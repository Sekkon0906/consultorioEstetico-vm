"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getProcedimientosApi } from "@/services/procedimientosApi";
import { IMG } from "../lib/imagenes";
import type { Procedimiento } from "@/types/domain";

/** Helper: redondeo determinista para evitar hydration mismatches por
 *  precisión IEEE-754 entre server y client. */
const r = (n: number, decimals = 3) => {
  const k = Math.pow(10, decimals);
  return Math.round(n * k) / k;
};

export default function Galeria3D() {
  const t = useTranslations("home.gallery");
  const ta = useTranslations("home.gallery_a11y");
  const [tratamientos, setTratamientos] = useState<Procedimiento[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  /**
   * Qué tarjeta está girada.
   *
   * Antes esto abría un panel encima con la página desenfocada detrás. El
   * desenfoque es caro —obliga al navegador a rasterizar y recomponer todo
   * lo que hay debajo— y además rompe la continuidad: la tarjeta que
   * pulsaste desaparece y en su lugar surge otra cosa.
   *
   * Girarla mantiene el objeto. Pulsas una tarjeta, esa misma tarjeta se da
   * la vuelta y por detrás está lo que querías leer. No hay nada que buscar
   * con la vista porque nada se ha movido de sitio.
   */
  const [girada, setGirada] = useState<string | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  // Con el detalle abierto se congela el scroll de la página: si no, el panel
  // se desplaza fuera de vista al hacer scroll y hay que buscarlo de vuelta.
  // Se limpia también al desmontar, para no dejar el body bloqueado si se
  // navega a otra página con el detalle abierto.
  useEffect(() => {
    if (selected === null) return;
    // En <html>, no en <body>. El elemento que desplaza la página aquí es
    // el raíz —se comprobó cuando un `overflow-x: clip` en <html> dejó el
    // sitio entero sin scroll—, así que `body { overflow: hidden }` no
    // bloqueaba nada y se seguía desplazando el fondo con el detalle
    // abierto. Se marcan los dos: cuesta lo mismo y cubre cualquier
    // navegador donde el que desplace sea el otro.
    document.documentElement.classList.add("g3d-detail-abierto");
    document.body.classList.add("g3d-detail-abierto");
    return () => {
      document.documentElement.classList.remove("g3d-detail-abierto");
      document.body.classList.remove("g3d-detail-abierto");
    };
  }, [selected]);

  // Cerrar con Escape: es un panel modal, y sin esto solo se cierra con clic.
  useEffect(() => {
    if (selected === null) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [selected]);

  // Carrusel deslizable de móvil: puntos VISIBLES (a diferencia de la
  // versión anterior, que los ocultaba) sincronizados con la posición real
  // del scroll — así se siente "vivo" como la rueda de escritorio, sin el
  // volteo de tarjeta que escondía la interacción.
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridIdx, setGridIdx] = useState(0);
  const onGridScroll = () => {
    const el = gridRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / tratamientos.length;
    setGridIdx(Math.round(el.scrollLeft / cardWidth));
  };
  const goToGridCard = (i: number) => {
    const el = gridRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / tratamientos.length;
    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  };

  // Marca que estamos en cliente — usado para gates de elementos puramente
  // visuales (partículas) que pueden divergir en hidratación si calculamos
  // floats con muchas cifras.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const all = await getProcedimientosApi();
        // Mostramos solo los procedimientos marcados para la Galería 3D
        // por la doctora desde el admin. Fallback: si nadie tiene
        // mostrarGaleriaHome marcado, caemos a los destacados clásicos
        // para no dejar la rueda vacía.
        const filtered = all.filter((p) => p.mostrarGaleriaHome);
        setTratamientos(filtered.length > 0 ? filtered : all.filter((p) => p.destacado));
      } catch (err) {
        console.error("Error cargando procedimientos para galería:", err);
      }
    }
    load();
  }, []);

  const angle = tratamientos.length > 0 ? 360 / tratamientos.length : 0;

  /**
   * El radio DEPENDE de cuántas tarjetas hay, y ese es el arreglo.
   *
   * Era fijo en 290. Con 4 destacados el ángulo entre tarjetas es de 90° y
   * quedaban bien separadas; al subir a 8 el ángulo baja a 45° y, con el
   * mismo radio, la distancia horizontal entre vecinas se reduce casi a la
   * mitad — se amontonaban unas sobre otras.
   *
   * Lo que se fija NO es el radio: es DÓNDE cae la tarjeta de al lado.
   *
   * Con 4 destacados la vecina quedaba a 290 px del centro y la composición
   * funcionaba —se veía entera, sin tocar a la frontal y sin salirse del
   * escenario—. Así que esa distancia es la que se conserva, y el radio se
   * despeja de ella:
   *
   *     x = sen(ángulo) × radio   →   radio = 290 / sen(ángulo)
   *
   * Se probó antes con `radio × ángulo` constante, que mantiene la
   * separación medida sobre el arco. Da 410 px con 8 tarjetas y las
   * laterales se salían por los lados. El arco no es lo que se ve; lo que
   * se ve es la proyección horizontal.
   *
   * El tope evita que con muchas destacadas el radio se dispare. Pasado ese
   * punto lo que toca no es más rueda, sino enseñar menos a la vez —de eso
   * se encarga `visiblesMax`.
   */
  const X_VECINA = 290;
  const senAngulo = Math.sin((angle * Math.PI) / 180) || 1;
  const radius = Math.min(520, Math.max(290, X_VECINA / senAngulo));

  /* Una a cada lado: tres tarjetas en pantalla, siempre.
     No es un número al azar — es lo que se veía con 4 destacados, donde la
     de dos puestos más allá caía justo detrás y el coseno ya la ocultaba.
     Fijándolo, la composición es la misma con 4 que con 12: cambia cuántas
     hay que recorrer, no cuántas compiten por la atención a la vez. */
  const visiblesMax = 1;

  // Rotación continua: la rueda gira en sentido contrario al anterior
  // (cards entran por la derecha y se desplazan hacia la izquierda).
  //
  // Solo corre en escritorio: la rueda 3D está oculta por CSS en móvil
  // (< 821px, ver globals.css), pero sin este guard el requestAnimationFrame
  // seguía disparando un setState en cada cuadro para animar algo que nadie
  // veía — gasto de batería/CPU puro en celular.
  useEffect(() => {
    if (isPaused || selected !== null) return;
    if (typeof window !== "undefined" && window.innerWidth <= 820) return;
    let frame: number;
    const animate = () => {
      setRotation((prev) => prev + 0.04);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, selected]);

  // Parallax discreto
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      setMouseTilt({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // PRNG determinista, valores redondeados.
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const particleCount = 18;
  const particles = useMemo(() => {
    const rng = mulberry32(98765);
    return Array.from({ length: particleCount }, (_, i) => {
      const theta = (i / particleCount) * 2 * Math.PI;
      const x = r(50 + (28 + rng() * 22) * Math.cos(theta), 2);
      const y = r(50 + (28 + rng() * 22) * Math.sin(theta), 2);
      const size = r(5 + rng() * 14, 2);
      const dur = r(3.5 + rng() * 3, 2);
      const opacity = r(0.22 + rng() * 0.25, 2);
      const color =
        i % 3 === 0
          ? `rgba(255, 240, 220, ${opacity})`
          : `rgba(218, 188, 152, ${opacity})`;
      return { x, y, size, dur, color };
    });
  }, []);

  /**
   * Posición de cada viñeta sobre el arco — "tipo libro".
   *
   * Antes la tarjeta llevaba `rotateY(...) translateZ(...)` dentro de un
   * contenedor en perspectiva: eso la giraba de verdad en 3D, y por eso las
   * laterales se veían como trapecios inclinados, con la foto deformada.
   *
   * Ahora el ángulo solo decide DÓNDE está la viñeta, no cómo se orienta:
   * de él salen el desplazamiento horizontal (seno), el tamaño y el brillo
   * (coseno). La tarjeta nunca rota, así que la foto conserva su forma
   * exacta. El ojo sigue leyendo profundidad —lo lejano es más pequeño y
   * más apagado— pero sin distorsión, como pasar páginas vistas de frente.
   */
  const getDepthStyles = (i: number) => {
    const total = tratamientos.length;
    // Pasos de distancia al frente, normalizados al rango [-total/2, total/2]
    // para que la viñeta tome siempre el camino corto y no cruce toda la fila.
    let offset = (((i - rotation / angle) % total) + total) % total;
    if (offset > total / 2) offset -= total;

    const radianes = (offset * angle * Math.PI) / 180;
    const coseno = Math.cos(radianes);

    const x = Math.sin(radianes) * radius;
    const scale = 0.62 + (coseno + 1) * 0.19;   // frente 1.0, atrás 0.62
    const brightness = 0.55 + (coseno + 1) * 0.225;
    /* Se ocultan por POSICIÓN en la rueda, no por ángulo.
       Antes bastaba `coseno > -0.2`, que con 4 tarjetas dejaba ver 3. Con 8
       ese mismo umbral deja ver 5, y las dos de los extremos aparecen
       recortadas por el borde del escenario. Contar puestos da el mismo
       resultado independientemente de cuántas haya. */
    const opacity = Math.abs(offset) <= visiblesMax && coseno > -0.2 ? 1 : 0;
    const zIndex = Math.round((coseno + 1) * 100);
    const isFront = coseno > 0.85;

    return { x, scale, brightness, opacity, zIndex, isFront };
  };

  /* Rotation crece (rueda gira al revés del anterior).
     Para que los dots sigan avanzando de izquierda a derecha
     (0 → 1 → 2 → ...), frontIndex = rotation / angle. */
  const frontIndex =
    tratamientos.length > 0
      ? ((Math.round(rotation / angle) % tratamientos.length) +
          tratamientos.length) %
        tratamientos.length
      : -1;

  const goToCard = (i: number) => {
    /* Para que dot i quede al frente, rotation = i * angle. */
    const target = i * angle;
    setRotation(target);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 1800);
  };

  return (
    <div
      className="g3d-stage position-relative"
      style={{
        perspective: "1700px",
        width: "100%",
        aspectRatio: "16 / 9",
        /* Cap a 95vh para que TODO el contenido (título + rueda + dots + CTA)
           se vea en una sola pantalla sin scroll, incluso en monitores 21:9
           donde 16:9 cabría holgado pero el usuario quiere ver el conjunto.
           min-height evita que se aplaste en pantallas muy pequeñas. */
        maxHeight: "95vh",
        minHeight: "600px",
        overflow: "hidden",
        backgroundImage: `url(${IMG.galeria3dBg})`,
        backgroundSize: "cover",
        /* "center top" para que el encuadre muestre la cabeza completa
           de la doctora (antes con "center" se cortaba). */
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay vertical sutil arriba+abajo y leve oscurecimiento a la derecha */}
      <div
        aria-hidden="true"
        className="g3d-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(var(--foto-tinte), 0.32) 0%, rgba(var(--foto-tinte), 0) 18%, rgba(var(--foto-tinte), 0) 78%, rgba(var(--foto-tinte), 0.35) 100%), linear-gradient(90deg, rgba(var(--foto-tinte), 0) 0%, rgba(var(--foto-tinte), 0) 45%, rgba(var(--foto-tinte), 0.18) 70%, rgba(var(--foto-tinte), 0.35) 100%)",
          zIndex: 1,
        }}
      />

      {/* Wrapper EXTERNO con position/right/translateX — necesario porque
          framer-motion sobrescribe el transform del style con su propio
          translate animado (y eso anulaba el translateX(50%) que centraba
          el título sobre el eje de la rueda). El motion.div interno se
          queda con la animación de entrada únicamente. */}
      <div
        className="g3d-title-wrap"
        style={{
          position: "absolute",
          top: "5%",
          right: "30%",
          /* fit-content + maxWidth hace que el wrap ocupe únicamente el
             ancho del texto, y translateX(50%) lo centra exactamente
             sobre el mismo eje que la rueda, dots y CTA. */
          width: "fit-content",
          maxWidth: "min(720px, 52%)",
          transform: "translateX(50%)",
          textAlign: "center",
          zIndex: 4,
          padding: "0 0.5rem",
        }}
      >
      <motion.div
        initial={{ y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            /* Va sobre la foto, no sobre una superficie: `--surface` es
               crema en claro pero casi negro en oscuro, y ahí el título
               se volvía ilegible. Ver `--texto-sobre-foto`. */
            color: "var(--texto-sobre-foto)",
            fontWeight: 700,
            /* Título mucho más grande para tomar más presencia visual. */
            fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
            margin: 0,
            textShadow: "var(--sombra-sobre-foto)",
            letterSpacing: "0.01em",
            lineHeight: 1.2,
          }}
        >
          {t.rich("title", {
            c: (chunks) => (
              <span
                className="g3d-title-accent"
                style={{
                  /* Café pastel cálido — ahora que la imagen de fondo es
                     más oscura, un crema cálido destaca sin chillar.
                     Se mantiene el peso 900 + italic para jerarquía. */
                  color: "#E8C9A0",
                  fontWeight: 900,
                  fontStyle: "italic",
                  textShadow:
                    "0 2px 14px rgba(0, 0, 0, 0.55), 0 0 22px rgba(232, 201, 160, 0.18)",
                }}
              >
                {chunks}
              </span>
            ),
          })}
        </h2>
        <div
          style={{
            width: 60,
            height: 3,
            background:
              "linear-gradient(90deg, transparent, #E8C9A0, transparent)",
            borderRadius: 2,
            margin: "0.8rem auto 0.7rem",
          }}
        />
        <p
          style={{
            color: "rgba(255, 253, 249, 0.95)",
            fontSize: "clamp(0.95rem, 1.05vw, 1.05rem)",
            margin: 0,
            textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            lineHeight: 1.55,
            fontWeight: 400,
          }}
        >
          {t("subtitle")}
        </p>
      </motion.div>
      </div>

      {/* Rueda 3D — centrada vertical entre el título y la base inferior.
          top subido de 58% a 63%: con subtítulo largo, el borde superior
          de la tarjeta frontal quedaba debajo del texto "Selecciona
          alguno para ver...". Ajuste moderado a propósito — subir más
          arriesga que el borde inferior choque con los dots/CTA. */}
      <div
        className="g3d-wheel-anchor"
        style={{
          position: "absolute",
          /* Sube del 63 % al 55 %.
             Medido en 1440×900: entre el final del título y el principio de
             la rueda había 160px muertos, y entre la rueda y los dots solo
             22 — los dos elementos que hay que distinguir estaban pegados y
             el aire sobraba donde no hacía falta. Subir la rueda reparte esa
             holgura al lado correcto. */
          top: "55%",
          right: "30%",
          transform: "translate(50%, -50%)",
          zIndex: 3,
        }}
      >
        {/* Halo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 520,
            height: 520,
            transform: `translate(-50%, -50%) rotateX(${r(mouseTilt.y * 0.2, 2)}deg) rotateY(${r(mouseTilt.x * 0.2, 2)}deg)`,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 230, 200, 0.18) 0%, rgba(176,137,104,0.10) 45%, transparent 70%)",
            filter: "blur(40px)",
            animation: "g3d-halo 40s linear infinite",
            zIndex: 0,
            opacity: selected ? 0.4 : 1,
            transition: "opacity 0.45s",
            pointerEvents: "none",
          }}
        />

        {/* Partículas — solo después de montar para evitar hydration mismatch */}
        {mounted && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 600,
              height: 600,
              transform: `translate(-50%, -50%) rotate(${r(-(rotation * 0.4), 2)}deg)`,
              transition: "transform 0.25s linear",
              zIndex: 1,
              pointerEvents: "none",
              opacity: selected ? 0.3 : 1,
            }}
          >
            {particles.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${p.y}%`,
                  left: `${p.x}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  borderRadius: "50%",
                  filter: "blur(2px)",
                  animation: `g3d-pulse ${p.dur}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Estado: cargando */}
        {selected === null && tratamientos.length === 0 && (
          <div
            style={{
              width: 260,
              height: 340,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <div className="spinner-border" style={{ color: "#E5D2C4" }} role="status" />
          </div>
        )}

        {/* Rueda 3D */}
        {selected === null && tratamientos.length > 0 && (
          <div
            style={{
              position: "relative",
              width: 260,
              height: 340,
              /* Sin preserve-3d ni rotateY: la rueda ya no gira en 3D, son
                 las viñetas las que se reposicionan sobre el arco. El
                 parallax del ratón queda como un desplazamiento suave del
                 conjunto, que no deforma nada. */
              transform: `translateX(${r(mouseTilt.x * 0.5, 2)}px) translateY(${r(mouseTilt.y * 0.3, 2)}px)`,
              transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
              zIndex: 3,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {tratamientos.map((tr, i) => {
              const { x, scale, brightness, opacity, zIndex, isFront } = getDepthStyles(i);
              return (
                <div
                  key={tr.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    /* Solo desplazamiento y tamaño. Sin rotateY, así que la
                       viñeta se mantiene recta y la foto no se deforma. */
                    transform: `translateX(${r(x, 2)}px) scale(${r(scale, 3)})`,
                    zIndex,
                    opacity,
                    filter: `brightness(${r(brightness, 3)})`,
                    /* Las de detrás no deben interceptar clics aunque estén
                       invisibles. */
                    pointerEvents: opacity === 0 ? "none" : "auto",
                    transition:
                      "filter 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease",
                  }}
                >
                  <div
                    className={`g3d-card ${isFront ? "is-front" : ""} ${girada === tr.id ? "esta-girada" : ""}`}
                    onClick={() => setGirada(girada === tr.id ? null : tr.id)}
                    role="button"
                    tabIndex={isFront ? 0 : -1}
                    aria-pressed={girada === tr.id}
                    aria-label={`${tr.nombre}. Pulsa para ver los detalles`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setGirada(girada === tr.id ? null : tr.id);
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      /* `preserve-3d` es lo que hace que las dos caras vivan
                         en el mismo espacio tridimensional. Sin esto, girar
                         el contenedor aplana a los hijos y la cara de atrás
                         nunca llega a verse. */
                      transformStyle: "preserve-3d",
                      transform: girada === tr.id ? "rotateY(180deg)" : "rotateY(0deg)",
                      transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {/* ── CARA FRONTAL ── */}
                    <div
                      className="g3d-cara g3d-cara-frente"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 20,
                        overflow: "hidden",
                        backgroundColor: "var(--surface)",
                        border: "1.5px solid rgba(255, 235, 215, 0.55)",
                        /* Sin esto se vería la cara de atrás del revés
                           through la de delante, como una calcomanía. */
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                    <img
                      src={tr.imagen || undefined}
                      alt={tr.nombre}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "45%",
                        background:
                          "linear-gradient(180deg, transparent 0%, rgba(var(--foto-tinte), 0) 30%, rgba(var(--foto-tinte), 0.55) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      className="g3d-badge"
                      style={{
                        position: "absolute",
                        left: 12,
                        right: 12,
                        bottom: 12,
                        padding: "0.55rem 0.8rem",
                        background: "var(--bg-elevated)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(var(--foto-tinte), 0.22)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.92rem",
                          fontWeight: 600,
                          color: "var(--text)",
                          fontFamily: "'Playfair Display', serif",
                          textAlign: "center",
                          letterSpacing: "0.01em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tr.nombre}
                      </p>
                    </div>
                    </div>

                    {/* ── CARA TRASERA ──
                        Ya girada 180°, así que al rotar el contenedor otros
                        180° queda de frente. Es la misma tarjeta: mismo
                        tamaño, mismo radio, mismo sitio. */}
                    <div
                      className="g3d-cara g3d-cara-dorso"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 20,
                        overflow: "hidden",
                        background: "var(--bg-elevated)",
                        border: "1.5px solid var(--border-strong)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        display: "flex",
                        flexDirection: "column",
                        padding: "1.3rem 1.2rem",
                        gap: "0.5rem",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "var(--text)",
                          lineHeight: 1.25,
                        }}
                      >
                        {tr.nombre}
                      </h3>
                      <span
                        aria-hidden="true"
                        style={{ width: 34, height: 2, background: "var(--brand)", borderRadius: 2 }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.86rem",
                          color: "var(--text-soft)",
                          lineHeight: 1.55,
                          flex: 1,
                          overflow: "hidden",
                        }}
                      >
                        {tr.desc}
                      </p>
                      {tr.precio && (
                        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--brand)" }}>
                          {Number(String(tr.precio).replace(/[^\d]/g, "")).toLocaleString("es-CO")}{" "}
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)" }}>COP</span>
                        </p>
                      )}
                      <Link
                        href={`/procedimientos/${tr.id}`}
                        className="btn-accion g3d-cta"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "0.65rem 1rem",
                          borderRadius: 100,
                          background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
                          color: "var(--brand-contrast)",
                          fontWeight: 700,
                          fontSize: "0.84rem",
                          textDecoration: "none",
                        }}
                      >
                        Conocer más
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === CARRUSEL DESLIZABLE (solo móvil) ===
          Segunda vuelta: la cuadrícula de 2 columnas se veía "plana" a
          primera vista (4 tarjetas estáticas a la vez). Esto se desliza con
          el dedo, con puntos VISIBLES que muestran la posición — a
          diferencia del carrusel de volteo anterior, que los ocultaba a
          propósito. Toca una tarjeta y abre el mismo modal que usa la
          rueda de escritorio. */}
      {selected === null && tratamientos.length > 0 && (
        <div className="g3d-grid-wrap-outer">
          <div className="g3d-grid-wrap" ref={gridRef} onScroll={onGridScroll}>
            {tratamientos.map((tr, i) => (
              <motion.button
                key={tr.id}
                type="button"
                className="g3d-grid-card"
                /* En móvil la tarjeta gira igual que en escritorio. Si aquí
                   se quedara el panel con la página desenfocada detrás, la
                   mitad de las visitas —que son móvil— seguirían viendo lo
                   que se quiso quitar. */
                onClick={() => setGirada(girada === tr.id ? null : tr.id)}
                aria-pressed={girada === tr.id}
                aria-label={`${tr.nombre}. Pulsa para ver los detalles`}
                initial={{ y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: Math.min(i, 4) * 0.05, ease: "easeOut" }}
                whileTap={{ scale: 0.96 }}
              >
                <img src={tr.imagen || undefined} alt={tr.nombre} loading="lazy" />
                <span className="g3d-grid-veil" aria-hidden="true" />
                {(tr.enPromocion || tr.destacado) && (
                  <span className={`g3d-grid-badge ${tr.enPromocion ? "promo" : "destacado"}`}>
                    ★ {tr.enPromocion ? t("badgePromo") : t("badgeDestacado")}
                  </span>
                )}
                <span className="g3d-grid-name">{tr.nombre}</span>

                {/* El dorso. Aparece encima al girar; la tarjeta de móvil es
                    pequeña, así que aquí solo cabe lo esencial: qué es y
                    cuánto cuesta. */}
                <span className={`g3d-grid-dorso ${girada === tr.id ? "visible" : ""}`}>
                  <span className="g3d-grid-dorso-titulo">{tr.nombre}</span>
                  <span className="g3d-grid-dorso-desc">{tr.desc}</span>
                  {tr.precio && (
                    <span className="g3d-grid-dorso-precio">
                      {Number(String(tr.precio).replace(/[^\d]/g, "")).toLocaleString("es-CO")} COP
                    </span>
                  )}
                </span>
              </motion.button>
            ))}
          </div>

          {tratamientos.length > 1 && (
            <div className="g3d-grid-dots" role="tablist" aria-label={t("subtitle")}>
              {tratamientos.map((tr, i) => (
                <button
                  key={tr.id}
                  type="button"
                  role="tab"
                  aria-selected={i === gridIdx}
                  aria-label={tr.nombre}
                  onClick={() => goToGridCard(i)}
                  className={`g3d-grid-dot ${i === gridIdx ? "is-active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dots — debajo de la rueda (no encima), mismo eje horizontal.
          bottom subido de 13% a 19%: al bajar la rueda (fix anterior)
          quedaba muy pegado al CTA de abajo (8 puntos de separación). */}
      {selected === null && tratamientos.length > 0 && (
        <div
          className="g3d-dots-wrap"
          style={{
            position: "absolute",
            /* Del 14 % al 7 %. Con las tarjetas girando, el dorso ocupa
               todo el alto de la tarjeta y el indicador quedaba pegado
               justo debajo, leyéndose casi como parte de ella. Bajarlo lo
               deja centrado en el hueco que hay hasta el botón de abajo. */
            bottom: "7%",
            right: "30%",
            transform: "translateX(50%)",
            zIndex: 5,
          }}
        >
          <div
            className="g3d-dots"
            style={{
              display: "flex",
              alignItems: "center",
              /* Un pelo mas de aire entre puntos y en el borde. Con 4
                 destacados la barra era corta y no se notaba; con 8 se veia
                 apretada. */
              gap: 9,
              padding: "0.4rem 0.7rem",
              background: "var(--bg-elevated)",
              backdropFilter: "blur(10px)",
              border: "1px solid var(--border)",
              borderRadius: 100,
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            }}
          >
            {/* Flechas junto a los dots.
                El carrusel de /procedimientos las tiene y este no: solo se
                podía avanzar apuntando al punto exacto, que en escritorio es
                un blanco de 8px. Van pegadas a los dots y no flotando sobre
                la rueda, para no tapar las tarjetas. */}
            <button
              type="button"
              onClick={() => goToCard((frontIndex - 1 + tratamientos.length) % tratamientos.length)}
              aria-label={ta("prevCard")}
              className="g3d-flecha"
            >
              ‹
            </button>
            {tratamientos.map((_, i) => (
              <button
                key={i}
                onClick={() => goToCard(i)}
                aria-label={ta("goToCard", { n: i + 1 })}
                style={{
                  width: i === frontIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 100,
                  background:
                    i === frontIndex
                      ? "linear-gradient(90deg, #B08968, #C9AD8D)"
                      : "rgba(176,137,104,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition:
                    "width 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s",
                  padding: 0,
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => goToCard((frontIndex + 1) % tratamientos.length)}
              aria-label={ta("nextCard")}
              className="g3d-flecha"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* CTA "Ver todos los procedimientos" — anclado al mismo eje
          vertical del título y la rueda, al fondo de la sección y
          despegado de los dots. Sin flecha para una píldora más limpia. */}
      {selected === null && (
        <div
          className="g3d-cta-wrap"
          style={{
            position: "absolute",
            bottom: "5%",
            right: "30%",
            transform: "translateX(50%)",
            zIndex: 5,
          }}
        >
          <Link
            href="/procedimientos"
            className="g3d-cta-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0.75rem 1.8rem",
              borderRadius: 100,
              background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
              color: "var(--brand-contrast)",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 8px 22px rgba(176, 137, 104, 0.4)",
              transition:
                "background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            <i className="fas fa-th-large" />
            {t("viewAll")}
          </Link>
        </div>
      )}

      {/* Detalle del tratamiento — se renderiza vía PORTAL a document.body
          para escapar del `perspective` + `overflow:hidden` del stage (que
          atrapaban el modal y lo rompían). Es un modal centrado con backdrop
          en TODAS las pantallas. */}
      {selected !== null && typeof document !== "undefined" && createPortal(
        <div
          className="g3d-detail-backdrop"
          onClick={() => setSelected(null)}
        >
        <div
          className="g3d-detail dark-aware-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "var(--surface)",
            width: "min(680px, 92vw)",
            maxWidth: "92vw",
            maxHeight: "88vh",
            overflowY: "auto",
            border: "1px solid var(--border-strong)",
            borderRadius: 24,
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(176,137,104,0.08)",
            padding: "2.5rem 2.2rem 2.2rem",
            position: "relative",
            /* La animación de apertura NO se declara aquí.
               Estaba en línea, y el estilo en línea le gana a la hoja: eso
               impedía que `prefers-reduced-motion` la anulara. Vive en
               03-compatibilidad.css junto al backdrop, que es quien pone la
               perspectiva del volteo. */
            display: "flex",
            flexDirection: "column",
            gap: "1.4rem",
          }}
        >
          {/* Acento dorado superior */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: 4,
              background:
                "linear-gradient(90deg, transparent 0%, var(--brand) 30%, #C9AD8D 50%, #B08968 70%, transparent 100%)",
              borderRadius: "0 0 4px 4px",
            }}
          />

          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute",
              top: 16,
              left: 18,
              background: "rgba(176,137,104,0.08)",
              border: "1px solid rgba(176,137,104,0.18)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              padding: "0.4rem 0.9rem",
              borderRadius: 100,
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.16)";
              e.currentTarget.style.transform = "translateX(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.08)";
              e.currentTarget.style.transform = "";
            }}
          >
            {t("back")}
          </button>

          <button
            onClick={() => setSelected(null)}
            aria-label={ta("close")}
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(176,137,104,0.08)",
              border: "1px solid rgba(176,137,104,0.18)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: "1.05rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.16)";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.08)";
              e.currentTarget.style.transform = "";
            }}
          >
            ×
          </button>

          <div style={{ display: "flex", gap: "1.6rem", marginTop: "1.8rem" }}>
            {/* Imagen */}
            <div
              style={{
                flex: "0 0 220px",
                aspectRatio: "3 / 4",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow:
                  "0 12px 32px rgba(176,137,104,0.28), 0 0 0 1px rgba(176,137,104,0.12)",
                background: "var(--surface-soft)",
              }}
            >
              <img
                src={
                  tratamientos.find((tr) => tr.id === selected)?.imagen ||
                  "/placeholder.png"
                }
                alt={
                  tratamientos.find((tr) => tr.id === selected)?.nombre || ""
                }
                style={{
                  objectFit: "cover",
                  objectPosition: "center top",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>

            {/* Texto */}
            <div
              style={{
                flex: 1,
                color: "var(--text)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    marginBottom: "0.6rem",
                    fontSize: "1.5rem",
                    lineHeight: 1.2,
                  }}
                >
                  {tratamientos.find((tr) => tr.id === selected)?.nombre}
                </h3>
                <div
                  style={{
                    width: 36,
                    height: 3,
                    background: "linear-gradient(90deg, var(--brand), #C9AD8D)",
                    borderRadius: 2,
                    marginBottom: "0.9rem",
                  }}
                />
                <p
                  style={{
                    color: "var(--text-soft)",
                    lineHeight: 1.65,
                    fontSize: "0.94rem",
                    marginBottom: "1.4rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {tratamientos.find((tr) => tr.id === selected)?.desc}
                </p>
              </div>
              <Link
                href={
                  "/procedimientos/" +
                  (tratamientos.find((tr) => tr.id === selected)?.id || "")
                }
                className="btn-ghost-app"
                style={{ width: "fit-content", marginTop: "0.6rem" }}
              >
                <i className="fas fa-info-circle" />
                {t("viewMore")}
              </Link>
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}

      {/* Estilos globales */}
      <style jsx global>{`
        @keyframes g3d-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%      { transform: scale(1.35); opacity: 0.85; }
        }
        @keyframes g3d-halo {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        /* Aquí estaban las keyframes g3d-detail-in. El modal ahora se
           voltea (g3d-voltear, en 03-compatibilidad.css) y aquellas
           llevaban un translate heredado de cuando el panel era absolute;
           hoy es un hijo flex centrado y ese desplazamiento sobraba. */
        .g3d-card {
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(176, 137, 104, 0.08);
          transition: box-shadow var(--mov-lento) ease, transform var(--mov-normal) ease;
        }
        .g3d-card.is-front {
          box-shadow:
            0 24px 50px rgba(0, 0, 0, 0.45),
            0 0 36px rgba(255, 220, 180, 0.55),
            0 0 0 1.5px rgba(255, 235, 215, 0.6);
        }
        .g3d-card:hover {
          transform: translateY(-3px);
        }

        /* El backdrop + posicionamiento del modal de detalle viven en
           globals.css (el detalle se portalea a document.body). */


        /* El reset global de enlaces (color inherit important) pisaba el
           color del pill dejándolo invisible. El botón es sólido champagne
           con texto BLANCO forzado para ganarle al reset. */
        /* Antes era blanco fijo con !important. En claro --brand es café
           oscuro y el blanco funcionaba; en oscuro --brand es champán claro
           y el botón quedaba blanco sobre champán, ilegible.
           --brand-contrast es exactamente ese par: blanco en claro, casi
           negro en oscuro. */
        .g3d-cta-pill,
        .g3d-cta-pill i,
        .g3d-cta-pill span {
          color: var(--brand-contrast) !important;
        }
        .g3d-cta-pill:hover,
        .g3d-cta-pill:focus-visible {
          background: linear-gradient(135deg, #A0724E, #B89A7C) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(176, 137, 104, 0.5);
        }

        @media (max-width: 1280px) {
          /* Solo el título va más a la derecha que el resto, para que
             se sienta alineado con el centro visual de las cards (que
             por la perspectiva 3D se ven ligeramente desplazadas). */
          .g3d-title-wrap     { right: 22% !important; max-width: min(500px, 46%) !important; }
          .g3d-wheel-anchor   { right: 22% !important; transform: translate(50%, -50%) !important; }
          .g3d-dots-wrap      { right: 22% !important; }
          .g3d-cta-wrap       { right: 22% !important; }
          /* El 70 % es para tablet, NO para el teléfono.
             Este bloque es max-width: 1200px, así que también atrapaba al
             móvil: en 375px el modal salía de 242 —el 65 % de la pantalla—
             y el botón "Saber más sobre el procedimiento" se salía 91px por
             la derecha. Se acota con min-width para que por debajo de 768
             mande la regla de móvil, que usa min(92vw, 460px). */
          @media (min-width: 768px) {
            .g3d-detail {
              max-width: 70% !important;
              width: auto !important;
            }
          }
        }
        @media (max-width: 980px) {
          .g3d-title-wrap     { right: 15% !important; max-width: min(460px, 52%) !important; }
          .g3d-wheel-anchor   { right: 15% !important; transform: translate(50%, -50%) !important; }
          .g3d-dots-wrap      { right: 15% !important; }
          .g3d-cta-wrap       { right: 15% !important; }
        }
        @media (max-width: 820px) {
          /* Layout en columna: título arriba, rueda (escalada) al centro,
             dots y CTA debajo. La rueda se escala para que las cards 3D no
             se salgan del viewport en pantallas chicas. */
          .g3d-stage          { background-position: 30% top !important; aspect-ratio: auto !important; height: auto !important; min-height: auto !important; padding: 4.5rem 0 3rem !important; overflow: hidden !important; }
          .g3d-overlay        {
            background:
              linear-gradient(180deg, rgba(var(--foto-tinte), 0.62) 0%, rgba(var(--foto-tinte), 0.42) 35%, rgba(var(--foto-tinte), 0.62) 100%) !important;
          }
          /* Título centrado con flujo normal (antes iba superpuesto a la
             derecha sobre la foto, alineado a la derecha — se veía forzado
             en pantallas angostas). Minimalista: solo texto, sin pelear
             con la imagen de fondo. */
          .g3d-title-wrap     {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            width: 90% !important;
            max-width: 90% !important;
            transform: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            text-align: center !important;
          }
          /* Rueda 3D escalada y anclada a la DERECHA.
             El origen del escalado importa: con transform-origin en el
             centro, un scale(0.6) encoge la rueda hacia su propio centro y
             la despega del borde derecho ~20 % de su ancho. Es decir, el
             bloque estaba alineado a la derecha en el layout pero se veía
             corrido hacia el medio — justo lo contrario de lo que se busca,
             que es que las tarjetas caigan donde la doctora señala con la
             mano. Anclando el origen a la derecha, encoger no la mueve. */
          .g3d-wheel-anchor   {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            margin: 0.5rem 0 0 auto !important;
            transform: scale(0.6) !important;
            transform-origin: right center !important;
            height: 270px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .g3d-dots-wrap      {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            margin: 0 auto 0 0 !important;
            display: flex !important;
            justify-content: flex-end !important;
            width: 78% !important;
            margin-left: auto !important;
          }
          /* CTA alineado a la derecha, bajo la rueda, coherente con el texto. */
          .g3d-cta-wrap       {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            margin: 1.5rem 0 0 auto !important;
            display: flex !important;
            justify-content: flex-end !important;
            width: 82% !important;
            padding-right: 4% !important;
          }
        }
        @media (max-width: 480px) {
          .g3d-title-wrap h1, .g3d-title-wrap h2 { font-size: 1.3rem !important; }
          .g3d-wheel-anchor { transform: scale(0.52) !important; transform-origin: right center !important; height: 230px !important; }
        }
        @media (max-width: 768px) {
          /* El modal va por globals.css. Aquí solo apilamos imagen + texto. */
          .g3d-detail > div:last-child {
            flex-direction: column !important;
            gap: 1.2rem !important;
          }
          .g3d-detail > div:last-child > div:first-child {
            flex: 1 1 auto !important;
            max-width: 220px !important;
            margin: 0 auto;
          }
        }

        /* === PANTALLAS BAJAS (portátiles) ===
           Todos los breakpoints de arriba son por ANCHO, y un portátil típico
           es ancho pero bajo (1920x900, 1440x800). Ahí no se activaba ninguno:
           el contenedor se recortaba por maxHeight:95vh mientras la rueda
           mantenía su alto fijo en px, así que las tarjetas invadían el
           subtítulo y los dots chocaban con el CTA. Se escala la rueda según
           el alto disponible, que es la dimensión que realmente escasea. */
        @media (min-width: 821px) and (max-height: 900px) {
          .g3d-stage        { min-height: 520px !important; }
          .g3d-title-wrap   { top: 3% !important; }
          .g3d-title-wrap h1, .g3d-title-wrap h2 { font-size: clamp(1.5rem, 2.4vw, 2.1rem) !important; }
          .g3d-title-wrap p { font-size: 0.92rem !important; }
          .g3d-wheel-anchor { top: 60% !important; transform: translate(50%, -50%) scale(0.86) !important; }
          .g3d-dots-wrap    { bottom: 16% !important; }
        }
        @media (min-width: 821px) and (max-height: 780px) {
          .g3d-stage        { min-height: 460px !important; }
          .g3d-title-wrap   { top: 2% !important; }
          .g3d-title-wrap h1, .g3d-title-wrap h2 { font-size: clamp(1.3rem, 2.1vw, 1.75rem) !important; }
          .g3d-title-wrap p { font-size: 0.85rem !important; line-height: 1.4 !important; }
          .g3d-wheel-anchor { top: 59% !important; transform: translate(50%, -50%) scale(0.72) !important; }
          .g3d-dots-wrap    { bottom: 14% !important; }
        }
        @media (min-width: 821px) and (max-height: 660px) {
          .g3d-title-wrap p { display: none !important; }
          .g3d-wheel-anchor { transform: translate(50%, -50%) scale(0.6) !important; }
        }
      `}</style>
    </div>
  );
}
