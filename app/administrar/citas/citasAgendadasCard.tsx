"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cita } from "./helpers";
import { PALETTE } from "../../agendar/page";
import { CalendarCheck, Edit3, XCircle, Eye } from "lucide-react";

interface Props {
  cita: Cita;
  onVerDetalles?: (cita: Cita) => void;
  onConfirmar?: (cita: Cita) => void;
  onCancelar?: (cita: Cita) => void;
  onReagendar?: (cita: Cita) => void;
}

const coloresEstado: Record<
  Cita["estado"],
  { color: string; texto: string }
> = {
  pendiente: { color: "#F7D774", texto: "#7D6608" },
  confirmada: { color: "#A7D4F5", texto: "#0B3C78" },
  atendida: { color: "#A9E4C4", texto: "#145A32" },
  cancelada: { color: "#F8B6B6", texto: "#7E1F1F" },
};

export default function CitasAgendadasCard({
  cita,
  onVerDetalles,
  onConfirmar,
  onCancelar,
  onReagendar,
}: Props) {
  const estilo = coloresEstado[cita.estado];

  return (
    <motion.div
      className="relative rounded-2xl border shadow-md p-6 flex flex-col gap-4 transition-all duration-300"
      style={{
        borderColor: "#E5D8C8",
        background: "#FFFCF8",
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0px 6px 22px rgba(176,137,104,0.2)",
      }}
    >
      {/* Oreja de estado */}
      <motion.div
        className="absolute top-0 right-0 w-0 h-0 border-t-[100px] border-l-[100px] border-l-transparent rounded-tr-2xl origin-top-right overflow-hidden"
        style={{
          borderTopColor: estilo.color,
          filter: "brightness(1.05)",
        }}
        whileHover={{ rotateZ: 2, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <span
          className="absolute text-[13px] font-bold uppercase tracking-wide select-none"
          style={{
            color: estilo.texto,
            top: "-62px",
            right: "18px",
            transform: "rotate(45deg)",
            textShadow: "0 0 2px rgba(255,255,255,0.8)",
            letterSpacing: "0.05em",
          }}
        >
          {cita.estado}
        </span>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex flex-col gap-1 mt-1">
        <h3
          className="text-lg font-semibold"
          style={{ color: PALETTE.main }}
        >
          {cita.nombres} {cita.apellidos}
        </h3>

        <p className="text-sm text-[#4E3B2B]">
          <strong>Hora:</strong> {cita.hora}
        </p>
        <p className="text-sm text-[#4E3B2B]">
          <strong>Procedimiento:</strong> {cita.procedimiento}
        </p>
        <p className="text-sm text-[#4E3B2B]">
          <strong>Telefono:</strong> {cita.telefono}
        </p>
        <p className="text-sm text-[#4E3B2B]">
          <strong>Correo:</strong> {cita.correo}
        </p>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 place-items-center">
        {cita.estado === "pendiente" && (
          <motion.button
            type="button"
            whileHover={{
              scale: 1.06,
              boxShadow: "0 0 12px rgba(33,118,214,0.35)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onConfirmar?.(cita)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full text-sm font-semibold text-white rounded-full shadow-sm transition-all"
            style={{
              background: "linear-gradient(90deg, #3A8DFF, #2176D6)",
            }}
          >
            <CalendarCheck size={16} /> Confirmar
          </motion.button>
        )}

        {cita.estado !== "atendida" && cita.estado !== "cancelada" && (
          <motion.button
            type="button"
            whileHover={{
              scale: 1.06,
              boxShadow: "0 0 10px rgba(220,199,172,0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReagendar?.(cita)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full text-sm font-semibold rounded-full shadow-sm transition-all"
            style={{
              background: "#E5D8C8",
              color: "#4E3B2B",
            }}
          >
            <Edit3 size={16} /> Reagendar
          </motion.button>
        )}

        <motion.button
          type="button"
          whileHover={{
            scale: 1.06,
            boxShadow: "0 0 12px rgba(176,137,104,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onVerDetalles?.(cita)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 w-full text-sm font-semibold text-white rounded-full shadow-sm transition-all"
          style={{
            background: "linear-gradient(90deg, #B08968, #A07855)",
          }}
        >
          <Eye size={16} /> Factura
        </motion.button>

        {cita.estado !== "cancelada" && cita.estado !== "atendida" && (
          <motion.button
            type="button"
            whileHover={{
              scale: 1.06,
              boxShadow: "0 0 12px rgba(255,107,107,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCancelar?.(cita)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full text-sm font-semibold text-white rounded-full shadow-sm transition-all"
            style={{
              background: "linear-gradient(90deg, #FF6B6B, #E04E4E)",
            }}
          >
            <XCircle size={16} /> Cancelar
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
