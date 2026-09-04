"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Check, X } from "lucide-react";
import { solicitarReagendaApi } from "@/services/reagendasApi";
import { getDisponibilidadApi } from "@/services/citasApi";
import { aISOLocal } from "@/lib/fechas";
import { MUELLE_LAMINA, MUELLE_TACTO } from "@/lib/movimiento";

/**
 * Que el paciente pueda pedir otro día, en vez de tener que llamar.
 *
 * LO QUE FALTABA
 * El endpoint `POST /citas/:id/solicitar-reagenda` existía en el servidor,
 * la función cliente existía en `reagendasApi`, y **no había ningún botón
 * que la llamara**. La dirección contraria sí estaba entera: si la doctora
 * proponía un cambio, el paciente podía aceptarlo o rechazarlo. Al revés,
 * no: quien no podía venir tenía que llamar por teléfono.
 *
 * NO CAMBIA LA CITA, LA PIDE
 * Esto crea una solicitud; la cita se queda donde está hasta que la doctora
 * responda. Se dice con todas las letras en el propio panel, porque la
 * diferencia importa: si alguien creyera que ya está cambiada, no vendría
 * el día que sigue reservado.
 *
 * EL MOTIVO NO ES OBLIGATORIO
 * Pedirlo obligatorio aquí es pedirle a alguien que justifique por qué no
 * puede ir al médico. La doctora puede preguntar si le hace falta.
 *
 * LAS HORAS SON LAS DE VERDAD
 * Al elegir día se consultan las horas realmente libres, las mismas que ve
 * el flujo de agendar. Ofrecer una lista fija llevaría a pedir horas ya
 * ocupadas, y cada una de esas es un rechazo que se podía haber evitado.
 */
export default function PedirReagenda({
  citaId,
  fechaActual,
  onPedida,
}: {
  citaId: string;
  fechaActual: string;
  onPedida?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [horas, setHoras] = useState<string[] | null>(null);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const hoy = aISOLocal(new Date());

  const alElegirDia = async (nueva: string) => {
    setFecha(nueva);
    setHora("");
    setHoras(null);
    if (!nueva) return;
    try {
      const d = await getDisponibilidadApi(nueva);
      // `globales` son las horas que la doctora tiene abiertas ese día;
      // `ocupadas`, las que ya tienen cita. Lo que queda es lo que se puede
      // pedir de verdad.
      const libres = (d.globales || []).filter((h) => !(d.ocupadas || []).includes(h));
      setHoras(libres);
    } catch {
      // Sin disponibilidad no se bloquea la solicitud: se deja escribir la
      // hora y que la doctora decida. Peor que una hora ocupada es no poder
      // pedir nada.
      setHoras([]);
    }
  };

  const enviar = async () => {
    if (!fecha || !hora) return;
    setEstado("enviando");
    setError(null);
    try {
      await solicitarReagendaApi(citaId, { nueva_fecha: fecha, nueva_hora: hora, motivo });
      setEstado("ok");
      onPedida?.();
      setTimeout(() => { setAbierto(false); setEstado("idle"); setFecha(""); setHora(""); setMotivo(""); }, 2200);
    } catch (e: unknown) {
      setEstado("error");
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
    }
  };

  const campo: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    outline: "none",
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setAbierto((p) => !p)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={MUELLE_TACTO}
        aria-expanded={abierto}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "0.5rem 1.1rem", borderRadius: 100,
          border: "1px solid var(--border-strong)", background: "transparent",
          color: "var(--text-soft)", fontWeight: 600, fontSize: "0.82rem",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <CalendarClock size={14} /> {abierto ? "Cancelar" : "Pedir otro día"}
      </motion.button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={MUELLE_LAMINA}
            style={{ overflow: "hidden", width: "100%" }}
          >
            <div style={{ marginTop: "0.9rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.1rem" }}>
              {estado === "ok" ? (
                <p style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--estado-atendida)", fontWeight: 600, margin: 0 }}>
                  <Check size={16} /> Solicitud enviada. Tu cita sigue en pie
                  hasta que la doctora responda.
                </p>
              ) : (
                <>
                  <p style={{ color: "var(--text-soft)", fontSize: "0.84rem", margin: "0 0 0.9rem" }}>
                    Esto <strong>no cambia tu cita todavía</strong>: envía una
                    solicitud. Tu hora del {fechaActual} sigue reservada hasta
                    que la doctora responda.
                  </p>

                  <div style={{ display: "grid", gap: "0.7rem" }}>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Nuevo día
                      </span>
                      <input
                        type="date"
                        value={fecha}
                        min={hoy}
                        onChange={(e) => void alElegirDia(e.target.value)}
                        style={campo}
                      />
                    </label>

                    {fecha && (
                      <label style={{ display: "block" }}>
                        <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                          Nueva hora
                        </span>
                        {horas === null ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0 }}>Buscando horas libres…</p>
                        ) : horas.length === 0 ? (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0 }}>
                            Ese día no queda ninguna hora libre. Prueba con otro.
                          </p>
                        ) : (
                          <select value={hora} onChange={(e) => setHora(e.target.value)} style={campo}>
                            <option value="">Elige una hora</option>
                            {horas.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        )}
                      </label>
                    )}

                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Motivo <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
                      </span>
                      <input
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Si quieres contar por qué"
                        style={campo}
                      />
                    </label>
                  </div>

                  {error && (
                    <p style={{ display: "flex", alignItems: "flex-start", gap: 7, color: "var(--danger)", fontSize: "0.83rem", margin: "0.8rem 0 0" }}>
                      <X size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {error}
                    </p>
                  )}

                  <motion.button
                    type="button"
                    onClick={() => void enviar()}
                    disabled={!fecha || !hora || estado === "enviando"}
                    whileHover={{ scale: fecha && hora ? 1.03 : 1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={MUELLE_TACTO}
                    className="btn-accion"
                    style={{
                      marginTop: "1rem", width: "100%", padding: "0.75rem",
                      borderRadius: 100, border: "none",
                      background: fecha && hora
                        ? "linear-gradient(135deg, var(--brand), var(--brand-soft))"
                        : "var(--surface-soft)",
                      color: fecha && hora ? "var(--brand-contrast)" : "var(--text-muted)",
                      fontWeight: 700, fontSize: "0.9rem",
                      cursor: fecha && hora ? "pointer" : "default",
                      fontFamily: "inherit",
                    }}
                  >
                    {estado === "enviando" ? "Enviando…" : "Enviar solicitud"}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
