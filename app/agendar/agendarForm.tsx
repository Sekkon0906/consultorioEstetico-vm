"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MUELLE_TACTO } from "@/lib/movimiento";
import { useLocale, useTranslations } from "next-intl";
import { PALETTE } from "./palette";

//  Tipos desde el dominio real (ya no usamos utils/localDB)
import type { Procedimiento, SessionUser } from "@/types/domain";

import { ArrowLeft, CalendarDays, Clock, RotateCcw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import TreatmentPicker from "./TreatmentPicker";

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
  const t = useTranslations("agendar.form");
  const locale = useLocale();
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const listaProcedimientos: Procedimiento[] = Array.isArray(procedimientos)
    ? procedimientos
    : [];

  /* Se llamaba DARK_PALETTE pero era al reves: dos marrones MUY oscuros
     pensados para leerse sobre el fondo claro. En modo oscuro eran texto
     casi negro sobre fondo casi negro. Ahora sale del tema. */
  const DARK_PALETTE = {
    ...PALETTE,
    text: "var(--text)",
    textSoft: "var(--text-soft)",
  };

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
    const intlLocale = locale === "en" ? "en-US" : "es-CO";
    return date.toLocaleDateString(intlLocale, { weekday: "long" });
  };

  const fmtFechaHumana = (date: Date): string => {
    const intlLocale = locale === "en" ? "en-US" : "es-CO";
    return date.toLocaleDateString(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const fmtHoraHumana = (hhmm: string): string => {
    const [hStr, mStr] = hhmm.split(":");
    let h = Number(hStr);
    if (locale === "en") {
      const suf = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      if (h > 12) h -= 12;
      return `${h}:${mStr} ${suf}`;
    }
    const suf = h >= 12 ? "p.m." : "a.m.";
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
    return `${h}:${mStr} ${suf}`;
  };

  const fechaObj = formData.fecha ? new Date(formData.fecha) : null;

  return (
    <motion.div
      key="panel-form"
      initial={{ y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="agendar-form-card dark-aware-card rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--surface) 100%)",
        border: `1px solid ${DARK_PALETTE.border}`,
        color: DARK_PALETTE.text,
        maxWidth: 920,
        margin: "0 auto",
      }}
    >
      {/* === BOTÓN VOLVER === */}
      <div
        className="p-6 flex items-center gap-2 cursor-pointer w-fit"
        onClick={goBack}
      >
        <ArrowLeft size={20} className="text-[var(--text-soft)]" />
        <span className="text-sm font-medium text-[var(--text-soft)] hover:text-[var(--brand-deep)] transition-colors">
          {t("back")}
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
          {t("title")}
        </h2>

        {usuario && esPrimeraCita && (
          <motion.div
            initial={{ y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm rounded-lg p-3 mx-auto max-w-lg bg-[var(--surface-soft)] border border-[var(--border)]"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            {t.rich("firstAppointmentNote", {
              b: (chunks) => <b>{chunks}</b>,
            })}
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
            className="md:col-span-2 p-5 rounded-2xl border bg-[var(--surface-soft)] shadow-inner relative"
            style={{
              borderColor: "var(--border-strong)",
              color: DARK_PALETTE.textSoft,
            }}
            initial={{ y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3
              className="text-lg font-serif mb-2 text-center"
              style={{ color: DARK_PALETTE.text }}
            >
              {t("selectedDateTime")}
            </h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[var(--brand)]" />
                <span>
                  <b>
                    {fmtDiaHumano(fechaObj)}, {fmtFechaHumana(fechaObj)}
                  </b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--brand)]" />
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
                transition={MUELLE_TACTO}
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full text-sm font-medium shadow-sm transition-all"
                style={{
                  background: "#FFF",
                  color: "var(--text-soft)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                <RotateCcw size={16} />
                {t("changeSchedule")}
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
            {t("fullName")} *
          </label>
          <input
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder={t("fullNamePlaceholder")}
            required
            className="w-full p-3 rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] outline-none transition-all"
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
            {t("phone")} *
          </label>
          <input
            value={formData.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            type="tel"
            placeholder={t("phonePlaceholder")}
            required
            pattern="[0-9]{7,}"
            className="w-full p-3 rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] outline-none transition-all"
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
            {t("email")} *
          </label>
          <input
            value={formData.correo}
            onChange={(e) => handleChange("correo", e.target.value)}
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            className="w-full p-3 rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] outline-none transition-all"
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
            {t("appointmentType")}
          </label>
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full p-3 rounded-lg border bg-[var(--bg-elevated)] font-medium shadow-inner"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.textSoft,
            }}
          >
            {t("appointmentTypeValue")}
          </motion.div>
        </div>

        {/* Procedimiento */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            {t("procedure")} *
          </label>
          <TreatmentPicker
            value={formData.procedimiento}
            onChange={(val) => handleChange("procedimiento", val)}
            procedimientos={listaProcedimientos}
            placeholder={t("procedurePlaceholder")}
          />
        </div>

        {/* Nota */}
        <div className="md:col-span-2">
          <label
            className="block mb-1 text-sm font-semibold"
            style={{ color: DARK_PALETTE.textSoft }}
          >
            {t("noteLabel")}
          </label>
          <textarea
            value={formData.nota}
            onChange={(e) => handleChange("nota", e.target.value)}
            rows={3}
            placeholder={t("notePlaceholder")}
            className="w-full p-3 rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] outline-none transition-all"
            style={{
              borderColor: DARK_PALETTE.border,
              color: DARK_PALETTE.text,
            }}
          />
        </div>

        {/* Aceptación de Términos / política de abono y cancelación */}
        <div className="md:col-span-2">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", color: DARK_PALETTE.textSoft }}>
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 3, accentColor: DARK_PALETTE.main, flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.84rem", lineHeight: 1.5 }}>
              He leído y acepto los{" "}
              <Link href="/legal/terminos" target="_blank" style={{ color: DARK_PALETTE.main, fontWeight: 600 }}>
                Términos y Condiciones
              </Link>
              , incluida la política de abono de reserva ($50.000) y de
              cancelación/reagenda, y el tratamiento de mis datos según la{" "}
              <Link href="/legal/privacidad" target="_blank" style={{ color: DARK_PALETTE.main, fontWeight: 600 }}>
                Política de Privacidad
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Botón continuar */}
        <div className="md:col-span-2 mt-6 flex justify-center">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={MUELLE_TACTO}
            className="px-8 py-2 rounded-lg font-semibold shadow-md text-white transition"
            style={{
              background: DARK_PALETTE.main,
              opacity:
                !formData.nombre ||
                !formData.telefono ||
                !formData.correo ||
                !formData.procedimiento ||
                !aceptaTerminos
                  ? 0.6
                  : 1,
            }}
            disabled={
              !formData.nombre ||
              !formData.telefono ||
              !formData.correo ||
              !formData.procedimiento ||
              !aceptaTerminos
            }
          >
            {t("continue")}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
