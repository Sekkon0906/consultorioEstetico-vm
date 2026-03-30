"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Charla {
  id: number; titulo: string; descripcion: string;
  detalle?: string; imagen: string; galeria?: string[]; fecha?: string;
}

export default function FormacionContinua() {
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [charlaSeleccionada, setCharlaSeleccionada] = useState<number | null>(null);
  const [galeriaIndex, setGaleriaIndex] = useState(0);
  const seccionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("charlas").select("id, titulo, descripcion, detalle, imagen, fecha").order("fecha", { ascending: false, nullsFirst: false }).order("creado_en", { ascending: false });
        if (error) throw error;
        const lista = data ?? [];
        const full = await Promise.all(lista.map(async (c) => {
          const { data: g } = await supabase.from("charla_galeria").select("url").eq("charla_id", c.id).order("orden", { ascending: true });
          return { ...c, galeria: (g ?? []).map((x: { url: string }) => x.url) } as Charla;
        }));
        setCharlas(full);
      } catch (e) { console.error("Error charlas:", e); }
    })();
  }, []);

  useEffect(() => {
    const handle = (e: WheelEvent) => {
      if (cooldown || showModal || charlas.length === 0) return;
      const sec = seccionRef.current;
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.5 && r.bottom >= window.innerHeight * 0.5) {
        e.preventDefault();
        setCooldown(true);
        setActiveIndex(p => e.deltaY > 0 ? (p + 1) % charlas.length : p === 0 ? charlas.length - 1 : p - 1);
        setTimeout(() => setCooldown(false), 900);
      }
    };
    window.addEventListener("wheel", handle, { passive: false });
    return () => window.removeEventListener("wheel", handle);
  }, [cooldown, showModal, charlas]);

  const siguiente = () => charlaSeleccionada !== null && setGaleriaIndex(p => (p + 1) % (charlas[charlaSeleccionada]?.galeria?.length || 1));
  const anterior = () => charlaSeleccionada !== null && setGaleriaIndex(p => p === 0 ? (charlas[charlaSeleccionada]?.galeria?.length || 1) - 1 : p - 1);

  if (charlas.length === 0) return (
    <section style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", background: "#FBF8F4" }}>
      <div className="spinner-border" style={{ color: "#B08968" }} role="status" />
    </section>
  );

  const charla = charlas[activeIndex];

  return (
    <>
      <section ref={seccionRef} style={{ position: "relative", minHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem", background: "linear-gradient(175deg, #F7EFE7 0%, #FBF8F4 100%)", overflow: "hidden" }}>

        {/* Orbes decorativos */}
        <div style={{ position: "absolute", width: 350, height: 350, top: "5%", right: "10%", borderRadius: "50%", background: "radial-gradient(circle, rgba(176,137,104,0.08) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 300, height: 300, bottom: "10%", left: "5%", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,173,141,0.1) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

        {/* Label */}
        <motion.span initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B08968", background: "rgba(176,137,104,0.07)", border: "1px solid rgba(176,137,104,0.18)", borderRadius: 100, padding: "0.4rem 1.3rem", marginBottom: "2rem" }}>
          Formacion Continua
        </motion.span>

        {/* Card principal */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: 920, background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 24, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 20px 60px rgba(78,59,43,0.1)", overflow: "hidden" }}
          >
            {/* Imagen grande */}
            <div style={{ position: "relative", width: "100%", height: 420, overflow: "hidden" }}>
              {charla.imagen ? (
                <img src={charla.imagen} alt={charla.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #4E3B2B, #B08968)" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />

              {/* Fecha badge */}
              {charla.fecha && (
                <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", color: "white", padding: "0.35rem 1rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>
                  {new Date(charla.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              )}

              {/* Counter badge */}
              <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", color: "white", padding: "0.35rem 1rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>
                {activeIndex + 1} / {charlas.length}
              </div>
            </div>

            {/* Texto */}
            <div style={{ padding: "2rem 2.5rem 2.5rem" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.8rem", lineHeight: 1.2 }}>
                {charla.titulo}
              </h3>
              <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, marginBottom: "1rem" }} />
              <p style={{ fontSize: "0.98rem", color: "#5A4A3A", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                {charla.descripcion}
              </p>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(176,137,104,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowModal(true); setCharlaSeleccionada(activeIndex); setGaleriaIndex(0); }}
                style={{ background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, padding: "0.8rem 2.2rem", fontWeight: 600, fontSize: "0.92rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(176,137,104,0.25)" }}
              >
                Ver detalle y galeria
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
          <button onClick={() => setActiveIndex(activeIndex === 0 ? charlas.length - 1 : activeIndex - 1)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(176,137,104,0.08)", border: "1px solid rgba(176,137,104,0.2)", color: "#B08968", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(176,137,104,0.08)"; }}>
            <i className="fas fa-chevron-left" style={{ fontSize: "0.75rem" }} />
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {charlas.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)}
                style={{ width: activeIndex === i ? 24 : 10, height: 10, borderRadius: 5, border: "none", background: activeIndex === i ? "#B08968" : "rgba(176,137,104,0.25)", cursor: "pointer", transition: "all 0.3s" }} />
            ))}
          </div>
          <button onClick={() => setActiveIndex((activeIndex + 1) % charlas.length)}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(176,137,104,0.08)", border: "1px solid rgba(176,137,104,0.2)", color: "#B08968", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(176,137,104,0.08)"; }}>
            <i className="fas fa-chevron-right" style={{ fontSize: "0.75rem" }} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "0.73rem", color: "#9B8575", marginTop: "0.8rem", fontStyle: "italic" }}>Desplaza con la rueda o usa las flechas</p>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && charlaSeleccionada !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: "#FFFDF9", borderRadius: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.3)", width: "90%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              onClick={e => e.stopPropagation()}>

              <button onClick={() => setShowModal(false)}
                style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(78,59,43,0.08)", border: "none", color: "#4E3B2B", fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(78,59,43,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(78,59,43,0.08)"; }}>
                <i className="fas fa-times" />
              </button>

              {(charlas[charlaSeleccionada].galeria?.length || 0) > 0 ? (
                <div style={{ position: "relative", borderRadius: "24px 24px 0 0", overflow: "hidden", background: "#000" }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={galeriaIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                      {(() => {
                        const m = charlas[charlaSeleccionada].galeria?.[galeriaIndex] || "";
                        if (m.includes("youtube") || m.includes("youtu.be")) {
                          const embed = m.includes("embed/") ? m : m.replace("watch?v=", "embed/");
                          return <iframe src={embed} title="Video" allowFullScreen style={{ width: "100%", height: 420, border: "none" }} />;
                        }
                        return <img src={m} alt="Galeria" style={{ width: "100%", height: 420, objectFit: "cover" }} />;
                      })()}
                    </motion.div>
                  </AnimatePresence>
                  {(charlas[charlaSeleccionada].galeria?.length || 0) > 1 && (
                    <>
                      <button onClick={anterior} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fas fa-chevron-left" style={{ fontSize: "0.8rem" }} />
                      </button>
                      <button onClick={siguiente} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fas fa-chevron-right" style={{ fontSize: "0.8rem" }} />
                      </button>
                    </>
                  )}
                  <div style={{ position: "absolute", top: 12, right: 60, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "white", padding: "0.3rem 0.9rem", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600 }}>
                    {galeriaIndex + 1} / {charlas[charlaSeleccionada]?.galeria?.length || 1}
                  </div>
                  <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                    {charlas[charlaSeleccionada].galeria?.map((_, i) => (
                      <button key={i} onClick={() => setGaleriaIndex(i)} style={{ width: galeriaIndex === i ? 20 : 8, height: 8, borderRadius: 4, border: "none", background: galeriaIndex === i ? "#C9AD8D" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </div>
              ) : charlas[charlaSeleccionada].imagen ? (
                <div style={{ borderRadius: "24px 24px 0 0", overflow: "hidden" }}>
                  <img src={charlas[charlaSeleccionada].imagen} alt={charlas[charlaSeleccionada].titulo} style={{ width: "100%", height: 380, objectFit: "cover" }} />
                </div>
              ) : null}

              <div style={{ padding: "2rem 2.5rem 2.5rem" }}>
                {charlas[charlaSeleccionada].fecha && (
                  <p style={{ fontSize: "0.8rem", color: "#B08968", fontWeight: 600, marginBottom: "0.5rem" }}>
                    {new Date(charlas[charlaSeleccionada].fecha!).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "1rem", lineHeight: 1.2 }}>
                  {charlas[charlaSeleccionada].titulo}
                </h4>
                <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, marginBottom: "1.2rem" }} />
                <p style={{ fontSize: "1rem", color: "#5A4A3A", lineHeight: 1.75 }}>
                  {charlas[charlaSeleccionada].detalle || charlas[charlaSeleccionada].descripcion}
                </p>
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <button onClick={() => setShowModal(false)}
                    style={{ background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, padding: "0.75rem 2.2rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(176,137,104,0.25)", transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}