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
  useEffect(() => {
    const el = textoRef.current;
    if (!el) return;
    try {
      const ancho = el.getComputedTextLength();
      if (ancho > 0) setAnchoTexto(Math.ceil(ancho) + 40);
    } catch {
      // getComputedTextLength falla si la fuente aún no cargó; se queda con
      // el ancho por defecto, que es razonable.
    }
  }, [palabra]);

  // Repinta el trazo cada vez que cambia la palabra.
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
  }, [palabra]);

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
          <path
            ref={trazoRef}
            d={`M 10 ${alto * 0.52} Q ${anchoTexto * 0.3} ${alto * 0.36}, ${anchoTexto * 0.55} ${alto * 0.5} T ${anchoTexto + 10} ${alto * 0.47}`}
            stroke="#fff"
            strokeWidth={alto * 0.85}
            fill="none"
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <text
        ref={textoRef}
        x="0"
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
