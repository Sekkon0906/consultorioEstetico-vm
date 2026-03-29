"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Calculator } from "lucide-react";
import CitasAgendadasEditor from "./citasAgendadasEditor";

import type { Cita } from "./helpers";
import {
  confirmarCitaAPI,
  cancelarCitaAPI,
  confirmarPagoCitaAPI,
} from "./helpers";

interface Props {
  cita: Cita;
  onClose: () => void;
  onUpdated: () => void;
}

export default function CitasAgendadasModal({
  cita,
  onClose,
  onUpdated,
}: Props) {
  const [monto, setMonto] = useState<number>(cita.monto ?? 0);
  const [pagoAhora, setPagoAhora] = useState(0);
  const [modoPago, setModoPago] = useState<"Efectivo" | "Tarjeta" | null>(
    null
  );
  const [concluida, setConcluida] = useState(cita.estado === "atendida");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previoPagado = cita.montoPagado ?? 0;
  const pagadoAcumulado = Math.max(previoPagado + pagoAhora, 0);
  const restante = Math.max(monto - pagadoAcumulado, 0);
  const porcentaje =
    monto > 0 ? Math.min((pagadoAcumulado / monto) * 100, 100) : 0;

  /* -- Confirmar -- */
  const handleConfirmar = async () => {
    setSaving(true);
    setError(null);
    try {
      await confirmarCitaAPI(cita.id);
      onUpdated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  /* -- Concluir + cobrar -- */
  const handleConcluir = async () => {
    if (cita.estado !== "confirmada") {
      setError("Solo puedes concluir citas confirmadas.");
      return;
    }
    if (!monto || monto <= 0) {
      setError("Ingresa el monto de la cita.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await confirmarPagoCitaAPI(cita.id, {
        monto,
        monto_pagado: pagadoAcumulado,
        metodo_pago: "Consultorio",
        tipo_pago_consultorio: modoPago || undefined,
      });
      setConcluida(true);
      setTimeout(() => onUpdated(), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  /* -- Cancelar -- */
  const handleCancelar = async () => {
    if (!confirm("Cancelar esta cita?")) return;
    setSaving(true);
    setError(null);
    try {
      await cancelarCitaAPI(cita.id, "Cancelada desde panel admin");
      onUpdated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  /* -- Modo edicion -- */
  if (modoEdicion) {
    return (
      <CitasAgendadasEditor
        cita={cita}
        onClose={() => {
          setModoEdicion(false);
          onUpdated();
        }}
      />
    );
  }

  const estadoColor: Record<string, string> = {
    pendiente: "#B08968",
    confirmada: "#2D6A4F",
    atendida: "#1B4F72",
    cancelada: "#922B21",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="position-fixed inset-0 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
        padding: "1rem",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 30 }}
        className="bg-white rounded-4 shadow-lg p-5 w-100"
        style={{ maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Cabecera */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            onClick={onClose}
            className="btn btn-sm"
            style={{
              backgroundColor: "#E9DED2",
              borderRadius: "50%",
              width: 34,
              height: 34,
              padding: 0,
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <h4 className="fw-bold m-0" style={{ color: "#4E3B2B" }}>
            Detalle de cita
          </h4>
          <span
            className="badge rounded-pill px-3 py-2 text-capitalize fw-semibold"
            style={{
              backgroundColor: estadoColor[cita.estado] ?? "#aaa",
              color: "#fff",
            }}
          >
            {cita.estado}
          </span>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 px-3 mb-3"
            style={{ fontSize: "0.88rem" }}
          >
            {error}
          </div>
        )}

        {/* Info paciente */}
        <div
          className="rounded-3 p-3 mb-4"
          style={{ backgroundColor: "#F5EEE6" }}
        >
          <p className="mb-1 fw-semibold" style={{ color: "#4E3B2B" }}>
            {cita.nombres} {cita.apellidos}
          </p>
          <p className="mb-1 small" style={{ color: "#6C584C" }}>
            Correo: {cita.correo}
          </p>
          <p className="mb-1 small" style={{ color: "#6C584C" }}>
            Telefono: {cita.telefono}
          </p>
          <p className="mb-0 small" style={{ color: "#6C584C" }}>
            Fecha: {String(cita.fecha).slice(0, 10)} - Hora: {cita.hora}
          </p>
        </div>

        {/* Procedimiento */}
        <div
          className="rounded-3 p-3 mb-4"
          style={{ backgroundColor: "#EEF7EE" }}
        >
          <p className="mb-1 fw-semibold" style={{ color: "#2D6A4F" }}>
            {cita.procedimiento}
          </p>
          <p className="mb-0 small" style={{ color: "#4A7A5A" }}>
            Tipo: {cita.tipoCita}
          </p>
          {cita.nota && (
            <p className="mb-0 small mt-1" style={{ color: "#4A7A5A" }}>
              Nota: {cita.nota}
            </p>
          )}
        </div>

        {/* Pago */}
        {cita.estado !== "cancelada" && (
          <div className="mb-4">
            <h5 className="fw-semibold mb-3" style={{ color: "#4E3B2B" }}>
              <Calculator size={16} className="me-1" /> Registro de pago
            </h5>

            <div className="d-flex gap-3 mb-3 flex-wrap">
              <div className="flex-1">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "#6C584C" }}
                >
                  Monto total (COP)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="flex-1">
                <label
                  className="form-label small fw-semibold"
                  style={{ color: "#6C584C" }}
                >
                  Pago ahora (COP)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={pagoAhora}
                  onChange={(e) => setPagoAhora(Number(e.target.value))}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
            </div>

            {/* Metodo */}
            <div className="d-flex gap-2 mb-3">
              {(["Efectivo", "Tarjeta"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModoPago(m)}
                  className="btn btn-sm rounded-pill flex-1"
                  style={{
                    backgroundColor: modoPago === m ? "#8B6A4B" : "#F5EEE6",
                    color: modoPago === m ? "#fff" : "#4E3B2B",
                    border: "none",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Barra de pago */}
            {monto > 0 && (
              <div>
                <div
                  className="d-flex justify-content-between small mb-1"
                  style={{ color: "#6C584C" }}
                >
                  <span>
                    Pagado: ${pagadoAcumulado.toLocaleString("es-CO")}
                  </span>
                  <span>
                    Restante: ${restante.toLocaleString("es-CO")}
                  </span>
                </div>
                <div
                  className="rounded-pill overflow-hidden"
                  style={{ height: 8, backgroundColor: "#E9DED2" }}
                >
                  <div
                    style={{
                      width: `${porcentaje}%`,
                      height: "100%",
                      backgroundColor: "#8B6A4B",
                      transition: "width 0.4s",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="d-flex gap-2 flex-wrap">
          {cita.estado === "pendiente" && (
            <button
              onClick={handleConfirmar}
              disabled={saving}
              className="btn rounded-pill fw-semibold flex-1"
              style={{
                backgroundColor: "#2D6A4F",
                color: "#fff",
                border: "none",
              }}
            >
              <CheckCircle2 size={15} className="me-1" /> Confirmar
            </button>
          )}

          {cita.estado === "confirmada" && !concluida && (
            <button
              onClick={handleConcluir}
              disabled={saving}
              className="btn rounded-pill fw-semibold flex-1"
              style={{
                backgroundColor: "#1B4F72",
                color: "#fff",
                border: "none",
              }}
            >
              {saving ? "Guardando..." : "Concluir y cobrar"}
            </button>
          )}

          {concluida && (
            <div className="d-flex align-items-center gap-2 text-success fw-semibold">
              <CheckCircle2 size={18} /> Cita concluida
            </div>
          )}

          {cita.estado !== "cancelada" && cita.estado !== "atendida" && (
            <>
              <button
                onClick={() => setModoEdicion(true)}
                className="btn rounded-pill fw-semibold"
                style={{
                  backgroundColor: "#E9DED2",
                  color: "#4E3B2B",
                  border: "none",
                }}
              >
                Editar
              </button>
              <button
                onClick={handleCancelar}
                disabled={saving}
                className="btn rounded-pill fw-semibold"
                style={{
                  backgroundColor: "#fff3ef",
                  color: "#b02e2e",
                  border: "1px solid #e4bfbf",
                }}
              >
                <XCircle size={15} className="me-1" /> Cancelar cita
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
