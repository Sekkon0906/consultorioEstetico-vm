"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTestimoniosApi,
  createTestimonioApi,
  updateTestimonioApi,
  deleteTestimonioApi,
  bustTestimoniosCache,
} from "@/services/testimoniosApi";
import {
  getComentariosAdminApi,
  aprobarComentarioApi,
  eliminarComentarioApi,
} from "@/services/comentariosApi";
import { subirImagenApi } from "@/services/uploadsApi";
import type { Testimonio } from "@/types/domain";
import { Plus, Edit3, Trash2, X, Eye, EyeOff, Star, Upload, Play } from "lucide-react";

var emptyForm = { nombre: "", texto: "", video: "", thumb: "" };

export default function TestimoniosList() {
  var [list, setList] = useState<Testimonio[]>([]);
  var [modo, setModo] = useState<"lista" | "form">("lista");
  var [actual, setActual] = useState<Testimonio | null>(null);
  var [form, setForm] = useState(emptyForm);
  var [saving, setSaving] = useState(false);
  var [upl, setUpl] = useState(false);
  var [err, setErr] = useState<string | null>(null);
  var [delId, setDelId] = useState<string | null>(null);
  var [toast, setToast] = useState<string | null>(null);
  var [tab, setTab] = useState<"testimonios" | "comentarios">("testimonios");
  var [comentarios, setCom] = useState<any[]>([]);

  var showToast = function(msg: string) { setToast(msg); setTimeout(function() { setToast(null); }, 3000); };
  var load = useCallback(function() { getTestimoniosApi({ fresh: true }).then(setList).catch(function(e) { setErr(e.message); }); }, []);
  useEffect(function() { load(); loadCom(); }, [load]);

  var loadCom = function() {
    getComentariosAdminApi().then(setCom).catch(function(e) { console.error(e); });
  };

  var toggleAprobado = async function(id: number, aprobado: boolean) {
    await aprobarComentarioApi(id, !aprobado);
    loadCom();
  };
  var deleteCom = async function(id: number) {
    await eliminarComentarioApi(id);
    loadCom();
  };

  var uploadFile = function(file: File): Promise<string> {
    return subirImagenApi(file, "testimonios");
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
        await updateTestimonioApi(actual.id, { nombre: form.nombre, texto: form.texto, video: form.video, thumb: form.thumb });
      } else {
        await createTestimonioApi({ nombre: form.nombre, texto: form.texto, video: form.video, thumb: form.thumb, activo: true, destacado: false });
      }
      showToast(actual ? "Actualizado" : "Creado");
      load(); reset();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  var toggle = async function(t: Testimonio, campo: "activo" | "destacado") {
    await updateTestimonioApi(t.id, { [campo]: !t[campo] });
    load();
  };

  var handleDel = async function(id: string) {
    await deleteTestimonioApi(id);
    setDelId(null); load();
  };

  var reset = function() { setForm(emptyForm); setModo("lista"); setActual(null); };
  var startEdit = function(t: Testimonio) { setActual(t); setForm({ nombre: t.nombre, texto: t.texto, video: t.video || "", thumb: t.thumb || "" }); setModo("form"); };

  var IS = { width: "100%", padding: "0.75rem 1rem", borderRadius: 14, border: "1px solid var(--border)", fontSize: "0.98rem", background: "var(--surface)" } as React.CSSProperties;
  var pendientes = comentarios.filter(function(c) { return !c.aprobado; }).length;

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1rem" }}>Testimonios y Comentarios</h2>

      <div style={{ display: "flex", gap: "0.7rem", marginBottom: "1.5rem" }}>
        <button onClick={function() { setTab("testimonios"); }} style={{ padding: "0.7rem 1.5rem", borderRadius: 100, fontWeight: 600, fontSize: "0.95rem", border: "none", cursor: "pointer", background: tab === "testimonios" ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "var(--surface-soft)", color: tab === "testimonios" ? "white" : "var(--text)", boxShadow: tab === "testimonios" ? "0 4px 14px rgba(176,137,104,0.25)" : "none", transition: "all 0.2s" }}>Testimonios</button>
        <button onClick={function() { setTab("comentarios"); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.7rem 1.5rem", borderRadius: 100, fontWeight: 600, fontSize: "0.95rem", border: "none", cursor: "pointer", background: tab === "comentarios" ? "linear-gradient(135deg, #8B6A4B, #B08968)" : "var(--surface-soft)", color: tab === "comentarios" ? "white" : "var(--text)", boxShadow: tab === "comentarios" ? "0 4px 14px rgba(176,137,104,0.25)" : "none", transition: "all 0.2s" }}>
          Comentarios {pendientes > 0 && <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 7px", borderRadius: 100, background: tab === "comentarios" ? "rgba(255,255,255,0.28)" : "#C62828", color: "white", fontSize: "0.78rem", fontWeight: 700 }}>{pendientes}</span>}
        </button>
      </div>

      {toast && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "#E8F5E9", color: "#145A32", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", textAlign: "center" }}>{toast}</motion.div>}
      {err && <div style={{ background: "#FDE8D8", color: "#922B21", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>{err}<button onClick={function() { setErr(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button></div>}

      {/* ===== COMENTARIOS TAB ===== */}
      {tab === "comentarios" && (
        <div>
          {comentarios.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-soft)", padding: "2rem 0" }}>No hay comentarios de pacientes</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {comentarios.map(function(c) {
                return (
                  <div key={c.id} className="admin-card" style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid " + (c.aprobado ? "#A0D8A8" : "#F0E0A0"), padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.1rem" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--text)", flexShrink: 0, fontSize: "1.3rem" }}>{(c.nombre || "?").charAt(0).toUpperCase()}</div>
                    <div className="admin-card-body" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.05rem" }}>{c.nombre}</span>
                        <span style={{ background: "var(--surface-soft)", color: "var(--brand)", padding: "0.2rem 0.7rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>{c.procedimiento}</span>
                        <span style={{ background: c.aprobado ? "rgba(150, 220, 170, 0.2)" : "rgba(242, 221, 184, 0.2)", color: c.aprobado ? "#5DBE7B" : "var(--brand)", border: "1px solid " + (c.aprobado ? "#5DBE7B" : "var(--brand)"), padding: "0.2rem 0.7rem", borderRadius: 100, fontSize: "0.74rem", fontWeight: 700 }}>{c.aprobado ? "Visible" : "Pendiente"}</span>
                      </div>
                      <p style={{ fontSize: "0.92rem", color: "var(--text-soft)", margin: "0.35rem 0 0", fontStyle: "italic" }}>&quot;{c.texto}&quot;</p>
                      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                        {[1,2,3,4,5].map(function(i) { return <span key={i} style={{ color: i <= c.puntuacion ? "#C0A080" : "#ddd", fontSize: "0.95rem" }}>★</span>; })}
                      </div>
                    </div>
                    <div className="admin-card-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={function() { toggleAprobado(c.id, c.aprobado); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 100, background: c.aprobado ? "rgba(232, 201, 160, 0.18)" : "rgba(150, 220, 170, 0.22)", color: c.aprobado ? "var(--brand)" : "#5DBE7B", border: "1px solid " + (c.aprobado ? "var(--brand)" : "#5DBE7B"), fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                        {c.aprobado ? <EyeOff size={14} /> : <Eye size={14} />}
                        {c.aprobado ? "Ocultar" : "Aprobar"}
                      </button>
                      <button onClick={function() { deleteCom(c.id); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 100, background: "rgba(244, 168, 168, 0.18)", color: "#E07878", border: "1px solid #E07878", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                        <Trash2 size={14} /> Eliminar
                      </button>
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
            {modo === "lista" && <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={function() { reset(); setModo("form"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0.7rem 1.5rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(176,137,104,0.28)" }}><Plus size={17} /> Nuevo</motion.button>}
          </div>

          <AnimatePresence>
            {modo === "form" && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: "1.8rem", marginBottom: "1.5rem" }}>
                <h4 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.2rem" }}>{actual ? "Editar" : "Nuevo"} testimonio</h4>
                <div style={{ marginBottom: "0.8rem" }}><Lbl>Nombre del paciente *</Lbl><input style={IS} value={form.nombre} onChange={function(e) { setForm({ ...form, nombre: e.target.value }); }} placeholder="Maria Lopez" /></div>
                <div style={{ marginBottom: "0.8rem" }}><Lbl>Testimonio *</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.texto} onChange={function(e) { setForm({ ...form, texto: e.target.value }); }} rows={3} placeholder="La experiencia fue increible..." /></div>
                <div style={{ marginBottom: "1rem" }}><Lbl>Link de video (YouTube)</Lbl>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Play size={16} color="var(--brand)" style={{ flexShrink: 0 }} />
                    <input style={IS} value={form.video} onChange={function(e) { setForm({ ...form, video: e.target.value }); }} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  {form.video && form.video.includes("youtu") && <p style={{ fontSize: "0.72rem", color: "#2D6A4F", marginTop: 3 }}>Video detectado</p>}
                </div>
                <div style={{ background: "var(--surface-soft)", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}><Lbl>Foto del paciente</Lbl>
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                    {form.thumb && <div style={{ position: "relative" }}><Image src={form.thumb} alt="" width={64} height={64} quality={70} style={{ height: 64, width: 64, borderRadius: 10, objectFit: "cover", border: "2px solid var(--brand)" }} /><button onClick={function() { setForm({ ...form, thumb: "" }); }} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#C62828", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button></div>}
                    <label style={{ padding: "0.45rem 1rem", borderRadius: 12, border: "1px dashed #B08968", cursor: upl ? "wait" : "pointer", fontSize: "0.82rem", color: "var(--brand)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: upl ? 0.6 : 1 }}><Upload size={14} /> {upl ? "Subiendo..." : form.thumb ? "Cambiar" : "Subir foto"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} disabled={upl} /></label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "0.65rem", borderRadius: 100, background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Guardando..." : "Guardar"}</motion.button>
                  <button onClick={reset} style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: "var(--surface-soft)", color: "var(--text)", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {list.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-soft)", padding: "2rem 0" }}>No hay testimonios</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {list.map(function(t, i) {
                return (
                  <motion.div key={t.id} className="admin-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.1rem", opacity: t.activo ? 1 : 0.5 }}>
                    {t.thumb ? <Image src={t.thumb} alt="" width={72} height={72} quality={70} style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, borderRadius: 14, background: "var(--border)", flexShrink: 0 }} />}
                    <div className="admin-card-body" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.08rem" }}>{t.nombre}</span>{t.video && <Play size={16} color="var(--brand)" />}</div>
                      <p style={{ fontSize: "0.92rem", color: "var(--text-soft)", margin: "0.25rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.texto}</p>
                    </div>
                    <div className="admin-card-actions" style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                      <IBtn icon={t.activo ? <Eye size={18} color="var(--brand-deep)" /> : <EyeOff size={18} color="var(--text-muted)" />} bg="var(--surface-soft)" title={t.activo ? "Ocultar" : "Mostrar"} onClick={function() { toggle(t, "activo"); }} />
                      <IBtn icon={<Star size={18} color="var(--brand)" fill={t.destacado ? "var(--brand)" : "none"} />} bg="var(--surface-soft)" title="Destacar" onClick={function() { toggle(t, "destacado"); }} />
                      <IBtn icon={<Edit3 size={18} color="var(--text)" />} bg="var(--surface-soft)" title="Editar" onClick={function() { startEdit(t); }} />
                      {delId === t.id ? (
                        <><button onClick={function() { handleDel(t.id); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "#C62828", color: "white", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Sí</button><button onClick={function() { setDelId(null); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "var(--border)", border: "none", fontSize: "0.85rem", cursor: "pointer" }}>No</button></>
                      ) : (
                        <IBtn icon={<Trash2 size={18} color="#E07878" />} bg="rgba(244, 168, 168, 0.12)" title="Eliminar" onClick={function() { setDelId(t.id); }} />
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

function Lbl(props: { children: string }) { return <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 3 }}>{props.children}</label>; }
function IBtn(props: { icon: React.ReactNode; bg: string; onClick: () => void; title?: string }) {
  return <motion.button whileTap={{ scale: 0.95 }} onClick={props.onClick} title={props.title} aria-label={props.title} style={{ width: 42, height: 42, borderRadius: 12, background: props.bg, border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{props.icon}</motion.button>;
}