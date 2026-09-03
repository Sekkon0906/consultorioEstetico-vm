"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, FileText, Calendar, User, Phone, Mail, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Cita, EstadoCita } from "@/types/domain";
import type { ReactNode } from "react";

export type { Cita, EstadoCita };

interface Props {
  cita: Cita;
  modo?: "confirmacion" | "lista" | "admin";
  mostrarQR?: boolean;
}

export default function TarjetaCita({ cita, modo = "confirmacion" }: Props) {
  const t = useTranslations("agendar.tarjeta");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";

  const fmtHoraHumana = (hhmm: string): string => {
    if (!hhmm) return "";
    const limpio = hhmm.replace(/(a\.?m\.?|p\.?m\.?)/gi, "").trim();
    const [hStr, mStr] = limpio.split(":");
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

  const fmtFecha = (fecha: string): string => {
    try {
      return new Date(fecha + "T12:00:00").toLocaleDateString(intlLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch { return fecha; }
  };

  const STEPS = [
    { label: t("steps.pendiente"), key: "pendiente", icon: <Clock size={14} /> },
    { label: t("steps.confirmada"), key: "confirmada", icon: <CheckCircle2 size={14} /> },
    { label: t("steps.atendida"), key: "atendida", icon: <FileText size={14} /> },
  ];

  const estados: EstadoCita[] = ["pendiente", "confirmada", "atendida"];
  const idx = estados.indexOf(cita.estado);
  const progreso = idx === -1 ? 1 : idx + 1;

  let metodoPagoTxt = "";
  if (cita.metodoPago === "Consultorio") {
    metodoPagoTxt = `${t("rows.paymentOnsite")} (${cita.tipoPagoConsultorio ?? "Efectivo"})`;
  } else if (cita.metodoPago === "Online") {
    metodoPagoTxt = `${t("rows.paymentOnline")} (${cita.tipoPagoOnline ?? ""})`;
  }

  return (
    <motion.div
      className="dark-aware-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}
    >
      <div style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 16px 48px rgba(78,59,43,0.1)", overflow: "hidden" }}>

        {/* Top accent */}
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--brand), #C9AD8D)" }} />

        <div style={{ padding: "2rem 2rem 2.5rem" }}>

          {/* Title */}
          <div style={{ textAlign: "left", marginBottom: "1.8rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(176,137,104,0.25)" }}>
              <CheckCircle2 size={22} color="white" />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.15rem" }}>
                {modo === "confirmacion" ? t("titleConfirm") : t("titleList")}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{t("subtitle")}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", padding: "0 0.5rem" }}>
            {STEPS.map((s, i) => {
              const active = i < progreso;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: active ? 1 : 0.85 }}
                      style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "linear-gradient(135deg, var(--brand), var(--brand-soft))" : "var(--border)",
                        color: active ? "white" : "#9B8575", boxShadow: active ? "0 2px 8px rgba(176,137,104,0.3)" : "none",
                        transition: "all 0.4s" }}>
                      {s.icon}
                    </motion.div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: active ? "var(--text)" : "#9B8575", whiteSpace: "nowrap" }}>{s.label}</span>
                  </div>
                  {!isLast && <div style={{ flex: 1, height: 3, borderRadius: 2, margin: "0 6px", marginBottom: 18, background: progreso > i + 1 ? "linear-gradient(90deg, var(--brand), #C9AD8D)" : "var(--border)", transition: "all 0.4s" }} />}
                </div>
              );
            })}
          </div>

          {/* Info rows — grid 2 columnas en desktop, 1 en móvil */}
          <div className="tarjeta-cita-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            <InfoRow icon={<Calendar size={15} color="var(--brand)" />} label={t("rows.date")} value={fmtFecha(cita.fecha)} />
            <InfoRow icon={<Clock size={15} color="var(--brand)" />} label={t("rows.time")} value={fmtHoraHumana(cita.hora)} />
            <InfoRow icon={<User size={15} color="var(--brand)" />} label={t("rows.patient")} value={`${cita.nombres} ${cita.apellidos || ""}`} />
            <InfoRow icon={<FileText size={15} color="var(--brand)" />} label={t("rows.procedure")} value={cita.procedimiento} />
            {cita.telefono && <InfoRow icon={<Phone size={15} color="var(--brand)" />} label={t("rows.phone")} value={cita.telefono} />}
            {cita.correo && <InfoRow icon={<Mail size={15} color="var(--brand)" />} label={t("rows.email")} value={cita.correo} />}
            {metodoPagoTxt && <InfoRow icon={<CreditCard size={15} color="var(--brand)" />} label={t("rows.payment")} value={metodoPagoTxt} />}
            {cita.nota && <InfoRow icon={<FileText size={15} color="var(--brand)" />} label={t("rows.note")} value={cita.nota} fullWidth />}
          </div>
          <style>{`
            @media (max-width: 700px) {
              .tarjeta-cita-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* Footer message */}
          <div className="tarjeta-cita-footer-msg" style={{ marginTop: "1.5rem", padding: "1rem", background: "linear-gradient(135deg, #FFFBF7, #F0E5D8)", borderRadius: 14, border: "1px solid rgba(176,137,104,0.1)", textAlign: "center" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", margin: 0 }}>
              <i className="fas fa-info-circle" style={{ marginRight: 6, color: "var(--brand)" }} />
              {t("footerInfo")}
            </p>
          </div>

          {/* Cita number */}
          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.72rem", color: "#9B8575" }}>
            {t("appointmentNumber")}{String(cita.id).slice(0, 8)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value, fullWidth }: { icon: ReactNode; label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className="tarjeta-cita-row dark-aware-panel" style={{ display: "flex", alignItems: "flex-start", gap: "0.8rem", padding: "0.55rem 0.8rem", borderRadius: 12, background: "#FDFBF8", border: "1px solid rgba(176,137,104,0.06)", textAlign: "left", gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ textAlign: "left" }}>
        <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <p style={{ fontSize: "0.9rem", color: "var(--text)", fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}
