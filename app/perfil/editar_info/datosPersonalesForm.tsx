"use client";

import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-start"
    >
      <h5 className="fw-semibold mb-3" style={{ color: PALETTE.main }}>
        Datos personales
      </h5>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Nombres
        </label>
        <input
          value={nombres}
          onChange={(e) => setNombres(e.target.value)}
          className="form-control rounded-3 shadow-sm"
          disabled={!canEdit}
          style={{ borderColor: PALETTE.border }}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Apellidos
        </label>
        <input
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
          className="form-control rounded-3 shadow-sm"
          disabled={!canEdit}
          style={{ borderColor: PALETTE.border }}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Teléfono
        </label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="form-control rounded-3 shadow-sm"
          disabled={!canEdit}
          style={{ borderColor: PALETTE.border }}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Edad
        </label>
        <input
          type="number"
          value={edad}
          onChange={(e) => setEdad(Number(e.target.value))}
          className="form-control rounded-3 shadow-sm"
          disabled={!canEdit}
          style={{ borderColor: PALETTE.border }}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Género
        </label>
        <select
          value={genero}
          onChange={(e) => setGenero(e.target.value as "Masculino" | "Femenino" | "Otro")}
          className="form-select rounded-3 shadow-sm"
          disabled={!canEdit}
          style={{ borderColor: PALETTE.border }}
        >
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
    </motion.div>
  );
}
