"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Cita } from "./helpers";
import { updateCitaAPI } from "./helpers";

interface Props {
  cita: Cita;
  onClose: () => void;
}

export default function CitasAgendadasEditor({
  cita: citaInicial,
  onClose,
}: Props) {
  const [form, setForm] = useState({ ...citaInicial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateCitaAPI(citaInicial.id, {
        fecha: form.fecha,
        hora: form.hora,
        estado: form.estado,
        nota: form.nota,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const ESTADOS = ["pendiente", "confirmada", "atendida", "cancelada"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-6 rounded-4 shadow-lg w-100 border"
      style={{ borderColor: "#E5D8C8", maxWidth: 560 }}
    >
      <h2
        className="fw-bold text-center mb-4"
        style={{ color: "#7A5534" }}
      >
        Reagendar / Editar Cita
      </h2>

      {error && (
        <div
          className="alert alert-danger py-2 px-3 mb-3"
          style={{ fontSize: "0.88rem" }}
        >
          {error}
        </div>
      )}
      {saved && (
        <div
          className="alert alert-success py-2 px-3 mb-3"
          style={{ fontSize: "0.88rem" }}
        >
          Cambios guardados correctamente
        </div>
      )}

      <div className="d-flex flex-column gap-3">
        <div>
          <label
            className="form-label small fw-semibold"
            style={{ color: "#6E5A49" }}
          >
            Procedimiento
          </label>
          <input
            name="procedimiento"
            className="form-control"
            value={form.procedimiento}
            onChange={handleChange}
            style={{
              borderColor: "#E5D8C8",
              backgroundColor: "#FFFDF9",
            }}
          />
        </div>
        <div className="d-flex gap-3">
          <div className="flex-1">
            <label
              className="form-label small fw-semibold"
              style={{ color: "#6E5A49" }}
            >
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              className="form-control"
              value={form.fecha?.slice(0, 10)}
              onChange={handleChange}
              style={{
                borderColor: "#E5D8C8",
                backgroundColor: "#FFFDF9",
              }}
            />
          </div>
          <div className="flex-1">
            <label
              className="form-label small fw-semibold"
              style={{ color: "#6E5A49" }}
            >
              Hora
            </label>
            <input
              name="hora"
              className="form-control"
              placeholder="ej: 10:00 AM"
              value={form.hora}
              onChange={handleChange}
              style={{
                borderColor: "#E5D8C8",
                backgroundColor: "#FFFDF9",
              }}
            />
          </div>
        </div>
        <div>
          <label
            className="form-label small fw-semibold"
            style={{ color: "#6E5A49" }}
          >
            Estado
          </label>
          <select
            name="estado"
            className="form-select"
            value={form.estado}
            onChange={handleChange}
            style={{
              borderColor: "#E5D8C8",
              backgroundColor: "#FFFDF9",
            }}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="form-label small fw-semibold"
            style={{ color: "#6E5A49" }}
          >
            Nota
          </label>
          <textarea
            name="nota"
            className="form-control"
            rows={3}
            value={form.nota ?? ""}
            onChange={handleChange}
            style={{
              borderColor: "#E5D8C8",
              backgroundColor: "#FFFDF9",
            }}
          />
        </div>
      </div>

      <div className="d-flex gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="btn rounded-pill fw-semibold flex-1"
          style={{
            backgroundColor: "#8B6A4B",
            color: "#fff",
            border: "none",
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          onClick={onClose}
          className="btn rounded-pill fw-semibold"
          style={{
            backgroundColor: "#E9DED2",
            color: "#4E3B2B",
            border: "none",
          }}
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}
