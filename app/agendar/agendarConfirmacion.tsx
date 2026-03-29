"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import jsPDF from "jspdf";

import type { Cita, SessionUser } from "../types/domain";
import { updateCitaApi } from "../services/citasApi";

import {
  CheckCircle2,
  CalendarDays,
  Clock,
  Mail,
  User as UserIcon,
  Home,
  Download,
} from "lucide-react";

interface AgendarConfirmacionProps {
  cita: Cita;
  usuario?: SessionUser | null;
}

// ==============================
// Formateador de moneda (COP)
// ==============================
const formatCurrency = (valor: number): string =>
  valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function AgendarConfirmacion({
  cita,
}: AgendarConfirmacionProps) {
  const router = useRouter();
  const [qrURL, setQrURL] = useState<string>("");
  const [estado, setEstado] = useState<Cita["estado"]>(
    cita.estado ?? "pendiente"
  );

  useEffect(() => {
    void generarQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cita]);

  async function generarQR(): Promise<void> {
    try {
      const data = `Cita #${cita.id} - ${cita.nombres} ${cita.apellidos}\n${cita.procedimiento}\n${cita.fecha} ${cita.hora}`;
      const url = await QRCode.toDataURL(data);
      setQrURL(url);
    } catch (err) {
      console.warn("Error generando QR de la cita:", err);
    }
  }

  // === Generar PDF con QR ===
  const descargarPDF = (): void => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("Confirmación de Cita", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${cita.nombres} ${cita.apellidos}`, 20, 35);
    doc.text(`Procedimiento: ${cita.procedimiento}`, 20, 45);
    doc.text(`Fecha: ${cita.fecha}`, 20, 55);
    doc.text(`Hora: ${cita.hora}`, 20, 65);
    doc.text(`Correo: ${cita.correo}`, 20, 75);
    doc.text(`Estado: ${estado}`, 20, 85);

    if (qrURL) {
      doc.addImage(qrURL, "PNG", 140, 30, 50, 50);
    }

    doc.save(`Cita_${cita.id}.pdf`);
  };

  // === Barra de progreso ===
  const pasos: Array<Cita["estado"]> = ["pendiente", "confirmada", "atendida"];
  const indice = pasos.indexOf(estado);

  const avanzarEstado = async (): Promise<void> => {
    try {
      if (estado === "pendiente") {
        await updateCitaApi(cita.id, { estado: "confirmada" });
        setEstado("confirmada");
      } else if (estado === "confirmada") {
        await updateCitaApi(cita.id, { estado: "atendida" });
        setEstado("atendida");
      }
    } catch (err) {
      console.error("Error actualizando estado de la cita:", err);
      alert("Ocurrió un error al actualizar el estado de la cita.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl shadow-2xl bg-gradient-to-b from-[#F7EFE6] to-[#E6D2B8] p-10 text-center relative border border-[#E0CDB5]"
    >
      <h2 className="text-3xl font-serif text-[#3B2615] mb-2">
        Confirmación de tu cita
      </h2>
      <p className="text-[#5A4635] mb-8">
        Tu cita ha sido registrada exitosamente. A continuación puedes ver su
        estado y los detalles.
      </p>

      {/* === Línea de progreso === */}
      <div className="flex justify-between items-center mb-10 relative px-6">
        {pasos.map((p, i) => (
          <div key={p} className="flex flex-col items-center flex-1 relative">
            <div
              className={`h-6 w-6 rounded-full border-2 z-10 ${
                i <= indice
                  ? "bg-[#B08968] border-[#A67855]"
                  : "bg-[#E9DED2] border-[#D5C3AF]"
              }`}
            />
            <span
              className={`mt-2 text-xs uppercase ${
                i <= indice ? "text-[#5A3B1E]" : "text-gray-400"
              }`}
            >
              {p}
            </span>
            {i < pasos.length - 1 && (
              <div
                className={`absolute top-3 left-1/2 w-full h-[2px] -translate-x-1/2 ${
                  i < indice ? "bg-[#B08968]" : "bg-[#E6D8C8]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* === Detalles === */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-left shadow-inner border border-[#E6D8C8] max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-[#4E3B2B] mb-1">
          <UserIcon size={18} className="text-[#B08968]" />
          <p>
            <b>Paciente:</b> {cita.nombres} {cita.apellidos}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[#4E3B2B] mb-1">
          <CalendarDays size={18} className="text-[#B08968]" />
          <p>
            <b>Fecha:</b> {cita.fecha}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[#4E3B2B] mb-1">
          <Clock size={18} className="text-[#B08968]" />
          <p>
            <b>Hora:</b> {cita.hora}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[#4E3B2B] mb-1">
          <Mail size={18} className="text-[#B08968]" />
          <p>
            <b>Correo:</b> {cita.correo}
          </p>
        </div>

        <p className="text-[#4E3B2B] mb-1">
          <b>Procedimiento:</b> {cita.procedimiento}
        </p>

        <p className="text-[#4E3B2B] mb-1">
          <b>Método de pago:</b>{" "}
          {cita.metodoPago === "Online"
            ? `Pago en línea (${cita.tipoPagoOnline ?? "N/A"})`
            : `Pago en consultorio (${cita.tipoPagoConsultorio ?? "N/A"})`}
        </p>

        {typeof cita.monto === "number" && (
          <p className="text-[#4E3B2B]">
            <b>Valor:</b> {formatCurrency(cita.monto)}
          </p>
        )}
      </div>

      {/* === QR === */}
      {qrURL && (
        <div className="flex flex-col items-center mt-10">
          <img
            src={qrURL}
            alt="QR cita"
            className="w-36 h-36 border border-[#E9DED2] rounded-lg bg-white shadow-sm"
          />
          <p className="mt-3 text-sm text-[#6C584C]">
            Escanea este código para confirmar tu asistencia
          </p>
        </div>
      )}

      {/* === Botones === */}
      <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
        <button
          type="button"
          onClick={descargarPDF}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white shadow-md"
          style={{
            background: "linear-gradient(90deg,#B08968,#D1A97A)",
          }}
        >
          <Download size={18} />
          Descargar PDF
        </button>

        {estado !== "atendida" && (
          <button
            type="button"
            onClick={() => void avanzarEstado()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-[#4E3B2B] border border-[#D1BFA4] bg-[#FBF7F2]"
          >
            <CheckCircle2 size={18} />
            {estado === "pendiente"
              ? "Marcar como confirmada"
              : "Marcar como atendida"}
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border border-[#E0CDB5] bg-[#FFFDF9] text-[#4E3B2B]"
        >
          <Home size={18} />
          Volver al inicio
        </button>
      </div>
    </motion.div>
  );
}
