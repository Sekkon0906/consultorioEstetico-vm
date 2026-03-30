"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaCalendarCheck, FaEye } from "react-icons/fa";
import type { Procedimiento } from "../types/domain";
import { getProcedimientosApi } from "../services/procedimientosApi";
import dynamic from "next/dynamic";

const FondoAnimado = dynamic(() => import("./FondoAnimado"), { ssr: false });
const SiluetasAnimadas = dynamic(() => import("./SiluetasAnimadas"), { ssr: false });

function formatPrecio(precio: string | number): string {
  if (typeof precio === "number") return precio.toLocaleString("es-CO");
  return precio.replace(/\d{1,3}(?:\d{3})*(?:\.\d+)?/g, (m) => {
    const n = parseFloat(m.replace(/\./g, "").replace(/,/g, "."));
    return isNaN(n) ? m : n.toLocaleString("es-CO");
  });
}

const CATEGORIAS = [
  { key: "Facial", titulo: "Procedimientos Faciales", icon: "fas fa-smile", desc: "Tratamientos para rejuvenecer, hidratar y perfeccionar tu rostro" },
  { key: "Corporal", titulo: "Procedimientos Corporales", icon: "fas fa-child", desc: "Soluciones esteticas para el cuidado integral de tu cuerpo" },
  { key: "Capilar", titulo: "Procedimientos Capilares", icon: "fas fa-cut", desc: "Tecnologias avanzadas para la salud y vitalidad de tu cabello" },
];

export default function ProcedimientosPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProcedimientosApi().then(d => { setProcedimientos(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <main style={{ position: "relative", minHeight: "100vh", padding: "3rem 1rem 5rem", overflow: "hidden" }}>
      {/* Backgrounds */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <FondoAnimado tipo={openSection} />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.8 }}>
        <SiluetasAnimadas tipo={openSection} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B08968", background: "rgba(176,137,104,0.07)", border: "1px solid rgba(176,137,104,0.18)", borderRadius: 100, padding: "0.4rem 1.3rem", marginBottom: "1rem" }}>Nuestros servicios</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.8rem" }}>Procedimientos Medicos y Esteticos</h1>
          <div style={{ width: 50, height: 3, background: "linear-gradient(90deg, #C9AD8D, #B08968)", borderRadius: 2, margin: "0 auto 0.8rem" }} />
          <p style={{ fontSize: "1.05rem", color: "#7A6554", maxWidth: 600, margin: "0 auto" }}>Tratamientos faciales, corporales y capilares con tecnicas seguras y personalizadas</p>
        </motion.div>

        {loading && <div style={{ textAlign: "center", padding: "3rem 0" }}><div className="spinner-border" style={{ color: "#B08968" }} /></div>}

        {/* Accordion sections */}
        {!loading && CATEGORIAS.map((cat, catIdx) => {
          const items = procedimientos.filter(p => p.categoria === cat.key);
          const isOpen = openSection === cat.key;

          return (
            <motion.div key={cat.key}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: catIdx * 0.1 }}
              style={{ marginBottom: "1rem", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(176,137,104,0.15)", boxShadow: "0 4px 16px rgba(78,59,43,0.06)", background: "rgba(255,253,250,0.85)", backdropFilter: "blur(8px)" }}
            >
              {/* Accordion header */}
              <button onClick={() => toggle(cat.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 1.5rem", background: isOpen ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "transparent", border: "none", cursor: "pointer", transition: "all 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isOpen ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1rem" }}>
                    <i className={cat.icon} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: isOpen ? "white" : "#3A2A1A" }}>{cat.titulo}</div>
                    <div style={{ fontSize: "0.78rem", color: isOpen ? "rgba(255,255,255,0.8)" : "#8A7565", marginTop: 2 }}>{cat.desc}</div>
                  </div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <FaChevronDown style={{ color: isOpen ? "white" : "#B08968", fontSize: "0.9rem" }} />
                </motion.div>
              </button>

              {/* Accordion content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "1.5rem", background: "rgba(250,249,247,0.5)" }}>
                      {items.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#9B8575", padding: "2rem 0" }}>No hay procedimientos en esta categoria por el momento.</p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.2rem" }}>
                          {items.map((p, i) => (
                            <motion.div key={p.id}
                              initial={{ opacity: 0, y: 20, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                              style={{ background: "rgba(255,253,250,0.95)", borderRadius: 16, border: "1px solid rgba(176,137,104,0.1)", overflow: "hidden", boxShadow: "0 4px 14px rgba(78,59,43,0.05)", transition: "box-shadow 0.3s, transform 0.3s", display: "flex", flexDirection: "column" }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 30px rgba(78,59,43,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(78,59,43,0.05)"; e.currentTarget.style.transform = ""; }}
                            >
                              {/* Image */}
                              <div style={{ position: "relative", overflow: "hidden", height: 220 }}>
                                {p.imagen ? (
                                  <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ""; }} />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", background: "#E9DED2", display: "flex", alignItems: "center", justifyContent: "center", color: "#B08968" }}>Sin imagen</div>
                                )}
                              </div>

                              {/* Content */}
                              <div style={{ padding: "1.2rem 1.3rem 1.4rem", flex: 1, display: "flex", flexDirection: "column" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.4rem" }}>{p.nombre}</h3>
                                <p style={{ fontSize: "0.83rem", color: "#6C584C", lineHeight: 1.55, marginBottom: "0.7rem", flex: 1 }}>
                                  {p.desc.length > 100 ? p.desc.slice(0, 100) + "..." : p.desc}
                                </p>
                                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#B08968", marginBottom: "0.2rem" }}>Precio: ${formatPrecio(p.precio)}</p>
                                <small style={{ fontSize: "0.7rem", color: "#9B8575", display: "block", marginBottom: "1rem" }}>*Puede variar segun valoracion medica</small>

                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <Link href={`/agendar?proc=${encodeURIComponent(p.nombre)}`}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0.6rem 0", borderRadius: 100, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.3s" }}>
                                    <FaCalendarCheck style={{ fontSize: "0.75rem" }} /> Agendar
                                  </Link>
                                  <Link href={`/procedimientos/${p.id}`}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0.6rem 0", borderRadius: 100, border: "1px solid rgba(176,137,104,0.3)", color: "#6C584C", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", transition: "all 0.3s", background: "transparent" }}>
                                    <FaEye style={{ fontSize: "0.75rem" }} /> Ver detalle
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}