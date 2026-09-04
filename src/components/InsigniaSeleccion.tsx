"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useCarrito } from "@/context/CarritoContext";

/**
 * La insignia de la selección en el navbar: destino del círculo que vuela.
 *
 * POR QUÉ UN PORTAPAPELES Y NO UN CARRITO DE LA COMPRA
 * El icono es la promesa. Un carrito de supermercado anuncia que al final
 * hay una caja donde se paga todo junto, y aquí no la hay: cada
 * procedimiento lleva su día y su hora y la doctora los acepta por
 * separado. Un portapapeles anuncia una lista, que es exactamente lo que
 * es.
 *
 * CUÁNDO APARECE
 * Solo cuando hay algo dentro. Una insignia permanente marcada con 0 es un
 * hueco que pide ser llenado; en una web de salud eso empuja a acumular
 * procedimientos, que no es lo que queremos empujar.
 *
 * EL TEMBLOR
 * Se dispara con `pulso`, un contador que sube en cada añadido. La clave de
 * React va atada a él: al cambiar la clave el nodo se reemplaza y la
 * animación arranca de cero. Sin eso, añadir dos cosas seguidas solo
 * animaría la primera, porque una animación CSS no se reinicia sola cuando
 * el elemento no ha cambiado.
 */
export default function InsigniaSeleccion({ compacta = false }: { compacta?: boolean }) {
  const { total, pulso, registrarAncla } = useCarrito();

  if (total === 0) return null;

  return (
    <Link
      href="/seleccion"
      ref={registrarAncla}
      aria-label={`Mi selección, ${total} ${total === 1 ? "procedimiento" : "procedimientos"}`}
      title="Mi selección"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: compacta ? 38 : 42,
        height: compacta ? 38 : 42,
        borderRadius: "50%",
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        color: "var(--text)",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <ClipboardList size={compacta ? 17 : 19} />
      <span
        key={pulso}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          minWidth: 19,
          height: 19,
          padding: "0 5px",
          borderRadius: 100,
          background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
          color: "var(--brand-contrast)",
          fontSize: "0.68rem",
          fontWeight: 800,
          lineHeight: "19px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(176,137,104,0.5)",
          animation: "insignia-tiembla 520ms cubic-bezier(0.36,0.07,0.19,0.97)",
        }}
      >
        {total}
      </span>
      <style>{`
        @keyframes insignia-tiembla {
          0%   { transform: scale(1) rotate(0deg); }
          /* Entra creciendo: el número acaba de recibir algo. */
          25%  { transform: scale(1.45) rotate(-9deg); }
          45%  { transform: scale(1.15) rotate(8deg); }
          65%  { transform: scale(1.25) rotate(-5deg); }
          85%  { transform: scale(1.05) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="insignia-tiembla"] { animation: none !important; }
        }
      `}</style>
    </Link>
  );
}
