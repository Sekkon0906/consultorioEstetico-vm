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
 * ESTÁ SIEMPRE, TAMBIÉN VACÍA
 * Antes solo aparecía al meter algo. Dos problemas, y el segundo era un
 * fallo de verdad:
 *
 *   1. Aparecía de la nada al lado del avatar. Un icono que se materializa
 *      donde no había nada se lee como un error de la página, no como una
 *      respuesta a lo que acabas de pulsar.
 *   2. **El círculo que vuela no se veía nunca en el primer añadido.** El
 *      vuelo necesita saber a dónde ir, y su destino es esta insignia: si
 *      no está montada, `volarDesde` no tiene ancla y se cancela. O sea que
 *      justo la primera vez —la única que importa para entender el gesto—
 *      no había animación.
 *
 * Vacía se muestra apagada y sin contador, así que no grita por llenarse.
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
  const vacia = total === 0;

  return (
    <Link
      href="/seleccion"
      ref={registrarAncla}
      aria-label={
        vacia
          ? "Mi selección, vacía"
          : `Mi selección, ${total} ${total === 1 ? "procedimiento" : "procedimientos"}`
      }
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
        // Vacía baja de peso pero sigue ahí: se ve que existe y que no
        // tiene nada, que es información en sí misma.
        opacity: vacia ? 0.45 : 1,
        transition: "opacity 260ms var(--mov-curva)",
      }}
    >
      <ClipboardList size={compacta ? 17 : 19} />
      {!vacia && (
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
      )}
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
