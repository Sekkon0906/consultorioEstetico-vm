"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  getTestimoniosApi,
  createTestimonioApi,
  updateTestimonioApi,
  deleteTestimonioApi,
} from "../../services/testimoniosApi";
import type { Testimonio } from "../../types/domain";

const emptyForm = { nombre: "", texto: "", video: "", thumb: "" };

export default function TestimoniosList() {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [modo, setModo] = useState<"lista" | "crear" | "editar">("lista");
  const [actual, setActual] = useState<Testimonio | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);

  const loadTestimonios = () => {
    getTestimoniosApi()
      .then((data) => setTestimonios(data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadTestimonios();
  }, []);

  /* -- Subir thumbnail al bucket "testimonios" -- */
  const handleThumbUpload = async (file: File) => {
    setUploadingThumb(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("testimonios")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage
        .from("testimonios")
        .getPublicUrl(path);
      setForm((prev) => ({ ...prev, thumb: data.publicUrl }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError("Error subiendo imagen: " + msg);
    } finally {
      setUploadingThumb(false);
    }
  };

  /* -- Guardar -- */
  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.texto.trim()) {
      setError("Nombre y texto son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (modo === "crear") {
        await createTestimonioApi({
          nombre: form.nombre,
          texto: form.texto,
          video: form.video,
          thumb: form.thumb,
          activo: true,
          destacado: false,
        });
      } else if (actual) {
        await updateTestimonioApi(actual.id, {
          nombre: form.nombre,
          texto: form.texto,
          video: form.video,
          thumb: form.thumb,
        });
      }
      loadTestimonios();
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* -- Toggle activo / destacado -- */
  const handleToggle = async (
    t: Testimonio,
    campo: "activo" | "destacado"
  ) => {
    try {
      await updateTestimonioApi(t.id, { [campo]: !t[campo] });
      loadTestimonios();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    }
  };

  /* -- Eliminar -- */
  const handleEliminar = async (id: number) => {
    try {
      await deleteTestimonioApi(id);
      setConfirmEliminar(null);
      loadTestimonios();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setModo("lista");
    setActual(null);
  };
  const startEditar = (t: Testimonio) => {
    setActual(t);
    setForm({
      nombre: t.nombre,
      texto: t.texto,
      video: t.video,
      thumb: t.thumb,
    });
    setModo("editar");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: "#4E3B2B" }}>
          Testimonios
        </h2>
        {modo === "lista" && (
          <button
            onClick={() => setModo("crear")}
            className="btn rounded-pill px-4"
            style={{
              backgroundColor: "#8B6A4B",
              color: "#fff",
              border: "none",
            }}
          >
            + Nuevo testimonio
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">{error}</div>
      )}

      {/* FORMULARIO */}
      <AnimatePresence>
        {(modo === "crear" || modo === "editar") && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="card border-0 rounded-4 shadow-sm p-4 mb-5"
            style={{ backgroundColor: "#FFFDF9" }}
          >
            <h4 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>
              {modo === "crear" ? "Nuevo testimonio" : "Editar testimonio"}
            </h4>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Nombre del paciente *
                </label>
                <input
                  className="form-control"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  URL del video (YouTube)
                </label>
                <input
                  className="form-control"
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.video}
                  onChange={(e) =>
                    setForm({ ...form, video: e.target.value })
                  }
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Testimonio *
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={form.texto}
                  onChange={(e) =>
                    setForm({ ...form, texto: e.target.value })
                  }
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Foto (thumbnail)
                </label>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    style={{ maxWidth: 280, borderColor: "#E9DED2" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleThumbUpload(f);
                    }}
                  />
                  {uploadingThumb && (
                    <div
                      className="spinner-border spinner-border-sm"
                      style={{ color: "#B08968" }}
                      role="status"
                    />
                  )}
                  {form.thumb && !uploadingThumb && (
                    <img
                      src={form.thumb}
                      alt="thumb"
                      style={{
                        height: 56,
                        width: 56,
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "1px solid #E9DED2",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="d-flex gap-3 mt-4">
              <button
                onClick={handleGuardar}
                disabled={saving || uploadingThumb}
                className="btn rounded-pill fw-semibold flex-1"
                style={{
                  backgroundColor: "#8B6A4B",
                  color: "#fff",
                  border: "none",
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={resetForm}
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
        )}
      </AnimatePresence>

      {/* LISTA */}
      {testimonios.length === 0 ? (
        <p className="text-center py-5" style={{ color: "#8B7060" }}>
          No hay testimonios aun.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {testimonios.map((t) => (
            <div
              key={t.id}
              className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row align-items-start gap-3"
              style={{ backgroundColor: "#FFFDF9" }}
            >
              {t.thumb && (
                <img
                  src={t.thumb}
                  alt={t.nombre}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid #E9DED2",
                    flexShrink: 0,
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="fw-bold mb-1" style={{ color: "#4E3B2B" }}>
                  {t.nombre}
                </p>
                <p
                  className="small mb-1 text-truncate"
                  style={{ color: "#6C584C" }}
                >
                  &quot;{t.texto}&quot;
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggle(t, "activo")}
                    className="btn btn-xs rounded-pill px-2 py-1"
                    style={{
                      fontSize: "0.72rem",
                      backgroundColor: t.activo ? "#D8F3DC" : "#F5EEE6",
                      color: t.activo ? "#2D6A4F" : "#8B7060",
                      border: "none",
                    }}
                  >
                    {t.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => handleToggle(t, "destacado")}
                    className="btn btn-xs rounded-pill px-2 py-1"
                    style={{
                      fontSize: "0.72rem",
                      backgroundColor: t.destacado ? "#FFF3E6" : "#F5EEE6",
                      color: t.destacado ? "#B08968" : "#8B7060",
                      border: "none",
                    }}
                  >
                    {t.destacado ? "Destacado" : "Normal"}
                  </button>
                </div>
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEditar(t)}
                  className="btn btn-sm rounded-pill"
                  style={{
                    backgroundColor: "#E9DED2",
                    color: "#4E3B2B",
                    border: "none",
                  }}
                >
                  Editar
                </button>
                {confirmEliminar === t.id ? (
                  <div className="d-flex gap-1">
                    <button
                      onClick={() => handleEliminar(t.id)}
                      className="btn btn-sm rounded-pill"
                      style={{
                        backgroundColor: "#b02e2e",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmEliminar(null)}
                      className="btn btn-sm rounded-pill"
                      style={{
                        backgroundColor: "#E9DED2",
                        color: "#4E3B2B",
                        border: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmEliminar(t.id)}
                    className="btn btn-sm rounded-pill"
                    style={{
                      backgroundColor: "#fff3ef",
                      color: "#b02e2e",
                      border: "1px solid #e4bfbf",
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
