"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FaCalendarCheck, FaArrowLeft, FaPlay, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("procedures.detail");
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

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}><div className="spinner-border" style={{ color: "var(--brand)" }} /></div>;
  if (!proc) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text)", gap: "1rem" }}>
      <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{t("notFound")}</p>
      <button onClick={() => router.push("/procedimientos")} style={{ padding: "0.7rem 2rem", background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, fontWeight: 600, cursor: "pointer" }}>{t("back2")}</button>
    </div>
  );

  const descDetalle = proc.descripcion_completa || proc.descripcion;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--bg) 0%, var(--surface-soft) 100%)" }}>
      <style>{`
        @media (max-width: 820px) {
          .proc-detail-hero { height: 280px !important; }
          .proc-detail-body { padding: 1.5rem 1.4rem 2rem !important; }
          .proc-detail-price-row { padding: 1.2rem 1.2rem !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          .proc-detail-hero { height: 220px !important; }
          .proc-detail-body { padding: 1.25rem 1rem 1.75rem !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/procedimientos" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-soft)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none", marginBottom: "1.5rem", padding: "0.5rem 1rem", borderRadius: 100, border: "1px solid var(--border)", background: "var(--surface)" }}>
            <FaArrowLeft style={{ fontSize: "0.75rem" }} /> {t("back")}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ background: "var(--surface)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 12px 40px rgba(78,59,43,0.08)", overflow: "hidden" }}>

          <div className="proc-detail-hero" style={{ position: "relative", width: "100%", height: 360, overflow: "hidden" }}>
            {proc.imagen ? (
              <Image
                src={proc.imagen}
                alt={proc.nombre}
                fill
                priority
                sizes="(max-width: 1000px) 100vw, 1000px"
                quality={90}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #E9DED2, #B08968)" }} />
            )}
            {/* Gradient bottom para legibilidad del título */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)" }} />
            <span style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", color: "white", padding: "0.4rem 1.2rem", borderRadius: 100, fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>{proc.categoria}</span>
            <div style={{ position: "absolute", bottom: 28, left: 32, right: 32 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 700, color: "white", textShadow: "0 4px 16px rgba(0,0,0,0.5)", margin: 0, lineHeight: 1.15 }}>{proc.nombre}</h1>
              <div style={{ width: 64, height: 3, background: "linear-gradient(90deg, #E8C9A0, #C9AD8D)", borderRadius: 2, marginTop: "0.8rem" }} />
            </div>
          </div>

          <div className="proc-detail-body" style={{ padding: "2.5rem 2.5rem 0" }}>
            {/* 1. Descripción */}
            <section style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.9rem" }}>{t("descriptionTitle")}</h2>
              <p style={{ fontSize: "1.02rem", color: "var(--text-soft)", lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>{descDetalle}</p>
            </section>

            {/* 2. Info chips (duración, seguridad, cuidado) */}
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
              {proc.duracion_min && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem 1.1rem", borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.9rem", flexShrink: 0 }}><i className="fas fa-clock" /></div>
                  <div><div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("approxDuration")}</div><div style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text)" }}>{proc.duracion_min} {t("minutes")}</div></div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem 1.1rem", borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.9rem", flexShrink: 0 }}><i className="fas fa-shield-alt" /></div>
                <div><div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("safety")}</div><div style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text)" }}>{t("certified")}</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem 1.1rem", borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.9rem", flexShrink: 0 }}><i className="fas fa-user-md" /></div>
                <div><div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("care")}</div><div style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text)" }}>{t("personalized")}</div></div>
              </div>
            </section>

            {/* 3. Galería de resultados (si existe) */}
            {galeria.length > 0 && (
              <section style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.2rem" }}>{t("galleryTitle")}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {galeria.map((m, i) => (
                <motion.div key={m.id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  onClick={() => setModalIndex(i)}
                  style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 4px 14px rgba(78,59,43,0.08)", transition: "transform 0.3s, box-shadow 0.3s", background: "var(--surface-soft)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(78,59,43,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(78,59,43,0.08)"; }}>
                  {m.tipo === "imagen" ? (
                    <div style={{ position: "relative", width: "100%", height: 200 }}>
                      <Image
                        src={m.url}
                        alt={m.titulo || ""}
                        fill
                        sizes="(max-width: 640px) 92vw, 260px"
                        quality={75}
                        style={{ objectFit: "cover", display: "block" }}
                      />
                    </div>
                  ) : (
                    <div style={{ position: "relative", height: 200, background: "#000" }}>
                      <Image
                        src={`https://img.youtube.com/vi/${(m.url.split("/embed/")[1] || "").split("?")[0]}/hqdefault.jpg`}
                        alt="Video"
                        fill
                        sizes="(max-width: 640px) 92vw, 260px"
                        quality={70}
                        style={{ objectFit: "cover", opacity: 0.7 }}
                        unoptimized
                      />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><FaPlay style={{ color: "white", fontSize: "2rem" }} /></div>
                    </div>
                  )}
                  {m.titulo && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.6), transparent)", padding: "1.5rem 0.8rem 0.6rem" }}><p style={{ color: "white", fontSize: "0.82rem", fontWeight: 600, margin: 0 }}>{m.titulo}</p></div>}
                </motion.div>
              ))}
                </div>
              </section>
            )}

            {/* 4. Precio + Book CTA (siempre al fondo) */}
            <section className="proc-detail-price-row" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", padding: "1.8rem 2rem", background: "var(--bg-elevated)", borderRadius: 18, border: "1px solid var(--border)", marginBottom: "2.5rem" }}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.3rem" }}>{t("standardPrice")}</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, marginBottom: "0.3rem" }}>${formatPrecio(proc.precio)}</p>
                <small style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{t("priceNote")}</small>
              </div>
              <Link href={`/agendar?proc=${encodeURIComponent(proc.nombre)}`}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", padding: "1rem 2.4rem", borderRadius: 100, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 6px 22px rgba(176,137,104,0.35)", whiteSpace: "nowrap" }}>
                <FaCalendarCheck /> {t("bookCta")}
              </Link>
            </section>
          </div>
        </motion.div>
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
                    <div style={{ position: "relative", width: "100%", height: "75vh" }}>
                      <Image
                        src={galeria[modalIndex].url}
                        alt=""
                        fill
                        sizes="(max-width: 900px) 100vw, 900px"
                        quality={90}
                        style={{ objectFit: "contain", display: "block" }}
                      />
                    </div>
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