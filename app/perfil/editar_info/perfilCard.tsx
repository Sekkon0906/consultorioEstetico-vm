"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import DatosPersonalesForm from "./datosPersonalesForm";
import DatosMedicosForm from "./datosMedicosForm";
import { useEditarInfo } from "./useEditarInfo";

export default function PerfilCard() {
  const t = useTranslations("perfil.edit");
  const {
    user, saving, message,
    nombres, setNombres, apellidos, setApellidos, telefono, setTelefono,
    edad, setEdad, genero, setGenero,
    antecedentes, setAntecedentes, alergias, setAlergias, medicamentos, setMedicamentos,
    antecedentesDescripcion, setAntecedentesDescripcion,
    alergiasDescripcion, setAlergiasDescripcion,
    medicamentosDescripcion, setMedicamentosDescripcion,
    handleSavePersonal, handleSaveMedical, canEdit, daysRemaining,
  } = useEditarInfo();

  const initial = (nombres || "").charAt(0).toUpperCase() + (apellidos || "").charAt(0).toUpperCase();

  return (
    <motion.div className="dark-aware-card" initial={{ y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ background: "var(--bg-elevated)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 12px 40px rgba(78,59,43,0.08)", overflow: "hidden" }}>

      <div style={{ height: 4, background: "linear-gradient(90deg, var(--brand), #C9AD8D)" }} />

      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-contrast)", fontSize: "1.2rem", fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 12px rgba(176,137,104,0.25)" }}>
            {initial || "?"}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{t("title")}</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{user?.email || ""}</p>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div initial={{ y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              style={{ padding: "0.7rem 1rem", borderRadius: 12, marginBottom: "1rem", fontSize: "0.88rem", textAlign: "center",
                background: message.includes("Error") || message.includes("error") ? "#FDE8D8" : "#E8F5E9",
                color: message.includes("Error") || message.includes("error") ? "#922B21" : "#145A32",
              }}>{message}</motion.div>
          )}
        </AnimatePresence>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="dark-aware-panel" style={{ background: "var(--surface-soft)", borderRadius: 18, padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.05rem", marginBottom: "1rem" }}>{t("personalSection")}</h4>
              <DatosPersonalesForm
                nombres={nombres} apellidos={apellidos} telefono={telefono} edad={edad} genero={genero}
                setNombres={setNombres} setApellidos={setApellidos} setTelefono={setTelefono} setEdad={setEdad} setGenero={setGenero}
                canEdit={canEdit}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="dark-aware-panel" style={{ background: "#EEF7EE", borderRadius: 18, padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, color: "var(--success)", fontSize: "1.05rem", marginBottom: "1rem" }}>{t("medicalSection")}</h4>
              <DatosMedicosForm
                antecedentes={antecedentes} alergias={alergias} medicamentos={medicamentos}
                setAntecedentes={setAntecedentes} setAlergias={setAlergias} setMedicamentos={setMedicamentos}
                antecedentesDescripcion={antecedentesDescripcion} alergiasDescripcion={alergiasDescripcion} medicamentosDescripcion={medicamentosDescripcion}
                setAntecedentesDescripcion={setAntecedentesDescripcion} setAlergiasDescripcion={setAlergiasDescripcion} setMedicamentosDescripcion={setMedicamentosDescripcion}
                canEdit={canEdit}
              />
            </div>
          </div>
        </div>

        {/* Botón único: guarda datos personales + médicos */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <motion.button
            whileHover={canEdit && !saving ? { scale: 1.04 } : {}}
            whileTap={canEdit && !saving ? { scale: 0.97 } : {}}
            onClick={async () => { await handleSavePersonal(); await handleSaveMedical(); }}
            disabled={!canEdit || saving}
            style={{ padding: "0.85rem 2.5rem", borderRadius: 100, background: canEdit && !saving ? "linear-gradient(135deg, var(--brand-deep), #B08968)" : "var(--border)", color: canEdit && !saving ? "white" : "#9B8575", border: "none", fontWeight: 700, fontSize: "1rem", cursor: canEdit && !saving ? "pointer" : "not-allowed", boxShadow: canEdit && !saving ? "0 6px 18px rgba(176,137,104,0.3)" : "none" }}
          >
            {saving ? t("saving") : t("save")}
          </motion.button>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "1.2rem" }}>
          {canEdit ? t("canEditHint") : t("cantEditHint", { days: daysRemaining })}
        </p>
      </div>
    </motion.div>
  );
}