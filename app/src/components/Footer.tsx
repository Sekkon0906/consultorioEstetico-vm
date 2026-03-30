"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface ProcItem { nombre: string; categoria: string; }

export default function Footer() {
  const [procs, setProcs] = useState<ProcItem[]>([]);
  const [showProcs, setShowProcs] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", procedure: "", phone: "", message: "", terms: false });

  useEffect(() => {
    supabase.from("procedimientos").select("nombre, categoria").order("categoria").order("nombre")
      .then(({ data }) => { if (data) setProcs(data as ProcItem[]); });
  }, []);

  const grouped = procs.reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p.nombre);
    return acc;
  }, {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked ?? false : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, procedure, message } = formData;
    const texto = `*Nuevo mensaje desde la web*\n\nNombre: ${name}\nCorreo: ${email}\nTelefono: ${phone || "No especificado"}\nProcedimiento: ${procedure || "No especificado"}\nMensaje: ${message}`;
    window.open(`https://wa.me/573155445748?text=${encodeURIComponent(texto)}`, "_blank");
    setFormData({ name: "", email: "", procedure: "", phone: "", message: "", terms: false });
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,253,250,0.08)", border: "1px solid rgba(176,137,104,0.4)",
    color: "#FAF9F7", borderRadius: 12, padding: "0.7rem 1rem", fontSize: "0.9rem",
    outline: "none", width: "100%", transition: "border-color 0.3s",
  };

  return (
    <footer style={{ background: "#5A4A3A", color: "white", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 0%, rgba(176,137,104,0.08) 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>

        {/* Form section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9AD8D", background: "rgba(176,137,104,0.1)", border: "1px solid rgba(176,137,104,0.2)", borderRadius: 100, padding: "0.35rem 1.2rem", marginBottom: "1rem" }}>Contacto</span>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 600, color: "#E9DED2", marginBottom: "0.5rem" }}>
            Tienes alguna pregunta?
          </h3>
          <p style={{ fontSize: "0.9rem", color: "rgba(233,222,210,0.7)", marginBottom: "2rem" }}>Contactame directamente por WhatsApp</p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", maxWidth: 650, margin: "0 auto" }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre completo" required style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />
            <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Correo electronico" required style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />

            {/* Procedure selector */}
            <div style={{ gridColumn: "1 / -1", position: "relative" }}>
              <button type="button" onClick={() => setShowProcs(!showProcs)}
                style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", color: formData.procedure ? "#FAF9F7" : "rgba(250,249,247,0.5)" }}>
                {formData.procedure || "Selecciona un procedimiento"}
                <i className={`fas fa-chevron-${showProcs ? "up" : "down"}`} style={{ fontSize: "0.7rem", color: "#B08968" }} />
              </button>
              {showProcs && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#4A3A2E", border: "1px solid rgba(176,137,104,0.3)", borderRadius: 12, marginTop: 4, maxHeight: 280, overflowY: "auto", zIndex: 20, boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <div style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#C9AD8D", background: "rgba(176,137,104,0.15)", textTransform: "uppercase", letterSpacing: "0.1em", position: "sticky", top: 0 }}>{cat}</div>
                      {items.map((p, i) => (
                        <button key={i} type="button" onClick={() => { setFormData(prev => ({ ...prev, procedure: p })); setShowProcs(false); }}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "0.55rem 1rem", background: "none", border: "none", color: "#E9DED2", fontSize: "0.85rem", cursor: "pointer", transition: "background 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.2)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefono" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />
            <textarea name="message" value={formData.message} onChange={handleChange} rows={3} placeholder="Tu mensaje" required
              style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />

            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <input name="terms" type="checkbox" checked={formData.terms} onChange={handleChange} required style={{ accentColor: "#B08968" }} />
              <small style={{ color: "rgba(233,222,210,0.7)", fontSize: "0.78rem" }}>Acepto los terminos y condiciones</small>
            </div>

            <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: "0.5rem" }}>
              <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, padding: "0.8rem 2.2rem", fontWeight: 600, fontSize: "0.92rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(176,137,104,0.3)", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(176,137,104,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,137,104,0.3)"; }}>
                <i className="fab fa-whatsapp" style={{ fontSize: "1.1rem" }} /> Enviar por WhatsApp
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div style={{ borderTop: "1px solid rgba(176,137,104,0.2)", paddingTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>Clinica Estetica</h4>
            <p style={{ fontSize: "0.82rem", color: "rgba(233,222,210,0.65)", lineHeight: 1.6 }}>Atencion personalizada y tratamientos de estetica facial, corporal y capilar.</p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>Direccion</h4>
            <p style={{ fontSize: "0.82rem", color: "rgba(233,222,210,0.65)", lineHeight: 1.6 }}>Carrera 5ta #11-24. Torre Empresarial. Consultorio 502. Ibague - Tolima.<br />Lunes a Sabado, 9:00 a.m. - 6:00 p.m.</p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>Contacto</h4>
            <p style={{ fontSize: "0.82rem", color: "rgba(233,222,210,0.65)", lineHeight: 1.6 }}>WhatsApp: +57 315 544 5748<br />Email: dra.vanessamedinao@gmail.com</p>
          </div>
        </div>

        {/* Social + credits */}
        <div style={{ borderTop: "1px solid rgba(176,137,104,0.2)", paddingTop: "1.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1rem" }}>
            {[
              { href: "https://www.facebook.com/profile.php?id=61556167276406", icon: "fab fa-facebook" },
              { href: "https://www.instagram.com/dravanessamedinao28/", icon: "fab fa-instagram" },
              { href: "https://wa.me/573155445748", icon: "fab fa-whatsapp" },
            ].map((r, i) => (
              <a key={i} href={r.href} target="_blank" rel="noopener noreferrer"
                style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(176,137,104,0.12)", border: "1px solid rgba(176,137,104,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9AD8D", fontSize: "1rem", transition: "all 0.3s", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(176,137,104,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(176,137,104,0.12)"; e.currentTarget.style.transform = ""; }}>
                <i className={r.icon} />
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "rgba(233,222,210,0.5)" }}>2023 Clinica Estetica Dra. Julieth Medina. Todos los derechos reservados.</p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ fontSize: "0.78rem", color: "rgba(233,222,210,0.5)", marginTop: "0.2rem" }}>
            Disenada por{" "}
            <a href="https://portafoliojmo.vercel.app" target="_blank" rel="noopener noreferrer" className="designer-credit">
              <span className="designer-text">Juan Medina O.</span>
              <span className="designer-sparkle" />
              <span className="designer-sparkle s2" />
              <span className="designer-sparkle s3" />
            </a>
          </motion.p>
        </div>
      </div>

      <style>{`
        .designer-credit {
          position: relative;
          display: inline-block;
          color: #C9AD8D;
          text-decoration: none;
          font-weight: 600;
          padding: 0 2px;
          transition: color 0.3s, text-shadow 0.3s;
        }
        .designer-credit:hover {
          color: #F0D8B0;
          text-shadow: 0 0 12px rgba(176,137,104,0.6), 0 0 30px rgba(176,137,104,0.3);
        }
        .designer-text {
          position: relative;
          z-index: 1;
          background: linear-gradient(90deg, #C9AD8D, #E0C9A8, #C9AD8D);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: designer-shimmer 3s ease-in-out infinite;
        }
        @keyframes designer-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .designer-credit::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #C9AD8D, transparent);
          transition: width 0.5s ease;
        }
        .designer-credit:hover::after {
          width: 100%;
        }
        .designer-sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #E0C9A8;
          opacity: 0;
          pointer-events: none;
        }
        .designer-credit:hover .designer-sparkle {
          animation: sparkle-burst 0.8s ease-out forwards;
        }
        .designer-sparkle.s2 {
          animation-delay: 0.15s !important;
        }
        .designer-sparkle.s3 {
          animation-delay: 0.3s !important;
        }
        @keyframes sparkle-burst {
          0% { opacity: 0; transform: translate(0, 0) scale(0); }
          30% { opacity: 1; transform: translate(var(--sx, 12px), var(--sy, -14px)) scale(1); }
          100% { opacity: 0; transform: translate(var(--ex, 20px), var(--ey, -22px)) scale(0); }
        }
        .designer-sparkle:nth-child(2) { --sx: 12px; --sy: -14px; --ex: 18px; --ey: -20px; }
        .designer-sparkle:nth-child(3) { --sx: -8px; --sy: -12px; --ex: -14px; --ey: -18px; }
        .designer-sparkle:nth-child(4) { --sx: 4px; --sy: -16px; --ex: 6px; --ey: -24px; }
      `}</style>
    </footer>
  );
}