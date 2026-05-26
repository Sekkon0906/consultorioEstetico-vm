"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getProcedimientosApi } from "../../services/procedimientosApi";
import { IMG } from "../lib/imagenes";
import type { Procedimiento } from "../../types/domain";

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
  const [selected, setSelected] = useState<number | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

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

  /* Radio reducido (de 380 a 290) para que las cards visibles a los
     lados queden más cerca del eje central de la rueda y, por tanto,
     mejor alineadas visualmente con el título y los dots. */
  const radius = 290;
  const angle = tratamientos.length > 0 ? 360 / tratamientos.length : 0;

  // Rotación continua: la rueda gira en sentido contrario al anterior
  // (cards entran por la derecha y se desplazan hacia la izquierda).
  useEffect(() => {
    if (isPaused || selected !== null) return;
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

  const getDepthStyles = (i: number) => {
    const relativeAngle = ((rotation / angle + i) % tratamientos.length) * angle;
    const normalized = Math.cos((relativeAngle * Math.PI) / 180);
    const scale = 0.85 + (normalized + 1) * 0.18;
    const brightness = 0.65 + normalized * 0.35;
    const zIndex = Math.round((normalized + 1) * 100);
    const isFront = normalized > 0.85;
    return { scale, brightness, zIndex, isFront };
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
            "linear-gradient(180deg, rgba(58,42,26,0.32) 0%, rgba(58,42,26,0) 18%, rgba(58,42,26,0) 78%, rgba(58,42,26,0.35) 100%), linear-gradient(90deg, rgba(58,42,26,0) 0%, rgba(58,42,26,0) 45%, rgba(58,42,26,0.18) 70%, rgba(58,42,26,0.35) 100%)",
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
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#FFFDF9",
            fontWeight: 700,
            /* Título mucho más grande para tomar más presencia visual. */
            fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.75)",
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

      {/* Rueda 3D — centrada vertical entre el título y la base inferior */}
      <div
        className="g3d-wheel-anchor"
        style={{
          position: "absolute",
          top: "58%",
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
              transformStyle: "preserve-3d",
              transform: `rotateX(${r(5 + mouseTilt.y * 0.18, 2)}deg) rotateY(${r(rotation + mouseTilt.x * 0.25, 2)}deg)`,
              /* Transición más suave para el parallax del mouse —
                 la rotación continua va a 60fps via rAF así que
                 estamos solo suavizando los cambios bruscos. */
              transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
              zIndex: 3,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {tratamientos.map((tr, i) => {
              const { scale, brightness, zIndex, isFront } = getDepthStyles(i);
              return (
                <div
                  key={tr.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: `rotateY(${r(i * angle, 2)}deg) translateZ(${radius}px) scale(${r(scale, 3)})`,
                    backfaceVisibility: "hidden",
                    zIndex,
                    filter: `brightness(${r(brightness, 3)})`,
                    /* Transiciones suaves cubic-bezier para que el cambio
                       de brillo y profundidad de las cards al rotar se
                       sienta orgánico, no abrupto. */
                    transition:
                      "filter 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    className={`g3d-card ${isFront ? "is-front" : ""}`}
                    onClick={() => setSelected(tr.id)}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: 20,
                      overflow: "hidden",
                      backgroundColor: "#FFFDF9",
                      border: "1.5px solid rgba(255, 235, 215, 0.55)",
                      cursor: "pointer",
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
                          "linear-gradient(180deg, transparent 0%, rgba(30,20,10,0) 30%, rgba(30,20,10,0.55) 100%)",
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
                        background: "rgba(255, 253, 249, 0.94)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(201,173,141,0.4)",
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(58,42,26,0.22)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.92rem",
                          fontWeight: 600,
                          color: "#3A2A1A",
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dots — debajo de la rueda (no encima), mismo eje horizontal */}
      {selected === null && tratamientos.length > 0 && (
        <div
          className="g3d-dots-wrap"
          style={{
            position: "absolute",
            bottom: "13%",
            right: "30%",
            transform: "translateX(50%)",
            zIndex: 5,
          }}
        >
          <div
            className="g3d-dots"
            style={{
              display: "flex",
              gap: 8,
              padding: "0.45rem 0.85rem",
              background: "rgba(255, 253, 249, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 235, 215, 0.5)",
              borderRadius: 100,
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            }}
          >
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
              background: "rgba(255, 253, 249, 0.95)",
              color: "#5A4635",
              border: "1.5px solid rgba(176, 137, 104, 0.55)",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 8px 22px rgba(0, 0, 0, 0.28)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition:
                "background 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            <i className="fas fa-th-large" />
            {t("viewAll")}
          </Link>
        </div>
      )}

      {/* Detalle del tratamiento seleccionado — centrado en el eje
          de la sección (right: 30%), mismo margen que la rueda/dots/CTA,
          no en el centro del viewport. */}
      {selected !== null && (
        <div
          className="g3d-detail"
          style={{
            position: "absolute",
            top: "50%",
            right: "30%",
            transform: "translate(50%, -50%)",
            backgroundColor: "#FFFDF9",
            width: 680,
            maxWidth: "55%",
            border: "1px solid rgba(201,173,141,0.4)",
            borderRadius: 24,
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(176,137,104,0.08)",
            padding: "2.5rem 2.2rem 2.2rem",
            zIndex: 6,
            animation: "g3d-detail-in 0.5s cubic-bezier(0.16,1,0.3,1)",
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
                "linear-gradient(90deg, transparent 0%, #B08968 30%, #C9AD8D 50%, #B08968 70%, transparent 100%)",
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
              color: "#5A4635",
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
              color: "#5A4635",
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
                background: "#F5EEE5",
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
                color: "#3A2A1A",
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
                    background: "linear-gradient(90deg, #B08968, #C9AD8D)",
                    borderRadius: 2,
                    marginBottom: "0.9rem",
                  }}
                />
                <p
                  style={{
                    color: "#6C584C",
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
                style={{ width: "fit-content" }}
              >
                <i className="fas fa-info-circle" />
                {t("viewMore")}
                <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>→</span>
              </Link>
            </div>
          </div>
        </div>
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
        @keyframes g3d-detail-in {
          0%   { opacity: 0; transform: translate(50%, -50%) scale(0.94); }
          100% { opacity: 1; transform: translate(50%, -50%) scale(1); }
        }
        .g3d-card {
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(176, 137, 104, 0.08);
          transition: box-shadow 0.4s ease, transform 0.3s ease;
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

        /* CTA "Ver todos los procedimientos" — hover se rellena con marca.
           Mismo gesto que el .hero-fs-btn-ghost para que se sienta familiar. */
        .g3d-cta-pill:hover,
        .g3d-cta-pill:focus-visible {
          background: linear-gradient(135deg, #B08968, #C9AD8D) !important;
          color: #FFFFFF !important;
          border-color: transparent !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(176, 137, 104, 0.45);
        }

        @media (max-width: 1280px) {
          /* Solo el título va más a la derecha que el resto, para que
             se sienta alineado con el centro visual de las cards (que
             por la perspectiva 3D se ven ligeramente desplazadas). */
          .g3d-title-wrap     { right: 22% !important; max-width: min(500px, 46%) !important; }
          .g3d-wheel-anchor   { right: 22% !important; transform: translate(50%, -50%) !important; }
          .g3d-dots-wrap      { right: 22% !important; }
          .g3d-cta-wrap       { right: 22% !important; }
          .g3d-detail         {
            max-width: 70% !important;
            width: auto !important;
          }
        }
        @media (max-width: 980px) {
          .g3d-title-wrap     { right: 15% !important; max-width: min(460px, 52%) !important; }
          .g3d-wheel-anchor   { right: 15% !important; transform: translate(50%, -50%) !important; }
          .g3d-dots-wrap      { right: 15% !important; }
          .g3d-cta-wrap       { right: 15% !important; }
        }
        @media (max-width: 820px) {
          .g3d-stage          { background-position: 30% top !important; aspect-ratio: auto !important; height: auto !important; min-height: 100vh !important; padding: 6rem 0 4rem !important; }
          .g3d-overlay        {
            background:
              linear-gradient(180deg, rgba(58,42,26,0.55) 0%, rgba(58,42,26,0.35) 35%, rgba(58,42,26,0.55) 100%) !important;
          }
          .g3d-title-wrap     {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            width: 92% !important;
            transform: none !important;
            margin: 0 auto !important;
          }
          .g3d-wheel-anchor   {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            transform: none !important;
            margin: 3rem auto 0 !important;
            display: flex;
            justify-content: center;
          }
          .g3d-dots-wrap      {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            margin: 1.5rem auto 0 !important;
            display: flex;
            justify-content: center;
          }
          .g3d-cta-wrap       {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            margin: 2rem auto 0 !important;
            display: flex;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .g3d-detail {
            position: fixed !important;
            top: 50% !important;
            right: 50% !important;
            transform: translate(50%, -50%) !important;
            width: 92% !important;
            max-width: 92% !important;
            padding: 2.5rem 1.5rem 1.5rem !important;
            animation: g3d-detail-in-mobile 0.5s cubic-bezier(0.16,1,0.3,1) !important;
          }
          @keyframes g3d-detail-in-mobile {
            0%   { opacity: 0; transform: translate(50%, -50%) scale(0.94); }
            100% { opacity: 1; transform: translate(50%, -50%) scale(1); }
          }
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
      `}</style>
    </div>
  );
}
