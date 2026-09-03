"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Una palabra que se escribe a mano, letra por letra.
 *
 * QUÉ CAMBIÓ Y POR QUÉ
 * Antes rotaba entre cuatro palabras y cada una se revelaba con un solo
 * trazo que barría de izquierda a derecha. Dos problemas: el barrido es un
 * efecto muy visto —se lee como "una transición", no como algo escrito— y
 * la rotación obligaba a leer el titular varias veces para entenderlo,
 * porque el sentido de la frase cambiaba cada 3,6 segundos.
 *
 * Ahora es UNA palabra, fija, que se traza letra a letra: primero la C,
 * luego la o, y así. Se queda. El titular se lee una vez.
 *
 * CÓMO FUNCIONA
 * Un `<mask>` de SVG decide qué parte del texto se ve: lo que la máscara
 * pinta de blanco, se ve. Dentro hay UN TRAZO POR LETRA, cada uno cubriendo
 * solo el ancho de su letra, y cada uno se "dibuja" animando
 * `stroke-dashoffset` con un retardo escalonado. El efecto es el de una
 * mano que avanza.
 *
 * Las posiciones de cada letra no se calculan a ojo: se preguntan al propio
 * SVG con `getStartPositionOfChar`, que es el único que sabe dónde cae cada
 * glifo con esta fuente y este tamaño.
 *
 * El texto sigue siendo TEXTO: se puede seleccionar, traducir y leer con un
 * lector de pantalla. No es una imagen ni un vídeo.
 *
 * SOBRE LA CURSIVA
 * Serif itálica, no caligráfica. Una caligráfica de verdad es bonita pero
 * cuesta leerla, y en un titular que vende confianza eso juega en contra.
 * La itálica se siente escrita a mano y elegante, pero cada letra sigue
 * siendo reconocible para quien no está acostumbrado a la cursiva.
 */

/** Aire a cada lado, en unidades del viewBox. La cursiva sobresale de su
 *  caja de avance y la pincelada lleva punta redonda, que se extiende media
 *  anchura de trazo más allá de donde empieza y termina. */
const MARGEN_CURSIVA = 28;

/** Alto del lienzo. El tamaño de letra y el grosor del trazo derivan de él. */
const ALTO = 130;

/** Lo que tarda en trazarse una letra, y cada cuánto entra la siguiente.
 *  El paso es menor que la duración a propósito: las letras se solapan un
 *  poco, que es como se escribe de verdad — no se espera a terminar una
 *  para empezar la siguiente. */
const DURACION_LETRA = 0.34;
const PASO_LETRA = 0.11;

interface Props {
  /** La palabra. Una sola: no rota ni se borra. */
  palabra: string;
}

interface Trazo {
  d: string;
  largo: number;
  retardo: number;
}

export default function PalabraPintada({ palabra }: Props) {
  const [anchoTexto, setAnchoTexto] = useState(560);
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const textoRef = useRef<SVGTextElement>(null);
  const medidorRef = useRef<SVGPathElement>(null);
  // useId evita que dos instancias compartan el mismo id de máscara, que en
  // SVG es global al documento y haría que una tapara a la otra.
  const idMascara = useId().replace(/:/g, "");

  // Las letras que llevan trazo. Los espacios no se pintan: no hay nada que
  // revelar, y darles su turno metería una pausa rara en mitad de la palabra.
  const letras = useMemo(
    () => Array.from(palabra).map((c, i) => ({ c, i, pinta: c.trim() !== "" })),
    [palabra]
  );

  useEffect(() => {
    const texto = textoRef.current;
    const medidor = medidorRef.current;
    if (!texto || !medidor) return;

    const medir = () => {
      const t = textoRef.current;
      const m = medidorRef.current;
      if (!t || !m) return;
      try {
        // Ancho total del lienzo. Con getBBox y no con getComputedTextLength:
        // la cursiva se inclina y sobresale de la caja de avance por los dos
        // lados, y getComputedTextLength solo suma anchos de avance — justo
        // la parte que se salía y cortaba la última letra.
        const caja = t.getBBox();
        const bordeDerecho = caja.x + caja.width;
        if (bordeDerecho > 0) setAnchoTexto(Math.ceil(bordeDerecho) + MARGEN_CURSIVA);

        // Un trazo por letra, colocado sobre ella. Las posiciones se le
        // preguntan al SVG: es el único que sabe dónde cae cada glifo con
        // esta fuente y este tamaño.
        const nuevos: Trazo[] = [];
        let turno = 0;
        for (const { i, pinta } of letras) {
          if (!pinta) continue;
          const ini = t.getStartPositionOfChar(i);
          const fin = t.getEndPositionOfChar(i);
          // Se desborda a los lados el propio grosor del trazo, para que la
          // punta redonda no deje media letra sin destapar en los extremos.
          const desborde = ALTO * 0.42;
          const x1 = ini.x - desborde;
          const x2 = fin.x + desborde;
          // Una leve curva: se lee como pincelada y no como una barra.
          const y = ALTO * 0.5;
          const d = `M ${x1} ${y + 6} Q ${(x1 + x2) / 2} ${y - 8}, ${x2} ${y + 4}`;
          m.setAttribute("d", d);
          nuevos.push({
            d,
            largo: m.getTotalLength(),
            retardo: turno * PASO_LETRA,
          });
          turno++;
        }
        setTrazos(nuevos);
      } catch {
        // getBBox y getStartPositionOfChar lanzan si el nodo todavía no está
        // pintado. Se reintenta cuando terminen de cargar las fuentes.
      }
    };

    medir();
    // Sin esto la medida se toma con la fuente de reserva, que es más
    // estrecha: el lienzo salía corto y la última letra quedaba fuera.
    let vivo = true;
    document.fonts?.ready.then(() => { if (vivo) medir(); }).catch(() => {});
    return () => { vivo = false; };
  }, [palabra, letras]);

  return (
    <svg
      viewBox={`0 0 ${anchoTexto} ${ALTO}`}
      style={{ width: "100%", maxWidth: anchoTexto, height: "auto", overflow: "visible" }}
      role="img"
      aria-label={palabra}
    >
      <defs>
        {/* Path oculto que solo sirve para preguntarle su longitud al
            navegador antes de dibujar el trazo de verdad. */}
        <path ref={medidorRef} d="M 0 0" />
        <mask id={`pincel-${idMascara}`}>
          {trazos.map((t, i) => (
            <path
              key={i}
              d={t.d}
              stroke="#fff"
              strokeWidth={ALTO * 0.9}
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: t.largo,
                strokeDashoffset: t.largo,
                animation: `palabra-trazo ${DURACION_LETRA}s cubic-bezier(0.4,0,0.3,1) ${t.retardo}s forwards`,
              }}
            />
          ))}
        </mask>
      </defs>
      <text
        ref={textoRef}
        x={MARGEN_CURSIVA}
        y={ALTO * 0.7}
        mask={trazos.length ? `url(#pincel-${idMascara})` : undefined}
        fill="currentColor"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: ALTO * 0.62,
          // Mientras no haya trazos medidos no hay máscara, y sin máscara el
          // texto se ve entero. Se oculta hasta que la haya, pero SOLO si el
          // navegador va a animar: si algo falla y los trazos nunca llegan,
          // es preferible una palabra quieta que ninguna palabra.
          opacity: trazos.length ? 1 : 0,
          transition: "opacity 80ms linear",
        }}
      >
        {palabra}
      </text>
      <style>{`
        @keyframes palabra-trazo { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          /* Sin trazo: la palabra está ahí y ya. */
          [id^="pincel-"] path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </svg>
  );
}
