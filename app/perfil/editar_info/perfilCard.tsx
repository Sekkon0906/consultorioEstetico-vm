"use client";

import { motion, AnimatePresence } from "framer-motion";
import DatosPersonalesForm from "./datosPersonalesForm";
import DatosMedicosForm from "./datosMedicosForm";
import { useEditarInfo } from "./useEditarInfo";

export default function PerfilCard() {
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
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 12px 40px rgba(78,59,43,0.08)", overflow: "hidden" }}>

      <div style={{ height: 4, background: "linear-gradient(90deg, #B08968, #C9AD8D)" }} />

      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.2rem", fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 12px rgba(176,137,104,0.25)" }}>
            {initial || "?"}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#3A2A1A", margin: 0 }}>Mi perfil</h2>
            <p style={{ fontSize: "0.82rem", color: "#8A7565", margin: 0 }}>{user?.email || ""}</p>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              style={{ padding: "0.7rem 1rem", borderRadius: 12, marginBottom: "1rem", fontSize: "0.88rem", textAlign: "center",
                background: message.includes("Error") || message.includes("error") ? "#FDE8D8" : "#E8F5E9",
                color: message.includes("Error") || message.includes("error") ? "#922B21" : "#145A32",
              }}>{message}</motion.div>
          )}
        </AnimatePresence>

        <div className="row g-4">
          <div className="col-md-6">
            <div style={{ background: "#F5EEE6", borderRadius: 18, padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, color: "#3A2A1A", fontSize: "1.05rem", marginBottom: "1rem" }}>Datos personales</h4>
              <DatosPersonalesForm
                nombres={nombres} apellidos={apellidos} telefono={telefono} edad={edad} genero={genero}
                setNombres={setNombres} setApellidos={setApellidos} setTelefono={setTelefono} setEdad={setEdad} setGenero={setGenero}
                canEdit={canEdit}
              />
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSavePersonal} disabled={!canEdit || saving}
                  style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: canEdit && !saving ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "#E9DED2", color: canEdit && !saving ? "white" : "#9B8575", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: canEdit && !saving ? "pointer" : "not-allowed" }}>
                  {saving ? "Guardando..." : "Guardar datos personales"}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div style={{ background: "#EEF7EE", borderRadius: 18, padding: "1.5rem" }}>
              <h4 style={{ fontWeight: 700, color: "#2D6A4F", fontSize: "1.05rem", marginBottom: "1rem" }}>Datos medicos</h4>
              <DatosMedicosForm
                antecedentes={antecedentes} alergias={alergias} medicamentos={medicamentos}
                setAntecedentes={setAntecedentes} setAlergias={setAlergias} setMedicamentos={setMedicamentos}
                antecedentesDescripcion={antecedentesDescripcion} alergiasDescripcion={alergiasDescripcion} medicamentosDescripcion={medicamentosDescripcion}
                setAntecedentesDescripcion={setAntecedentesDescripcion} setAlergiasDescripcion={setAlergiasDescripcion} setMedicamentosDescripcion={setMedicamentosDescripcion}
                canEdit={canEdit}
              />
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveMedical} disabled={!canEdit || saving}
                  style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: canEdit && !saving ? "linear-gradient(135deg, #2D6A4F, #43A047)" : "#E9DED2", color: canEdit && !saving ? "white" : "#9B8575", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: canEdit && !saving ? "pointer" : "not-allowed" }}>
                  {saving ? "Guardando..." : "Guardar datos medicos"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#8A7565", marginTop: "1.2rem" }}>
          {canEdit ? "Puedes actualizar tu informacion cuando quieras." : `Vuelve en ${daysRemaining} dia(s) para modificar tus datos.`}
        </p>
      </div>
    </motion.div>
  );
}