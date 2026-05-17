"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getTestimoniosApi, deleteTestimonioApi } from "../../services/testimoniosApi";
import type { Testimonio } from "../../types/domain";
import { Plus, Edit3, Trash2, X, Eye, EyeOff, Star, Upload, Play } from "lucide-react";

var BUCKET = "testimonios";
var BURL = "https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/testimonios";
var emptyForm = { nombre: "", texto: "", video: "", thumb: "" };

export default function TestimoniosList() {
  var [list, setList] = useState<Testimonio[]>([]);
  var [modo, setModo] = useState<"lista" | "form">("lista");
  var [actual, setActual] = useState<Testimonio | null>(null);
  var [form, setForm] = useState(emptyForm);
  var [saving, setSaving] = useState(false);
  var [upl, setUpl] = useState(false);
  var [err, setErr] = useState<string | null>(null);
  var [delId, setDelId] = useState<number | null>(null);
  var [toast, setToast] = useState<string | null>(null);
  var [tab, setTab] = useState<"testimonios" | "comentarios">("testimonios");
  var [comentarios, setCom] = useState<any[]>([]);

  var showToast = function(msg: string) { setToast(msg); setTimeout(function() { setToast(null); }, 3000); };
  var load = useCallback(function() { getTestimoniosApi().then(setList).catch(function(e) { setErr(e.message); }); }, []);
  useEffect(function() { load(); loadCom(); }, [load]);

  var loadCom = function() {
    supabase.from("comentarios_pacientes").select("*").order("creado_en", { ascending: false })
      .then(function(res) { if (res.data) setCom(res.data); });
  };

  var toggleAprobado = async function(id: number, aprobado: boolean) {
    await supabase.from("comentarios_pacientes").update({ aprobado: !aprobado }).eq("id", id);
    loadCom();
  };
  var deleteCom = async function(id: number) {
    await supabase.from("comentarios_pacientes").delete().eq("id", id);
    loadCom();
  };

  var uploadFile = async function(file: File): Promise<string> {
    var ext = file.name.split(".").pop();
    var path = "test_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5) + "." + ext;
    var result = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (result.error) throw new Error(result.error.message);
    return BURL + "/" + path;
  };

  var handleThumb = async function(e: React.ChangeEvent<HTMLInputElement>) {
    var f = e.target.files?.[0]; if (!f) return;
    setUpl(true); setErr(null);
    try { var url = await uploadFile(f); setForm(function(p) { return { ...p, thumb: url }; }); showToast("Foto subida"); }
    catch (er: any) { setErr("Error: " + er.message); }
    finally { setUpl(false); e.target.value = ""; }
  };

  var handleSave = async function() {
    if (!form.nombre.trim() || !form.texto.trim()) { setErr("Nombre y texto obligatorios"); return; }
    setSaving(true); setErr(null);
    try {
      if (actual) {
        var upRes = await supabase.from("testimonios").update({ nombre: form.nombre, texto: form.texto, video: form.video, thumb: form.thumb, actualizado_en: new Date().toISOString() }).eq("id", actual.id);
        if (upRes.error) throw new Error(upRes.error.message);
      } else {
        var inRes = await supabase.from("testimonios").insert({ nombre: form.nombre, texto: form.texto, video: form.video, thumb: form.thumb, activo: true, destacado: false });
        if (inRes.error) throw new Error(inRes.error.message);
      }
      showToast(actual ? "Actualizado" : "Creado");
      load(); reset();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  var toggle = async function(t: Testimonio, campo: "activo" | "destacado") {
    await supabase.from("testimonios").update({ [campo]: !t[campo] }).eq("id", t.id);
    load();
  };

  var handleDel = async function(id: number) {
    await supabase.from("testimonios").delete().eq("id", id);
    setDelId(null); load();
  };

  var reset = function() { setForm(emptyForm); setModo("lista"); setActual(null); };
  var startEdit = function(t: Testimonio) { setActual(t); setForm({ nombre: t.nombre, texto: t.texto, video: t.video || "", thumb: t.thumb || "" }); setModo("form"); };

  var IS = { width: "100%", padding: "0.55rem 0.8rem", borderRadius: 12, border: "1px solid #E9DED2", fontSize: "0.88rem" } as React.CSSProperties;
  var pendientes = comentarios.filter(function(c) { return !c.aprobado; }).length;

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: "#3A2A1A", marginBottom: "1rem" }}>Testimonios y Comentarios</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={function() { setTab("testimonios"); }} style={{ padding: "0.55rem 1.2rem", borderRadius: 100, fontWeight: 600, fontSize: "0.85rem", border: "none", cursor: "pointer", background: tab === "testimonios" ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "#F5EEE6", color: tab === "testimonios" ? "white" : "#4E3B2B" }}>Testimonios</button>
        <button onClick={function() { setTab("comentarios"); }} style={{ padding: "0.55rem 1.2rem", borderRadius: 100, fontWeight: 600, fontSize: "0.85rem", border: "none", cursor: "pointer", background: tab === "comentarios" ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "#F5EEE6", color: tab === "comentarios" ? "white" : "#4E3B2B" }}>
          Comentarios {pendientes > 0 && <span style={{ background: "#C62828", color: "white", borderRadius: "50%", padding: "0.1rem 0.4rem", fontSize: "0.68rem", marginLeft: 4 }}>{pendientes}</span>}
        </button>
      </div>

      {toast && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "#E8F5E9", color: "#145A32", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", textAlign: "center" }}>{toast}</motion.div>}
      {err && <div style={{ background: "#FDE8D8", color: "#922B21", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>{err}<button onClick={function() { setErr(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button></div>}

      {/* ===== COMENTARIOS TAB ===== */}
      {tab === "comentarios" && (
        <div>
          {comentarios.length === 0 ? (
            <p style={{ textAlign: "center", color: "#8B7060", padding: "2rem 0" }}>No hay comentarios de pacientes</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {comentarios.map(function(c) {
                return (
                  <div key={c.id} style={{ background: "#FFFDF9", borderRadius: 14, border: "1px solid " + (c.aprobado ? "#A0D8A8" : "#F0E0A0"), padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E9DED2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4E3B2B", flexShrink: 0, fontSize: "0.88rem" }}>{(c.nombre || "?").charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "#3A2A1A", fontSize: "0.85rem" }}>{c.nombre}</span>
                        <span style={{ background: "#F5EEE6", color: "#8B6A4B", padding: "0.1rem 0.5rem", borderRadius: 100, fontSize: "0.62rem", fontWeight: 600 }}>{c.procedimiento}</span>
                        <span style={{ fontSize: "0.62rem", color: c.aprobado ? "#2E7D32" : "#F9A825", fontWeight: 600 }}>{c.aprobado ? "Visible" : "Pendiente"}</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#6C584C", margin: "0.2rem 0 0", fontStyle: "italic" }}>&quot;{c.texto}&quot;</p>
                      <div style={{ display: "flex", gap: 1, marginTop: 2 }}>
                        {[1,2,3,4,5].map(function(i) { return <span key={i} style={{ color: i <= c.puntuacion ? "#C0A080" : "#ddd", fontSize: "0.65rem" }}>★</span>; })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={function() { toggleAprobado(c.id, c.aprobado); }} style={{ padding: "0.25rem 0.6rem", borderRadius: 8, background: c.aprobado ? "#FFF3E6" : "#D8F3DC", color: c.aprobado ? "#B08968" : "#2E7D32", border: "none", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>{c.aprobado ? "Ocultar" : "Aprobar"}</button>
                      <button onClick={function() { deleteCom(c.id); }} style={{ padding: "0.25rem 0.6rem", borderRadius: 8, background: "#FDE8D8", color: "#C62828", border: "none", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TESTIMONIOS TAB ===== */}
      {tab === "testimonios" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            {modo === "lista" && <motion.button whileTap={{ scale: 0.97 }} onClick={function() { reset(); setModo("form"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.55rem 1.2rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}><Plus size={15} /> Nuevo</motion.button>}
          </div>

          <AnimatePresence>
            {modo === "form" && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ background: "#FFFDF9", borderRadius: 20, border: "1px solid #E9DED2", padding: "1.8rem", marginBottom: "1.5rem" }}>
                <h4 style={{ fontWeight: 700, color: "#3A2A1A", marginBottom: "1.2rem" }}>{actual ? "Editar" : "Nuevo"} testimonio</h4>
                <div style={{ marginBottom: "0.8rem" }}><Lbl>Nombre del paciente *</Lbl><input style={IS} value={form.nombre} onChange={function(e) { setForm({ ...form, nombre: e.target.value }); }} placeholder="Maria Lopez" /></div>
                <div style={{ marginBottom: "0.8rem" }}><Lbl>Testimonio *</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.texto} onChange={function(e) { setForm({ ...form, texto: e.target.value }); }} rows={3} placeholder="La experiencia fue increible..." /></div>
                <div style={{ marginBottom: "1rem" }}><Lbl>Link de video (YouTube)</Lbl>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Play size={16} color="#B08968" style={{ flexShrink: 0 }} />
                    <input style={IS} value={form.video} onChange={function(e) { setForm({ ...form, video: e.target.value }); }} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  {form.video && form.video.includes("youtu") && <p style={{ fontSize: "0.72rem", color: "#2D6A4F", marginTop: 3 }}>Video detectado</p>}
                </div>
                <div style={{ background: "#F5EEE6", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}><Lbl>Foto del paciente</Lbl>
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                    {form.thumb && <div style={{ position: "relative" }}><img src={form.thumb} alt="" style={{ height: 64, width: 64, borderRadius: 10, objectFit: "cover", border: "2px solid #B08968" }} /><button onClick={function() { setForm({ ...form, thumb: "" }); }} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#C62828", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button></div>}
                    <label style={{ padding: "0.45rem 1rem", borderRadius: 12, border: "1px dashed #B08968", cursor: upl ? "wait" : "pointer", fontSize: "0.82rem", color: "#B08968", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: upl ? 0.6 : 1 }}><Upload size={14} /> {upl ? "Subiendo..." : form.thumb ? "Cambiar" : "Subir foto"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} disabled={upl} /></label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "0.65rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Guardando..." : "Guardar"}</motion.button>
                  <button onClick={reset} style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: "#F5EEE6", color: "#4E3B2B", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {list.length === 0 ? <p style={{ textAlign: "center", color: "#8B7060", padding: "2rem 0" }}>No hay testimonios</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {list.map(function(t, i) {
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} style={{ background: "#FFFDF9", borderRadius: 18, border: "1px solid #E9DED2", padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.1rem", opacity: t.activo ? 1 : 0.5 }}>
                    {t.thumb ? <img src={t.thumb} alt="" style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 14, background: "#E9DED2", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontWeight: 700, color: "#3A2A1A", fontSize: "1.08rem" }}>{t.nombre}</span>{t.video && <Play size={16} color="#B08968" />}</div>
                      <p style={{ fontSize: "0.92rem", color: "#6C584C", margin: "0.25rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.texto}</p>
                    </div>
                    <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                      <IBtn icon={t.activo ? <Eye size={18} /> : <EyeOff size={18} />} bg={t.activo ? "#D8F3DC" : "#F5EEE6"} onClick={function() { toggle(t, "activo"); }} />
                      <IBtn icon={<Star size={18} fill={t.destacado ? "#B08968" : "none"} />} bg={t.destacado ? "#FFF3E6" : "#F5EEE6"} onClick={function() { toggle(t, "destacado"); }} />
                      <IBtn icon={<Edit3 size={18} />} bg="#F5EEE6" onClick={function() { startEdit(t); }} />
                      {delId === t.id ? (
                        <><button onClick={function() { handleDel(t.id); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "#C62828", color: "white", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Sí</button><button onClick={function() { setDelId(null); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "#E9DED2", border: "none", fontSize: "0.85rem", cursor: "pointer" }}>No</button></>
                      ) : (
                        <IBtn icon={<Trash2 size={18} color="#b02e2e" />} bg="#fff3ef" onClick={function() { setDelId(t.id); }} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Lbl(props: { children: string }) { return <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 3 }}>{props.children}</label>; }
function IBtn(props: { icon: React.ReactNode; bg: string; onClick: () => void }) {
  return <motion.button whileTap={{ scale: 0.95 }} onClick={props.onClick} style={{ width: 42, height: 42, borderRadius: 12, background: props.bg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{props.icon}</motion.button>;
}