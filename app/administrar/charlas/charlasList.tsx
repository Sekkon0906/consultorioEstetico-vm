"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Charla {
  id: number;
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

  const loadCharlas = async () => {
    try {
      const { data, error: err } = await supabase
        .from("charlas")
        .select("id, titulo, descripcion, detalle, imagen, fecha, creado_en")
        .order("fecha", { ascending: false, nullsFirst: false })
        .order("creado_en", { ascending: false });

      if (err) throw new Error(err.message);

      // Cargar galeria para cada charla
      const charlasConGaleria = await Promise.all(
        (data ?? []).map(async (c) => {
          const { data: galeriaData } = await supabase
            .from("charla_galeria")
            .select("url")
            .eq("charla_id", c.id)
            .order("orden", { ascending: true });

          return {
            ...c,
            galeria: (galeriaData ?? []).map((g: { url: string }) => g.url),
          } as Charla;
        })
      );

      setCharlas(charlasConGaleria);
    } catch (err) {
      console.error("Error cargando charlas:", err);
    }
  };

  useEffect(() => {
    loadCharlas();
  }, []);

  /* -- Imagen principal -> Supabase Storage -- */
  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("charlas")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("charlas").getPublicUrl(path);
      setForm((prev) => ({ ...prev, imagen: data.publicUrl }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError("Error subiendo imagen: " + msg);
    } finally {
      setUploadingImg(false);
    }
  };

  /* -- Galeria -> Supabase Storage -- */
  const handleGaleriaUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split(".").pop();
        const path = `galeria/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("charlas")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) {
          setError("Error subiendo galeria: " + upErr.message);
          continue;
        }
        const { data } = supabase.storage.from("charlas").getPublicUrl(path);
        setForm((prev) => ({
          ...prev,
          galeria: [...prev.galeria, data.publicUrl],
        }));
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
      if (modo === "crear") {
        const { data: newCharla, error: insertErr } = await supabase
          .from("charlas")
          .insert({
            titulo: form.titulo,
            descripcion: form.descripcion,
            detalle: form.detalle,
            imagen: form.imagen || "",
            fecha: form.fecha || null,
          })
          .select()
          .single();

        if (insertErr) throw new Error(insertErr.message);

        // Insertar galeria
        if (form.galeria.length > 0 && newCharla) {
          for (let i = 0; i < form.galeria.length; i++) {
            await supabase.from("charla_galeria").insert({
              charla_id: newCharla.id,
              url: form.galeria[i],
              tipo: "imagen",
              orden: i,
            });
          }
        }
      } else if (actual) {
        const { error: updateErr } = await supabase
          .from("charlas")
          .update({
            titulo: form.titulo,
            descripcion: form.descripcion,
            detalle: form.detalle,
            imagen: form.imagen || "",
            fecha: form.fecha || null,
            actualizado_en: new Date().toISOString(),
          })
          .eq("id", actual.id);

        if (updateErr) throw new Error(updateErr.message);

        // Reemplazar galeria
        await supabase
          .from("charla_galeria")
          .delete()
          .eq("charla_id", actual.id);

        for (let i = 0; i < form.galeria.length; i++) {
          await supabase.from("charla_galeria").insert({
            charla_id: actual.id,
            url: form.galeria[i],
            tipo: "imagen",
            orden: i,
          });
        }
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
  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar esta charla?")) return;
    try {
      const { error: err } = await supabase
        .from("charlas")
        .delete()
        .eq("id", id);
      if (err) throw new Error(err.message);
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
        <h2 className="fw-bold" style={{ color: "#4E3B2B" }}>
          Formacion / Charlas
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
            + Nueva charla
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
                  style={{ borderColor: "#E9DED2" }}
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
                  style={{ borderColor: "#E9DED2" }}
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
                  style={{ borderColor: "#E9DED2" }}
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
                  style={{ borderColor: "#E9DED2" }}
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
                    style={{ maxWidth: 280, borderColor: "#E9DED2" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  {uploadingImg && (
                    <div
                      className="spinner-border spinner-border-sm"
                      style={{ color: "#B08968" }}
                      role="status"
                    />
                  )}
                  {form.imagen && !uploadingImg && (
                    <img
                      src={form.imagen}
                      alt="preview"
                      style={{
                        height: 60,
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "1px solid #E9DED2",
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
                  style={{ maxWidth: 320, borderColor: "#E9DED2" }}
                  onChange={(e) => handleGaleriaUpload(e.target.files)}
                />
                {form.galeria.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {form.galeria.map((url, i) => (
                      <div key={i} className="position-relative">
                        <img
                          src={url}
                          alt={`galeria ${i}`}
                          style={{
                            height: 52,
                            width: 52,
                            borderRadius: 6,
                            objectFit: "cover",
                            border: "1px solid #E9DED2",
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
      {charlas.length === 0 ? (
        <p className="text-center py-5" style={{ color: "#8B7060" }}>
          No hay charlas aun.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {charlas.map((c) => (
            <div
              key={c.id}
              className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row gap-3 align-items-start"
              style={{ backgroundColor: "#FFFDF9" }}
            >
              {c.imagen && (
                <img
                  src={c.imagen}
                  alt={c.titulo}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    objectFit: "cover",
                    border: "1px solid #E9DED2",
                    flexShrink: 0,
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="fw-bold mb-1" style={{ color: "#4E3B2B" }}>
                  {c.titulo}
                </p>
                <p
                  className="small mb-0 text-truncate"
                  style={{ color: "#6C584C" }}
                >
                  {c.descripcion}
                </p>
                {c.fecha && (
                  <p
                    className="small mb-0"
                    style={{ color: "#8B7060" }}
                  >
                    Fecha: {c.fecha}
                  </p>
                )}
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEditar(c)}
                  className="btn btn-sm rounded-pill"
                  style={{
                    backgroundColor: "#E9DED2",
                    color: "#4E3B2B",
                    border: "none",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(c.id)}
                  className="btn btn-sm rounded-pill"
                  style={{
                    backgroundColor: "#fff3ef",
                    color: "#b02e2e",
                    border: "1px solid #e4bfbf",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
