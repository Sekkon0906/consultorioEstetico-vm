"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PALETTE } from "./palette";
import type { Cita, MetodoPago, TipoPagoConsultorio, TipoPagoOnline } from "../types/domain";
import { createCitaApi } from "../services/citasApi";

export type CrearCitaPayload = Omit<Cita, "id" | "fechaCreacion">;
export type CitaSinPagos = Omit<CrearCitaPayload, "metodoPago" | "tipoPagoConsultorio" | "tipoPagoOnline" | "estado">;

interface AgendarPagoProps {
  metodoPago: MetodoPago | null;
  setMetodoPago: (m: MetodoPago | null) => void;
  tipoPagoConsultorio: TipoPagoConsultorio | undefined;
  setTipoPagoConsultorio: (t: TipoPagoConsultorio | undefined) => void;
  tipoPagoOnline: TipoPagoOnline | undefined;
  setTipoPagoOnline: (t: TipoPagoOnline | undefined) => void;
  citaData: CitaSinPagos;
  onConfirmar: (citaCreada: Cita) => void;
  goBack: () => void;
}

export default function AgendarPago({ citaData, onConfirmar, goBack, setMetodoPago, setTipoPagoConsultorio }: AgendarPagoProps) {
  const t = useTranslations("agendar.pago");
  const locale = useLocale();
  const [tipoPago, setTipoPago] = useState<"Efectivo" | "Tarjeta">("Efectivo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEfectivo = tipoPago === "Efectivo";
  const intlLocale = locale === "en" ? "en-US" : "es-CO";

  const handleConfirmar = async () => {
    setLoading(true);
    setError(null);
    setMetodoPago("Consultorio");
    setTipoPagoConsultorio(tipoPago);

    try {
      const payload: CrearCitaPayload = {
        ...citaData,
        metodoPago: "Consultorio",
        tipoPagoConsultorio: tipoPago,
        tipoPagoOnline: null,
        estado: "pendiente",
      };
      const nuevaCita = await createCitaApi(payload);

      const fechaH = new Date(citaData.fecha + "T12:00:00").toLocaleDateString(intlLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const tipoPagoLocalizado = isEfectivo ? t("cash") : t("card");
      const lineas = [
        t("whatsapp.title"),
        "",
        `${t("whatsapp.patient")} ${citaData.nombres} ${citaData.apellidos || ""}`,
        `${t("whatsapp.phone")} ${citaData.telefono || t("summary.notSpecified")}`,
        `${t("whatsapp.email")} ${citaData.correo || t("summary.notSpecified")}`,
        `${t("whatsapp.procedure")} ${citaData.procedimiento}`,
        `${t("whatsapp.date")} ${fechaH}`,
        `${t("whatsapp.time")} ${citaData.hora}`,
        `${t("whatsapp.payment")} ${t("whatsapp.paymentValue")} (${tipoPagoLocalizado})`,
      ];
      if (citaData.nota) lineas.push(`${t("whatsapp.note")} ${citaData.nota}`);
      lineas.push(`${t("whatsapp.appointmentNumber")}${nuevaCita.id}*`);
      const texto = lineas.join("\n");
      window.open(`https://wa.me/573155445748?text=${encodeURIComponent(texto)}`, "_blank");

      onConfirmar(nuevaCita);
    } catch (err: any) { setError(err.message || t("errorCreate")); }
    finally { setLoading(false); }
  };

  return (
    <motion.div key="pago" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5 }} style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="agendar-pago-card dark-aware-card" style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 12px 40px rgba(78,59,43,0.08)", padding: "2.5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.5rem" }}>{t("title")}</h2>
        <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, margin: "0 auto 1.5rem" }} />

        {/* Resumen */}
        <div className="pago-summary-box" style={{ textAlign: "left", background: "linear-gradient(145deg, #FFFBF7, #F0E5D8)", borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(176,137,104,0.12)", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.9rem", color: "#5A4A3A" }}>
            <span style={{ fontWeight: 600, color: "#3A2A1A" }}>{t("summary.patient")}</span><span>{citaData.nombres} {citaData.apellidos || ""}</span>
            <span style={{ fontWeight: 600, color: "#3A2A1A" }}>{t("summary.procedure")}</span><span>{citaData.procedimiento}</span>
            <span style={{ fontWeight: 600, color: "#3A2A1A" }}>{t("summary.date")}</span><span>{new Date(citaData.fecha + "T12:00:00").toLocaleDateString(intlLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <span style={{ fontWeight: 600, color: "#3A2A1A" }}>{t("summary.time")}</span><span>{citaData.hora}</span>
            <span style={{ fontWeight: 600, color: "#3A2A1A" }}>{t("summary.phone")}</span><span>{citaData.telefono || t("summary.notSpecified")}</span>
          </div>
          {citaData.nota && <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(176,137,104,0.15)" }}><span style={{ fontWeight: 600, color: "#3A2A1A", fontSize: "0.9rem" }}>{t("summary.noteLabel")}</span><span style={{ fontSize: "0.9rem", color: "#5A4A3A" }}>{citaData.nota}</span></div>}
        </div>

        {/* Toggle Efectivo / Tarjeta */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3A2A1A", marginBottom: "0.8rem" }}>{t("paymentMethodLabel")}</p>
          <div
            onClick={() => setTipoPago(isEfectivo ? "Tarjeta" : "Efectivo")}
            style={{
              display: "inline-flex", alignItems: "center", cursor: "pointer", userSelect: "none",
              background: isEfectivo
                ? "linear-gradient(135deg, #B08968, #C9AD8D)"
                : "linear-gradient(135deg, #6C8B6A, #8DB08A)",
              borderRadius: 50, padding: "5px", width: 240, height: 48, position: "relative",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
              transition: "background 0.4s ease",
            }}
          >
            {/* Track labels */}
            <span style={{
              position: "absolute", left: 20, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.9)",
              opacity: isEfectivo ? 0 : 1, transition: "opacity 0.3s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <i className="fas fa-money-bill-wave" style={{ fontSize: "0.7rem" }} /> {t("cash")}
            </span>
            <span style={{
              position: "absolute", right: 20, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.9)",
              opacity: isEfectivo ? 1 : 0, transition: "opacity 0.3s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {t("card")} <i className="fas fa-credit-card" style={{ fontSize: "0.7rem" }} />
            </span>

            {/* Knob */}
            <motion.div
              animate={{ x: isEfectivo ? 0 : 192 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              style={{
                width: 42, height: 38, borderRadius: 50,
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", zIndex: 2,
              }}
            >
              <motion.div
                animate={{ rotate: isEfectivo ? 0 : 180 }}
                transition={{ duration: 0.4 }}
              >
                {isEfectivo ? (
                  <i className="fas fa-money-bill-wave" style={{ color: "#B08968", fontSize: "0.9rem" }} />
                ) : (
                  <i className="fas fa-credit-card" style={{ color: "#6C8B6A", fontSize: "0.9rem" }} />
                )}
              </motion.div>
            </motion.div>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#8A7565", marginTop: "0.6rem" }}>
            {isEfectivo ? t("cashHint") : t("cardHint")}
          </p>
        </div>

        <p style={{ fontSize: "0.78rem", color: "#8A7565", marginBottom: "1.5rem", fontStyle: "italic" }}>
          {t("footerInfo")}
        </p>

        {error && <div style={{ background: "#FDE8D8", color: "#922B21", padding: "0.7rem 1rem", borderRadius: 12, marginBottom: "1rem", fontSize: "0.85rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.75rem 1.5rem", borderRadius: 100, border: "1px solid rgba(176,137,104,0.3)", background: "transparent", color: "#6C584C", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
            <ArrowLeft size={16} /> {t("back")}
          </button>
          <button onClick={handleConfirmar} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.75rem 2rem", borderRadius: 100, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(176,137,104,0.25)", opacity: loading ? 0.7 : 1 }}>
            <i className="fab fa-whatsapp" style={{ fontSize: "1.1rem" }} /> {loading ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
