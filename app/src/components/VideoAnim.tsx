"use client";

import { useEffect, useRef, useState } from "react";
import { IMG } from "@/lib/imagenes";

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

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number, w = 0, h = 0;
    const resize = () => { const p = canvas.parentElement; if (!p) return; w = p.offsetWidth; h = p.offsetHeight; canvas.width = w; canvas.height = h; };
    resize();
    window.addEventListener("resize", resize);
    interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; da: number; shape: number; }
    const ps: P[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * (w || 1400), y: Math.random() * (h || 800),
      vx: (Math.random() - 0.5) * 0.4, vy: -0.1 - Math.random() * 0.25,
      r: 2 + Math.random() * 5, a: Math.random(), da: 0.004 + Math.random() * 0.008,
      shape: Math.floor(Math.random() * 3),
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.a > 1) p.da = -Math.abs(p.da);
        if (p.a < 0) { p.da = Math.abs(p.da); p.x = Math.random() * w; p.y = h + 10; }
        if (p.y < -20) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 10;
        if (p.x > w + 20) p.x = -10;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.globalAlpha = Math.max(0, Math.min(0.45, p.a * 0.45));
        if (p.shape === 0) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(176,137,104,1)"; ctx.fill(); }
        else if (p.shape === 1) { ctx.rotate(Math.PI / 4); ctx.fillStyle = "rgba(201,173,141,1)"; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); }
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.strokeStyle = "rgba(176,137,104,1)"; ctx.lineWidth = 1.2; ctx.stroke(); }
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

export default function VideoAnim() {
  const [videoActivo, setVideoActivo] = useState(false);
  const [startCount, setStartCount] = useState(false);
  const countersRef = useRef<HTMLDivElement | null>(null);
  const hdr = useReveal(); const vid = useReveal(0.1); const lft = useReveal(); const rgt = useReveal();

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStartCount(true); o.disconnect(); } }, { threshold: 0.3 });
    if (countersRef.current) o.observe(countersRef.current);
    return () => o.disconnect();
  }, []);

  const Counter = ({ value, label, suffix, icon, delay }: { value: number; label: string; suffix: string; icon: string; delay: number }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!startCount) return;
      const t = setTimeout(() => {
        let s: number | null = null;
        const a = (ts: number) => { if (!s) s = ts; const p = Math.min((ts - s) / 1800, 1); setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value)); if (p < 1) requestAnimationFrame(a); };
        requestAnimationFrame(a);
      }, delay);
      return () => clearTimeout(t);
    }, [startCount, value, delay]);
    return (
      <div style={{ textAlign: "center", padding: "1rem 0.6rem", borderRadius: 14, background: "linear-gradient(145deg, #FFFBF7, #F0E5D8)", border: "1px solid rgba(176,137,104,0.14)", transition: "transform 0.35s, box-shadow 0.35s", position: "relative", overflow: "hidden", cursor: "default" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(176,137,104,0.16)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #B08968, #D4A87A)", color: "white", fontSize: "0.75rem", marginBottom: 6 }}><i className={icon} /></div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: "#3A2A1A", lineHeight: 1 }}>{count}{suffix}</div>
        <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "#7A6554", marginTop: 3 }}>{label}</div>
        <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)", transform: "rotate(25deg)", animation: "va-shine 4s ease-in-out infinite", pointerEvents: "none" }} />
      </div>
    );
  };

  const features = [
    { icon: "fas fa-microchip", title: "Tecnologia HydraFacial", desc: "Certificacion internacional" },
    { icon: "fas fa-flask", title: "Productos premium", desc: "Grado medico avanzado" },
    { icon: "fas fa-heart", title: "Sin dolor", desc: "Minima recuperacion" },
    { icon: "fas fa-hands-helping", title: "Atencion personalizada", desc: "Plan a tu medida" },
  ];

  const rs = (vis: boolean, d = 0): React.CSSProperties => ({
    opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(35px)",
    transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${d}s, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${d}s`,
  });

  return (
    <>
      <style>{`
        @keyframes va-shine { 0%,100%{transform:rotate(25deg) translateX(-120%)} 50%{transform:rotate(25deg) translateX(120%)} }
        @keyframes va-glow { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.85;transform:translate(-50%,-50%) scale(1.06)} }
        @keyframes va-pulse { 0%{transform:translate(-50%,-50%) scale(1);opacity:.5} 100%{transform:translate(-50%,-50%) scale(1.7);opacity:0} }
        @keyframes va-orb { 0%,100%{transform:translate(0,0)} 33%{transform:translate(25px,-20px)} 66%{transform:translate(-20px,25px)} }
        @media(max-width:991px){ .va-3col{grid-template-columns:1fr !important} .va-video-col{order:-1} }
      `}</style>

      <section style={{ position: "relative", padding: "5rem 0 4rem", overflow: "hidden", background: "linear-gradient(175deg, #FDFCFA 0%, #F5EEE5 55%, #FBF8F4 100%)" }}>
        <ParticleCanvas />

        {/* Orbs */}
        <div style={{ position: "absolute", width: 450, height: 450, top: "-8%", left: "5%", borderRadius: "50%", background: "radial-gradient(circle, rgba(176,137,104,0.1) 0%, transparent 70%)", filter: "blur(60px)", animation: "va-orb 14s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 380, height: 380, bottom: "-5%", right: "3%", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,173,141,0.12) 0%, transparent 70%)", filter: "blur(60px)", animation: "va-orb 18s ease-in-out infinite reverse", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 280, height: 280, top: "35%", left: "45%", borderRadius: "50%", background: "radial-gradient(circle, rgba(224,184,146,0.08) 0%, transparent 70%)", filter: "blur(50px)", animation: "va-orb 11s ease-in-out infinite 2s", pointerEvents: "none" }} />

        {/* Header */}
        <div ref={hdr.ref} style={{ ...rs(hdr.v), textAlign: "center", marginBottom: "2.5rem", padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B08968", background: "rgba(176,137,104,0.07)", border: "1px solid rgba(176,137,104,0.18)", borderRadius: 100, padding: "0.4rem 1.3rem", marginBottom: "1rem" }}>Nuestro consultorio</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)", fontWeight: 700, color: "#3A2A1A", maxWidth: 660, margin: "0 auto 1rem", lineHeight: 1.2 }}>Por que realizar consultas y procedimientos con nosotros</h2>
          <div style={{ width: 50, height: 3, background: "linear-gradient(90deg,#C9AD8D,#B08968)", borderRadius: 2, margin: "0 auto 0.8rem" }} />
          <p style={{ fontSize: "1.05rem", color: "#7A6554", margin: 0 }}>Calidad, experiencia y resultados que hablan por si solos</p>
        </div>

        {/* 3 COLUMN LAYOUT */}
        <div className="va-3col" style={{ display: "grid", gridTemplateColumns: "230px 1fr 230px", gap: "1rem", maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1, alignItems: "center" }}>

          {/* LEFT - Features */}
          <div ref={lft.ref} style={{ ...rs(lft.v, 0.15), background: "rgba(255,253,250,0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(176,137,104,0.14)", borderRadius: 18, padding: "1.8rem 1.2rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "1.2rem", textAlign: "center" }}>Lo que nos distingue</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.8rem", borderRadius: 12,
                  background: "linear-gradient(135deg, #FFFBF7, #F4EBE0)", border: "1px solid rgba(176,137,104,0.12)",
                  opacity: lft.v ? 1 : 0, transform: lft.v ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.5s ease ${0.25 + i * 0.1}s, transform 0.5s ease ${0.25 + i * 0.1}s, box-shadow 0.3s`, cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(176,137,104,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem" }}><i className={f.icon} /></div>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3A2A1A" }}>{f.title}</div><div style={{ fontSize: "0.72rem", color: "#8A7565", marginTop: 1 }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER - Video */}
          <div className="va-video-col" ref={vid.ref} style={{ ...rs(vid.v, 0.08), position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "115%", height: "140%", background: "radial-gradient(ellipse, rgba(176,137,104,0.14) 0%, transparent 65%)", filter: "blur(45px)", animation: "va-glow 4s ease-in-out infinite", pointerEvents: "none", zIndex: 0, transform: "translate(-50%,-50%)" }} />
            <div onClick={() => setVideoActivo(true)} style={{
              position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 20, overflow: "hidden", cursor: "pointer", zIndex: 1,
              boxShadow: "0 20px 55px rgba(58,42,26,0.18), 0 0 0 1px rgba(176,137,104,0.12)", transition: "transform 0.4s, box-shadow 0.4s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 28px 65px rgba(58,42,26,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 20px 55px rgba(58,42,26,0.18)"; }}>
              {videoActivo ? (
                <iframe src="https://www.youtube.com/embed/pBkwUM0IpTE?autoplay=1&modestbranding=1&rel=0" title="Presentacion" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 20 }} />
              ) : (
                <>
                  <img src={IMG.previewVideo} alt="Video" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.32) 100%)" }} />
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: 90, height: 90, borderRadius: "50%", background: "rgba(176,137,104,0.2)", animation: "va-pulse 2.2s ease-out infinite", transform: "translate(-50%,-50%)" }} />
                    <div style={{ position: "relative", width: 68, height: 68, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.4rem", transition: "all 0.3s" }}><i className="fas fa-play" style={{ marginLeft: 3 }} /></div>
                  </div>
                  <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", fontWeight: 600, color: "white", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", padding: "0.3rem 1rem", borderRadius: 100, zIndex: 2 }}>Ver presentacion</div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT - Counters */}
          <div ref={el => { rgt.ref.current = el; countersRef.current = el; }}
            style={{ ...rs(rgt.v, 0.2), background: "rgba(255,253,250,0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(176,137,104,0.14)", borderRadius: 18, padding: "1.8rem 1.2rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "1.2rem", textAlign: "center" }}>La experiencia habla</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
              <Counter value={680} label="Pacientes satisfechos" suffix="+" icon="fas fa-users" delay={0} />
              <Counter value={15} label="Tratamientos" suffix="+" icon="fas fa-syringe" delay={150} />
              <Counter value={4} label="Anios experiencia" suffix="+" icon="fas fa-award" delay={300} />
              <Counter value={5} label="Calificacion" suffix="/5" icon="fas fa-star" delay={450} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}