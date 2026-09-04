"use client";

import { useRef } from "react";
import { Check, Plus } from "lucide-react";
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

  const alPulsar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dentro) {
      quitar(item.id);
      return;
    }
    if (añadir(item)) volarDesde(ref.current);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={alPulsar}
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
        transition: "background 180ms var(--mov-curva), transform 180ms var(--mov-curva), border-color 180ms var(--mov-curva)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {dentro ? <Check size={16} strokeWidth={3} /> : <Plus size={17} />}
    </button>
  );
}
