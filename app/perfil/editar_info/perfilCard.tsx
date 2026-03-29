"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PALETTE } from "./palette";
import FotoPerfil from "./fotoPerfil";
import DatosPersonalesForm from "./datosPersonalesForm";
import DatosMedicosForm from "./datosMedicosForm";
import { useEditarInfo } from "./useEditarInfo";

export default function PerfilCard() {
  const {
    user,
    saving,
    message,
    nombres, setNombres,
    apellidos, setApellidos,
    telefono, setTelefono,
    edad, setEdad,
    genero, setGenero,
    photo, setPhoto,
    antecedentes, setAntecedentes,
    alergias, setAlergias,
    medicamentos, setMedicamentos,
    antecedentesDescripcion, setAntecedentesDescripcion,
    alergiasDescripcion, setAlergiasDescripcion,
    medicamentosDescripcion, setMedicamentosDescripcion,
    handleSavePersonal,
    handleSaveMedical,
    canEdit,
    daysRemaining,
  } = useEditarInfo();

  return (
    <motion.div
      className="card rounded-4 shadow-lg p-4"
      style={{ border: "none", backgroundColor: PALETTE.surface }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <FotoPerfil
        photo={photo}
        email={user?.email}
        canEdit={canEdit}
        setPhoto={setPhoto}
      />

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <div
              className="alert text-center"
              style={{
                backgroundColor: message.startsWith("") ? "#f8d7da" : PALETTE.main,
                color: message.startsWith("") ? "#721c24" : "white",
                border: "none",
              }}
            >
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="row g-4">
        <div className="col-md-6">
          <DatosPersonalesForm
            nombres={nombres}
            apellidos={apellidos}
            telefono={telefono}
            edad={edad}
            genero={genero}
            setNombres={setNombres}
            setApellidos={setApellidos}
            setTelefono={setTelefono}
            setEdad={setEdad}
            setGenero={setGenero}
            canEdit={canEdit}
          />
          <div className="text-center mt-3">
            <button
              onClick={handleSavePersonal}
              disabled={!canEdit || saving}
              className="btn text-white fw-semibold px-4 py-2 rounded-3 shadow-sm"
              style={{ backgroundColor: PALETTE.main, opacity: canEdit && !saving ? 1 : 0.6 }}
            >
              {saving ? "Guardando…" : "Guardar datos personales"}
            </button>
          </div>
        </div>

        <div className="col-md-6">
          <DatosMedicosForm
            antecedentes={antecedentes}
            alergias={alergias}
            medicamentos={medicamentos}
            setAntecedentes={setAntecedentes}
            setAlergias={setAlergias}
            setMedicamentos={setMedicamentos}
            antecedentesDescripcion={antecedentesDescripcion}
            alergiasDescripcion={alergiasDescripcion}
            medicamentosDescripcion={medicamentosDescripcion}
            setAntecedentesDescripcion={setAntecedentesDescripcion}
            setAlergiasDescripcion={setAlergiasDescripcion}
            setMedicamentosDescripcion={setMedicamentosDescripcion}
            canEdit={canEdit}
          />
          <div className="text-center mt-3">
            <button
              onClick={handleSaveMedical}
              disabled={!canEdit || saving}
              className="btn text-white fw-semibold px-4 py-2 rounded-3 shadow-sm"
              style={{ backgroundColor: PALETTE.main, opacity: canEdit && !saving ? 1 : 0.6 }}
            >
              {saving ? "Guardando…" : "Guardar datos médicos"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-muted text-center mt-3" style={{ fontSize: "0.85rem" }}>
        {canEdit
          ? "Puedes actualizar tu información cuando quieras."
          : `Vuelve en ${daysRemaining} día(s) para modificar tus datos.`}
      </p>
    </motion.div>
  );
}