"use client";

import { useEffect, useState } from "react";

/**
 * El círculo que sube desde el "+" hasta la insignia de la selección.
 *
 * PARA QUÉ SIRVE, MÁS ALLÁ DE QUE SEA BONITO
 * Cuando pulsas "+" en una tarjeta, lo que cambia está en la esquina
 * opuesta de la pantalla: un número dentro de una insignia diminuta. Sin
 * nada que enlace las dos cosas, el gesto se siente sin respuesta y la
 * gente lo pulsa dos veces. El círculo hace visible el trayecto: sale de
 * donde pulsaste y termina donde apareció el cambio.
 *
 * CÓMO SE MUEVE
 * En arco, no en línea recta. Una recta entre dos esquinas se lee como un
 * cursor deslizándose; un arco se lee como algo lanzado, que es la metáfora
 * correcta. La curva se consigue animando X e Y por separado: X avanza a
 * ritmo constante y Y sale primero hacia arriba y luego cae, así que el
 * conjunto describe una parábola.
 *
 * DÓNDE VIVE
 * En un portal a `document.body` con `position: fixed`, para que ningún
 * `overflow: hidden` de una tarjeta lo recorte a mitad de vuelo. Se
 * autodestruye al terminar; no deja nada en el DOM.
 *
 * Respeta `prefers-reduced-motion`: si el sistema pide menos movimiento,
 * no hay vuelo. El contador sigue subiendo, que es la información de
 * verdad.
 */

export interface Vuelo {
  /** Identificador del disparo. Cambiarlo relanza la animación. */
  clave: number;
  desde: { x: number; y: number };
  hasta: { x: number; y: number };
}

const DURACION = 620;

export default function VueloAlCarrito({
  vuelo,
  alTerminar,
}: {
  vuelo: Vuelo | null;
  alTerminar: () => void;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!vuelo) return;
    const t = setTimeout(alTerminar, DURACION);
    return () => clearTimeout(t);
  }, [vuelo, alTerminar]);

  if (!montado || !vuelo) return null;

  const dx = vuelo.hasta.x - vuelo.desde.x;
  const dy = vuelo.hasta.y - vuelo.desde.y;

  return (
    <div
      key={vuelo.clave}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: vuelo.desde.x,
        top: vuelo.desde.y,
        width: 18,
        height: 18,
        marginLeft: -9,
        marginTop: -9,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
        boxShadow: "0 4px 14px rgba(176,137,104,0.55)",
        pointerEvents: "none",
        zIndex: 4000,
        animation: `vuelo-x ${DURACION}ms cubic-bezier(0.4,0,0.6,1) forwards`,
      }}
    >
      {/* Un hijo para separar los dos ejes: el padre lleva la X y este la Y.
          Una sola animación de `translate` no puede tener ritmos distintos
          en cada eje, y sin eso el recorrido sale recto. */}
      <span
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "inherit",
          animation: `vuelo-y ${DURACION}ms cubic-bezier(0.3,0,0.2,1) forwards`,
        }}
      />
      <style>{`
        @keyframes vuelo-x {
          from { transform: translateX(0); opacity: 1; }
          70%  { opacity: 1; }
          to   { transform: translateX(${dx}px); opacity: 0.25; }
        }
        @keyframes vuelo-y {
          from { transform: translateY(0) scale(1); }
          /* El punto alto del arco: sube antes de caer. */
          40%  { transform: translateY(${dy * 0.25 - 90}px) scale(1.25); }
          to   { transform: translateY(${dy}px) scale(0.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="vuelo-x"], [style*="vuelo-y"] { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
