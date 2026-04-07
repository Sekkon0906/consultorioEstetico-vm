"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Clock, User, Phone, Mail, FileText, CheckCircle, AlertCircle, XCircle, Loader } from "lucide-react";
import { getMisCitasApi } from "../../services/citasApi";
import FirmaConsentimiento from "../../src/components/FirmaConsentimiento";
import type { Cita } from "../../types/domain";
const ESTADOS = {
  pendiente: { bg: "#FFF8E1", text: "#7D6608", icon: Loader, label: "Pendiente", step: 1 },
  confirmada: { bg: "#E3F2FD", text: "#0B3C78", icon: CheckCircle, label: "Confirmada", step: 2 },
  atendida: { bg: "#E8F5E9", text: "#145A32", icon: CheckCircle, label: "Atendida", step: 3 },
  cancelada: { bg: "#FCE4EC", text: "#7E1F1F", icon: XCircle, label: "Cancelada", step: 0 },
};

const STEPS = [
  { label: "Pendiente", key: "pendiente" },
  { label: "Confirmada", key: "confirmada" },
  { label: "Atendida", key: "atendida" },
];

function ProgressBar({ estado }: { estado: string }) {
  const currentStep = estado === "cancelada" ? 0 : ESTADOS[estado as keyof typeof ESTADOS]?.step || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.2rem" }}>
      {STEPS.map((s, i) => {
        const active = currentStep >= i + 1;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: active ? 1 : 0.8 }}
                style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: active ? "white" : "#9B8575", background: active ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#E9DED2", transition: "all 0.4s", boxShadow: active ? "0 2px 8px rgba(176,137,104,0.3)" : "none" }}>
                {active ? <CheckCircle size={14} /> : i + 1}
              </motion.div>
              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: active ? "#3A2A1A" : "#9B8575", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: 3, borderRadius: 2, margin: "0 4px", marginBottom: 18, background: currentStep > i + 1 ? "linear-gradient(90deg, #B08968, #C9AD8D)" : "#E9DED2", transition: "background 0.4s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  } catch { return fecha; }
}

export default function CitasAgendadas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [ascendente, setAscendente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMisCitasApi().then(setCitas).catch(() => setError("No se pudieron cargar las citas.")).finally(() => setLoading(false));
  }, []);

  const citasFiltradas = useMemo(() => {
    let lista = [...citas];
    if (filtroEstado !== "todos") lista = lista.filter(c => c.estado === filtroEstado);
    return lista.sort((a, b) => {
      const f = ascendente ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha);
      return f !== 0 ? f : (ascendente ? a.hora.localeCompare(b.hora) : b.hora.localeCompare(a.hora));
    });
  }, [citas, ascendente, filtroEstado]);

  const resumen = useMemo(() => ({
    pendiente: citas.filter(c => c.estado === "pendiente").length,
    confirmada: citas.filter(c => c.estado === "confirmada").length,
    atendida: citas.filter(c => c.estado === "atendida").length,
    cancelada: citas.filter(c => c.estado === "cancelada").length,
  }), [citas]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}><div className="spinner-border" style={{ color: "#B08968" }} /></div>;
  if (error) return <div style={{ textAlign: "center", padding: "3rem" }}><p style={{ color: "#7E1F1F" }}>{error}</p><button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.6rem 2rem", borderRadius: 100, background: "#B08968", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>Reintentar</button></div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.5rem" }}>Mis Citas Agendadas</h2>
        <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, margin: "0 auto 1.2rem" }} />
      </motion.div>

      {/* Summary badges */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        {Object.entries(resumen).map(([estado, count]) => {
          const c = ESTADOS[estado as keyof typeof ESTADOS];
          return <span key={estado} style={{ background: c.bg, color: c.text, padding: "0.35rem 1rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>{c.label}: {count}</span>;
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
        {["todos", "pendiente", "confirmada", "atendida", "cancelada"].map(f => (
          <button key={f} onClick={() => setFiltroEstado(f)}
            style={{ padding: "0.45rem 1rem", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize",
              background: filtroEstado === f ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#F5EEE6",
              color: filtroEstado === f ? "white" : "#4E3B2B",
              boxShadow: filtroEstado === f ? "0 2px 10px rgba(176,137,104,0.25)" : "none",
            }}>{f}</button>
        ))}
        <button onClick={() => setAscendente(a => !a)}
          style={{ padding: "0.45rem 0.8rem", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", background: "#F5EEE6", color: "#4E3B2B", display: "flex", alignItems: "center", gap: 4 }}>
          {ascendente ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Fecha
        </button>
      </div>

      {/* Cards */}
      {citasFiltradas.length === 0 ? (
        <p style={{ textAlign: "center", color: "#8B7060", padding: "2rem 0" }}>No hay citas{filtroEstado !== "todos" ? ` con estado "${filtroEstado}"` : ""}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence>
            {citasFiltradas.map((cita, i) => {
              const est = ESTADOS[cita.estado as keyof typeof ESTADOS] || ESTADOS.pendiente;
              const isCancelada = cita.estado === "cancelada";
              const isConfirmada = cita.estado === "confirmada";

              return (
                <motion.div key={cita.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(8px)", borderRadius: 20, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 4px 16px rgba(78,59,43,0.06)", overflow: "hidden", transition: "box-shadow 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(78,59,43,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(78,59,43,0.06)"; }}
                >
                  {/* Top accent bar */}
                  <div style={{ height: 4, background: isCancelada ? "#E57373" : "linear-gradient(90deg, #B08968, #C9AD8D)" }} />

                  <div style={{ padding: "1.5rem 1.8rem" }}>
                    {/* Progress bar (not for cancelled) */}
                    {!isCancelada && <ProgressBar estado={cita.estado} />}

                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.2rem" }}>{cita.procedimiento}</h3>
                        <span style={{ fontSize: "0.78rem", color: "#8A7565" }}>{cita.tipoCita === "valoracion" ? "Valoracion" : "Implementacion"}</span>
                      </div>
                      <span style={{ background: est.bg, color: est.text, padding: "0.3rem 1rem", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize", whiteSpace: "nowrap" }}>{est.label}</span>
                    </div>

                    {/* Details grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#5A4A3A" }}><Clock size={14} color="#B08968" /> {formatFecha(cita.fecha)} - {cita.hora}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#5A4A3A" }}><User size={14} color="#B08968" /> {cita.nombres} {cita.apellidos}</div>
                      {cita.telefono && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#6C584C" }}><Phone size={14} color="#B08968" /> {cita.telefono}</div>}
                      {cita.correo && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#6C584C" }}><Mail size={14} color="#B08968" /> {cita.correo}</div>}
                    </div>

                    {cita.nota && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: "#6C584C", padding: "0.6rem 0.8rem", background: "#F5EEE6", borderRadius: 10, marginBottom: "1rem" }}>
                        <FileText size={14} color="#B08968" style={{ marginTop: 2, flexShrink: 0 }} /> {cita.nota}
                      </div>
                    )}

                    {/* Payment info */}
                    {cita.metodoPago && (
                      <div style={{ fontSize: "0.82rem", color: "#8A7565", marginBottom: "0.5rem" }}>
                        <i className="fas fa-wallet" style={{ marginRight: 6, color: "#B08968" }} />
                        Pago en {cita.metodoPago} ({cita.tipoPagoConsultorio || cita.tipoPagoOnline || ""})
                      </div>
                    )}

                    {/* Amount */}
                    {cita.monto != null && cita.monto > 0 && (
                      <div style={{ padding: "0.6rem 1rem", background: "linear-gradient(135deg, #FFFBF7, #F0E5D8)", borderRadius: 12, border: "1px solid rgba(176,137,104,0.1)", fontSize: "0.85rem", color: "#3A2A1A", marginBottom: "0.5rem" }}>
                        <strong>Monto:</strong> ${cita.monto.toLocaleString("es-CO")}
                        {cita.montoPagado != null && <span> | Pagado: ${cita.montoPagado.toLocaleString("es-CO")}</span>}
                        {cita.montoRestante != null && cita.montoRestante > 0 && <span> | Restante: ${cita.montoRestante.toLocaleString("es-CO")}</span>}
                      </div>
                    )}

                    {/* Cancellation reason */}
                    {isCancelada && cita.motivoCancelacion && (
                      <div style={{ padding: "0.6rem 1rem", background: "#FCE4EC", borderRadius: 12, fontSize: "0.82rem", color: "#7E1F1F", display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertCircle size={14} /> Motivo: {cita.motivoCancelacion}
                      </div>
                    )}

                    {/* Consent signing button - only for confirmed citas */}
                    {isConfirmada && !(cita as any).consentimiento_firmado && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <FirmaConsentimiento
                          citaId={cita.id}
                          pacienteNombre={`${cita.nombres} ${cita.apellidos || ""}`}
                          procedimiento={cita.procedimiento}
                          fecha={cita.fecha}
                          onFirmado={() => {
                            setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, consentimiento_firmado: true } as any : c));
                          }}
                        />
                      </div>
                    )}

                    {(cita as any).consentimiento_firmado && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 600, color: "#145A32", background: "#E8F5E9", padding: "0.5rem 1.2rem", borderRadius: 100 }}>
                          <CheckCircle size={14} /> Consentimiento firmado
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}