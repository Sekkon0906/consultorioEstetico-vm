"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";

interface ProcItem { nombre: string; categoria: string; }

export default function Footer() {
  const t = useTranslations("footer");
  const [procs, setProcs] = useState<ProcItem[]>([]);
  const [showProcs, setShowProcs] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", procedure: "", phone: "", message: "", terms: false });
  const [warning, setWarning] = useState<string | null>(null);

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
    // Si el usuario empieza a llenar tras un warning, lo limpiamos.
    if (warning) setWarning(null);
  };

  // Form completo = nombre, email y mensaje obligatorios + términos aceptados.
  const isFormComplete = !!(
    formData.name.trim() &&
    formData.email.trim() &&
    formData.message.trim() &&
    formData.terms
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      setWarning(t("form.incompleteWarning"));
      return;
    }
    const { name, email, phone, procedure, message } = formData;
    const lineas = [
      t("form.whatsappTitle"),
      "",
      `${t("form.whatsappName")} ${name}`,
      `${t("form.whatsappEmail")} ${email}`,
      `${t("form.whatsappPhone")} ${phone || t("form.notSpecified")}`,
      `${t("form.whatsappProcedure")} ${procedure || t("form.notSpecified")}`,
      `${t("form.whatsappMessage")} ${message}`,
    ];
    window.open(`https://wa.me/573155445748?text=${encodeURIComponent(lineas.join("\n"))}`, "_blank");
    setFormData({ name: "", email: "", procedure: "", phone: "", message: "", terms: false });
    setWarning(null);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,253,250,0.08)", border: "1px solid rgba(176,137,104,0.4)",
    color: "#FAF9F7", borderRadius: 12, padding: "0.7rem 1rem", fontSize: "0.9rem",
    outline: "none", width: "100%", transition: "border-color 0.3s",
  };

  const resetCookies = () => {
    try {
      window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
    } catch {}
  };

  // Direcciones y contacto vienen como líneas separadas con \n.
  const addressLines = t("addressLines").split("\n");
  const contactLines = t("contactLines").split("\n");

  return (
    <footer style={{ background: "#3E2E22", color: "#FFFFFF", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 0%, rgba(201,173,141,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem 2rem" }}>

        {/* Form section — contrastes mejorados */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#F0D8B0", background: "rgba(240,216,176,0.14)", border: "1px solid rgba(240,216,176,0.35)", borderRadius: 100, padding: "0.4rem 1.2rem", marginBottom: "1rem" }}>{t("contactBadge")}</span>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.35rem, 2.8vw, 1.9rem)", fontWeight: 700, color: "#FFFDF9", marginBottom: "0.5rem", lineHeight: 1.25 }}>
            {t("contactTitle")}
          </h3>
          <p style={{ fontSize: "0.95rem", color: "#FFFFFF", marginBottom: "2rem" }}>{t("contactSub")}</p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", maxWidth: 650, margin: "0 auto" }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder={t("form.name")} required style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />
            <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder={t("form.email")} required style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />

            {/* Procedure selector */}
            <div style={{ gridColumn: "1 / -1", position: "relative" }}>
              <button type="button" onClick={() => setShowProcs(!showProcs)}
                style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", color: formData.procedure ? "#FAF9F7" : "rgba(250,249,247,0.5)" }}>
                {formData.procedure || t("form.procedure")}
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

            <input name="phone" value={formData.phone} onChange={handleChange} placeholder={t("form.phone")} style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />
            <textarea name="message" value={formData.message} onChange={handleChange} rows={3} placeholder={t("form.message")} required
              style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#B08968"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(176,137,104,0.4)"; }} />

            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <input name="terms" type="checkbox" checked={formData.terms} onChange={handleChange} style={{ accentColor: "#B08968" }} />
              <small style={{ color: "rgba(245, 235, 220, 0.9)", fontSize: "0.82rem" }}>
                {t("form.acceptIntro")}{" "}
                <Link
                  href="/legal/terminos"
                  className="footer-terms-link"
                >
                  {t("form.acceptTerms")}
                </Link>
              </small>
            </div>

            {/* Warning si el form está vacío al intentar enviar */}
            {warning && (
              <div
                role="alert"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  background: "rgba(255, 180, 130, 0.14)",
                  border: "1px solid rgba(255, 180, 130, 0.45)",
                  color: "#FFD8B0",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "0.55rem 1rem",
                  borderRadius: 100,
                  marginTop: "0.3rem",
                }}
              >
                <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />
                {warning}
              </div>
            )}

            <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: "0.5rem" }}>
              <button
                type="submit"
                className="btn-ghost-app footer-cta-ghost"
              >
                <i className="fab fa-whatsapp" style={{ fontSize: "1.05rem" }} />
                {t("form.submit")}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div style={{ borderTop: "1px solid rgba(176,137,104,0.2)", paddingTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>{t("clinic")}</h4>
            <p style={{ fontSize: "0.82rem", color: "#FFFFFF", lineHeight: 1.6 }}>{t("clinicDesc")}</p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>{t("address")}</h4>
            <p style={{ fontSize: "0.82rem", color: "#FFFFFF", lineHeight: 1.6 }}>
              {addressLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < addressLines.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "#E9DED2", marginBottom: "0.6rem" }}>{t("contact")}</h4>
            <p style={{ fontSize: "0.82rem", color: "#FFFFFF", lineHeight: 1.6 }}>
              {contactLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < contactLines.length - 1 && <br />}
                </span>
              ))}
            </p>
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
          {/* Enlaces legales */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", flexWrap: "wrap", marginBottom: "0.8rem", alignItems: "center" }}>
            <Link href="/legal/privacidad" style={{ fontSize: "0.78rem", color: "#FFFFFF", textDecoration: "none" }}>{t("legalLinks.privacy")}</Link>
            <Link href="/legal/terminos" style={{ fontSize: "0.78rem", color: "#FFFFFF", textDecoration: "none" }}>{t("legalLinks.terms")}</Link>
            <Link href="/legal/cookies" style={{ fontSize: "0.78rem", color: "#FFFFFF", textDecoration: "none" }}>{t("legalLinks.cookies")}</Link>
            <Link href="/legal/aviso" style={{ fontSize: "0.78rem", color: "#FFFFFF", textDecoration: "none" }}>{t("legalLinks.notice")}</Link>
            <button type="button" onClick={resetCookies} style={{ fontSize: "0.78rem", color: "#FFFFFF", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
              {t("cookiePrefs")}
            </button>
          </div>

          <p style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.85)" }}>{t("rights")}</p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.85)", marginTop: "0.2rem" }}>
            {t("designedBy")}{" "}
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
          text-decoration: none;
          font-weight: 700;
          font-size: 0.86rem;
          padding: 0.15rem 0.65rem;
          margin-left: 0.15rem;
          border-radius: 100px;
          /* Borde dorado siempre visible — píldora sutil que enmarca */
          border: 1px solid rgba(232, 201, 160, 0.4);
          background: rgba(232, 201, 160, 0.06);
          transition: background 0.3s ease, border-color 0.3s ease,
            text-shadow 0.3s ease, transform 0.25s ease;
        }
        .designer-credit:hover {
          background: rgba(232, 201, 160, 0.14);
          border-color: rgba(255, 230, 179, 0.7);
          transform: translateY(-1px);
          text-shadow: 0 0 14px rgba(232, 201, 160, 0.55),
            0 0 32px rgba(232, 201, 160, 0.28);
        }
        .designer-text {
          position: relative;
          z-index: 1;
          /* Cream/champán brillante con shimmer suave para resaltar
             sobre el café oscuro del footer. */
          background: linear-gradient(
            90deg,
            #F5E1B8 0%,
            #FFF1C8 30%,
            #FFE6B3 50%,
            #FFF1C8 70%,
            #F5E1B8 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: designer-shimmer 4s ease-in-out infinite;
          letter-spacing: 0.01em;
        }
        @keyframes designer-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .designer-credit::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 0%;
          height: 1.5px;
          background: linear-gradient(
            90deg,
            transparent,
            #FFE6B3,
            transparent
          );
          transition: width 0.45s ease;
        }
        .designer-credit:hover::after {
          width: 80%;
        }
        .designer-sparkle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFE6B3;
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 0 6px rgba(255, 230, 179, 0.7);
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
