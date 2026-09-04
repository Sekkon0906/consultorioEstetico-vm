"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, CalendarCheck, ClipboardList } from "lucide-react";
import { useCarrito } from "@/context/CarritoContext";

/**
 * "Mi selección": los procedimientos que el paciente ha ido guardando.
 *
 * NO ES UNA PANTALLA DE PAGO, Y NO LO FINGE
 * No hay un botón de "confirmar todo". Cada procedimiento se agenda por su
 * cuenta porque cada uno lleva su día y su hora, y la doctora los acepta
 * uno a uno. Un único botón grande de confirmar sería mentir sobre lo que
 * pasa después.
 *
 * Lo que sí hay es un total, porque saber cuánto suma es la razón principal
 * por la que alguien junta varias cosas en una lista. Va etiquetado como
 * orientativo: los precios varían según la valoración médica, y eso ya lo
 * dice la ficha de cada procedimiento.
 *
 * El botón de agendar de cada línea lleva el nombre en la URL, igual que
 * desde la ficha, así que el flujo de agenda no ha tenido que cambiar.
 */

/** "350000" y 350000 salen los dos como "350.000". El precio llega de la
 *  API unas veces como número y otras como cadena ya formateada, así que se
 *  normaliza a número y se vuelve a formatear en el locale de Colombia. */
function mostrarPrecio(precio: string | number): string {
  const n = aNumero(precio);
  return n ? n.toLocaleString("es-CO") : String(precio);
}

function aNumero(precio: string | number | undefined): number {
  if (precio == null) return 0;
  if (typeof precio === "number") return precio;
  // "350.000 COP" → 350000. Los puntos son separadores de miles en
  // Colombia, así que se quitan antes de leer el número.
  const m = String(precio).replace(/[.\s]/g, "").match(/\d+/);
  return m ? Number(m[0]) : 0;
}

export default function SeleccionPage() {
  const { items, quitar, vaciar, total } = useCarrito();

  const suma = items.reduce((acc, i) => acc + aNumero(i.precio), 0);

  return (
    <main style={{ minHeight: "60vh", padding: "3rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: "var(--ancho-contenido)", margin: "0 auto" }}>

        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.4rem" }}>
            Mi selección
          </h1>
          <p style={{ color: "var(--text-soft)", maxWidth: "var(--ancho-texto)", fontSize: "0.95rem" }}>
            Los procedimientos que has guardado. Cada uno se agenda por
            separado, con su propio día y hora, porque la doctora los
            confirma uno a uno.
          </p>
        </header>

        {total === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20 }}>
            <ClipboardList size={40} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
            <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: "0.4rem" }}>
              Todavía no has guardado nada
            </p>
            <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "1.6rem" }}>
              Pulsa el <strong>+</strong> en cualquier procedimiento para
              tenerlo aquí a mano.
            </p>
            <Link
              href="/procedimientos"
              className="btn-accion"
              style={{ display: "inline-flex", alignItems: "center", padding: "0.85rem 1.8rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, textDecoration: "none" }}
            >
              Ver procedimientos
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "1.8rem" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="seleccion-fila"
                  style={{ display: "flex", gap: "1.1rem", alignItems: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 18, padding: "1rem" }}
                >
                  <div style={{ position: "relative", width: 84, height: 66, flexShrink: 0, borderRadius: 12, overflow: "hidden", background: "var(--surface-soft)" }}>
                    {item.imagen && (
                      <Image src={item.imagen} alt="" fill sizes="84px" quality={55} style={{ objectFit: "cover" }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/procedimientos/${item.id}`}
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textDecoration: "none", display: "block", marginBottom: "0.15rem" }}
                    >
                      {item.nombre}
                    </Link>
                    {item.precio != null && (
                      <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--brand)" }}>
                        {mostrarPrecio(item.precio)}{" "}
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)" }}>COP</span>
                      </span>
                    )}
                  </div>

                  <div className="seleccion-acciones" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
                    <Link
                      href={`/agendar?proc=${encodeURIComponent(item.nombre)}`}
                      className="btn-accion"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.65rem 1.3rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.86rem", textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      <CalendarCheck size={15} /> Agendar
                    </Link>
                    <button
                      type="button"
                      onClick={() => quitar(item.id)}
                      aria-label={`Quitar ${item.nombre} de mi selección`}
                      title="Quitar de mi selección"
                      style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 size={15} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.2rem 1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  Total orientativo
                </p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, marginBottom: "0.25rem" }}>
                  ${suma.toLocaleString("es-CO")}
                </p>
                <small style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
                  El precio final puede variar según la valoración médica.
                </small>
              </div>
              <button
                type="button"
                onClick={vaciar}
                style={{ padding: "0.7rem 1.3rem", borderRadius: 100, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-soft)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "0.86rem" }}
              >
                Vaciar selección
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          /* En vertical la fila no cabe: la imagen y el texto se quedan
             arriba y las acciones bajan a una línea propia, a ancho
             completo, que es donde el pulgar llega sin estirarse. */
          .seleccion-fila { flex-wrap: wrap; }
          .seleccion-acciones { width: 100%; }
          .seleccion-acciones a { flex: 1; justify-content: center; }
        }
      `}</style>
    </main>
  );
}
