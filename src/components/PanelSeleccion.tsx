"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ClipboardList, Trash2, X } from "lucide-react";
import { useCarrito } from "@/context/CarritoContext";
import { MUELLE_LAMINA, MUELLE_TACTO, CURVA_OPACIDAD } from "@/lib/movimiento";

/**
 * La selección, desplegada desde el propio botón.
 *
 * POR QUÉ UN PANEL Y NO UNA PÁGINA
 * Antes la insignia navegaba a `/seleccion`. Eso te saca de donde estabas:
 * si estás comparando procedimientos y quieres comprobar qué llevas, mirar
 * cuesta perder la rejilla y volver atrás. Un panel deja la página debajo,
 * así que mirar es gratis. `/seleccion` sigue existiendo para quien llega
 * por enlace directo o quiere la vista completa.
 *
 * DE DÓNDE SALE
 * De la derecha, que es donde está el botón que lo abre. Un panel que
 * aparece en el lado contrario obliga a buscar de dónde vino.
 *
 * CÓMO SE CIERRA
 * Con la X, con Escape, o pulsando fuera. Las tres, porque cada persona
 * intenta una distinta y fallar en cerrar algo que tapa la página se siente
 * como estar atrapado.
 *
 * MIENTRAS ESTÁ ABIERTO
 * El fondo no se desplaza. Sin eso, al llegar al final del panel la rueda
 * del ratón sigue moviendo la página de detrás, y el panel parece flotar
 * sobre algo que se escapa.
 */
export default function PanelSeleccion({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const { items, quitar, vaciar, total } = useCarrito();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape cierra, y el foco entra al panel al abrirlo: quien navega con
  // teclado tiene que poder alcanzar lo que acaba de aparecer sin recorrer
  // toda la página primero.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", alPulsar);
    panelRef.current?.focus();
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = previo;
    };
  }, [abierto, onCerrar]);

  // El portal evita que cualquier `overflow` o `transform` del navbar
  // recorte el panel o lo saque de sitio: un `position: fixed` deja de
  // referirse a la ventana en cuanto un antepasado tiene `transform`.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={CURVA_OPACIDAD}
            onClick={onCerrar}
            style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 3000 }}
          />

          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Mi selección de procedimientos"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={MUELLE_LAMINA}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(420px, 100vw)",
              background: "var(--bg-elevated)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.25)",
              zIndex: 3001,
              display: "flex", flexDirection: "column",
              outline: "none",
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1.2rem 1.3rem", borderBottom: "1px solid var(--border)" }}>
              <ClipboardList size={20} color="var(--brand)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  Mi selección
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                  {total === 0
                    ? "Vacía"
                    : `${total} ${total === 1 ? "procedimiento" : "procedimientos"}`}
                </p>
              </div>
              <motion.button
                type="button"
                onClick={onCerrar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                transition={MUELLE_TACTO}
                aria-label="Cerrar"
                style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X size={17} color="var(--text)" />
              </motion.button>
            </header>

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.3rem" }}>
              {total === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
                  <ClipboardList size={34} color="var(--text-muted)" style={{ marginBottom: "0.9rem" }} />
                  <p style={{ color: "var(--text)", fontWeight: 600, margin: "0 0 0.3rem" }}>
                    Todavía no has guardado nada
                  </p>
                  <p style={{ color: "var(--text-soft)", fontSize: "0.87rem", margin: "0 0 1.4rem" }}>
                    Pulsa el <strong>+</strong> en cualquier procedimiento para
                    tenerlo aquí a mano.
                  </p>
                  <Link
                    href="/procedimientos"
                    onClick={onCerrar}
                    className="btn-accion"
                    style={{ display: "inline-flex", padding: "0.7rem 1.5rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}
                  >
                    Ver procedimientos
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={MUELLE_TACTO}
                        style={{ display: "flex", gap: "0.8rem", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "0.7rem" }}
                      >
                        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "var(--surface-soft)" }}>
                          {item.imagen && (
                            <Image src={item.imagen} alt="" fill sizes="56px" quality={55} style={{ objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            href={`/procedimientos/${item.id}`}
                            onClick={onCerrar}
                            style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {item.nombre}
                          </Link>
                          <Link
                            href={`/agendar?proc=${encodeURIComponent(item.nombre)}`}
                            onClick={onCerrar}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, fontSize: "0.78rem", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}
                          >
                            <CalendarCheck size={13} /> Agendar
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitar(item.id)}
                          aria-label={`Quitar ${item.nombre}`}
                          title="Quitar"
                          style={{ width: 32, height: 32, borderRadius: 9, background: "color-mix(in srgb, var(--danger) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {total > 0 && (
              <footer style={{ borderTop: "1px solid var(--border)", padding: "1.1rem 1.3rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                <Link
                  href="/seleccion"
                  onClick={onCerrar}
                  className="btn-accion"
                  style={{ display: "flex", justifyContent: "center", padding: "0.8rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}
                >
                  Ver la selección completa
                </Link>
                <button
                  type="button"
                  onClick={vaciar}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", padding: "0.2rem" }}
                >
                  Vaciar selección
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
