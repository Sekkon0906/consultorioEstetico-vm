"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
// Nota: asegúrate de tener instalado react-datepicker:
//   npm install react-datepicker @types/react-datepicker
// El CSS se importa globalmente en globals.css para evitar el error de módulo:
//   @import 'react-datepicker/dist/react-datepicker.css';
import { PALETTE } from "./palette";

interface Props {
  nombres: string;
  apellidos: string;
  telefono: string;
  edad: number;
  genero: string;
  setNombres: (v: string) => void;
  setApellidos: (v: string) => void;
  setTelefono: (v: string) => void;
  setGenero: (v: "Masculino" | "Femenino" | "Otro") => void;
  setEdad: (v: number) => void;
  canEdit: boolean;
}

const inputStyle = (borderColor: string): React.CSSProperties => ({
  borderColor,
  borderRadius: "0.5rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  padding: "0.45rem 0.75rem",
  border: `1px solid ${borderColor}`,
  width: "100%",
  outline: "none",
  fontSize: "0.9rem",
  background: "#FFFCF8",
});

export default function DatosPersonalesForm({
  nombres,
  apellidos,
  telefono,
  edad,
  genero,
  setNombres,
  setApellidos,
  setTelefono,
  setGenero,
  setEdad,
  canEdit,
}: Props) {
  const t = useTranslations("perfil.edit.personal");
  const border = PALETTE.border ?? "#D4A97A";
  const text   = PALETTE.text  ?? "#4E3B2B";

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.3rem",
    color: text,
    fontSize: "0.85rem",
  };

  const fieldClass = "mb-3";

  return (
    <motion.div
      initial={{ y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: "start" }}
    >

      <div className={fieldClass}>
        <label style={labelStyle}>{t("names")}</label>
        <input
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          disabled={!canEdit}
          style={inputStyle(border)}
        />
      </div>

      <div className={fieldClass}>
        <label style={labelStyle}>{t("lastNames")}</label>
        <input
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          disabled={!canEdit}
          style={inputStyle(border)}
        />
      </div>

      <div className={fieldClass}>
        <label style={labelStyle}>{t("phone")}</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          disabled={!canEdit}
          style={inputStyle(border)}
        />
      </div>

      <div className={fieldClass}>
        <label style={labelStyle}>{t("age")}</label>
        <input
          type="number"
          value={edad || ""}
          onChange={(e) => setEdad(Number(e.target.value) || 0)}
          placeholder={t("agePlaceholder")}
          disabled={!canEdit}
          style={inputStyle(border)}
        />
      </div>

      <div className={fieldClass}>
        <label style={labelStyle}>{t("gender")}</label>
        <select
          value={genero}
          onChange={(e) =>
            setGenero(e.target.value as "Masculino" | "Femenino" | "Otro")
          }
          disabled={!canEdit}
          style={inputStyle(border)}
        >
          <option value="Masculino">{t("genderMale")}</option>
          <option value="Femenino">{t("genderFemale")}</option>
          <option value="Otro">{t("genderOther")}</option>
        </select>
      </div>
    </motion.div>
  );
}
