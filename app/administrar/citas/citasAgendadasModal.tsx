"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Calculator } from "lucide-react";
import type { Cita } from "./helpers";
import { confirmarCitaAPI, confirmarPagoCitaAPI } from "./helpers";

interface Props { cita: Cita; onClose: () => void; onUpdated: () => void; }

export default function CitasAgendadasModal({ cita, onClose, onUpdated }: Props) {
  const [monto, setMonto] = useState<string>(cita.monto ? String(cita.monto) : "");
  const [pagoCliente, setPagoCliente] = useState<string>("");
  const [modoPago, setModoPago] = useState<"Efectivo" | "Tarjeta" | null>(null);
  const [concluida, setConcluida] = useState(cita.estado === "atendida");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const montoNum = Number(monto) || 0;
  const pagoNum = Number(pagoCliente) || 0;
  const previoPagado = cita.montoPagado ?? 0;
  const pagadoTotal = previoPagado + pagoNum;

  // Calculate devolucion or restante
  const diferencia = pagadoTotal - montoNum;
  const devolucion = diferencia > 0 ? diferencia : 0;
  const restante = diferencia < 0 ? Math.abs(diferencia) : 0;
  const porcentaje = montoNum > 0 ? Math.min((Math.min(pagadoTotal, montoNum) / montoNum) * 100, 100) : 0;

  const handleConfirmarCita = async () => {
    setSaving(true); setError(null);
    try { await confirmarCitaAPI(cita.id); setShowConfirm(false); onUpdated(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleConcluir = async () => {
    if (cita.estado !== "confirmada") { setError("Solo puedes concluir citas confirmadas."); return; }
    if (!montoNum || montoNum <= 0) { setError("Ingresa el total a pagar."); return; }
    if (!modoPago) { setError("Selecciona el metodo de pago."); return; }
    if (pagoNum <= 0) { setError("Ingresa el pago del cliente."); return; }
    setSaving(true); setError(null);
    try {
      await confirmarPagoCitaAPI(cita.id, { monto: montoNum, monto_pagado: Math.min(pagadoTotal, montoNum), metodo_pago: "Consultorio", tipo_pago_consultorio: modoPago });
      setConcluida(true);
      setTimeout(() => onUpdated(), 1500);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const estadoColor: Record<string, string> = { pendiente: "var(--brand)", confirmada: "#2D6A4F", atendida: "#1B4F72", cancelada: "#922B21" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

        <div style={{ height: 4, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: "24px 24px 0 0" }} />
        <div style={{ padding: "1.8rem 2rem 2rem" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-soft)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={16} /></button>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--text)", margin: 0, fontSize: "1.2rem" }}>Facturacion</h4>
            <span style={{ background: estadoColor[cita.estado] ?? "#aaa", color: "white", padding: "0.3rem 0.9rem", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>{cita.estado}</span>
          </div>

          {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#FDE8D8", color: "#922B21", padding: "0.6rem 1rem", borderRadius: 12, marginBottom: "1rem", fontSize: "0.85rem" }}>{error}</motion.div>}

          {/* Patient */}
          <div style={{ background: "var(--surface-soft)", borderRadius: 14, padding: "1rem", marginBottom: "0.8rem" }}>
            <p style={{ fontWeight: 600, color: "var(--text)", margin: 0 }}>{cita.nombres} {cita.apellidos}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", margin: "0.2rem 0 0" }}>{cita.correo} | {cita.telefono}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", margin: "0.15rem 0 0" }}>{String(cita.fecha).slice(0, 10)} - {cita.hora}</p>
          </div>

          {/* Procedure */}
          <div style={{ background: "#EEF7EE", borderRadius: 14, padding: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: 600, color: "#2D6A4F", margin: 0 }}>{cita.procedimiento}</p>
            {cita.nota && <p style={{ fontSize: "0.82rem", color: "#4A7A5A", margin: "0.2rem 0 0" }}>Nota: {cita.nota}</p>}
          </div>

          {/* Payment - only non-cancelled, non-atendida */}
          {cita.estado !== "cancelada" && cita.estado !== "atendida" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h5 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6, fontSize: "1rem" }}>
                <Calculator size={16} color="var(--brand)" /> Registro de pago
              </h5>

              <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 5 }}>Total a pagar</label>
                  <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="350000"
                    style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 14, border: "1px solid var(--border)", fontSize: "1.05rem", background: "var(--surface)" }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--brand)", fontWeight: 600, display: "block", marginTop: 4, minHeight: 16 }}>{montoNum > 0 ? `$ ${montoNum.toLocaleString("es-CO")}` : ""}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 5 }}>Pago total cliente</label>
                  <input type="number" value={pagoCliente} onChange={e => setPagoCliente(e.target.value)} placeholder="350000"
                    style={{ width: "100%", padding: "0.75rem 0.9rem", borderRadius: 14, border: "1px solid var(--border)", fontSize: "1.05rem", background: "var(--surface)" }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--brand)", fontWeight: 600, display: "block", marginTop: 4, minHeight: 16 }}>{pagoNum > 0 ? `$ ${pagoNum.toLocaleString("es-CO")}` : ""}</span>
                </div>
              </div>

              {/* Method toggle */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {(["Efectivo", "Tarjeta"] as const).map(m => (
                  <motion.button key={m} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => setModoPago(m)}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: 14, fontWeight: 600, fontSize: "0.95rem", border: "none", cursor: "pointer", transition: "all 0.25s",
                      background: modoPago === m ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "var(--surface-soft)",
                      color: modoPago === m ? "white" : "var(--text)",
                      boxShadow: modoPago === m ? "0 4px 14px rgba(176,137,104,0.3)" : "none",
                    }}>{m}</motion.button>
                ))}
              </div>

              {/* Summary */}
              {montoNum > 0 && pagoNum > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                    <span style={{ color: "var(--text-soft)" }}>Pagado: <strong>${pagadoTotal.toLocaleString("es-CO")}</strong></span>
                    {restante > 0 && <span style={{ color: "var(--brand)", fontWeight: 600 }}>Restante: ${restante.toLocaleString("es-CO")}</span>}
                    {devolucion > 0 && <span style={{ color: "#2E7D32", fontWeight: 600 }}>Devolucion: ${devolucion.toLocaleString("es-CO")}</span>}
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                    <motion.div animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.4 }}
                      style={{ height: "100%", background: devolucion > 0 ? "linear-gradient(90deg, #43A047, #66BB6A)" : "linear-gradient(90deg, #8B6A4B, #B08968)", borderRadius: 4 }} />
                  </div>
                  {devolucion > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: "0.82rem", color: "#2E7D32", fontWeight: 600, marginTop: 6, textAlign: "center", background: "#E8F5E9", padding: "0.5rem", borderRadius: 10 }}>
                      Debe devolver ${devolucion.toLocaleString("es-CO")} al cliente
                    </motion.p>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
            {cita.estado === "pendiente" && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(true)} disabled={saving}
                style={{ flex: 1, padding: "0.9rem", borderRadius: 100, background: "linear-gradient(135deg, #2D6A4F, #43A047)", color: "white", border: "none", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 6px 18px rgba(45,106,79,0.28)" }}>
                <CheckCircle2 size={17} /> Confirmar cita
              </motion.button>
            )}

            {cita.estado === "confirmada" && !concluida && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleConcluir} disabled={saving}
                style={{ flex: 1, padding: "0.9rem", borderRadius: 100, background: "linear-gradient(135deg, #1B4F72, #2980B9)", color: "white", border: "none", fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(27,79,114,0.28)" }}>
                {saving ? "Guardando..." : "Concluir y cobrar"}
              </motion.button>
            )}

            {concluida && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#145A32", fontWeight: 600, fontSize: "0.95rem", background: "#E8F5E9", padding: "0.8rem 1.5rem", borderRadius: 100 }}>
                <CheckCircle2 size={18} /> Cita concluida
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Confirm sub-modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              style={{ background: "white", borderRadius: 22, padding: "2rem", maxWidth: 380, width: "90%", textAlign: "center" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}><CheckCircle2 size={22} color="#2E7D32" /></div>
              <h4 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>Confirmar cita?</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginBottom: "1.5rem" }}>Cita de <strong>{cita.nombres}</strong> para <strong>{cita.procedimiento}</strong></p>
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                <button onClick={() => setShowConfirm(false)} style={{ padding: "0.6rem 1.3rem", borderRadius: 100, border: "1px solid var(--border)", background: "transparent", color: "var(--text-soft)", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleConfirmarCita} disabled={saving} style={{ padding: "0.6rem 1.3rem", borderRadius: 100, background: "#2D6A4F", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>{saving ? "..." : "Si, confirmar"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}