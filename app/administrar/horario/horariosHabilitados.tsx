"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBloqueosGlobalesApi,
  addBloqueoGlobalApi,
  removeBloqueoGlobalApi,
  getBloqueosPorFechaApi,
  createBloqueoHoraApi,
  deleteBloqueoHoraByFechaApi,
  getCitasByDayApi,
} from "@/services/citasApi";
import { aISOLocal } from "@/lib/fechas";

const HORAS_BASE = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM",
  "05:00 PM","05:30 PM","06:00 PM",
];

interface CitaHora { hora: string; estado: string; nombres: string; procedimiento: string; }
interface ConfirmAction { tipo: "bloquear" | "desbloquear" | "global_bloquear" | "global_desbloquear"; hora: string; }

export default function HorariosHabilitados() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bloqueosHoras, setBloqueosHoras] = useState<Set<string>>(new Set());
  const [bloqueosGlobales, setBloqueosGlobales] = useState<Set<string>>(new Set());
  const [citasDelDia, setCitasDelDia] = useState<CitaHora[]>([]);
  const [loadingDia, setLoadingDia] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [tab, setTab] = useState<"diario" | "global">("diario");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { cargarGlobales(); }, []);

  const cargarGlobales = async () => {
    try {
      const horas = await getBloqueosGlobalesApi();
      setBloqueosGlobales(new Set(horas));
    } catch (e) { console.error(e); }
  };

  const cargarDia = async (fecha: string) => {
    setLoadingDia(true);
    try {
      const [bloqueos, citas] = await Promise.all([
        getBloqueosPorFechaApi(fecha),
        getCitasByDayApi(fecha),
      ]);
      setBloqueosHoras(new Set(bloqueos.map((b) => b.hora)));
      setCitasDelDia(
        citas
          .filter((c) => c.estado !== "cancelada")
          .map((c) => ({ hora: c.hora, estado: c.estado, nombres: c.nombres, procedimiento: c.procedimiento }))
      );
    } catch (e) { console.error(e); }
    finally { setLoadingDia(false); }
  };

  const ejecutarAccion = async () => {
    if (!confirmAction) return;
    const { tipo, hora } = confirmAction;
    setConfirmAction(null);
    try {
      if (tipo === "bloquear" && selectedDate) {
        await createBloqueoHoraApi({ fechaISO: selectedDate, hora, motivo: "Bloqueo manual" });
        showToast(`${hora} bloqueada`); cargarDia(selectedDate);
      } else if (tipo === "desbloquear" && selectedDate) {
        await deleteBloqueoHoraByFechaApi(selectedDate, hora);
        showToast(`${hora} desbloqueada`); cargarDia(selectedDate);
      } else if (tipo === "global_bloquear") {
        await addBloqueoGlobalApi(hora, "Bloqueo global");
        showToast(`${hora} bloqueada globalmente`); cargarGlobales();
      } else if (tipo === "global_desbloquear") {
        await removeBloqueoGlobalApi(hora);
        showToast(`${hora} desbloqueada globalmente`); cargarGlobales();
      }
    } catch (e: any) { showToast("Error: " + e.message); }
  };

  const getCitaEnHora = (hora: string) => citasDelDia.find(c => c.hora === hora);
  const esBloqueada = (hora: string) => bloqueosHoras.has(hora);
  const esGlobal = (hora: string) => bloqueosGlobales.has(hora);

  const primerDia = new Date(anio, mes, 1).getDay() || 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasCal: (number | null)[] = [];
  for (let i = 1; i < primerDia; i++) diasCal.push(null);
  for (let d = 1; d <= diasEnMes; d++) diasCal.push(d);
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const getHoraStyle = (hora: string): { bg: string; color: string; border: string; label: string } => {
    const cita = getCitaEnHora(hora);
    if (esGlobal(hora)) return { bg: "#EDE0F0", color: "#5B2C8E", border: "#C8B0E0", label: "Global" };
    if (cita) {
      if (cita.estado === "pendiente") return { bg: "#FFF8E1", color: "#7D6608", border: "#F0E0A0", label: `${cita.nombres} - ${cita.procedimiento}` };
      if (cita.estado === "confirmada") return { bg: "#E3F2FD", color: "#0B3C78", border: "#A0C8F0", label: `${cita.nombres} - ${cita.procedimiento}` };
      if (cita.estado === "atendida") return { bg: "#E8F5E9", color: "#145A32", border: "#A0D8A8", label: `${cita.nombres} - ${cita.procedimiento}` };
      return { bg: "#EEF7EE", color: "var(--success)", border: "#A8D8B9", label: `${cita.nombres}` };
    }
    if (esBloqueada(hora)) return { bg: "#FDE8D8", color: "var(--danger)", border: "#F0A898", label: "Bloqueada" };
    return { bg: "var(--surface-soft)", color: "var(--text)", border: "var(--border)", label: "Disponible" };
  };

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.5rem" }}>Gestion de Horarios</h2>

      {toast && <div style={{ background: "var(--border)", color: "var(--text)", border: "1px solid #D4C4B0", borderRadius: 12, padding: "0.6rem 1rem", textAlign: "center", fontWeight: 600, marginBottom: "1rem", fontSize: "0.88rem" }}>{toast}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[{ k: "diario", l: "Bloqueo por dia" }, { k: "global", l: "Bloqueo global" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ padding: "0.6rem 1.3rem", borderRadius: 100, fontWeight: 600, fontSize: "0.85rem", border: "none", cursor: "pointer",
              background: tab === t.k ? "linear-gradient(135deg, var(--brand-deep), #B08968)" : "var(--surface-soft)", color: tab === t.k ? "white" : "var(--text)" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* GLOBAL TAB */}
      {tab === "global" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.5rem" }}>
          <h5 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Horarios bloqueados permanentemente</h5>
          <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", marginBottom: "1.2rem" }}>Estas horas nunca se mostraran como disponibles</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {HORAS_BASE.map(hora => {
              const bl = esGlobal(hora);
              return (
                <button key={hora} onClick={() => setConfirmAction({ tipo: bl ? "global_desbloquear" : "global_bloquear", hora })}
                  style={{ padding: "0.6rem", borderRadius: 12, fontWeight: 600, fontSize: "0.78rem", border: `1px solid ${bl ? "#C8B0E0" : "var(--border)"}`, cursor: "pointer",
                    background: bl ? "#EDE0F0" : "var(--surface-soft)", color: bl ? "#5B2C8E" : "var(--text)" }}>
                  {hora} {bl ? "(Bloqueada)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DIARIO TAB */}
      {tab === "diario" && (
        <div className="row g-4">
          <div className="col-md-5">
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }}
                  style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--border)", border: "none", color: "var(--text)", cursor: "pointer" }}>&lsaquo;</button>
                <h5 style={{ fontWeight: 600, color: "var(--text)", margin: 0, fontSize: "1rem" }}>{MESES[mes]} {anio}</h5>
                <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }}
                  style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--border)", border: "none", color: "var(--text)", cursor: "pointer" }}>&rsaquo;</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", marginBottom: 4 }}>
                {["L","M","X","J","V","S","D"].map(d => <div key={d} style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-soft)" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {diasCal.map((dia, i) => {
                  if (!dia) return <div key={`e-${i}`} />;
                  const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                  const sel = iso === selectedDate;
                  const pasado = (() => { const d = new Date(anio, mes, dia); const h = new Date(); h.setHours(0,0,0,0); return d < h; })();
                  const hoy = new Date(anio, mes, dia).toDateString() === new Date().toDateString();
                  return (
                    <motion.button key={dia} whileHover={pasado ? {} : { scale: 1.1 }} onClick={() => !pasado && (setSelectedDate(iso), cargarDia(iso))} disabled={pasado}
                      style={{ width: 34, height: 34, borderRadius: "50%", border: hoy && !sel ? "2px solid var(--brand)" : "none", margin: "0 auto",
                        background: sel ? "var(--brand)" : pasado ? "transparent" : "var(--surface-soft)",
                        color: sel ? "white" : pasado ? "#ccc" : "var(--text)",
                        fontWeight: sel || hoy ? 700 : 400, fontSize: "0.82rem", cursor: pasado ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", opacity: pasado ? 0.4 : 1,
                      }}>{dia}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-md-7">
            {!selectedDate ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "var(--text-soft)" }}>Selecciona un dia para gestionar las horas</p>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.5rem" }}>
                <h5 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h5>

                {loadingDia ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}><div className="spinner-border spinner-border-sm" style={{ color: "var(--brand)" }} /></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {HORAS_BASE.map(hora => {
                      const s = getHoraStyle(hora);
                      const cita = getCitaEnHora(hora);
                      const global = esGlobal(hora);
                      const bloqueada = esBloqueada(hora);
                      // Check if hour is past for today
                      const esHoy = selectedDate === aISOLocal(new Date());
                      const horaPasada = esHoy && (() => {
                        const [hStr] = hora.split(":");
                        let h = parseInt(hStr);
                        if (hora.includes("PM") && h !== 12) h += 12;
                        if (hora.includes("AM") && h === 12) h = 0;
                        return h < new Date().getHours() || (h === new Date().getHours() && parseInt(hora.split(":")[1]) <= new Date().getMinutes());
                      })();
                      const disabled = !!cita || global || !!horaPasada;

                      return (
                        <button key={hora}
                          onClick={() => { if (!disabled) setConfirmAction({ tipo: bloqueada ? "desbloquear" : "bloquear", hora }); }}
                          disabled={disabled}
                          title={horaPasada ? "Hora pasada" : s.label}
                          style={{ padding: "0.55rem 0.3rem", borderRadius: 12, fontWeight: 600, fontSize: "0.75rem",
                            background: horaPasada ? "transparent" : s.bg, color: horaPasada ? "#ccc" : s.color, border: `1px solid ${horaPasada ? "#eee" : s.border}`,
                            cursor: disabled ? "default" : "pointer", transition: "all 0.2s", opacity: horaPasada ? 0.4 : 1,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                          }}>
                          <span>{hora}</span>
                          {cita && <span style={{ fontSize: "0.62rem", fontWeight: 500, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{cita.nombres.split(" ")[0]}</span>}
                          {global && <span style={{ fontSize: "0.62rem" }}>Global</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem", flexWrap: "wrap", fontSize: "0.72rem" }}>
                  {[
                    { bg: "var(--surface-soft)", border: "var(--border)", label: "Disponible" },
                    { bg: "#FFF8E1", border: "#F0E0A0", label: "Pendiente" },
                    { bg: "#E3F2FD", border: "#A0C8F0", label: "Confirmada" },
                    { bg: "#E8F5E9", border: "#A0D8A8", label: "Atendida" },
                    { bg: "#FDE8D8", border: "#F0A898", label: "Bloqueada" },
                    { bg: "#EDE0F0", border: "#C8B0E0", label: "Global" },
                  ].map(l => (
                    <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-soft)" }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1px solid ${l.border}`, display: "inline-block" }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              style={{ background: "white", borderRadius: 20, padding: "2rem", maxWidth: 400, width: "90%", textAlign: "center" }}
              onClick={e => e.stopPropagation()}>
              <h5 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.8rem" }}>Confirmar accion</h5>
              <p style={{ color: "var(--text-soft)", marginBottom: "1.5rem", fontSize: "0.92rem" }}>
                {confirmAction.tipo === "bloquear" && `Bloquear ${confirmAction.hora} para ${selectedDate}?`}
                {confirmAction.tipo === "desbloquear" && `Desbloquear ${confirmAction.hora} para ${selectedDate}?`}
                {confirmAction.tipo === "global_bloquear" && `Bloquear ${confirmAction.hora} en todos los dias?`}
                {confirmAction.tipo === "global_desbloquear" && `Desbloquear ${confirmAction.hora} globalmente?`}
              </p>
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "0.6rem 1.3rem", borderRadius: 100, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={ejecutarAccion} style={{ padding: "0.6rem 1.3rem", borderRadius: 100, background: "var(--brand)", color: "var(--brand-contrast)", border: "none", fontWeight: 600, cursor: "pointer" }}>Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}