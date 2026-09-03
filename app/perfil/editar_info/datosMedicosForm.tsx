"use client";

import { motion, AnimatePresence } from "framer-motion";
import Select, { MultiValue } from "react-select";
import { useTranslations } from "next-intl";
import { PALETTE } from "./palette";

interface Opcion {
  value: string;
  label: string;
}

interface Props {
  antecedentes: MultiValue<Opcion>;
  alergias: MultiValue<Opcion>;
  medicamentos: MultiValue<Opcion>;
  setAntecedentes: (v: MultiValue<Opcion>) => void;
  setAlergias: (v: MultiValue<Opcion>) => void;
  setMedicamentos: (v: MultiValue<Opcion>) => void;
  antecedentesDescripcion: string;
  alergiasDescripcion: string;
  medicamentosDescripcion: string;
  setAntecedentesDescripcion: (v: string) => void;
  setAlergiasDescripcion: (v: string) => void;
  setMedicamentosDescripcion: (v: string) => void;
  canEdit: boolean;
}

export default function DatosMedicosForm({
  antecedentes,
  alergias,
  medicamentos,
  setAntecedentes,
  setAlergias,
  setMedicamentos,
  antecedentesDescripcion,
  alergiasDescripcion,
  medicamentosDescripcion,
  setAntecedentesDescripcion,
  setAlergiasDescripcion,
  setMedicamentosDescripcion,
  canEdit,
}: Props) {
  const t = useTranslations("perfil.edit.medical");
  const selectStyles = {
    control: (p: Record<string, unknown>) => ({
      ...p,
      borderColor: PALETTE.border,
      boxShadow: "none",
      minHeight: "44px",
      borderRadius: 12,
    }),
  };

  const ANTECEDENTES: Opcion[] = [
    { value: "Hipertensión", label: t("options.hipertension") },
    { value: "Diabetes", label: t("options.diabetes") },
    { value: "Asma", label: t("options.asma") },
    { value: "Cirugías previas", label: t("options.cirugias") },
    { value: "Otra condición", label: t("options.otraCondicion") },
    { value: "No tengo", label: t("options.noTengo") },
  ];
  const ALERGIAS: Opcion[] = [
    { value: "Penicilina", label: t("options.penicilina") },
    { value: "Polen", label: t("options.polen") },
    { value: "Lácteos", label: t("options.lacteos") },
    { value: "Otra alergia", label: t("options.otraAlergia") },
    { value: "No tengo", label: t("options.noTengo") },
  ];
  const MEDICAMENTOS: Opcion[] = [
    { value: "Ibuprofeno", label: t("options.ibuprofeno") },
    { value: "Insulina", label: t("options.insulina") },
    { value: "Otro medicamento", label: t("options.otroMedicamento") },
    { value: "No tengo", label: t("options.noTengo") },
  ];

  const renderCampo = (
    titulo: string,
    valor: MultiValue<Opcion>,
    setValor: (v: MultiValue<Opcion>) => void,
    desc: string,
    setDesc: (v: string) => void,
    opcionesLista: Opcion[]
  ) => {
    const tieneNoTengo = valor.some((x) => x.value === "No tengo");

    // Re-mapear los `value` cargados desde BD a sus labels traducidos.
    const valorLocalizado = valor.map((v) => {
      const match = opcionesLista.find((o) => o.value === v.value);
      return match ?? v;
    });

    return (
      <div className="mb-3 text-start">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          {titulo}
        </label>
        <Select
          isMulti
          options={opcionesLista}
          value={valorLocalizado}
          onChange={(v) => setValor(v as MultiValue<Opcion>)}
          styles={selectStyles}
          classNamePrefix="react-select"
          placeholder={`${t("selectPrefix")} ${titulo.toLowerCase()}...`}
          isDisabled={!canEdit}
        />
        <AnimatePresence>
          {!tieneNoTengo && valor.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              style={{ overflow: "hidden" }}
            >
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="form-control mt-2 rounded-3 shadow-sm"
                placeholder={t("descriptionPlaceholder")}
                disabled={!canEdit}
                style={{
                  borderColor: PALETTE.border,
                  backgroundColor: PALETTE.surface,
                  minHeight: 80,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div initial={{ y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {renderCampo(
        t("background"),
        antecedentes,
        setAntecedentes,
        antecedentesDescripcion,
        setAntecedentesDescripcion,
        ANTECEDENTES
      )}

      {renderCampo(
        t("allergies"),
        alergias,
        setAlergias,
        alergiasDescripcion,
        setAlergiasDescripcion,
        ALERGIAS
      )}

      {renderCampo(
        t("medications"),
        medicamentos,
        setMedicamentos,
        medicamentosDescripcion,
        setMedicamentosDescripcion,
        MEDICAMENTOS
      )}
    </motion.div>
  );
}
