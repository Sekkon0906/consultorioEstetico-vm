"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Check, X } from "lucide-react";
import {
  getReagendasAdminApi,
  aprobarReagendaAdminApi,
  rechazarReagendaAdminApi,
} from "@/services/reagendasApi";
import { formatearFecha } from "@/lib/fechas";
import { MUELLE_ENTRADA, MUELLE_TACTO } from "@/lib/movimiento";

/**
 * Los cambios de fecha que piden los pacientes.
 *
 * POR QUÉ EXISTE
 * El paciente ya puede pedir otro día desde su perfil. Sin esta pantalla,
 * esas peticiones caían en una tabla que nadie miraba: el paciente pide y
 * recibe silencio, que es peor que no dejarle pedir. Las dos mitades tienen
 * que ir juntas o no va ninguna.
 *
 * DÓNDE VIVE
 * Arriba del todo en "Citas Agendadas", y solo cuando hay algo. Una
 * solicitud es una persona esperando respuesta: no puede estar en una
 * sección aparte a la que se entra si uno se acuerda.
 *
 * LO QUE MUESTRA
 * De qué cita se trata, qué día tiene ahora y qué día pide. Sin las tres
 * cosas a la vez no se puede decidir: aprobar a ciegas es mover una cita
 * sin saber desde dónde.
 *
 * APROBAR MUEVE LA CITA
 * No es un "visto". Por eso el botón lo dice y por eso, al aprobar, la
 * fila desaparece y se avisa al calendario de que recargue: dejarla ahí
 * invitaría a pulsarla dos veces.
 */

interface Solicitud {
  id: string;
  cita_id: string;
  nombres?: string;
  apellidos?: string;
  procedimiento?: string;
  fecha_actual?: string;
  hora_actual?: string;
  nueva_fecha: string;
  nueva_hora: string;
  motivo?: string;
  estado: string;
  origen?: string;
}

export default function SolicitudesReagenda({
  locale = "es-CO",
  onResuelta,
}: {
  locale?: string;
  onResuelta?: () => void;
}) {
  const [items, setItems] = useState<Solicitud[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const datos = (await getReagendasAdminApi()) as unknown as Solicitud[];
      // Dos filtros, y los dos hacen falta:
      //
      //  · `pendiente` — el historial de lo ya decidido no es una tarea, y
      //    compite por la atención con las que sí lo son.
      //  · `origen === "paciente"` — la tabla guarda las DOS direcciones de
      //    la conversación. Sin esto, la doctora vería sus propias
      //    propuestas listadas como "un paciente pide cambiar su cita", y
      //    aprobaría una petición que hizo ella misma.
      setItems(
        (datos || []).filter((r) => r.estado === "pendiente" && r.origen === "paciente")
      );
    } catch {
      // Silencio a propósito: esto va encima del panel de citas, que ya
      // avisa si la sesión cayó. Dos avisos del mismo fallo es ruido.
      setItems([]);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const responder = async (id: string, aprobar: boolean) => {
    setProcesando(id);
    setError(null);
    try {
      if (aprobar) await aprobarReagendaAdminApi(id);
      else await rechazarReagendaAdminApi(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      onResuelta?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo responder");
    } finally {
      setProcesando(null);
    }
  };

  if (items.length === 0) return null;

  const fmt = (f?: string) => (f ? formatearFecha(f, locale) : "—");

  return (
    <section style={{ marginBottom: "1.6rem" }}>
      <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--estado-pendiente)", marginBottom: "0.8rem" }}>
        <CalendarClock size={14} />
        {items.length === 1
          ? "1 paciente pide cambiar su cita"
          : `${items.length} pacientes piden cambiar su cita`}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        <AnimatePresence initial={false}>
          {items.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ ...MUELLE_ENTRADA, delay: i * 0.05 }}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--estado-pendiente-borde)",
                borderLeft: "3px solid var(--estado-pendiente)",
                borderRadius: 14,
                padding: "1rem 1.2rem",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ color: "var(--text)", fontWeight: 700, fontSize: "0.98rem", margin: 0 }}>
                  {[r.nombres, r.apellidos].filter(Boolean).join(" ") || "Paciente"}
                  {r.procedimiento && (
                    <span style={{ fontWeight: 500, color: "var(--text-soft)" }}> · {r.procedimiento}</span>
                  )}
                </p>
                <p style={{ fontSize: "0.86rem", margin: "0.3rem 0 0", color: "var(--text-soft)" }}>
                  {/* El "de → a" es lo único que hace falta leer para decidir. */}
                  <span style={{ textDecoration: "line-through", opacity: 0.7 }}>
                    {fmt(r.fecha_actual)}{r.hora_actual ? `, ${r.hora_actual}` : ""}
                  </span>
                  {"  "}
                  <strong style={{ color: "var(--text)" }}>
                    {fmt(r.nueva_fecha)}{r.nueva_hora ? `, ${r.nueva_hora}` : ""}
                  </strong>
                </p>
                {r.motivo && (
                  <p style={{ fontSize: "0.83rem", fontStyle: "italic", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>
                    &ldquo;{r.motivo}&rdquo;
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <motion.button
                  type="button"
                  onClick={() => void responder(r.id, true)}
                  disabled={procesando === r.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={MUELLE_TACTO}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "0.55rem 1.1rem", borderRadius: 100, border: "none",
                    background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
                    color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.84rem",
                    cursor: procesando === r.id ? "wait" : "pointer", fontFamily: "inherit",
                  }}
                >
                  <Check size={15} /> Mover la cita
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => void responder(r.id, false)}
                  disabled={procesando === r.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={MUELLE_TACTO}
                  aria-label="Rechazar la solicitud"
                  title="Rechazar: la cita se queda como está"
                  style={{
                    width: 38, height: 38, borderRadius: 100,
                    background: "color-mix(in srgb, var(--danger) 12%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
                    cursor: procesando === r.id ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={16} color="var(--danger)" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.83rem", marginTop: "0.7rem" }}>{error}</p>
      )}
    </section>
  );
}
