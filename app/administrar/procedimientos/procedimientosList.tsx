"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getProcedimientosApi, updateProcedimientoApi, deleteProcedimientoApi } from "../../services/procedimientosApi";
import type { Procedimiento } from "../../types/domain";
import { Plus, Edit3, Trash2, X, ChevronUp, ChevronDown, Upload, Play } from "lucide-react";

type Cat = "Facial" | "Corporal" | "Capilar";
const BUCKET = "procedimientos";
const BURL = "https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos";

interface GalItem { id?: string; url: string; titulo: string; orden: number; tipo: string; }

const emptyForm = { nombre: "", desc: "", descCompleta: "", precio: "", imagen: "", categoria: "Facial" as Cat, duracionMin: "", destacado: false, video: "" };

export default function ProcedimientosList() {
  const [procs, setProcs] = useState<Procedimiento[]>([]);
  const [modo, setModo] = useState<"lista" | "form">("lista");
  const [actual, setActual] = useState<Procedimiento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [gal, setGal] = useState<GalItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGal, setUploadingGal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = function(msg: string) { setToast(msg); setTimeout(function() { setToast(null); }, 3000); };

  const load = useCallback(function() {
    getProcedimientosApi().then(setProcs).catch(function(e) { setErr(e.message); });
  }, []);
  useEffect(function() { load(); }, [load]);

  const loadGal = async function(pid: string | number) {
    var res = await supabase.from("procedimiento_galeria").select("id, url, titulo, orden, tipo").eq("procedimiento_id", pid).order("orden");
    if (res.data) setGal(res.data as GalItem[]);
    else setGal([]);
  };

  var uploadFile = async function(file: File): Promise<string> {
    var ext = file.name.split(".").pop();
    var path = "proc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5) + "." + ext;
    var result = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (result.error) throw new Error(result.error.message);
    return BURL + "/" + path;
  };

  var handleMainImg = async function(e: React.ChangeEvent<HTMLInputElement>) {
    var f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr(null);
    try {
      var url = await uploadFile(f);
      setForm(function(p) { return { ...p, imagen: url }; });
      showToast("Imagen subida");
    } catch (er: any) { setErr("Error: " + er.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  var handleGalAdd = async function(e: React.ChangeEvent<HTMLInputElement>) {
    var f = e.target.files?.[0];
    if (!f || !actual) return;
    setUploadingGal(true);
    setErr(null);
    try {
      var url = await uploadFile(f);
      var ord = gal.length;
      var res = await supabase.from("procedimiento_galeria").insert({ procedimiento_id: actual.id, tipo: "imagen", url: url, titulo: "", orden: ord }).select().single();
      if (res.error) throw new Error(res.error.message);
      setGal(function(prev) { return [...prev, { id: res.data.id, url: url, titulo: "", orden: ord, tipo: "imagen" }]; });
      showToast("Imagen agregada a galeria");
    } catch (er: any) { setErr("Error: " + er.message); }
    finally { setUploadingGal(false); e.target.value = ""; }
  };

  var galRemove = async function(item: GalItem) {
    if (item.id) await supabase.from("procedimiento_galeria").delete().eq("id", item.id);
    setGal(function(prev) { return prev.filter(function(g) { return g.id !== item.id; }); });
  };

  var galMove = async function(i: number, dir: -1 | 1) {
    var j = i + dir;
    if (j < 0 || j >= gal.length) return;
    var updated = [...gal];
    var temp = updated[i]; updated[i] = updated[j]; updated[j] = temp;
    updated.forEach(function(g, idx) { g.orden = idx; });
    setGal(updated);
    for (var g of updated) { if (g.id) await supabase.from("procedimiento_galeria").update({ orden: g.orden }).eq("id", g.id); }
  };

  var handleSave = async function() {
    if (!form.nombre.trim()) { setErr("Nombre obligatorio"); return; }
    setSaving(true);
    setErr(null);
    try {
      var dbPayload: Record<string, unknown> = {
        nombre: form.nombre,
        descripcion: form.desc,
        descripcion_completa: form.descCompleta,
        precio: form.precio || "0",
        imagen: form.imagen,
        categoria: form.categoria,
        duracion_min: Number(form.duracionMin) || null,
        destacado: form.destacado,
        actualizado_en: new Date().toISOString(),
      };

      if (actual) {
        var upRes = await supabase.from("procedimientos").update(dbPayload).eq("id", actual.id);
        if (upRes.error) throw new Error(upRes.error.message);
      } else {
        var inRes = await supabase.from("procedimientos").insert(dbPayload);
        if (inRes.error) throw new Error(inRes.error.message);
      }
      showToast(actual ? "Procedimiento actualizado" : "Procedimiento creado");
      load();
      reset();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  var handleDel = async function(id: string | number) {
    try {
      await supabase.from("procedimientos").delete().eq("id", id);
      setDelId(null); load();
    } catch (e: any) { setErr(e.message); }
  };

  var reset = function() { setForm(emptyForm); setModo("lista"); setActual(null); setGal([]); };

  var startEdit = function(p: Procedimiento) {
    setActual(p);
    setForm({
      nombre: p.nombre, desc: p.desc, descCompleta: (p as any).descCompleta || "",
      precio: String(p.precio), imagen: p.imagen, categoria: p.categoria,
      duracionMin: p.duracionMin ? String(p.duracionMin) : "", destacado: p.destacado || false, video: "",
    });
    setModo("form");
    loadGal(p.id);
  };

  var IS = { width: "100%", padding: "0.55rem 0.8rem", borderRadius: 12, border: "1px solid #E9DED2", fontSize: "0.88rem" } as React.CSSProperties;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, color: "#3A2A1A" }}>Procedimientos</h2>
        {modo === "lista" && <motion.button whileTap={{ scale: 0.97 }} onClick={function() { reset(); setModo("form"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.55rem 1.2rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}><Plus size={15} /> Nuevo</motion.button>}
      </div>

      {toast && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#E8F5E9", color: "#145A32", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", textAlign: "center" }}>{toast}</motion.div>}
      {err && <div style={{ background: "#FDE8D8", color: "#922B21", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>{err}<button onClick={function() { setErr(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button></div>}

      <AnimatePresence>
        {modo === "form" && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ background: "#FFFDF9", borderRadius: 20, border: "1px solid #E9DED2", padding: "1.8rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontWeight: 700, color: "#3A2A1A", marginBottom: "1.2rem" }}>{actual ? "Editar" : "Nuevo"} procedimiento</h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}><Lbl>Nombre *</Lbl><input style={IS} value={form.nombre} onChange={function(e) { setForm({ ...form, nombre: e.target.value }); }} placeholder="Acido Hialuronico" /></div>
              <div><Lbl>Precio (COP)</Lbl><input type="number" style={IS} value={form.precio} onChange={function(e) { setForm({ ...form, precio: e.target.value }); }} placeholder="350000" /></div>
              <div><Lbl>Duracion (min)</Lbl><input type="number" style={IS} value={form.duracionMin} onChange={function(e) { setForm({ ...form, duracionMin: e.target.value }); }} placeholder="60" /></div>
              <div><Lbl>Categoria</Lbl><select value={form.categoria} onChange={function(e) { setForm({ ...form, categoria: e.target.value as Cat }); }} style={IS}><option>Facial</option><option>Corporal</option><option>Capilar</option></select></div>
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.destacado} onChange={function(e) { setForm({ ...form, destacado: e.target.checked }); }} style={{ width: 17, height: 17, accentColor: "#B08968" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4E3B2B" }}>Destacado</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "0.8rem" }}><Lbl>Descripcion breve</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.desc} onChange={function(e) { setForm({ ...form, desc: e.target.value }); }} rows={2} placeholder="Se muestra en las cards..." /></div>
            <div style={{ marginBottom: "1.2rem" }}><Lbl>Descripcion completa</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.descCompleta} onChange={function(e) { setForm({ ...form, descCompleta: e.target.value }); }} rows={4} placeholder="Se muestra en la pagina de detalle..." /></div>

            {/* MAIN IMAGE - only 1, upload replaces */}
            <div style={{ background: "#F5EEE6", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}>
              <Lbl>Foto principal</Lbl>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                {form.imagen && (
                  <div style={{ position: "relative" }}>
                    <img src={form.imagen} alt="" style={{ height: 80, width: 120, borderRadius: 10, objectFit: "cover", border: "2px solid #B08968" }} />
                    <button onClick={function() { setForm({ ...form, imagen: "" }); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#C62828", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} /></button>
                  </div>
                )}
                <label style={{ padding: "0.5rem 1.2rem", borderRadius: 12, border: "1px dashed #B08968", cursor: uploading ? "wait" : "pointer", fontSize: "0.82rem", color: "#B08968", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: uploading ? 0.6 : 1 }}>
                  <Upload size={14} /> {uploading ? "Subiendo..." : form.imagen ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleMainImg} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* GALLERY - only in edit mode */}
            {actual && (
              <div style={{ background: "#EEF7EE", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}>
                <Lbl>Galeria de resultados</Lbl>
                <p style={{ fontSize: "0.72rem", color: "#6C584C", marginBottom: "0.6rem" }}>Sube fotos de antes/despues. Usa las flechas para ordenar.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {gal.filter(function(g) { return g.tipo === "imagen"; }).map(function(g, i) {
                    return (
                      <div key={g.id || i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #E9DED2" }}>
                        <img src={g.url} alt="" style={{ width: 90, height: 70, objectFit: "cover", display: "block" }} />
                        <button onClick={function() { galRemove(g); }} style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, background: "rgba(198,40,40,0.85)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 2, background: "rgba(0,0,0,0.4)", padding: 1 }}>
                          <button onClick={function() { galMove(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: i === 0 ? 0.3 : 1, padding: 0 }}><ChevronUp size={11} /></button>
                          <span style={{ color: "white", fontSize: "0.55rem" }}>{i + 1}</span>
                          <button onClick={function() { galMove(i, 1); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0 }}><ChevronDown size={11} /></button>
                        </div>
                      </div>
                    );
                  })}
                  <label style={{ width: 90, height: 70, borderRadius: 10, border: "2px dashed #A0D8A8", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingGal ? "wait" : "pointer", fontSize: "0.68rem", color: "#2D6A4F", fontWeight: 600, textAlign: "center", opacity: uploadingGal ? 0.6 : 1 }}>
                    {uploadingGal ? "..." : "+ Foto"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalAdd} disabled={uploadingGal} />
                  </label>
                </div>

                {/* Videos en galeria */}
                <div style={{ marginTop: "0.8rem", borderTop: "1px solid #C8E6C9", paddingTop: "0.8rem" }}>
                  <Lbl>Videos (YouTube / Instagram)</Lbl>
                  <p style={{ fontSize: "0.72rem", color: "#6C584C", marginBottom: "0.5rem" }}>Agrega links de videos del procedimiento</p>
                  {gal.filter(function(g) { return g.tipo === "video"; }).map(function(g, i) {
                    return (
                      <div key={g.id || "v" + i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                        <Play size={14} color="#B08968" />
                        <span style={{ flex: 1, fontSize: "0.78rem", color: "#4E3B2B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.url}</span>
                        <button onClick={function() { galRemove(g); }} style={{ width: 20, height: 20, borderRadius: "50%", background: "#FDE8D8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} color="#C62828" /></button>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input id="videoLinkInput" style={{ ...IS, flex: 1, fontSize: "0.82rem" }} placeholder="https://youtube.com/watch?v=... o https://instagram.com/reel/..." />
                    <button onClick={async function() {
                      var input = document.getElementById("videoLinkInput") as HTMLInputElement;
                      var url = input?.value?.trim();
                      if (!url || !actual) return;
                      try {
                        var ord = gal.length;
                        var r = await supabase.from("procedimiento_galeria").insert({ procedimiento_id: actual.id, tipo: "video", url: url, titulo: "", orden: ord }).select().single();
                        if (r.error) throw new Error(r.error.message);
                        setGal(function(prev) { return [...prev, { id: r.data.id, url: url, titulo: "", orden: ord, tipo: "video" }]; });
                        input.value = "";
                        showToast("Video agregado");
                      } catch (e: any) { setErr(e.message); }
                    }} style={{ padding: "0.45rem 1rem", borderRadius: 10, background: "#B08968", color: "white", border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>+ Agregar</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "0.65rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Guardando..." : "Guardar"}
              </motion.button>
              <button onClick={reset} style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: "#F5EEE6", color: "#4E3B2B", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {procs.length === 0 ? <p style={{ textAlign: "center", color: "#8B7060", padding: "2rem 0" }}>No hay procedimientos</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {procs.map(function(p, i) {
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                style={{ background: "#FFFDF9", borderRadius: 14, border: "1px solid #E9DED2", padding: "0.7rem 1rem", display: "flex", alignItems: "center", gap: "0.7rem" }}>
                {p.imagen ? <img src={p.imagen} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: "#E9DED2", flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "#3A2A1A", fontSize: "0.88rem" }}>{p.nombre}</span>
                    <span style={{ background: "#E9DED2", color: "#8B6A4B", padding: "0.1rem 0.5rem", borderRadius: 100, fontSize: "0.65rem", fontWeight: 600 }}>{p.categoria}</span>
                    {p.destacado && <span style={{ background: "#FFF3E6", color: "#B08968", padding: "0.1rem 0.5rem", borderRadius: 100, fontSize: "0.65rem" }}>★</span>}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#6C584C", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</p>
                </div>
                <span style={{ fontSize: "0.82rem", color: "#B08968", fontWeight: 700, whiteSpace: "nowrap" }}>${Number(p.precio).toLocaleString("es-CO")}</span>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={function() { startEdit(p); }} style={{ width: 32, height: 32, borderRadius: 8, background: "#F5EEE6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit3 size={13} color="#4E3B2B" /></motion.button>
                  {delId === p.id ? (
                    <><button onClick={function() { handleDel(p.id); }} style={{ padding: "0.2rem 0.5rem", borderRadius: 6, background: "#C62828", color: "white", border: "none", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>Si</button><button onClick={function() { setDelId(null); }} style={{ padding: "0.2rem 0.5rem", borderRadius: 6, background: "#E9DED2", border: "none", fontSize: "0.68rem", cursor: "pointer" }}>No</button></>
                  ) : (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={function() { setDelId(p.id); }} style={{ width: 32, height: 32, borderRadius: 8, background: "#fff3ef", border: "1px solid #e4bfbf", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color="#b02e2e" /></motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Lbl(props: { children: string }) { return <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 3 }}>{props.children}</label>; }