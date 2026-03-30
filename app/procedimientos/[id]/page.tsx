"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FaCalendarCheck, FaArrowLeft, FaPlay, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

function formatPrecio(precio: string | number): string {
  if (typeof precio === "number") return precio.toLocaleString("es-CO");
  return String(precio).replace(/\d{1,3}(?:\d{3})*(?:\.\d+)?/g, (m) => {
    const n = parseFloat(m.replace(/\./g, "").replace(/,/g, "."));
    return isNaN(n) ? m : n.toLocaleString("es-CO");
  });
}

interface Proc { id: string; nombre: string; descripcion: string; descripcion_completa: string; precio: string; imagen: string; categoria: string; duracion_min: number | null; }
interface MediaItem { id: string; tipo: string; url: string; titulo: string; descripcion: string; }

export default function ProcedimientoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [proc, setProc] = useState<Proc | null>(null);
  const [galeria, setGaleria] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Query Supabase directly - no API dependency
    Promise.all([
      supabase.from("procedimientos").select("id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, duracion_min").eq("id", id).single(),
      supabase.from("procedimiento_galeria").select("id, tipo, url, titulo, descripcion, orden").eq("procedimiento_id", id).order("orden", { ascending: true }),
    ]).then(([procRes, galRes]) => {
      if (!procRes.error && procRes.data) {
        setProc(procRes.data as Proc);
      }
      if (!galRes.error && galRes.data) {
        setGaleria(galRes.data.map((g: any) => ({ id: String(g.id), tipo: g.tipo || "imagen", url: g.url, titulo: g.titulo || "", descripcion: g.descripcion || "" })));
      }
    }).catch((e) => console.error("Error:", e)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (modalIndex === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setModalIndex(p => p !== null ? (p > 0 ? p - 1 : galeria.length - 1) : null);
      if (e.key === "ArrowRight") setModalIndex(p => p !== null ? (p < galeria.length - 1 ? p + 1 : 0) : null);
      if (e.key === "Escape") setModalIndex(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [modalIndex, galeria.length]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F7" }}><div className="spinner-border" style={{ color: "#B08968" }} /></div>;
  if (!proc) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF9F7", color: "#4E3B2B", gap: "1rem" }}>
      <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>Procedimiento no encontrado</p>
      <button onClick={() => router.push("/procedimientos")} style={{ padding: "0.7rem 2rem", background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, fontWeight: 600, cursor: "pointer" }}>Volver</button>
    </div>
  );

  const descDetalle = proc.descripcion_completa || proc.descripcion;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #FAF9F7 0%, #F5EEE5 100%)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/procedimientos" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#6C584C", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none", marginBottom: "1.5rem", padding: "0.5rem 1rem", borderRadius: 100, border: "1px solid rgba(176,137,104,0.2)", background: "rgba(255,253,250,0.8)" }}>
            <FaArrowLeft style={{ fontSize: "0.75rem" }} /> Volver a procedimientos
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 12px 40px rgba(78,59,43,0.08)", overflow: "hidden" }}>

          <div style={{ position: "relative", width: "100%", height: 380, overflow: "hidden" }}>
            {proc.imagen ? (
              <img src={proc.imagen} alt={proc.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #E9DED2, #B08968)" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 40%)" }} />
            <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", color: "white", padding: "0.3rem 1rem", borderRadius: 100, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{proc.categoria}</span>
            <h1 style={{ position: "absolute", bottom: 20, left: 24, fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.3)", margin: 0 }}>{proc.nombre}</h1>
          </div>

          <div style={{ padding: "2rem 2.5rem 2.5rem" }}>
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, marginBottom: "1rem" }} />
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.8rem" }}>Descripcion del procedimiento</h2>
              <p style={{ fontSize: "1rem", color: "#5A4A3A", lineHeight: 1.8, whiteSpace: "pre-line" }}>{descDetalle}</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", padding: "1.5rem 2rem", background: "linear-gradient(145deg, #FFFBF7, #F0E5D8)", borderRadius: 18, border: "1px solid rgba(176,137,104,0.12)", marginBottom: "2rem" }}>
              <div style={{ flex: "1 1 auto" }}>
                <p style={{ fontSize: "0.72rem", color: "#8A7565", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.2rem" }}>Precio estandar</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "#3A2A1A", lineHeight: 1, marginBottom: "0.2rem" }}>${formatPrecio(proc.precio)}</p>
                <small style={{ fontSize: "0.72rem", color: "#9B8575" }}>*Puede variar segun valoracion medica</small>
              </div>
              <Link href={`/agendar?proc=${encodeURIComponent(proc.nombre)}`}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", padding: "0.9rem 2.2rem", borderRadius: 100, fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", boxShadow: "0 4px 18px rgba(176,137,104,0.3)", whiteSpace: "nowrap" }}>
                <FaCalendarCheck /> Agendar cita
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {proc.duracion_min && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem", borderRadius: 14, background: "#FFFBF7", border: "1px solid rgba(176,137,104,0.1)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", flexShrink: 0 }}><i className="fas fa-clock" /></div>
                  <div><div style={{ fontSize: "0.78rem", color: "#8A7565" }}>Duracion aprox.</div><div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#3A2A1A" }}>{proc.duracion_min} min</div></div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem", borderRadius: 14, background: "#FFFBF7", border: "1px solid rgba(176,137,104,0.1)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", flexShrink: 0 }}><i className="fas fa-shield-alt" /></div>
                <div><div style={{ fontSize: "0.78rem", color: "#8A7565" }}>Seguridad</div><div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#3A2A1A" }}>Procedimiento certificado</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem", borderRadius: 14, background: "#FFFBF7", border: "1px solid rgba(176,137,104,0.1)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", flexShrink: 0 }}><i className="fas fa-user-md" /></div>
                <div><div style={{ fontSize: "0.78rem", color: "#8A7565" }}>Atencion</div><div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#3A2A1A" }}>Personalizada</div></div>
              </div>
            </div>
          </div>
        </motion.div>

        {galeria.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "1.5rem", textAlign: "center" }}>Galeria de resultados</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {galeria.map((m, i) => (
                <motion.div key={m.id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  onClick={() => setModalIndex(i)}
                  style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 4px 14px rgba(78,59,43,0.08)", transition: "transform 0.3s, box-shadow 0.3s", background: "#E9DED2" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(78,59,43,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(78,59,43,0.08)"; }}>
                  {m.tipo === "imagen" ? (
                    <img src={m.url} alt={m.titulo || ""} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ position: "relative", height: 200, background: "#000" }}>
                      <img src={`https://img.youtube.com/vi/${(m.url.split("/embed/")[1] || "").split("?")[0]}/hqdefault.jpg`} alt="Video" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><FaPlay style={{ color: "white", fontSize: "2rem" }} /></div>
                    </div>
                  )}
                  {m.titulo && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.6), transparent)", padding: "1.5rem 0.8rem 0.6rem" }}><p style={{ color: "white", fontSize: "0.82rem", fontWeight: 600, margin: 0 }}>{m.titulo}</p></div>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {modalIndex !== null && galeria[modalIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}
            onClick={() => setModalIndex(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ position: "relative", maxWidth: 900, width: "100%", background: "#1a1a1a", borderRadius: 20, overflow: "hidden" }}
              onClick={e => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div key={modalIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {galeria[modalIndex].tipo === "imagen" ? (
                    <img src={galeria[modalIndex].url} alt="" style={{ width: "100%", maxHeight: "75vh", objectFit: "cover", display: "block" }} />
                  ) : (
                    <iframe src={galeria[modalIndex].url} title="Video" allowFullScreen style={{ width: "100%", height: "60vh", border: "none" }} />
                  )}
                </motion.div>
              </AnimatePresence>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7), transparent)", padding: "2rem 1.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "white", fontWeight: 600 }}>{galeria[modalIndex].titulo || proc.nombre}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{modalIndex + 1} / {galeria.length}</span>
              </div>
              <button onClick={() => setModalIndex(null)} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes /></button>
              {galeria.length > 1 && (
                <>
                  <button onClick={() => setModalIndex(p => p !== null ? (p > 0 ? p - 1 : galeria.length - 1) : null)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaChevronLeft /></button>
                  <button onClick={() => setModalIndex(p => p !== null ? (p < galeria.length - 1 ? p + 1 : 0) : null)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaChevronRight /></button>
                </>
              )}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                {galeria.map((_, i) => (
                  <button key={i} onClick={() => setModalIndex(i)} style={{ width: modalIndex === i ? 20 : 8, height: 8, borderRadius: 4, border: "none", background: modalIndex === i ? "#C9AD8D" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}