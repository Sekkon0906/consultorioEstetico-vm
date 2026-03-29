"use client";

import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Clock, CheckCircle2, FileText } from "lucide-react";
import type { Cita, EstadoCita } from "../types/domain";
import type { ReactNode } from "react";

//  re-exportamos los tipos para que otros componentes puedan usarlos
export type { Cita, EstadoCita };

interface Props {
  cita: Cita;
  modo?: "confirmacion" | "lista" | "admin";
  mostrarQR?: boolean;
}

// ====== FORMATEADORES ======
const fmtHoraHumana = (hhmm: string): string => {
  if (!hhmm) return "Hora no válida";

  // limpiar cualquier AM/PM que venga del backend o del input
  const limpio = hhmm.replace(/(a\.?m\.?|p\.?m\.?)/gi, "").trim();

  const [hStr, mStr] = limpio.split(":");
  let h = Number(hStr);
  const suf = h >= 12 ? "p.m." : "a.m.";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;

  return `${h}:${mStr} ${suf}`;
};

const fmtHoraMilitar = (hhmm: string): string => {
  if (!hhmm) return "--:--";

  const limpio = hhmm.replace(/(a\.?m\.?|p\.?m\.?)/gi, "").trim();
  const [hStr, mStr] = limpio.split(":");
  let h = Number(hStr);

  if (/p\.?m\.?/i.test(hhmm) && h < 12) h += 12;
  if (/a\.?m\.?/i.test(hhmm) && h === 12) h = 0;

  const hMil = h.toString().padStart(2, "0");
  return `${hMil}:${mStr}`;
};

const fmtDiaHumano = (date: Date): string => {
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  return dias[date.getDay()];
};

const fmtFechaHumana = (date: Date): string => {
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${date.getDate()} de ${meses[date.getMonth()]}`;
};

export default function TarjetaCita({
  cita,
  modo = "confirmacion",
  mostrarQR = false,
}: Props) {
  const fechaObj = new Date(cita.fecha);
  const diaTxt = fmtDiaHumano(fechaObj);
  const fechaTxt = fmtFechaHumana(fechaObj);
  const horaNormal = fmtHoraHumana(cita.hora);
  const horaMilitar = fmtHoraMilitar(cita.hora);

  const numeroCita = String(cita.id).padStart(5, "0");

  let metodoPagoTxt = "Sin información de método de pago";
  if (cita.metodoPago === "Consultorio") {
    metodoPagoTxt = `Pago en consultorio (${
      cita.tipoPagoConsultorio ?? "sin especificar"
    })`;
  } else if (cita.metodoPago === "Online") {
    metodoPagoTxt = `Pago en línea (${cita.tipoPagoOnline ?? "sin especificar"})`;
  }

  // === DETERMINAR PROGRESO ===
  const estados: EstadoCita[] = ["pendiente", "confirmada", "atendida"];
  const idx = estados.indexOf(cita.estado);
  const progreso = idx === -1 ? 1 : idx + 1;

  const pasos: { label: string; icon: ReactNode }[] = [
    { label: "Cita pendiente", icon: <Clock size={18} /> },
    { label: "Cita confirmada", icon: <CheckCircle2 size={18} /> },
    { label: "Cita atendida", icon: <FileText size={18} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-[#E9DED2] bg-white shadow-md p-6 relative overflow-hidden"
    >
      {/* === ENCABEZADO === */}
      <h3 className="text-lg font-bold mb-5 text-[#bd8755] text-center">
        {modo === "confirmacion" ? "Solicitud creada" : "Detalles de la cita"}
      </h3>

      {/* === BARRA DE PROGRESO === */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#E5D8C8] -translate-y-1/2" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(progreso - 1) * 50}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-1/2 left-0 h-[3px] bg-[#B08968] -translate-y-1/2 rounded-full"
        />

        <div className="relative flex justify-between items-center">
          {pasos.map((step, i) => {
            const activo = i < progreso;
            return (
              <div key={step.label} className="flex flex-col items-center w-1/3">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: activo ? 1 : 0.9 }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    activo
                      ? "bg-[#B08968] border-[#B08968] text-white shadow-md"
                      : "bg-white border-[#E5D8C8] text-[#B89B82]"
                  }`}
                >
                  {step.icon}
                </motion.div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    activo ? "text-[#8B6A4B]" : "text-[#B89B82]"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* === INFORMACIÓN DE LA CITA === */}
      <div className="text-[#4E3B2B] leading-relaxed space-y-1">
        <p>
          <b>Número de Cita:</b> #{numeroCita}
        </p>
        <p>
          <b>Paciente:</b> {cita.nombres} {cita.apellidos}
        </p>
        <p>
          <b>Procedimiento:</b> {cita.procedimiento}
        </p>
        <p>
          <b>Fecha:</b> {diaTxt}, {fechaTxt}
        </p>
        <p>
          <b>Hora:</b> {horaNormal}{" "}
          <span className="text-[#A78A75] text-sm">
            (formato 24h: {horaMilitar})
          </span>
        </p>
        <p>
          <b>Teléfono:</b> {cita.telefono}
        </p>
        <p>
          <b>Correo:</b> {cita.correo}
        </p>
        <p>
          <b>Método de pago:</b> {metodoPagoTxt}
        </p>
        {cita.nota ? (
          <p>
            <b>Nota:</b> {cita.nota}
          </p>
        ) : null}
      </div>

      <hr className="my-4 border-[#E9DED2]" />

      <div className="text-center mt-2">
        {cita.pagado ? (
          <p className="font-medium text-green-700">Pago confirmado </p>
        ) : (
          <p className="italic text-sm text-[#6C584C]">
            El pago se realizará al asistir o mediante el QR generado.
          </p>
        )}
      </div>

      {mostrarQR && !cita.pagado && (
        <div className="mt-6 flex flex-col items-center">
          <div className="w-28 h-28 border border-[#E9DED2] bg-[#FAF9F7] flex items-center justify-center rounded-lg">
            <QRCode
              value={`Cita #${cita.id} - ${cita.nombres} ${cita.apellidos}`}
              size={120}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
