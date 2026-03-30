"use client";

import { IMG } from "@/lib/imagenes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const galleryImages = [
  { src: IMG.consultorioRelleno[0], label: "Sala de procedimiento" },
  { src: IMG.consultorioRelleno[1], label: "Divisiones y privacidad" },
  { src: IMG.consultorioRelleno[2], label: "Zona de trabajo" },
  { src: IMG.consultorioRelleno[3], label: "Acceso y luz natural" },
  { src: IMG.consultorioRelleno[4], label: "Detalle de ambiente" },
];

function useReveal(t = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: t });
    o.observe(el);
    return () => o.disconnect();
  }, [t]);
  return { ref, v };
}

export default function ConsultorioPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const heroRef = useReveal(0.1);
  const descRef = useReveal();
  const galRef = useReveal(0.1);

  const closeModal = () => setSelectedIndex(null);
  const showPrev = () => setSelectedIndex(p => p === null ? 0 : (p - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () => setSelectedIndex(p => p === null ? 0 : (p + 1) % galleryImages.length);

  // Keyboard nav
  useEffect(() => {
    if (selectedIndex === null) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selectedIndex]);

  const currentImage = selectedIndex !== null ? galleryImages[selectedIndex] : null;

  const rs = (vis: boolean, d = 0): React.CSSProperties => ({
    opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(35px)",
    transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${d}s, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${d}s`,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F1", color: "#2B2B2B", overflow: "hidden" }}>

      {/* HERO */}
      <section style={{ position: "relative", width: "100%", height: "85vh", overflow: "hidden" }}>
        <img src={IMG.consultorioPrincipal} alt="Consultorio principal" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)" }} />

        <div ref={heroRef.ref} style={{ ...rs(heroRef.v), position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "white", padding: "0 1.5rem" }}>
          <span style={{ fontSize: "0.78rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1rem", opacity: 0.85 }}>Espacio medico estetico</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, marginBottom: "1rem" }}>Nuestro Consultorio</h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 700, lineHeight: 1.6, opacity: 0.9 }}>
            Un ambiente disenado para tu bienestar, donde la estetica, la tecnologia y la calma se integran en cada detalle.
          </p>
          <div style={{ marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", padding: "0.7rem 1.5rem", borderRadius: 100, border: "1px solid rgba(255,255,255,0.15)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#86efac", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.85rem" }}>Atmosfera tranquila - Equipos modernos - Atencion personalizada</span>
          </div>
        </div>
      </section>

      {/* DESCRIPCION */}
      <section ref={descRef.ref} style={{ ...rs(descRef.v), maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem 3rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 600, color: "#B08968", marginBottom: "1rem" }}>
          Elegancia, confort y tecnologia
        </h2>
        <div style={{ width: 50, height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)", borderRadius: 2, margin: "0 auto 1.2rem" }} />
        <p style={{ fontSize: "1.05rem", lineHeight: 1.75, color: "rgba(43,43,43,0.75)", maxWidth: 650, margin: "0 auto" }}>
          Cada area del consultorio ha sido pensada para proporcionar comodidad, privacidad y una experiencia estetica profesional y calida.
        </p>
      </section>

      {/* GALERIA */}
      <section ref={galRef.ref} style={{ padding: "0 1.5rem 5rem" }}>
        <div style={{ ...rs(galRef.v), maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 600, color: "#B08968", textAlign: "center", marginBottom: "2.5rem" }}>
            Galeria del consultorio
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.2rem" }}>
            {galleryImages.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={galRef.v ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(78,59,43,0.15)" }}
                style={{ borderRadius: 18, overflow: "hidden", cursor: "pointer", position: "relative", background: "#E9DED2", boxShadow: "0 6px 20px rgba(78,59,43,0.08)", transition: "box-shadow 0.3s" }}
                onClick={() => setSelectedIndex(index)}
              >
                <img src={img.src} alt={img.label} style={{ width: "100%", height: 280, objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }} />

                {/* Overlay on hover */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 50%)", opacity: 0, transition: "opacity 0.3s", pointerEvents: "none" }}
                  className="gallery-overlay" />

                {/* Label */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{img.label}</span>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.75rem" }}>
                    <i className="fas fa-expand" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {currentImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", padding: "1rem" }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", maxWidth: 950, width: "100%", borderRadius: 20, overflow: "hidden", background: "#1a1a1a" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={currentImage.src}
                  alt={currentImage.label}
                  style={{ width: "100%", height: "auto", maxHeight: "78vh", objectFit: "cover", display: "block" }}
                />
              </AnimatePresence>

              {/* Label bar */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)", padding: "2rem 1.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{currentImage.label}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{(selectedIndex ?? 0) + 1} / {galleryImages.length}</span>
              </div>

              {/* Arrows */}
              <button onClick={showPrev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                <i className="fas fa-chevron-left" />
              </button>
              <button onClick={showNext} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                <i className="fas fa-chevron-right" />
              </button>

              {/* Close */}
              <button onClick={closeModal} style={{ position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                <i className="fas fa-times" />
              </button>

              {/* Dots */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                {galleryImages.map((_, i) => (
                  <button key={i} onClick={() => setSelectedIndex(i)} style={{ width: selectedIndex === i ? 22 : 8, height: 8, borderRadius: 4, border: "none", background: selectedIndex === i ? "#C9AD8D" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP */}
      <section style={{ padding: "0 1.5rem 5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", background: "white" }}>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600, color: "#B08968", marginBottom: "0.5rem" }}>Donde estamos ubicados?</h3>
            <p style={{ fontSize: "0.92rem", color: "rgba(43,43,43,0.7)" }}>Carrera 5ta #11-24. Edificio Torre Empresarial. Consultorio 502. Ibague - Tolima.</p>
          </div>
          <div style={{ width: "100%", height: 360 }}>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d994.454304702495!2d-75.24131428635316!3d4.445089870529062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c4845c124d1d%3A0x4c5542efc906b982!2sEdificio%20Torre%20Empresarial!5e0!3m2!1ses-419!2sco!4v1763922944777!5m2!1ses-419!2sco"
              loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
      `}</style>
    </div>
  );
}