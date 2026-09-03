"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Palabra que aparece como si la pintaran de un trazo.
 *
 * Reemplaza la máquina de escribir (react-type-animation), que escribía y
 * borraba en bucle. Aquí la palabra se revela con un trazo de pincel que la
 * recorre de izquierda a derecha.
 *
 * CÓMO FUNCIONA
 * Un `<mask>` de SVG contiene una línea gruesa. Lo que la máscara pinta de
 * blanco es lo que se ve del texto. Animando `stroke-dashoffset` la línea
 * "se dibuja", y a su paso va destapando las letras. No es una imagen ni un
 * video: el texto es texto de verdad, así que se puede seleccionar, traducir
 * y leer con lector de pantalla.
 *
 * SOBRE LA CURSIVA
 * Va en serif itálica, no en caligráfica. Una caligráfica de verdad es bonita
 * pero cuesta leerla, y en un titular que vende confianza eso juega en
 * contra. La itálica se siente escrita a mano y elegante, pero cada letra
 * sigue siendo reconocible para quien no está acostumbrado a la cursiva.
 */

/** Aire a cada lado, en unidades del viewBox. La cursiva sobresale de su
 *  caja de avance y la pincelada de la máscara lleva punta redonda, que se
 *  extiende media anchura de trazo más allá de donde empieza y termina. */
const MARGEN_CURSIVA = 28;

interface Props {
  /** Palabras a mostrar. Con una sola, queda fija. */
  palabras: string[];
  /** Milisegundos que permanece cada palabra antes de repintar la siguiente. */
  duracionPorPalabra?: number;
}

export default function PalabraPintada({ palabras, duracionPorPalabra = 3600 }: Props) {
  const [indice, setIndice] = useState(0);
  const [anchoTexto, setAnchoTexto] = useState(560);
  const textoRef = useRef<SVGTextElement>(null);
  const trazoRef = useRef<SVGPathElement>(null);
  // useId evita que dos instancias compartan el mismo id de máscara, que en
  // SVG es global al documento y haría que una tapara a la otra.
  const idMascara = useId().replace(/:/g, "");

  const palabra = palabras[indice] ?? "";

  // El ancho del SVG se ajusta a la palabra: si no, "confianza." y "armonía."
  // quedarían con cajas distintas y el texto saltaría de tamaño al cambiar.
  //
  // Aquí estaba el bug de la palabra cortada ("autenticidac", sin la última
  // letra). La medida se tomaba UNA vez, al montar, y en ese momento Playfair
  // todavía no había cargado: se medía la fuente de reserva, que es más
  // estrecha, y el viewBox salía más corto que el texto real. Al llegar la
  // fuente el texto crecía, pero la caja ya estaba fijada y lo que sobraba
  // por la derecha quedaba fuera.
  //
  // Se mide con getBBox, no con getComputedTextLength: la cursiva se inclina
  // y sobresale de la caja de avance por los dos lados, y getComputedTextLength
  // solo suma anchos de avance — justo la parte que se salía.
  useEffect(() => {
    const el = textoRef.current;
    if (!el) return;

    const medir = () => {
      const actual = textoRef.current;
      if (!actual) return;
      try {
        const caja = actual.getBBox();
        // `caja.x` ya incluye el desplazamiento inicial del texto, así que
        // el borde derecho es x + width y solo falta el margen de la
        // derecha. Sumar dos márgenes aquí sobraría espacio y, como el SVG
        // se escala a `width: 100%`, encogería la palabra sin motivo.
        const bordeDerecho = caja.x + caja.width;
        if (bordeDerecho > 0) setAnchoTexto(Math.ceil(bordeDerecho) + MARGEN_CURSIVA);
      } catch {
        // getBBox lanza si el nodo aún no está pintado; se reintenta al
        // cargar las fuentes.
      }
    };

    medir();
    let vivo = true;
    document.fonts?.ready.then(() => { if (vivo) medir(); }).catch(() => {});
    return () => { vivo = false; };
  }, [palabra]);

  // Repinta el trazo cada vez que cambia la palabra O el ancho medido.
  //
  // Depender solo de `palabra` dejaba un desfase visible: `anchoTexto`
  // cambia después, al cargar la fuente, y con él cambia la `d` del trazo y
  // por tanto su longitud. El `strokeDasharray` se quedaba con la longitud
  // vieja, más corta que el trazo nuevo, así que el sobrante quedaba sin
  // guion que lo cubriera y la palabra aparecía a trozos.
  useEffect(() => {
    const trazo = trazoRef.current;
    if (!trazo) return;

    const prefiereMenosMovimiento =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const largo = trazo.getTotalLength();
    trazo.style.strokeDasharray = String(largo);

    if (prefiereMenosMovimiento) {
      // Sin animación: la palabra simplemente está ahí, visible.
      trazo.style.transition = "none";
      trazo.style.strokeDashoffset = "0";
      return;
    }

    trazo.style.transition = "none";
    trazo.style.strokeDashoffset = String(largo);
    // Reflow forzado: sin esto el navegador funde los dos estados en uno y
    // no se ve la animación.
    void trazo.getBoundingClientRect();
    trazo.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.35,0.1,0.25,1)";
    trazo.style.strokeDashoffset = "0";
  }, [palabra, anchoTexto]);

  // Rotación entre palabras. Con una sola no hace nada.
  useEffect(() => {
    if (palabras.length <= 1) return;
    const t = setTimeout(
      () => setIndice((i) => (i + 1) % palabras.length),
      duracionPorPalabra
    );
    return () => clearTimeout(t);
  }, [indice, palabras.length, duracionPorPalabra]);

  const alto = 130;

  return (
    <svg
      viewBox={`0 0 ${anchoTexto} ${alto}`}
      style={{ width: "100%", maxWidth: anchoTexto, height: "auto", overflow: "visible" }}
      role="img"
      aria-label={palabra}
    >
      <defs>
        <mask id={`pincel-${idMascara}`}>
          {/* Trazo con curva y punta redonda: se lee como pincelada, no
              como una barra de progreso. El grosor cubre el alto del texto. */}
          {/* Arranca y termina FUERA del viewBox (−MARGEN, ancho+MARGEN):
              con la punta redonda, si el trazo empezara en el borde exacto
              la primera y la última letra se destapaban a medias. */}
          <path
            ref={trazoRef}
            d={`M ${-MARGEN_CURSIVA} ${alto * 0.52} Q ${anchoTexto * 0.3} ${alto * 0.36}, ${anchoTexto * 0.55} ${alto * 0.5} T ${anchoTexto + MARGEN_CURSIVA} ${alto * 0.47}`}
            stroke="#fff"
            strokeWidth={alto * 0.85}
            fill="none"
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <text
        ref={textoRef}
        x={MARGEN_CURSIVA}
        y={alto * 0.7}
        mask={`url(#pincel-${idMascara})`}
        fill="currentColor"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: alto * 0.62,
        }}
      >
        {palabra}
      </text>
    </svg>
  );
}
