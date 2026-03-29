"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

const HORAS_BASE = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM",
  "04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM",
];

interface Bloqueo { id?: number; fecha: string; hora: string; motivo: string; }
interface ConfirmAction { tipo: "bloquear" | "desbloquear" | "global_bloquear" | "global_desbloquear"; hora: string; }

export default function HorariosHabilitados() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [bloqueosGlobales, setBloqueosGlobales] = useState<Set<string>>(new Set());
  const [citasOcupadas, setCitasOcupadas] = useState<Set<string>>(new Set());
  const [loadingDia, setLoadingDia] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [motivoNuevo, setMotivoNuevo] = useState("Bloqueo manual");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [tab, setTab] = useState<"diario" | "global">("diario");

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => { cargarBloqueosGlobales(); }, []);

  const cargarBloqueosGlobales = async () => {
    const { data, error } = await supabase.from("bloqueos_globales").select("hora");
    if (!error && data) setBloqueosGlobales(new Set(data.map((b: any) => b.hora)));
  };

  const cargarDia = async (fecha: string) => {
    setLoadingDia(true);
    try {
      const [bloqRes, citasRes] = await Promise.all([
        supabase.from("bloqueos_horas").select("id, fecha, hora, motivo").eq("fecha", fecha),
        supabase.from("citas").select("hora, estado").eq("fecha", fecha),
      ]);
      if (!bloqRes.error) setBloqueos((bloqRes.data ?? []).map((b: any) => ({ id: b.id, fecha: b.fecha, hora: b.hora, motivo: b.motivo })));
      if (!citasRes.error) setCitasOcupadas(new Set((citasRes.data ?? []).filter((c: any) => c.estado !== "cancelada").map((c: any) => c.hora)));
    } catch (e) { console.error(e); }
    finally { setLoadingDia(false); }
  };

  const seleccionarDia = (iso: string) => { setSelectedDate(iso); cargarDia(iso); };

  const ejecutarAccion = async () => {
    if (!confirmAction) return;
    const { tipo, hora } = confirmAction;
    setConfirmAction(null);
    try {
      if (tipo === "bloquear" && selectedDate) {
        const { error } = await supabase.from("bloqueos_horas").insert({ fecha: selectedDate, hora, motivo: motivoNuevo });
        if (error) throw new Error(error.message);
        showToast(`Hora ${hora} bloqueada`);
        cargarDia(selectedDate);
      } else if (tipo === "desbloquear" && selectedDate) {
        const { error } = await supabase.from("bloqueos_horas").delete().eq("fecha", selectedDate).eq("hora", hora);
        if (error) throw new Error(error.message);
        showToast(`Hora ${hora} desbloqueada`);
        cargarDia(selectedDate);
      } else if (tipo === "global_bloquear") {
        const { error } = await supabase.from("bloqueos_globales").insert({ hora, motivo: "Bloqueo global permanente" });
        if (error) throw new Error(error.message);
        showToast(`Hora ${hora} bloqueada globalmente`);
        cargarBloqueosGlobales();
      } else if (tipo === "global_desbloquear") {
        const { error } = await supabase.from("bloqueos_globales").delete().eq("hora", hora);
        if (error) throw new Error(error.message);
        showToast(`Hora ${hora} desbloqueada globalmente`);
        cargarBloqueosGlobales();
      }
    } catch (e: any) { showToast("Error: " + e.message); }
  };

  const esBloqueada = (hora: string) => bloqueos.some((b) => b.hora === hora);
  const esCita = (hora: string) => citasOcupadas.has(hora);
  const esGlobal = (hora: string) => bloqueosGlobales.has(hora);

  const primerDia = new Date(anio, mes, 1).getDay() || 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasCal: (number | null)[] = [];
  for (let i = 1; i < primerDia; i++) diasCal.push(null);
  for (let d = 1; d <= diasEnMes; d++) diasCal.push(d);
  const nombresMes = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const mensajeConfirmacion = () => {
    if (!confirmAction) return "";
    const { tipo, hora } = confirmAction;
    if (tipo === "bloquear") return `Deseas bloquear la hora ${hora} para el dia ${selectedDate}?`;
    if (tipo === "desbloquear") return `Deseas quitar el bloqueo de la hora ${hora} para el dia ${selectedDate}?`;
    if (tipo === "global_bloquear") return `Deseas bloquear la hora ${hora} de forma permanente en todos los dias?`;
    if (tipo === "global_desbloquear") return `Deseas desbloquear la hora ${hora} globalmente?`;
    return "";
  };

  return (
    <div>
      <h2 className="fw-bold mb-4" style={{ color: "#4E3B2B" }}>Gestion de Horarios</h2>

      {toast && (
        <div className="alert rounded-3 py-2 px-4 mb-3 text-center fw-semibold" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "1px solid #D4C4B0" }}>{toast}</div>
      )}

      <div className="d-flex gap-2 mb-4">
        <button onClick={() => setTab("diario")} className="btn rounded-pill px-4 fw-semibold" style={{ backgroundColor: tab === "diario" ? "#8B6A4B" : "#F5EEE6", color: tab === "diario" ? "#fff" : "#4E3B2B", border: "none" }}>Bloqueo por dia</button>
        <button onClick={() => setTab("global")} className="btn rounded-pill px-4 fw-semibold" style={{ backgroundColor: tab === "global" ? "#8B6A4B" : "#F5EEE6", color: tab === "global" ? "#fff" : "#4E3B2B", border: "none" }}>Bloqueo global permanente</button>
      </div>

      {/* TAB GLOBAL */}
      {tab === "global" && (
        <div className="rounded-4 p-4 shadow-sm" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
          <h5 className="fw-semibold mb-2" style={{ color: "#4E3B2B" }}>Horarios bloqueados permanentemente</h5>
          <p className="small mb-4" style={{ color: "#8B7060" }}>Las horas bloqueadas aqui nunca se mostraran como disponibles, sin importar el dia.</p>
          <div className="d-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {HORAS_BASE.map((hora) => {
              const bloqueada = esGlobal(hora);
              return (
                <button key={hora} onClick={() => setConfirmAction({ tipo: bloqueada ? "global_desbloquear" : "global_bloquear", hora })}
                  className="btn btn-sm rounded-pill fw-semibold py-2" style={{ fontSize: "0.75rem", backgroundColor: bloqueada ? "#FDE8D8" : "#F5EEE6", color: bloqueada ? "#922B21" : "#4E3B2B", border: bloqueada ? "1px solid #F0A898" : "1px solid #E9DED2", cursor: "pointer" }}>
                  {hora} {bloqueada ? "(Bloqueada)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB DIARIO */}
      {tab === "diario" && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="rounded-4 p-4 shadow-sm" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>&lsaquo;</button>
                <h5 className="fw-semibold m-0" style={{ color: "#4E3B2B" }}>{nombresMes[mes]} {anio}</h5>
                <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>&rsaquo;</button>
              </div>
              <div className="d-grid mb-2" style={{ gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
                {["L","M","X","J","V","S","D"].map((d) => (<div key={d} style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B7060" }}>{d}</div>))}
              </div>
              <div className="d-grid" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                {diasCal.map((dia, i) => {
                  if (!dia) return <div key={`e-${i}`} />;
                  const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                  const isSelected = iso === selectedDate;
                  return (
                    <motion.button key={dia} whileHover={{ scale: 1.1 }} onClick={() => seleccionarDia(iso)}
                      style={{ width: 34, height: 34, borderRadius: "50%", border: "none", margin: "0 auto", backgroundColor: isSelected ? "#8B6A4B" : "#F5EEE6", color: isSelected ? "#fff" : "#4E3B2B", fontWeight: isSelected ? 700 : 400, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {dia}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-md-7">
            {!selectedDate ? (
              <div className="rounded-4 p-5 text-center" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
                <p style={{ color: "#8B7060" }}>Selecciona un dia para gestionar las horas.</p>
              </div>
            ) : (
              <div className="rounded-4 p-4 shadow-sm" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
                <h5 className="fw-semibold mb-3" style={{ color: "#4E3B2B" }}>{selectedDate}</h5>
                <div className="mb-3 d-flex gap-2 align-items-center">
                  <input className="form-control form-control-sm" placeholder="Motivo del bloqueo" value={motivoNuevo} onChange={(e) => setMotivoNuevo(e.target.value)} style={{ borderColor: "#E9DED2", maxWidth: 260 }} />
                </div>
                {loadingDia ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" /></div>
                ) : (
                  <div className="d-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {HORAS_BASE.map((hora) => {
                      const bloqueada = esBloqueada(hora);
                      const citada = esCita(hora);
                      const global = esGlobal(hora);
                      return (
                        <button key={hora}
                          onClick={() => { if (!citada && !global) setConfirmAction({ tipo: bloqueada ? "desbloquear" : "bloquear", hora }); }}
                          disabled={citada || global}
                          className="btn btn-sm rounded-pill fw-semibold py-2"
                          style={{ fontSize: "0.75rem", backgroundColor: global ? "#E8E0F0" : citada ? "#EEF7EE" : bloqueada ? "#FDE8D8" : "#F5EEE6", color: global ? "#5B2C8E" : citada ? "#2D6A4F" : bloqueada ? "#922B21" : "#4E3B2B", border: global ? "1px solid #C8B8E0" : citada ? "1px solid #A8D8B9" : bloqueada ? "1px solid #F0A898" : "1px solid #E9DED2", cursor: (citada || global) ? "not-allowed" : "pointer" }}>
                          {hora} {global ? "(Global)" : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="d-flex gap-3 mt-3 flex-wrap" style={{ fontSize: "0.75rem", color: "#8B7060" }}>
                  <span>Disponible</span>
                  <span>Bloqueada manualmente</span>
                  <span>Con cita activa</span>
                  <span>Bloqueo global</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACION */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="position-fixed d-flex align-items-center justify-content-center"
            style={{ inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
            onClick={() => setConfirmAction(null)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              className="bg-white rounded-4 shadow-lg p-5 text-center" style={{ maxWidth: 420, width: "90%" }}
              onClick={(e) => e.stopPropagation()}>
              <h5 className="fw-bold mb-3" style={{ color: "#4E3B2B" }}>Confirmar accion</h5>
              <p className="mb-4" style={{ color: "#6C584C" }}>{mensajeConfirmacion()}</p>
              <div className="d-flex gap-3 justify-content-center">
                <button onClick={ejecutarAccion} className="btn rounded-pill fw-semibold px-4" style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>Si, confirmar</button>
                <button onClick={() => setConfirmAction(null)} className="btn rounded-pill fw-semibold px-4" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}