"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProcedimientosApi,
  getGaleriaProcedimientoApi,
  createProcedimientoApi,
  updateProcedimientoApi,
  deleteProcedimientoApi,
  addGaleriaItemApi,
  deleteGaleriaItemApi,
  reordenarGaleriaApi,
  bustProcedimientosCache,
} from "@/services/procedimientosApi";
import { subirImagenApi } from "@/services/uploadsApi";
import type { Procedimiento } from "@/types/domain";
import { MUELLE_TACTO } from "@/lib/movimiento";
import { Plus, Edit3, Trash2, X, ChevronUp, ChevronDown, Upload, Play, Star, ArrowLeft, Loader2, Check } from "lucide-react";

type Cat = "Facial" | "Corporal" | "Capilar";

interface GalItem { id?: number | string; url: string; titulo: string; orden: number; tipo: string; }

const emptyForm = {
  nombre: "",
  desc: "",
  descCompleta: "",
  precio: "",
  imagen: "",
  categoria: "Facial" as Cat,
  subcategoria: "",
  duracionMin: "",
  destacado: false,
  enPromocion: false,
  precioPromocional: "",
  promocionHasta: "",
  mostrarGaleriaHome: false,
  mostrarGaleriaProcedimientos: true,
  video: "",
};

/**
 * Editar en la lista, sin abrir el formulario.
 *
 * POR QUÉ SOLO EL PRECIO Y EL DESTACADO
 * Son las dos cosas que se tocan solas: un precio sube, una promoción entra
 * y sale del mes. El resto —nombre, descripción, fotos, galería— se escribe
 * una vez al crear el procedimiento y casi no se vuelve a mirar, así que
 * para eso el formulario completo sigue siendo lo correcto.
 *
 * Abrir un formulario de catorce campos para cambiar un número es la clase
 * de fricción que hace que los precios se queden desactualizados.
 */
function PrecioEditable({
  valor,
  onGuardar,
}: {
  valor: string | number;
  onGuardar: (nuevo: string) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor));
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");

  // Si el precio cambia por fuera (recarga de la lista), el borrador local
  // se queda obsoleto; se resincroniza mientras no se esté editando.
  useEffect(() => { if (!editando) setTexto(String(valor)); }, [valor, editando]);

  const confirmar = async () => {
    setEditando(false);
    const limpio = texto.replace(/[^\d]/g, "");
    if (!limpio || limpio === String(valor)) { setTexto(String(valor)); return; }
    setEstado("guardando");
    try {
      await onGuardar(limpio);
      setEstado("ok");
      setTimeout(() => setEstado("idle"), 1800);
    } catch {
      setEstado("error");
      setTexto(String(valor));
    }
  };

  if (editando) {
    return (
      <input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => void confirmar()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setTexto(String(valor)); setEditando(false); }
        }}
        aria-label="Precio en pesos"
        style={{ width: 110, padding: "0.3rem 0.5rem", borderRadius: 8, border: "1px solid var(--brand)", background: "var(--bg-elevated)", color: "var(--text)", fontSize: "1rem", fontWeight: 700, textAlign: "right", outline: "none" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      title="Pulsa para cambiar el precio"
      className="admin-card-price"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed transparent", borderRadius: 8, padding: "0.2rem 0.4rem", cursor: "text", fontSize: "1.1rem", color: estado === "error" ? "var(--danger)" : "var(--brand)", fontWeight: 700, whiteSpace: "nowrap", font: "inherit" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
    >
      ${Number(valor).toLocaleString("es-CO")}
      {estado === "guardando" && <Loader2 size={13} style={{ animation: "proc-gira 900ms linear infinite" }} />}
      {estado === "ok" && <Check size={13} strokeWidth={3} color="var(--estado-atendida)" />}
      {estado === "error" && <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>no se guardó</span>}
      <style>{`@keyframes proc-gira { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

export default function ProcedimientosList() {
  const [procs, setProcs] = useState<Procedimiento[]>([]);
  const [modo, setModo] = useState<"lista" | "form">("lista");
  const [actual, setActual] = useState<Procedimiento | null>(null);

  /**
   * Guarda UN campo de UN procedimiento, sin abrir el formulario.
   *
   * Se puede mandar solo ese campo porque el PUT del servidor pasó a ser
   * parcial: construye el SET con las columnas que de verdad llegan. Antes
   * reescribía las catorce, así que un `{ precio }` suelto habría borrado
   * la descripción, la imagen y la categoría de paso.
   *
   * La lista se actualiza en cuanto responde el servidor y con lo que
   * DEVUELVE el servidor, no con lo que mandamos: si algo se normalizó por
   * el camino, la pantalla enseña lo que quedó guardado de verdad.
   */
  const guardarCampoSuelto = useCallback(async (
    id: string | number,
    campos: Partial<Omit<Procedimiento, "id">>
  ) => {
    const actualizado = await updateProcedimientoApi(id, campos);
    setProcs(function(prev) {
      return prev.map(function(x) {
        return String(x.id) === String(id) ? { ...x, ...actualizado } : x;
      });
    });
  }, []);
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
    // Admin siempre ve el dato más reciente (omite caché)
    getProcedimientosApi({ fresh: true }).then(setProcs).catch(function(e) { setErr(e.message); });
  }, []);
  useEffect(function() { load(); }, [load]);

  const loadGal = async function(pid: string | number) {
    try {
      var items = await getGaleriaProcedimientoApi(pid);
      setGal(items.map((g) => ({ id: g.id, url: g.url, titulo: g.titulo || "", orden: g.orden, tipo: g.tipo })));
    } catch { setGal([]); }
  };

  var uploadFile = function(file: File): Promise<string> {
    return subirImagenApi(file, "procedimientos");
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
      var item = await addGaleriaItemApi(actual.id, { tipo: "imagen", url: url });
      setGal(function(prev) { return [...prev, { id: item.id, url: url, titulo: "", orden: item.orden, tipo: "imagen" }]; });
      showToast("Imagen agregada a galeria");
    } catch (er: any) { setErr("Error: " + er.message); }
    finally { setUploadingGal(false); e.target.value = ""; }
  };

  var galRemove = async function(item: GalItem) {
    if (typeof item.id === "number") await deleteGaleriaItemApi(item.id);
    setGal(function(prev) { return prev.filter(function(g) { return g.id !== item.id; }); });
  };

  var galMove = async function(i: number, dir: -1 | 1) {
    var j = i + dir;
    if (j < 0 || j >= gal.length || !actual) return;
    var updated = [...gal];
    var temp = updated[i]; updated[i] = updated[j]; updated[j] = temp;
    updated.forEach(function(g, idx) { g.orden = idx; });
    setGal(updated);
    var orden = updated
      .filter(function(g) { return typeof g.id === "number"; })
      .map(function(g) { return { id: g.id as number, orden: g.orden }; });
    await reordenarGaleriaApi(actual.id, orden);
  };

  var handleSave = async function() {
    if (!form.nombre.trim()) { setErr("Nombre obligatorio"); return; }
    setSaving(true);
    setErr(null);
    try {
      // El backend (normalizeBody) acepta camelCase.
      var payload = {
        nombre: form.nombre,
        desc: form.desc,
        descCompleta: form.descCompleta,
        precio: form.precio || "0",
        imagen: form.imagen,
        categoria: form.categoria,
        subcategoria: form.subcategoria?.trim() || null,
        duracionMin: Number(form.duracionMin) || null,
        destacado: form.destacado,
        enPromocion: form.enPromocion,
        precioPromocional: form.enPromocion ? (form.precioPromocional?.trim() || null) : null,
        promocionHasta: form.enPromocion ? (form.promocionHasta || null) : null,
        mostrarGaleriaHome: form.mostrarGaleriaHome,
        mostrarGaleriaProcedimientos: form.mostrarGaleriaProcedimientos,
      } as unknown as Omit<Procedimiento, "id" | "galeria">;

      if (actual) {
        await updateProcedimientoApi(actual.id, payload);
      } else {
        await createProcedimientoApi(payload);
      }
      showToast(actual ? "Procedimiento actualizado" : "Procedimiento creado");
      bustProcedimientosCache(); // refresca el caché público
      load();
      reset();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  var handleDel = async function(id: string | number) {
    try {
      await deleteProcedimientoApi(id);
      setDelId(null); load();
    } catch (e: any) { setErr(e.message); }
  };

  var reset = function() { setForm(emptyForm); setModo("lista"); setActual(null); setGal([]); };

  var startEdit = function(p: Procedimiento) {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setActual(p);
    setForm({
      nombre: p.nombre,
      desc: p.desc,
      descCompleta: (p as any).descCompleta || "",
      precio: String(p.precio),
      imagen: p.imagen,
      categoria: p.categoria,
      subcategoria: p.subcategoria || "",
      duracionMin: p.duracionMin ? String(p.duracionMin) : "",
      destacado: p.destacado || false,
      enPromocion: p.enPromocion || false,
      precioPromocional: p.precioPromocional || "",
      promocionHasta: p.promocionHasta || "",
      mostrarGaleriaHome: p.mostrarGaleriaHome || false,
      mostrarGaleriaProcedimientos:
        p.mostrarGaleriaProcedimientos == null ? true : p.mostrarGaleriaProcedimientos,
      video: "",
    });
    setModo("form");
    loadGal(p.id);
  };

  var IS = { width: "100%", padding: "0.75rem 1rem", borderRadius: 14, border: "1px solid var(--border)", fontSize: "0.98rem", background: "var(--surface)" } as React.CSSProperties;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, color: "var(--text)" }}>Procedimientos</h2>
        {modo === "lista" && <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={function() { reset(); setModo("form"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0.7rem 1.5rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand-deep), #B08968)", color: "var(--brand-contrast)", border: "none", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(176,137,104,0.28)" }}><Plus size={17} /> Nuevo</motion.button>}
      </div>

      {toast && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#E8F5E9", color: "#145A32", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", textAlign: "center" }}>{toast}</motion.div>}
      {err && <div style={{ background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", color: "var(--danger)", padding: "0.5rem 1rem", borderRadius: 12, marginBottom: "0.8rem", fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>{err}<button aria-label="Cerrar aviso" onClick={function() { setErr(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} /></button></div>}

      <AnimatePresence>
        {modo === "form" && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: "1.8rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.2rem" }}>{actual ? "Editar" : "Nuevo"} procedimiento</h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}><Lbl>Nombre *</Lbl><input style={IS} value={form.nombre} onChange={function(e) { setForm({ ...form, nombre: e.target.value }); }} placeholder="Acido Hialuronico" /></div>
              <div><Lbl>Precio (COP)</Lbl><input type="number" style={IS} value={form.precio} onChange={function(e) { setForm({ ...form, precio: e.target.value }); }} placeholder="350000" /></div>
              <div><Lbl>Duracion (min)</Lbl><input type="number" style={IS} value={form.duracionMin} onChange={function(e) { setForm({ ...form, duracionMin: e.target.value }); }} placeholder="60" /></div>
              <div><Lbl>Categoria</Lbl><select value={form.categoria} onChange={function(e) { setForm({ ...form, categoria: e.target.value as Cat }); }} style={IS}><option>Facial</option><option>Corporal</option><option>Capilar</option></select></div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Lbl>Subcategoria (opcional)</Lbl>
                <input
                  style={IS}
                  value={form.subcategoria}
                  onChange={function(e) { setForm({ ...form, subcategoria: e.target.value }); }}
                  placeholder="Ej: Labios, Arrugas, Perfilamiento, Cicatrices..."
                  list="subcategoria-sugerencias"
                />
                {/* Sugerencias derivadas de subcategorías ya usadas en
                    procedimientos existentes — datalist nativo del browser */}
                <datalist id="subcategoria-sugerencias">
                  {Array.from(new Set(procs.map(function(p) { return p.subcategoria || ""; }).filter(function(s) { return !!s; }))).map(function(s) {
                    return <option key={s} value={s} />;
                  })}
                </datalist>
                <small style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                  Agrupa procedimientos dentro de su categoria (ej: dentro de Facial → Labios, Arrugas, Perfilamiento). Se puede repetir entre varios.
                </small>
              </div>
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.destacado} onChange={function(e) { setForm({ ...form, destacado: e.target.checked }); }} style={{ width: 17, height: 17, accentColor: "var(--brand)" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Destacado</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "0.8rem" }}><Lbl>Descripción breve</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.desc} onChange={function(e) { setForm({ ...form, desc: e.target.value }); }} rows={2} placeholder="Se muestra en las cards..." /></div>
            <div style={{ marginBottom: "1.2rem" }}><Lbl>Descripción completa</Lbl><textarea style={{ ...IS, resize: "vertical" as const }} value={form.descCompleta} onChange={function(e) { setForm({ ...form, descCompleta: e.target.value }); }} rows={4} placeholder="Se muestra en la página de detalle..." /></div>

            {/* === PROMOCIÓN === */}
            <div style={{
              marginBottom: "1.2rem",
              padding: "1.2rem 1.3rem",
              background: form.enPromocion
                ? "linear-gradient(135deg, rgba(247,214,128,0.18), rgba(255,230,179,0.1))"
                : "var(--surface-soft)",
              borderRadius: 16,
              border: form.enPromocion
                ? "1.5px solid rgba(247,214,128,0.6)"
                : "1px solid var(--border)",
              transition: "background 0.3s, border-color 0.3s",
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: form.enPromocion ? "1rem" : 0 }}>
                <input
                  type="checkbox"
                  checked={form.enPromocion}
                  onChange={function(e) { setForm({ ...form, enPromocion: e.target.checked }); }}
                  style={{ width: 18, height: 18, accentColor: "#D4A437" }}
                />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={14} fill="currentColor" color="var(--brand)" /> En promoción
                </span>
                <small style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                  Se muestra con descuento y badge especial.
                </small>
              </label>

              <AnimatePresence>
                {form.enPromocion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                      <div>
                        <Lbl>Precio promocional (COP)</Lbl>
                        <input
                          type="text"
                          style={IS}
                          value={form.precioPromocional}
                          onChange={function(e) { setForm({ ...form, precioPromocional: e.target.value }); }}
                          placeholder={form.precio ? `Menor a ${form.precio}` : "250000"}
                        />
                        <small style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                          El precio normal aparecerá tachado al lado.
                        </small>
                      </div>
                      <div>
                        <Lbl>Disponible hasta (opcional)</Lbl>
                        <input
                          type="date"
                          style={IS}
                          value={form.promocionHasta}
                          onChange={function(e) { setForm({ ...form, promocionHasta: e.target.value }); }}
                        />
                        <small style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                          Si lo dejas vacío, no expira automáticamente.
                        </small>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* === VISIBILIDAD EN GALERÍAS === */}
            <div style={{
              marginBottom: "1.2rem",
              padding: "1.2rem 1.3rem",
              background: "var(--surface-soft)",
              borderRadius: 16,
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
                ¿Dónde mostrar este procedimiento?
              </div>
              <small style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.9rem" }}>
                Puedes elegir uno, ambos o ninguno. Si no marcas ninguna, el procedimiento queda oculto al público.
              </small>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "0.85rem 1rem",
                  borderRadius: 12,
                  background: form.mostrarGaleriaHome ? "rgba(176, 137, 104, 0.12)" : "var(--surface)",
                  border: form.mostrarGaleriaHome ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background 0.25s, border-color 0.25s",
                }}>
                  <input
                    type="checkbox"
                    checked={form.mostrarGaleriaHome}
                    onChange={function(e) { setForm({ ...form, mostrarGaleriaHome: e.target.checked }); }}
                    style={{ marginTop: 2, width: 17, height: 17, accentColor: "var(--brand)", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text)" }}>Galería Home</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                      Aparece en la rueda 3D de la página principal.
                    </div>
                  </div>
                </label>

                <label style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "0.85rem 1rem",
                  borderRadius: 12,
                  background: form.mostrarGaleriaProcedimientos ? "rgba(176, 137, 104, 0.12)" : "var(--surface)",
                  border: form.mostrarGaleriaProcedimientos ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background 0.25s, border-color 0.25s",
                }}>
                  <input
                    type="checkbox"
                    checked={form.mostrarGaleriaProcedimientos}
                    onChange={function(e) { setForm({ ...form, mostrarGaleriaProcedimientos: e.target.checked }); }}
                    style={{ marginTop: 2, width: 17, height: 17, accentColor: "var(--brand)", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text)" }}>Galería Procedimientos</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                      Aparece en el listado completo de /procedimientos.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* MAIN IMAGE - only 1, upload replaces */}
            <div style={{ background: "var(--surface-soft)", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}>
              <Lbl>Foto principal</Lbl>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                {form.imagen && (
                  <div style={{ position: "relative" }}>
                    <Image src={form.imagen} alt="" width={120} height={80} quality={70} style={{ height: 80, width: 120, borderRadius: 10, objectFit: "cover", border: "2px solid var(--brand)" }} />
                    <button aria-label="Quitar imagen" title="Quitar imagen" onClick={function() { setForm({ ...form, imagen: "" }); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#C62828", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} /></button>
                  </div>
                )}
                <label style={{ padding: "0.5rem 1.2rem", borderRadius: 12, border: "1px dashed var(--brand)", cursor: uploading ? "wait" : "pointer", fontSize: "0.82rem", color: "var(--brand)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: uploading ? 0.6 : 1 }}>
                  <Upload size={14} /> {uploading ? "Subiendo..." : form.imagen ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleMainImg} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* GALLERY - only in edit mode */}
            {actual && (
              <div style={{ background: "var(--surface-soft)", borderRadius: 16, padding: "1.2rem", marginBottom: "1rem", border: "1px solid var(--border)" }}>
                <h5 style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.98rem", margin: 0, marginBottom: 4 }}>Galería de resultados</h5>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.9rem", margin: 0 }}>Sube fotos de antes/después. Usa las flechas para ordenar.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.8rem" }}>
                  {gal.filter(function(g) { return g.tipo === "imagen"; }).map(function(g, i) {
                    return (
                      <div key={g.id || i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                        <Image src={g.url} alt="" width={90} height={70} quality={65} style={{ width: 90, height: 70, objectFit: "cover", display: "block" }} />
                        <button onClick={function() { galRemove(g); }} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(224, 120, 120, 0.92)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Eliminar"><X size={10} /></button>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.55)", padding: "2px 0" }}>
                          <button onClick={function() { galMove(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", color: "white", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1, padding: 0, display: "flex", alignItems: "center" }} title="Subir"><ChevronUp size={12} /></button>
                          <span style={{ color: "white", fontSize: "0.6rem", fontWeight: 700 }}>{i + 1}</span>
                          <button onClick={function() { galMove(i, 1); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Bajar"><ChevronDown size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                  <label style={{ width: 90, height: 70, borderRadius: 10, border: "2px dashed var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingGal ? "wait" : "pointer", fontSize: "0.72rem", color: "var(--brand)", fontWeight: 600, textAlign: "center", opacity: uploadingGal ? 0.6 : 1, background: "transparent" }}>
                    {uploadingGal ? "..." : "+ Foto"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalAdd} disabled={uploadingGal} />
                  </label>
                </div>

                {/* Videos en galeria */}
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.9rem" }}>
                  <Lbl>Videos (YouTube / Instagram)</Lbl>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-soft)", marginBottom: "0.5rem" }}>Agrega links de videos del procedimiento</p>
                  {gal.filter(function(g) { return g.tipo === "video"; }).map(function(g, i) {
                    return (
                      <div key={g.id || "v" + i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                        <Play size={14} color="var(--brand)" />
                        <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.url}</span>
                        <button onClick={function() { galRemove(g); }} style={{ width: 20, height: 20, borderRadius: "50%", background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} color="#C62828" /></button>
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
                        var it = await addGaleriaItemApi(actual.id, { tipo: "video", url: url });
                        setGal(function(prev) { return [...prev, { id: it.id, url: url, titulo: "", orden: it.orden, tipo: "video" }]; });
                        input.value = "";
                        showToast("Video agregado");
                      } catch (e: any) { setErr(e.message); }
                    }} style={{ padding: "0.45rem 1rem", borderRadius: 10, background: "var(--brand)", color: "var(--brand-contrast)", border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>+ Agregar</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "0.65rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand-deep), #B08968)", color: "var(--brand-contrast)", border: "none", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Guardando..." : "Guardar"}
              </motion.button>
              <button onClick={reset} style={{ padding: "0.65rem 1.5rem", borderRadius: 100, background: "var(--surface-soft)", color: "var(--text)", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {modo === "lista" && (procs.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-soft)", padding: "2rem 0" }}>No hay procedimientos</p> : (() => {
        const ORDEN = ["Facial", "Corporal", "Capilar"];
        const grupos: Record<string, typeof procs> = {};
        procs.forEach(function(p) {
          const k = p.categoria || "Otros";
          (grupos[k] = grupos[k] || []).push(p);
        });
        const cats = Object.keys(grupos).sort(function(a, b) {
          const ia = ORDEN.indexOf(a), ib = ORDEN.indexOf(b);
          if (ia === -1 && ib === -1) return a.localeCompare(b);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {cats.map(function(cat) {
              const items = grupos[cat];
              return (
                <div key={cat}>
                  {/* Encabezado de categoria */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.9rem" }}>
                    <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--text)" }}>{cat}</h3>
                    <span style={{ background: "var(--border)", color: "var(--brand)", padding: "0.15rem 0.7rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 700 }}>{items.length}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    {items.map(function(p, i) {
                      return (
                        <motion.div key={p.id} className="admin-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.1rem 1.4rem", display: "flex", alignItems: "center", gap: "1.1rem" }}>
                          {p.imagen ? <Image src={p.imagen} alt="" width={76} height={76} quality={70} style={{ width: 76, height: 76, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 76, height: 76, borderRadius: 14, background: "var(--border)", flexShrink: 0 }} />}
                          <div className="admin-card-body" style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "1.08rem" }}>{p.nombre}</span>
                              {/* La estrella es un interruptor, no una etiqueta. Destacar
                                  algo es una decision de temporada que se cambia sola; que
                                  obligara a abrir el formulario entero era lo que hacia que
                                  los destacados se quedaran meses sin tocar. */}
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                transition={MUELLE_TACTO}
                                onClick={function() { void guardarCampoSuelto(p.id, { destacado: !p.destacado }); }}
                                aria-pressed={!!p.destacado}
                                title={p.destacado ? "Quitar de destacados" : "Marcar como destacado"}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: p.destacado ? "rgba(232, 201, 160, 0.18)" : "transparent", color: p.destacado ? "var(--brand)" : "var(--text-muted)", border: p.destacado ? "1px solid transparent" : "1px solid var(--border)", padding: "0.2rem 0.6rem", borderRadius: 100, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", font: "inherit" }}
                              >
                                <Star size={11} fill={p.destacado ? "currentColor" : "none"} /> Destacado
                              </motion.button>
                            </div>
                            <p style={{ fontSize: "0.92rem", color: "var(--text-soft)", margin: "0.25rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</p>
                          </div>
                          <PrecioEditable
                            valor={p.precio}
                            onGuardar={async function(nuevo) { await guardarCampoSuelto(p.id, { precio: nuevo }); }}
                          />
                          <div className="admin-card-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <motion.button aria-label="Editar procedimiento" title="Editar procedimiento" whileTap={{ scale: 0.95 }} onClick={function() { startEdit(p); }} style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface-soft)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit3 size={18} color="var(--text)" /></motion.button>
                            {delId === p.id ? (
                              <><button onClick={function() { handleDel(p.id); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "#C62828", color: "white", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Sí</button><button onClick={function() { setDelId(null); }} style={{ padding: "0.4rem 0.8rem", borderRadius: 10, background: "var(--border)", border: "none", fontSize: "0.85rem", cursor: "pointer" }}>No</button></>
                            ) : (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={function() { setDelId(p.id); }} style={{ width: 42, height: 42, borderRadius: 12, background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", border: "1px solid #e4bfbf", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={18} color="#b02e2e" /></motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })())}
    </div>
  );
}

function Lbl(props: { children: string }) { return <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 3 }}>{props.children}</label>; }