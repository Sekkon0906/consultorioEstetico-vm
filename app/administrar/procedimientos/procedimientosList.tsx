"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  getProcedimientosApi,
  createProcedimientoApi,
  updateProcedimientoApi,
  deleteProcedimientoApi,
} from "../../services/procedimientosApi";
import type { Procedimiento, MediaItem } from "../../types/domain";

type Categoria = "Facial" | "Corporal" | "Capilar";

const emptyForm = {
  nombre: "",
  desc: "",
  precio: "",
  imagen: "",
  categoria: "Facial" as Categoria,
  duracionMin: "",
  destacado: false,
};

export default function ProcedimientosList() {
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [modo, setModo] = useState<"lista" | "crear" | "editar">("lista");
  const [actual, setActual] = useState<Procedimiento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [galeria, setGaleria] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Galeria form
  const [showGaleriaForm, setShowGaleriaForm] = useState(false);
  const [galTipo, setGalTipo] = useState<"imagen" | "video">("imagen");
  const [galTitulo, setGalTitulo] = useState("");
  const [galDesc, setGalDesc] = useState("");
  const [galUrl, setGalUrl] = useState("");

  const loadProcedimientos = async () => {
    try {
      const data = await getProcedimientosApi();
      setProcedimientos(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadGaleria = async (procId: number) => {
    const { data } = await supabase
      .from("procedimiento_galeria")
      .select("id, tipo, url, titulo, descripcion, orden")
      .eq("procedimiento_id", procId)
      .order("orden", { ascending: true });

    setGaleria(
      (data ?? []).map((g: any) => ({
        id: String(g.id),
        tipo: g.tipo,
        url: g.url,
        titulo: g.titulo || "",
        descripcion: g.descripcion || "",
      }))
    );
  };

  useEffect(() => { loadProcedimientos(); }, []);

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("procedimientos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("procedimientos").getPublicUrl(path);
      setForm((prev) => ({ ...prev, imagen: data.publicUrl }));
    } catch (e: any) {
      setError("Error subiendo imagen: " + e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleGaleriaImageUpload = async (file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `galeria/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("procedimientos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("procedimientos").getPublicUrl(path);
      setGalUrl(data.publicUrl);
    } catch (e: any) {
      setError("Error subiendo imagen de galeria: " + e.message);
    }
  };

  const agregarAGaleria = () => {
    if (!galUrl.trim()) { setError("La URL es obligatoria."); return; }
    setGaleria((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: galTipo,
        url: galTipo === "video" ? toEmbedUrl(galUrl) : galUrl,
        titulo: galTitulo,
        descripcion: galDesc,
      },
    ]);
    setGalTitulo("");
    setGalDesc("");
    setGalUrl("");
    setShowGaleriaForm(false);
  };

  const quitarDeGaleria = (id: string) => {
    setGaleria((prev) => prev.filter((g) => g.id !== id));
  };

  function toEmbedUrl(url: string): string {
    if (!url) return "";
    if (url.includes("embed/")) return url;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.desc.trim()) {
      setError("Nombre y descripcion son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nombre: form.nombre,
        desc: form.desc,
        precio: form.precio || "0",
        imagen: form.imagen,
        categoria: form.categoria as Procedimiento["categoria"],
        duracionMin: Number(form.duracionMin) || null,
        destacado: form.destacado,
      };

      let procId: number;
      if (modo === "crear") {
        const created = await createProcedimientoApi(payload);
        procId = created.id;
      } else if (actual) {
        await updateProcedimientoApi(actual.id, payload);
        procId = actual.id;
      } else {
        return;
      }

      // Guardar galeria
      await supabase.from("procedimiento_galeria").delete().eq("procedimiento_id", procId);
      for (let i = 0; i < galeria.length; i++) {
        await supabase.from("procedimiento_galeria").insert({
          procedimiento_id: procId,
          tipo: galeria[i].tipo,
          url: galeria[i].url,
          titulo: galeria[i].titulo || "",
          descripcion: galeria[i].descripcion || "",
          orden: i,
        });
      }

      loadProcedimientos();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar este procedimiento?")) return;
    try {
      await deleteProcedimientoApi(id);
      loadProcedimientos();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setGaleria([]);
    setModo("lista");
    setActual(null);
    setShowGaleriaForm(false);
  };

  const startEditar = async (p: Procedimiento) => {
    setActual(p);
    setForm({
      nombre: p.nombre,
      desc: p.desc,
      precio: String(p.precio),
      imagen: p.imagen,
      categoria: p.categoria,
      duracionMin: p.duracionMin ? String(p.duracionMin) : "",
      destacado: p.destacado || false,
    });
    await loadGaleria(p.id);
    setModo("editar");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: "#4E3B2B" }}>Procedimientos</h2>
        {modo === "lista" && (
          <button onClick={() => setModo("crear")} className="btn rounded-pill px-4" style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>
            + Nuevo procedimiento
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      <AnimatePresence>
        {(modo === "crear" || modo === "editar") && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="card border-0 rounded-4 shadow-sm p-4 mb-5" style={{ backgroundColor: "#FFFDF9" }}>
            <h4 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>
              {modo === "crear" ? "Nuevo procedimiento" : "Editar procedimiento"}
            </h4>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nombre *</label>
                <input className="form-control" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={{ borderColor: "#E9DED2" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Precio (COP)</label>
                <input type="number" className="form-control" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} style={{ borderColor: "#E9DED2" }} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Duracion (min)</label>
                <input type="number" className="form-control" value={form.duracionMin} onChange={(e) => setForm({ ...form, duracionMin: e.target.value })} style={{ borderColor: "#E9DED2" }} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Descripcion *</label>
                <textarea rows={3} className="form-control" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={{ borderColor: "#E9DED2" }} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Categoria</label>
                <select className="form-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })} style={{ borderColor: "#E9DED2" }}>
                  <option>Facial</option><option>Corporal</option><option>Capilar</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} id="destacado" />
                  <label className="form-check-label small fw-semibold" htmlFor="destacado">Destacado</label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Imagen principal</label>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <input type="file" accept="image/*" className="form-control" style={{ maxWidth: 280, borderColor: "#E9DED2" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  {uploadingImg && <div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" />}
                  {form.imagen && !uploadingImg && <img src={form.imagen} alt="preview" style={{ height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #E9DED2" }} />}
                </div>
                <small className="text-muted">O pega una URL:</small>
                <input className="form-control mt-1" placeholder="https://..." value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} style={{ borderColor: "#E9DED2" }} />
              </div>
            </div>

            {/* GALERIA */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold m-0" style={{ color: "#4E3B2B" }}>Galeria multimedia</h5>
                <button onClick={() => setShowGaleriaForm(true)} className="btn btn-sm rounded-pill" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>
                  + Agregar
                </button>
              </div>

              {/* Form para agregar item de galeria */}
              {showGaleriaForm && (
                <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: "#F5EEE6", border: "1px solid #E9DED2" }}>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <select className="form-select form-select-sm" value={galTipo} onChange={(e) => setGalTipo(e.target.value as "imagen" | "video")} style={{ borderColor: "#E9DED2" }}>
                        <option value="imagen">Imagen</option>
                        <option value="video">Video YouTube</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <input className="form-control form-control-sm" placeholder="Titulo" value={galTitulo} onChange={(e) => setGalTitulo(e.target.value)} style={{ borderColor: "#E9DED2" }} />
                    </div>
                    <div className="col-md-5">
                      <input className="form-control form-control-sm" placeholder="Descripcion breve" value={galDesc} onChange={(e) => setGalDesc(e.target.value)} style={{ borderColor: "#E9DED2" }} />
                    </div>
                    <div className="col-12">
                      {galTipo === "imagen" ? (
                        <div className="d-flex gap-2 align-items-center">
                          <input type="file" accept="image/*" className="form-control form-control-sm" style={{ maxWidth: 260, borderColor: "#E9DED2" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGaleriaImageUpload(f); }} />
                          <span className="text-muted small">o URL:</span>
                          <input className="form-control form-control-sm" placeholder="https://..." value={galUrl} onChange={(e) => setGalUrl(e.target.value)} style={{ borderColor: "#E9DED2" }} />
                        </div>
                      ) : (
                        <input className="form-control form-control-sm" placeholder="https://youtube.com/watch?v=... o link de embed" value={galUrl} onChange={(e) => setGalUrl(e.target.value)} style={{ borderColor: "#E9DED2" }} />
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button onClick={agregarAGaleria} className="btn btn-sm rounded-pill" style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>Agregar</button>
                    <button onClick={() => { setShowGaleriaForm(false); setGalUrl(""); setGalTitulo(""); setGalDesc(""); }} className="btn btn-sm rounded-pill" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>Cancelar</button>
                  </div>
                </div>
              )}

              {/* Items de galeria */}
              {galeria.length === 0 ? (
                <p className="small" style={{ color: "#8B7060" }}>Sin elementos en la galeria.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {galeria.map((g) => (
                    <div key={g.id} className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ backgroundColor: "#F5EEE6", border: "1px solid #E9DED2" }}>
                      {g.tipo === "imagen" ? (
                        <img src={g.url} alt={g.titulo} style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: "#E9DED2", color: "#4E3B2B", fontSize: "0.7rem", fontWeight: 700 }}>VIDEO</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="small fw-semibold mb-0" style={{ color: "#4E3B2B" }}>{g.titulo || "(Sin titulo)"}</p>
                        <p className="small mb-0 text-truncate" style={{ color: "#8B7060" }}>{g.url}</p>
                      </div>
                      <button onClick={() => quitarDeGaleria(g.id)} className="btn btn-sm" style={{ color: "#b02e2e" }}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-flex gap-3 mt-4">
              <button onClick={handleGuardar} disabled={saving || uploadingImg} className="btn rounded-pill fw-semibold flex-1" style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={resetForm} className="btn rounded-pill fw-semibold" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA */}
      {procedimientos.length === 0 ? (
        <p className="text-center py-5" style={{ color: "#8B7060" }}>No hay procedimientos aun.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {procedimientos.map((p) => (
            <div key={p.id} className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: "#FFFDF9" }}>
              {p.imagen && <img src={p.imagen} alt={p.nombre} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #E9DED2", flexShrink: 0 }} />}
              <div className="flex-1 min-w-0">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span className="fw-bold" style={{ color: "#4E3B2B" }}>{p.nombre}</span>
                  <span className="badge rounded-pill px-2" style={{ backgroundColor: "#E9DED2", color: "#8B6A4B", fontSize: "0.72rem" }}>{p.categoria}</span>
                  {p.destacado && <span className="badge rounded-pill px-2" style={{ backgroundColor: "#FFF3E6", color: "#B08968", fontSize: "0.72rem" }}>Destacado</span>}
                </div>
                <p className="small mb-0 text-truncate" style={{ color: "#6C584C" }}>{p.desc}</p>
                {p.precio !== undefined && <p className="small mb-0 fw-semibold" style={{ color: "#B08968" }}>${Number(p.precio).toLocaleString("es-CO")} COP</p>}
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button onClick={() => startEditar(p)} className="btn btn-sm rounded-pill" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>Editar</button>
                <button onClick={() => handleEliminar(p.id)} className="btn btn-sm rounded-pill" style={{ backgroundColor: "#fff3ef", color: "#b02e2e", border: "1px solid #e4bfbf" }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}