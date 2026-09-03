"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { IMG } from "@/lib/imagenes";
import { getGaleriaConfianzaApi, type FotoConfianza } from "@/services/galeriaConfianzaApi";

/**
 * Revela la sección al entrar en pantalla.
 *
 * Lleva red de seguridad, y no es teórica: esta sección se quedaba en
 * blanco —titular y texto en `opacity: 0` sobre fondo claro— cuando el
 * observador no llegaba a disparar. Es la "pantalla fantasma" del estudio
 * de móvil.
 *
 * El observador puede no disparar por varios motivos: que el umbral no se
 * alcance nunca porque la sección es más alta que la ventana, que el
 * elemento esté en un contenedor con `overflow` que hace de raíz, o
 * simplemente que el hilo principal esté ocupado en la carga. Y como esto
 * decide si el CONTENIDO se ve —no un adorno—, no puede depender de que
 * todo salga bien.
 *
 * Pasado el plazo, se revela igual. Si el observador dispara antes, mejor;
 * si no, el usuario lee la sección en vez de mirar un hueco.
 */
function useReveal(t = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: t });
    o.observe(el);
    const respaldo = setTimeout(() => { setV(true); o.disconnect(); }, 1200);
    return () => { clearTimeout(respaldo); o.disconnect(); };
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
    const ps: P[] = Array.from({ length: 14 }, () => ({
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

    // Solo anima cuando el canvas está visible en pantalla (ahorra CPU/jank)
    let running = false;
    const start = () => { if (!running) { running = true; draw(); } };
    const stop = () => { running = false; cancelAnimationFrame(animId); };
    const io = new IntersectionObserver(
      ([e]) => { e.isIntersecting ? start() : stop(); },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => { io.disconnect(); cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

export default function VideoAnim() {
  const t = useTranslations("home.video");
  const [fotos, setFotos] = useState<FotoConfianza[]>([]);
  const [fotoIdx, setFotoIdx] = useState(0);
  const fotoActiva = fotos[fotoIdx];

  // La galería la administra la doctora desde el panel. Si la petición
  // falla, `fotos` se queda vacío y el marco cae a la miniatura de siempre:
  // una sección sin fotos es peor que una sección con una.
  useEffect(() => {
    let vivo = true;
    getGaleriaConfianzaApi()
      .then((r) => { if (vivo) setFotos(r); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

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
      const tmr = setTimeout(() => {
        let s: number | null = null;
        const a = (ts: number) => { if (!s) s = ts; const p = Math.min((ts - s) / 1800, 1); setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value)); if (p < 1) requestAnimationFrame(a); };
        requestAnimationFrame(a);
      }, delay);
      return () => clearTimeout(tmr);
    }, [startCount, value, delay]);
    return (
      <div style={{ textAlign: "center", padding: "1rem 0.6rem", borderRadius: 14, background: "linear-gradient(145deg, var(--surface), var(--surface-soft))", border: "1px solid rgba(176,137,104,0.14)", transition: "transform 0.35s, box-shadow 0.35s", position: "relative", overflow: "hidden", cursor: "default" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(176,137,104,0.16)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), #D4A87A)", color: "var(--brand-contrast)", fontSize: "0.75rem", marginBottom: 6 }}><i className={icon} /></div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{count}{suffix}</div>
        <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
        <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)", transform: "rotate(25deg)", animation: "va-shine 4s ease-in-out infinite", pointerEvents: "none" }} />
      </div>
    );
  };

  const featureIcons = ["fas fa-microchip", "fas fa-flask", "fas fa-heart", "fas fa-hands-helping"];
  const features = (t.raw("features") as Array<{ title: string; desc: string }>).map((f, i) => ({
    ...f,
    icon: featureIcons[i] || featureIcons[0],
  }));

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

      <section className="dark-aware-section videoanim-section" style={{ position: "relative", padding: "2.5rem 0 2rem", overflow: "hidden", background: "linear-gradient(175deg, #FDFCFA 0%, #F5EEE5 55%, #FBF8F4 100%)" }}>
        <ParticleCanvas />

        {/* Orbs */}
        <div style={{ position: "absolute", width: 450, height: 450, top: "-8%", left: "5%", borderRadius: "50%", background: "radial-gradient(circle, rgba(176,137,104,0.1) 0%, transparent 70%)", filter: "blur(60px)", animation: "va-orb 14s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 380, height: 380, bottom: "-5%", right: "3%", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,173,141,0.12) 0%, transparent 70%)", filter: "blur(60px)", animation: "va-orb 18s ease-in-out infinite reverse", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 280, height: 280, top: "35%", left: "45%", borderRadius: "50%", background: "radial-gradient(circle, rgba(224,184,146,0.08) 0%, transparent 70%)", filter: "blur(50px)", animation: "va-orb 11s ease-in-out infinite 2s", pointerEvents: "none" }} />

        {/* Header — sin kicker para ahorrar vertical y que título+video+CTAs entren juntos en pantalla */}
        <div ref={hdr.ref} style={{ ...rs(hdr.v), textAlign: "center", marginBottom: "1.4rem", padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.4rem, 2.6vw, 2rem)", fontWeight: 700, color: "var(--text)", maxWidth: 780, margin: "0 auto 0.6rem", lineHeight: 1.2 }}>{t("title")}</h2>
          <div style={{ width: 50, height: 3, background: "linear-gradient(90deg,var(--brand-soft),#B08968)", borderRadius: 2, margin: "0 auto 0.55rem" }} />
          <p style={{ fontSize: "0.95rem", color: "#7A6554", margin: 0 }}>{t("subtitle")}</p>
        </div>

        {/* 3 COLUMN LAYOUT */}
        <div className="va-3col" style={{ display: "grid", gridTemplateColumns: "250px minmax(0, 1fr) 250px", gap: "1.75rem", maxWidth: 1560, margin: "0 auto", padding: "0 1.5rem", position: "relative", zIndex: 1, alignItems: "center" }}>

          {/* LEFT - Features */}
          <div className="dark-aware-card" ref={lft.ref} style={{ ...rs(lft.v, 0.15), background: "var(--bg-elevated)", backdropFilter: "blur(10px)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.2rem 1rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.85rem", textAlign: "center" }}>{t("distinguishTitle")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.8rem", borderRadius: 12,
                  /* El fondo era un degradado claro quemado a mano mientras el
                     título usaba `var(--text)`. En oscuro el texto pasa a
                     crema y el fondo se quedaba claro: crema sobre crema, con
                     los títulos invisibles y solo el subtítulo legible. Ahora
                     el fondo también sigue al tema. */
                  background: "linear-gradient(135deg, var(--surface), var(--surface-soft))",
                  border: "1px solid var(--border)",
                  opacity: lft.v ? 1 : 0, transform: lft.v ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.5s ease ${0.25 + i * 0.1}s, transform 0.5s ease ${0.25 + i * 0.1}s, box-shadow 0.3s`, cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(176,137,104,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-contrast)", fontSize: "0.8rem" }}><i className={f.icon} /></div>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{f.title}</div><div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRO — Galería de confianza.
              Aquí había un vídeo de presentación. La doctora reportó que
              grabarlo se estaba complicando, así que el bloque pasa a fotos
              que ella misma administra desde el panel: bioseguridad,
              esterilización y los equipos con los que trabaja.

              La miniatura del vídeo se conserva como PRIMERA foto —es la
              que abre la sección hoy y funciona— y el resto van apareciendo
              detrás. Si la galería viniera vacía, se cae a esa imagen: la
              sección nunca queda en blanco. */}
          <div className="va-video-col" ref={vid.ref} style={{ ...rs(vid.v, 0.08), position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "115%", height: "140%", background: "radial-gradient(ellipse, rgba(176,137,104,0.14) 0%, transparent 65%)", filter: "blur(45px)", animation: "va-glow 4s ease-in-out infinite", pointerEvents: "none", zIndex: 0, transform: "translate(-50%,-50%)" }} />

            <div className="va-marco" style={{
              position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 20, overflow: "hidden", zIndex: 1,
              boxShadow: "0 20px 55px rgba(58,42,26,0.18), 0 0 0 1px rgba(176,137,104,0.12)",
            }}>
              <Image
                key={fotoActiva?.url || IMG.previewVideo}
                src={fotoActiva?.url || IMG.previewVideo}
                alt={fotoActiva?.titulo || t("iframeTitle")}
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                quality={80}
                className="va-poster va-poster-entra"
                style={{ objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.62) 100%)" }} />

              {/* El pie de foto es lo que convierte la galería en
                  información y no en decoración: dice QUÉ estás mirando. */}
              {(fotoActiva?.titulo || fotoActiva?.descripcion) && (
                <div className="va-pie">
                  {fotoActiva?.titulo && <span className="va-pie-titulo">{fotoActiva.titulo}</span>}
                  {fotoActiva?.descripcion && <span className="va-pie-texto">{fotoActiva.descripcion}</span>}
                </div>
              )}
            </div>

            {/* Miniaturas: solo si hay más de una foto. Con una sola, una
                fila de puntos sería una promesa vacía. */}
            {fotos.length > 1 && (
              <div className="va-miniaturas">
                {fotos.map((fo, i) => (
                  <button
                    key={fo.id}
                    type="button"
                    onClick={() => setFotoIdx(i)}
                    aria-label={fo.titulo || `Foto ${i + 1}`}
                    aria-current={i === fotoIdx}
                    className={`va-miniatura ${i === fotoIdx ? "is-activa" : ""}`}
                  >
                    <Image src={fo.url} alt="" fill sizes="88px" quality={55} style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Counters */}
          <div className="dark-aware-card" ref={el => { rgt.ref.current = el; countersRef.current = el; }}
            style={{ ...rs(rgt.v, 0.2), background: "var(--bg-elevated)", backdropFilter: "blur(10px)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.2rem 1rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.85rem", textAlign: "center" }}>{t("experienceTitle")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
              <Counter value={680} label={t("counters.patients")} suffix="+" icon="fas fa-users" delay={0} />
              <Counter value={15} label={t("counters.treatments")} suffix="+" icon="fas fa-syringe" delay={150} />
              <Counter value={4} label={t("counters.years")} suffix="+" icon="fas fa-award" delay={300} />
              <Counter value={5} label={t("counters.rating")} suffix="/5" icon="fas fa-star" delay={450} />
            </div>
          </div>
        </div>

        {/* CTAs hacia /doctora y /testimonios — píldoras ghost reusables.
            width:100% + margin auto + maxWidth iguala el grid de arriba
            para que las píldoras queden centradas en el viewport. */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: "0.9rem",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "1.4rem",
            padding: "0 1.5rem",
            width: "100%",
            maxWidth: 1560,
            marginLeft: "auto",
            marginRight: "auto",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <Link href="/doctora" className="btn-ghost-app">
            <i className="fas fa-user-md" /> {t("ctaAboutDr")}
          </Link>
          <Link href="/testimonios" className="btn-ghost-app">
            <i className="fas fa-comments" /> {t("ctaTestimonials")}
          </Link>
        </div>
      </section>
    </>
  );
}
