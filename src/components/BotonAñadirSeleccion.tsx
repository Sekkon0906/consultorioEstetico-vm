"use client";

import { useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { MUELLE_TACTO } from "@/lib/movimiento";
import { useCarrito, type ItemSeleccion } from "@/context/CarritoContext";

/**
 * El "+" que mete un procedimiento en la selección.
 *
 * Tiene dos estados y no tres: o está en la lista o no. Al añadirlo cambia
 * a una marca de verificación y se queda así, porque el paciente necesita
 * saber de un vistazo qué ya eligió al recorrer la rejilla.
 *
 * Pulsarlo cuando ya está lo QUITA. Podría no hacer nada, pero un control
 * que deja de responder se lee como estropeado; y llevar al paciente hasta
 * la página de selección solo para deshacer un toque es demasiado viaje
 * para el tamaño del error.
 *
 * El botón no navega. Vive dentro de una tarjeta que es un enlace, así que
 * detiene la propagación: sin eso, añadir a la selección te sacaba de la
 * rejilla a la ficha del procedimiento, que es justo lo contrario de lo que
 * quieres cuando estás comparando.
 */
export default function BotonAñadirSeleccion({
  item,
  tamaño = 34,
  className,
}: {
  item: ItemSeleccion;
  tamaño?: number;
  className?: string;
}) {
  const { añadir, quitar, tiene, volarDesde } = useCarrito();
  const ref = useRef<HTMLButtonElement>(null);
  const dentro = tiene(item.id);
  // Sube en cada pulsación. La animación del icono va atada a él con la
  // clave de React: sin eso, pulsar dos veces seguidas solo animaría la
  // primera, porque el elemento no cambia y una animación CSS no se
  // reinicia sola.
  const [toque, setToque] = useState(0);

  const alPulsar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setToque((n) => n + 1);
    if (dentro) {
      quitar(item.id);
      return;
    }
    if (añadir(item)) volarDesde(ref.current);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={alPulsar}
      /* Muelle, no curva de tiempo: el botón tiene que sentirse como algo
         con masa que se hunde bajo el dedo y vuelve. Ver lib/movimiento. */
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.82 }}
      transition={MUELLE_TACTO}
      className={className}
      aria-pressed={dentro}
      aria-label={
        dentro
          ? `Quitar ${item.nombre} de mi selección`
          : `Añadir ${item.nombre} a mi selección`
      }
      title={dentro ? "Quitar de mi selección" : "Añadir a mi selección"}
      style={{
        width: tamaño,
        height: tamaño,
        flexShrink: 0,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: dentro ? "none" : "1px solid var(--border-strong)",
        background: dentro
          ? "linear-gradient(135deg, var(--brand), var(--brand-soft))"
          : "var(--surface)",
        color: dentro ? "var(--brand-contrast)" : "var(--text)",
        transition: "background 220ms var(--mov-curva), border-color 220ms var(--mov-curva)",
      }}
    >
      {/* El icono no se cambia y ya: entra girando y creciendo desde el
          centro, así que el paso de "+" a "✓" se lee como una respuesta al
          toque y no como un sprite que se sustituye. */}
      <span
        key={`${dentro}-${toque}`}
        style={{
          display: "flex",
          animation: "sel-icono 340ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {dentro ? <Check size={16} strokeWidth={3} /> : <Plus size={17} />}
      </span>
      <style>{`
        @keyframes sel-icono {
          from { transform: scale(0.2) rotate(-120deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="sel-icono"] { animation: none !important; }
        }
      `}</style>
    </motion.button>
  );
}
