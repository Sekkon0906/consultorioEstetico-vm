"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, Calendar } from "lucide-react";
import { getCharlasApi, createCharlaApi, updateCharlaApi, deleteCharlaApi } from "@/services/charlasApi";
import { subirImagenApi } from "@/services/uploadsApi";

interface Charla {
  id: string;
  titulo: string;
  descripcion: string;
  detalle: string;
  imagen: string;
  galeria?: string[];
  fecha?: string;
}

const emptyForm = {
  titulo: "",
  descripcion: "",
  detalle: "",
  imagen: "",
  galeria: [] as string[],
  fecha: "",
};

export default function CharlasList() {
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [modo, setModo] = useState<"lista" | "crear" | "editar">("lista");
  const [actual, setActual] = useState<Charla | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEliminarId, setConfirmEliminarId] = useState<string | null>(null);

  const loadCharlas = async () => {
    try {
      const data = await getCharlasApi(); // ya trae la galería agregada
      setCharlas(
        data.map((c) => ({
          id: String(c.id),
          titulo: c.titulo,
          descripcion: c.descripcion,
          detalle: c.detalle ?? "",
          imagen: c.imagen ?? "",
          fecha: c.fecha ?? "",
          galeria: (c.galeria ?? []).map((g) => g.url),
        }))
      );
    } catch (err) {
      console.error("Error cargando charlas:", err);
    }
  };

  useEffect(() => {
    loadCharlas();
  }, []);

  /* -- Imagen principal -> R2 -- */
  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    setError(null);
    try {
      const url = await subirImagenApi(file, "charlas");
      setForm((prev) => ({ ...prev, imagen: url }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError("Error subiendo imagen: " + msg);
    } finally {
      setUploadingImg(false);
    }
  };

  /* -- Galeria -> R2 -- */
  const handleGaleriaUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const url = await subirImagenApi(file, "charlas");
        setForm((prev) => ({ ...prev, galeria: [...prev.galeria, url] }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError("Error subiendo galeria: " + msg);
      }
    }
  };

  /* -- Guardar -- */
  const handleGuardar = async () => {
    if (
      !form.titulo.trim() ||
      !form.descripcion.trim() ||
      !form.detalle.trim()
    ) {
      setError("Titulo, descripcion y detalle son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        detalle: form.detalle,
        imagen: form.imagen || "",
        fecha: form.fecha || null,
        // El backend reemplaza charla_galeria entera con este array.
        galeria: form.galeria,
      };
      if (modo === "crear") {
        await createCharlaApi(payload);
      } else if (actual) {
        await updateCharlaApi(actual.id, payload);
      }
      loadCharlas();
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* -- Eliminar -- */
  const handleEliminar = async (id: string) => {
    setConfirmEliminarId(null);
    try {
      await deleteCharlaApi(id);
      loadCharlas();
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
  const startEditar = (c: Charla) => {
    setActual(c);
    setForm({
      titulo: c.titulo,
      descripcion: c.descripcion,
      detalle: c.detalle,
      imagen: c.imagen,
      galeria: c.galeria || [],
      fecha: c.fecha || "",
    });
    setModo("editar");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: "var(--text)" }}>
          Formacion / Charlas
        </h2>
        {modo === "lista" && (
          <button
            onClick={() => setModo("crear")}
            className="btn rounded-pill px-4"
            style={{
              backgroundColor: "var(--brand)",
              color: "#fff",
              border: "none",
            }}
          >
            + Nueva charla
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">{error}</div>
      )}

      {/* CONFIRMAR ELIMINAR (pt 17/18 — sin confirm() nativo) */}
      <AnimatePresence>
        {confirmEliminarId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmEliminarId(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999, display: "flex",
              alignItems: "center", justifyContent: "center", padding: "1rem",
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-4 shadow-lg p-4 text-center"
              style={{ maxWidth: 360, width: "100%" }}
            >
              <h5 className="fw-bold mb-2" style={{ color: "#6B4E3D" }}>
                Â¿Eliminar esta charla?
              </h5>
              <p className="mb-4" style={{ color: "#8d7a6a", fontSize: "0.9rem" }}>
                Esta acción no se puede deshacer.
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn flex-fill rounded-pill"
                  style={{ background: "var(--surface-soft)", color: "#4B3A2E", fontWeight: 600, border: "none" }}
                  onClick={() => setConfirmEliminarId(null)}
                >
                  Cancelar
                </button>
                <button
                  className="btn flex-fill rounded-pill"
                  style={{ background: "#b02e2e", color: "#fff", fontWeight: 600, border: "none" }}
                  onClick={() => handleEliminar(confirmEliminarId)}
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORMULARIO */}
      <AnimatePresence>
        {(modo === "crear" || modo === "editar") && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="card border-0 rounded-4 shadow-sm p-4 mb-5 dark-aware-card admin-form-card"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h4 className="fw-semibold mb-4" style={{ color: "var(--text)" }}>
              {modo === "crear" ? "Nueva charla" : "Editar charla"}
            </h4>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small fw-semibold">
                  Titulo *
                </label>
                <input
                  className="form-control"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm({ ...form, titulo: e.target.value })
                  }
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.fecha}
                  onChange={(e) =>
                    setForm({ ...form, fecha: e.target.value })
                  }
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Descripcion corta *
                </label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Detalle completo *
                </label>
                <textarea
                  rows={4}
                  className="form-control"
                  value={form.detalle}
                  onChange={(e) =>
                    setForm({ ...form, detalle: e.target.value })
                  }
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Imagen principal
                </label>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    style={{ maxWidth: 280, borderColor: "var(--border)" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  {uploadingImg && (
                    <div
                      className="spinner-border spinner-border-sm"
                      style={{ color: "var(--brand)" }}
                      role="status"
                    />
                  )}
                  {form.imagen && !uploadingImg && (
                    <Image
                      src={form.imagen}
                      alt="preview"
                      width={90}
                      height={60}
                      quality={70}
                      style={{
                        height: 60,
                        width: "auto",
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">
                  Galeria (multiples fotos)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control"
                  style={{ maxWidth: 320, borderColor: "var(--border)" }}
                  onChange={(e) => handleGaleriaUpload(e.target.files)}
                />
                {form.galeria.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {form.galeria.map((url, i) => (
                      <div key={i} className="position-relative">
                        <Image
                          src={url}
                          alt={`galeria ${i}`}
                          width={52}
                          height={52}
                          quality={65}
                          style={{
                            height: 52,
                            width: 52,
                            borderRadius: 6,
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                          }}
                        />
                        <button
                          className="position-absolute top-0 end-0 rounded-circle border-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: 18,
                            height: 18,
                            backgroundColor: "#b02e2e",
                            color: "#fff",
                            fontSize: "0.6rem",
                            lineHeight: 1,
                          }}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              galeria: prev.galeria.filter(
                                (_, j) => j !== i
                              ),
                            }))
                          }
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex gap-3 mt-4">
              <button
                onClick={handleGuardar}
                disabled={saving || uploadingImg}
                className="btn rounded-pill fw-semibold flex-1"
                style={{
                  backgroundColor: "var(--brand)",
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
                  backgroundColor: "var(--border)",
                  color: "var(--text)",
                  border: "none",
                }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA — mismo patrón que Procedimientos / Testimonios */}
      {charlas.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-soft)", padding: "2rem 0" }}>
          No hay charlas aun.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {charlas.map((c, i) => (
            <motion.div
              key={c.id}
              className="admin-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.1rem" }}
            >
              {c.imagen ? (
                <Image src={c.imagen} alt={c.titulo} width={76} height={76} quality={70} style={{ width: 76, height: 76, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: 14, background: "var(--border)", flexShrink: 0 }} />
              )}
              <div className="admin-card-body" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.08rem" }}>{c.titulo}</span>
                  {c.fecha && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--border)", color: "var(--brand)", padding: "0.2rem 0.7rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>
                      <Calendar size={13} /> {c.fecha}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.92rem", color: "var(--text-soft)", margin: "0.25rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.descripcion}
                </p>
              </div>
              <div className="admin-card-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => startEditar(c)} style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface-soft)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit3 size={18} color="var(--text)" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmEliminarId(c.id)} style={{ width: 42, height: 42, borderRadius: 12, background: "#fff3ef", border: "1px solid #e4bfbf", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} color="#b02e2e" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
