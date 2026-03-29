"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Globe, ArrowLeft, AlertTriangle } from "lucide-react";
import { PALETTE } from "./page";

//  Tipos de dominio reales
import type {
  Cita,
  MetodoPago,
  TipoPagoConsultorio,
  TipoPagoOnline,
} from "../types/domain";

//  Servicio que habla con el backend
import { createCitaApi } from "../services/citasApi";

// -----------------------------
// Tipos auxiliares
// -----------------------------

//  Tipo que espera createCitaApi (coincide con Omit<Cita, "id" | "fechaCreacion">)
export type CrearCitaPayload = Omit<Cita, "id" | "fechaCreacion">;

//  En pasos anteriores todavía NO tenemos pagos ni estado
export type CitaSinPagos = Omit<
  CrearCitaPayload,
  "metodoPago" | "tipoPagoConsultorio" | "tipoPagoOnline" | "estado"
>;

interface AgendarPagoProps {
  metodoPago: MetodoPago | null;
  setMetodoPago: (metodo: MetodoPago | null) => void;

  tipoPagoConsultorio: TipoPagoConsultorio | undefined;
  setTipoPagoConsultorio: (tipo: TipoPagoConsultorio | undefined) => void;

  tipoPagoOnline: TipoPagoOnline | undefined;
  setTipoPagoOnline: (tipo: TipoPagoOnline | undefined) => void;

  // datos ya capturados en pasos anteriores (sin info de pago)
  citaData: CitaSinPagos;

  // callback cuando la cita se crea correctamente
  onConfirmar: (citaCreada: Cita) => void;

  goBack: () => void;
}

export default function AgendarPago({
  metodoPago,
  setMetodoPago,
  tipoPagoConsultorio,
  setTipoPagoConsultorio,
  tipoPagoOnline,
  setTipoPagoOnline,
  citaData,
  onConfirmar,
  goBack,
}: AgendarPagoProps) {
  const [brilloActivo, setBrilloActivo] = useState(false);
  const [error, setError] = useState(false);

const opciones: {
  tipo: MetodoPago;
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
}[] = [
  {
    tipo: "Consultorio",
    icono: <Wallet size={26} />,
    titulo: "Pagar en consultorio",
    descripcion: "Podrás pagar tu cita en efectivo o tarjeta al asistir.",
  },
  {
    tipo: "Online",
    icono: <Globe size={26} />,
    titulo: "Pago en línea",
    descripcion: "Realiza tu pago seguro vía PayU o PSE antes de asistir.",
  },
];


  const pagoValido: boolean =
    (metodoPago === "Consultorio" &&
      (tipoPagoConsultorio === "Efectivo" ||
        tipoPagoConsultorio === "Tarjeta")) ||
    (metodoPago === "Online" &&
      (tipoPagoOnline === "PayU" || tipoPagoOnline === "PSE"));

  // === CONFIRMAR ===
  const handleConfirmar = async (): Promise<void> => {
    if (!pagoValido) {
      setError(true);
      setTimeout(() => setError(false), 2500);
      return;
    }

    setBrilloActivo(true);

    setTimeout(async () => {
      try {
        const payload: CrearCitaPayload = {
          ...citaData,
          //  aquí agregamos la info de pago
          metodoPago: metodoPago ?? "Consultorio",
          tipoPagoConsultorio:
            metodoPago === "Consultorio" ? tipoPagoConsultorio ?? "Efectivo" : null,
          tipoPagoOnline:
            metodoPago === "Online" ? tipoPagoOnline ?? "PayU" : null,
          //  estado requerido por el tipo Cita
          estado: "pendiente",
        };

        const nuevaCita = await createCitaApi(payload);

        //  Notificar a AgendarPage
        onConfirmar(nuevaCita);

        //  Dispara evento global para actualizar calendario
        window.dispatchEvent(
          new CustomEvent("horarioCambiado", {
            detail: { tipo: "nuevaCita", cita: nuevaCita },
          })
        );
      } catch (err: unknown) {
        console.error("Error creando cita:", err);
        // eslint-disable-next-line no-alert
        alert("Error al confirmar la cita. Intenta nuevamente.");
      } finally {
        setBrilloActivo(false);
      }
    }, 1000);
  };

  // === UI ===
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl shadow-2xl p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#F2E7DA 0%,#E6D5C3 100%)",
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      {/* === BOTÓN VOLVER === */}
      <motion.button
        onClick={goBack}
        className="absolute top-6 left-6 flex items-center gap-1 text-[#3A2413] hover:text-[#5A3A23] transition"
        animate={{ y: [0, -2, 0] }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 3,
          ease: "easeInOut",
        }}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Volver</span>
      </motion.button>

      {/* === ENCABEZADO === */}
      <div className="text-center mb-8">
        <h2
          className="text-3xl font-serif mb-2"
          style={{ color: "#3A2413" }}
        >
          Método de pago
        </h2>
        <p className="text-[#4E3B2B]">
          Valor de la consulta de valoración:{" "}
          <b className="text-[#B08968]">$120.000 COP</b>
        </p>
      </div>

      {/* === OPCIONES === */}
      <motion.div
        className="grid md:grid-cols-2 gap-6"
        animate={error ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {opciones.map((o) => (
          <motion.div
            key={o.tipo}
            onClick={() => setMetodoPago(o.tipo)}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`cursor-pointer p-6 rounded-2xl border-2 backdrop-blur-sm transition-all flex flex-col items-start gap-2 ${
              metodoPago === o.tipo
                ? "border-[#B08968] bg-white shadow-lg"
                : "border-transparent bg-[#F9F4EE]"
            }`}
          >
            <div className="flex items-center gap-3 text-[#3E2A1A]">
              {o.icono}
              <h3 className="font-semibold text-lg">{o.titulo}</h3>
            </div>
            <p className="text-sm text-[#5E4A3A]">{o.descripcion}</p>

            {/* SUBOPCIONES CONSULTORIO */}
            {metodoPago === o.tipo && o.tipo === "Consultorio" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex gap-4 w-full"
              >
                {(["Efectivo", "Tarjeta"] as TipoPagoConsultorio[]).map((m) => (
                  <button
                    key={m}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTipoPagoConsultorio(m);
                      setTipoPagoOnline(undefined);
                    }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${
                      tipoPagoConsultorio === m
                        ? "bg-[#B08968] text-white border-[#B08968]"
                        : "bg-[#FFFDF9] text-[#4B3726] border-[#E9DED2]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </motion.div>
            )}

            {/* SUBOPCIONES ONLINE */}
            {metodoPago === o.tipo && o.tipo === "Online" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex gap-4 w-full"
              >
                {(["PayU", "PSE"] as TipoPagoOnline[]).map((m) => (
                  <button
                    key={m}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTipoPagoOnline(m);
                      setTipoPagoConsultorio(undefined);
                    }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${
                      tipoPagoOnline === m
                        ? "bg-[#B08968] text-white border-[#B08968]"
                        : "bg-[#FFFDF9] text-[#4B3726] border-[#E9DED2]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* MENSAJE DE ERROR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={error ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className={`mt-6 flex items-center justify-center gap-2 text-[#7A4A2E] bg-[#FDF2E6] border border-[#E9C9A0] p-3 rounded-lg text-sm font-medium shadow-sm ${
          error ? "visible" : "invisible"
        }`}
      >
        <AlertTriangle size={18} />
        Debes seleccionar un método y tipo de pago antes de continuar.
      </motion.div>

      {/* BOTÓN CONFIRMAR */}
      <div className="mt-12 text-center relative">
        <motion.button
          whileHover={{ scale: pagoValido ? 1.05 : 1 }}
          whileTap={{ scale: pagoValido ? 0.97 : 1 }}
          disabled={!pagoValido}
          onClick={handleConfirmar}
          className={`relative px-10 py-3 rounded-full font-semibold text-white shadow-lg transition-all overflow-hidden ${
            pagoValido ? "" : "cursor-not-allowed"
          }`}
          style={{
            background: pagoValido
              ? "linear-gradient(90deg,#8B6749,#B08968)"
              : "linear-gradient(90deg,#D5C4B3,#C1B2A3)",
            opacity: pagoValido ? 1 : 0.6,
          }}
        >
          Confirmar cita
          {brilloActivo && (
            <motion.span
              initial={{ left: "-150%" }}
              animate={{ left: "150%" }}
              transition={{ duration: 1 }}
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#fff3e0]/70 to-transparent blur-lg"
              style={{ mixBlendMode: "screen" }}
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
