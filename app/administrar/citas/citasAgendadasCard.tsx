"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cita } from "./helpers";
import { CalendarCheck, Edit3, XCircle, Eye, ClipboardList, Phone, Mail, Calendar, Clock } from "lucide-react";

interface Props {
  cita: Cita;
  onVerDetalles?: (cita: Cita) => void;
  onConfirmar?: (cita: Cita) => void;
  onCancelar?: (cita: Cita) => void;
  onReagendar?: (cita: Cita) => void;
  onVerMotivo?: (cita: Cita) => void;
  onVerResumen?: (cita: Cita) => void;
}

const CE: Record<string, { bg: string; text: string; dot: string }> = {
  /* Los cuatro estados salen de tokens que se recalculan por tema (ver
     01-tokens.css). Antes iban con pasteles claros fijos aquí, y en modo
     oscuro quedaban como parches luminosos sobre el fondo casi negro. */
  pendiente:  { bg: "var(--estado-pendiente-bg)",  text: "var(--estado-pendiente)",  dot: "var(--estado-pendiente)" },
  confirmada: { bg: "var(--estado-confirmada-bg)", text: "var(--estado-confirmada)", dot: "var(--estado-confirmada)" },
  atendida:   { bg: "var(--estado-atendida-bg)",   text: "var(--estado-atendida)",   dot: "var(--estado-atendida)" },
  cancelada:  { bg: "var(--estado-cancelada-bg)",  text: "var(--estado-cancelada)",  dot: "var(--estado-cancelada)" },
};

export default function CitasAgendadasCard({
  cita, onVerDetalles, onConfirmar, onCancelar, onReagendar, onVerMotivo, onVerResumen,
}: Props) {
  const e = CE[cita.estado] || CE.pendiente;

  return (
    <motion.div
      className="admin-cita-card"
      initial={{ y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: "1.2rem 1.4rem",
        transition: "box-shadow 0.25s",
      }}
      whileHover={{ boxShadow: "0 4px 20px rgba(176,137,104,0.12)" }}
    >
      {/* Top row: name + estado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>
          {cita.nombres} {cita.apellidos}
        </h3>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: e.bg, color: e.text,
          padding: "0.28rem 0.75rem", borderRadius: 100,
          fontSize: "0.7rem", fontWeight: 700, textTransform: "capitalize",
          letterSpacing: "0.02em", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.dot }} />
          {cita.estado}
        </span>
      </div>

      {/* Procedure */}
      <p style={{ fontSize: "0.88rem", color: "var(--brand)", fontWeight: 600, margin: "0 0 0.5rem" }}>
        {cita.procedimiento}
      </p>

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-soft)", marginBottom: "0.8rem" }}>
        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} color="var(--brand)" /> {cita.telefono}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} color="var(--brand)" /> {cita.correo}</span>
        </div>
        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} color="var(--brand)" /> {cita.fecha}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} color="var(--brand)" /> {cita.hora}</span>
        </div>
      </div>

      {/* Buttons row */}
      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
        {cita.estado === "pendiente" && (
          <>
            <Btn label="Confirmar" icon={<CalendarCheck size={14} />} bg="var(--brand)" color="#fff" onClick={() => onConfirmar?.(cita)} />
            <Btn label="Reagendar" icon={<Edit3 size={14} />} bg="var(--surface-soft)" color="var(--text)" onClick={() => onReagendar?.(cita)} />
            <Btn label="Cancelar" icon={<XCircle size={14} />} bg="#C62828" color="#fff" onClick={() => onCancelar?.(cita)} />
          </>
        )}
        {cita.estado === "confirmada" && (
          <>
            <Btn label="Facturar" icon={<Eye size={14} />} bg="var(--brand)" color="#fff" onClick={() => onVerDetalles?.(cita)} />
            <Btn label="Reagendar" icon={<Edit3 size={14} />} bg="var(--surface-soft)" color="var(--text)" onClick={() => onReagendar?.(cita)} />
            <Btn label="Cancelar" icon={<XCircle size={14} />} bg="#C62828" color="#fff" onClick={() => onCancelar?.(cita)} />
          </>
        )}
        {cita.estado === "atendida" && (
          <Btn label="Ver resumen" icon={<ClipboardList size={14} />} bg="var(--estado-atendida-bg)" color="var(--estado-atendida)" onClick={() => onVerResumen?.(cita)} />
        )}
        {cita.estado === "cancelada" && (
          <Btn label="Ver motivo" icon={<Eye size={14} />} bg="var(--estado-cancelada-bg)" color="var(--estado-cancelada)" onClick={() => onVerMotivo?.(cita)} />
        )}
      </div>
    </motion.div>
  );
}

function Btn({ label, icon, bg, color, onClick }: { label: string; icon: React.ReactNode; bg: string; color: string; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0.42rem 0.9rem", borderRadius: 100, border: "none", background: bg, color, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon} {label}
    </motion.button>
  );
}