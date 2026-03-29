"use client";

import { motion } from "framer-motion";
import { PALETTE } from "./page";

//  Tipos desde el dominio real (ya no usamos utils/localDB)
import type { Procedimiento, SessionUser } from "../types/domain";

import { ArrowLeft, CalendarDays, Clock, RotateCcw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

export interface AgendarFormData {
  fecha?: string;
  hora?: string;
  nombre: string;
  telefono: string;
  correo: string;
  procedimiento: string;
  nota?: string;
}

interface AgendarFormProps {
  usuario: SessionUser | null;
  esPrimeraCita: boolean;
  procedimientos?: Procedimiento[];
  formData: AgendarFormData;
  setFormData: Dispatch<SetStateAction<AgendarFormData>>;
  handleConfirmar: () => void;
  goBack: () => void;
}

export default function AgendarForm({
  usuario,
  esPrimeraCita,
  procedimientos = [],
  formData,
  setFormData,
  handleConfirmar,
  goBack,
}: AgendarFormProps) {
  const listaProcedimientos: Procedimiento[] = Array.isArray(procedimientos)
    ? procedimientos
    : [];

  const DARK_PALETTE = {
    ...PALETTE,
    text: "#2A1C12",
    textSoft: "#4B3726",
  };

  const procedimientosFaciales = listaProcedimientos.filter(
    (p) => p.categoria === "Facial"
  );
  const procedimientosCorporales = listaProcedimientos.filter(
    (p) => p.categoria === "Corporal"
  );
  const procedimientosCapilares = listaProcedimientos.filter(
    (p) => p.categoria === "Capilar"
  );

  const handleChange = <K extends keyof AgendarFormData>(
    key: K,
    value: AgendarFormData[K]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleContinue = (): void => {
    handleConfirmar();
  };

  // === FORMATOS DE FECHA Y HORA ===
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
    return `${date.getDate()} de ${
      meses[date.getMonth()]
    } de ${date.getFullYear()}`;
  };

  const fmtHoraHumana = (hhmm: string): string => {
    const [hStr, mStr] = hhmm.split(":");
    let h = Number(hStr);
    const suf = h >= 12 ? "p.m." : "a.m.";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h}:${mStr} ${suf}`;
  };

  const fechaObj = formData.fecha ? new Date(formData.fecha) : null;

  return (
    <motion.div
      key="panel-form"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FBF7F2 0%, #F4EBE2 100%)",
        border: `1px solid ${DARK_PALETTE.border}`,
        color: DARK_PALETTE.text,
      }}
    >
      {/* === BOTÓN VOLVER === */}
      <div
        className="p-6 flex items-center gap-2 cursor-pointer w-fit"
        onClick={goBack}
      >
        <ArrowLeft size={20} className="text-[#5C4533]" />
        <span className="text-sm font-medium text-[#5C4533] hover:text-[#8B6A4B] transition-colors">
          Volver
        </span>
      </div>

      {/* === ENCABEZADO === */}
      <div
        className="pb-6 text-center border-b"
        style={{ borderColor: DARK_PALETTE.border }}
      >
        <h2
          className="text-3xl font-serif mb-2"
          style={{ color: DARK_PALETTE.text }}
        >
          Completa tus datos
        </h2>

        {usuario && esPrimeraCita && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm rounded-lg p-3 mx-auto max-w-lg bg-[#E8E1D4] border border-[#E0D3C0]"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            La <b>primera cita</b> es una <b>consulta de valoración</b>, y{" "}
            <b>dependiendo del diagnóstico</b>, se podría{" "}
            <b>realizar el procedimiento</b> indicado en la{" "}
            <b>misma cita</b>.
          </motion.div>
        )}
      </div>

      {/* === FORMULARIO === */}
      <form
        className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
      >
        {/* === BLOQUE DÍA Y HORA SELECCIONADA === */}
        {fechaObj && formData.hora && (
          <motion.div
            className="md:col-span-2 p-5 rounded-2xl border bg-[#e4d0b9] shadow-inner relative"
            style={{
              borderColor: "#E0CDB5",
              color: DARK_PALETTE.textSoft,
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3
              className="text-lg font-serif mb-2 text-center"
              style={{ color: DARK_PALETTE.text }}
            >
              Fecha y hora seleccionadas
            </h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#B08968]" />
                <span>
                  <b>
                    {fmtDiaHumano(fechaObj)}, {fmtFechaHumana(fechaObj)}
                  </b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#B08968]" />
                <span>
                  <b>{fmtHoraHumana(formData.hora)}</b>
                </span>
              </div>
            </div>
            <div className="text-center mt-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full text-sm font-medium shadow-sm transition-all"
                style={{
                  background: "#FFF",
                  color: "#6C584C",
                  border: "1px solid #E0CDB5",
                }}
              >
                <RotateCcw size={16} />
                Cambiar horario
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* === CAMPOS DE FORMULARIO === */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Nombre completo *
          </label>
          <input
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Ej: Laura Gómez"
            required
            className="w-full p-3 rounded-lg border bg-white focus:border-[#B08968] focus:ring-2 focus:ring-[#C7A27A]/30 outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          />
        </div>

        <div>
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Teléfono *
          </label>
          <input
            value={formData.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            type="tel"
            placeholder="Solo números"
            required
            pattern="[0-9]{7,}"
            className="w-full p-3 rounded-lg border bg-white focus:border-[#B08968] focus:ring-2 focus:ring-[#C7A27A]/30 outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          />
        </div>

        <div>
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Correo electrónico *
          </label>
          <input
            value={formData.correo}
            onChange={(e) => handleChange("correo", e.target.value)}
            type="email"
            placeholder="ejemplo@correo.com"
            required
            className="w-full p-3 rounded-lg border bg-white focus:border-[#B08968] focus:ring-2 focus:ring-[#C7A27A]/30 outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          />
        </div>

        {/* Tipo de cita (solo informativo ahora) */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Tipo de cita
          </label>
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full p-3 rounded-lg border bg-[#FBF7F2] font-medium shadow-inner"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.textSoft,
            }}
          >
            Valoración / Procedimiento
          </motion.div>
        </div>

        {/* Procedimiento */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Procedimiento *
          </label>
          <select
            value={formData.procedimiento}
            onChange={(e) => handleChange("procedimiento", e.target.value)}
            required
            className="w-full p-3 rounded-lg border bg-white focus:border-[#B08968] focus:ring-2 focus:ring-[#C7A27A]/30 outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          >
            <option value="">Selecciona un procedimiento</option>
            <optgroup label="Faciales">
              {procedimientosFaciales.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Corporales">
              {procedimientosCorporales.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Capilares">
              {procedimientosCapilares.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Nota */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            Nota (opcional)
          </label>
          <textarea
            value={formData.nota}
            onChange={(e) => handleChange("nota", e.target.value)}
            rows={3}
            placeholder="Ej: tengo nervios a las agujas, es mi primera vez"
            className="w-full p-3 rounded-lg border bg-white focus:border-[#B08968] focus:ring-2 focus:ring-[#C7A27A]/30 outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          />
        </div>

        {/* Botón continuar */}
        <div className="md:col-span-2 mt-8 flex justify-center">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-2 rounded-lg font-semibold shadow-md text-white transition"
            style={{
              background: DARK_PALETTE.main,
              opacity:
                !formData.nombre ||
                !formData.telefono ||
                !formData.correo ||
                !formData.procedimiento
                  ? 0.6
                  : 1,
            }}
            disabled={
              !formData.nombre ||
              !formData.telefono ||
              !formData.correo ||
              !formData.procedimiento
            }
          >
            Continuar
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
