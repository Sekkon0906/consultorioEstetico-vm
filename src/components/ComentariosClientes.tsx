"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import {
  getComentariosApi,
  getElegibilidadComentarioApi,
  crearComentarioApi,
} from "@/services/comentariosApi";
import { useAuth } from "@/context/AuthContext";

interface Comentario {
  id: number;
  nombre: string;
  procedimiento: string;
  texto: string;
  puntuacion: number;
  creado_en: string;
}

export default function ComentariosClientes() {
  const t = useTranslations("comentarios");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";
  var { user } = useAuth();
  var [comentarios, setComentarios] = useState<Comentario[]>([]);
  var [citasAtendidas, setCitasAtendidas] = useState<string[]>([]);
  var [yaComento, setYaComento] = useState(false);
  var [loading, setLoading] = useState(true);
  var [showForm, setShowForm] = useState(false);
  var [enviando, setEnviando] = useState(false);
  var [mensaje, setMensaje] = useState<string | null>(null);
  var [procSeleccionado, setProcSeleccionado] = useState("");
  var [texto, setTexto] = useState("");
  var [puntuacion, setPuntuacion] = useState(0);
  var [hoverStar, setHoverStar] = useState(0);

  useEffect(function() {
    getComentariosApi()
      .then(function(data) { setComentarios(data); })
      .catch(function(e) { console.error("Error cargando comentarios:", e); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    if (!user) return;
    getElegibilidadComentarioApi()
      .then(function(r) {
        setCitasAtendidas(r.procedimientos);
        setYaComento(r.yaComento);
      })
      .catch(function(e) { console.error("Error comprobando elegibilidad:", e); });
  }, [user]);

  var nombreCompleto = user ? ((user.nombres || "") + " " + (user.apellidos || "")).trim() : "";
  var puedeOpinar = citasAtendidas.length > 0 && !yaComento;

  var handleEnviar = async function() {
    if (!procSeleccionado || !texto.trim() || puntuacion === 0) { setMensaje(t("messages.completeFields")); return; }
    setEnviando(true); setMensaje(null);
    try {
      await crearComentarioApi({ procedimiento: procSeleccionado, texto: texto.trim(), puntuacion: puntuacion });
      setMensaje(t("messages.sent"));
      setTexto(""); setPuntuacion(0); setProcSeleccionado(""); setShowForm(false); setYaComento(true);
    } catch (e: any) { setMensaje("Error: " + (e?.message || "")); }
    finally { setEnviando(false); }
  };

  const ratingLabels = t.raw("ratingLabels") as string[];

  return (
    <section className="dark-aware-section comentarios-section" style={{ position: "relative", zIndex: 10, padding: "4rem 1.5rem", textAlign: "center", backgroundColor: "var(--bg)", color: "var(--topbar-text)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>{t("title")}</h2>
      <p style={{ fontSize: "0.88rem", fontStyle: "italic", color: "var(--text-soft)", marginBottom: "1.5rem" }}>{t("subtitle")}</p>

      {user && puedeOpinar && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={function() { setShowForm(!showForm); }} style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", border: "none", borderRadius: 100, padding: "0.7rem 2rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
            {showForm ? t("closeForm") : t("openForm")}
          </button>
        </div>
      )}

      {user && yaComento && (
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem", fontStyle: "italic" }}>{t("alreadyCommented")}</p>
      )}

      {mensaje && <div style={{ maxWidth: 500, margin: "0 auto 1rem", padding: "0.8rem 1.2rem", borderRadius: 12, background: "var(--border)", color: "#4E3B2B", border: "1px solid #D4C4B0", fontSize: "0.88rem" }}>{mensaje}</div>}

      {showForm && (
        <div className="dark-aware-card" style={{ maxWidth: 520, margin: "0 auto 2rem", padding: "1.8rem", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "left", boxShadow: "0 4px 16px rgba(78,59,43,0.06)" }}>
          <h4 style={{ fontWeight: 600, color: "#4E3B2B", marginBottom: "1.2rem", textAlign: "center" }}>{t("form.title")}</h4>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>{t("form.yourName")}</label>
            <input value={nombreCompleto} disabled style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-soft)", color: "#4E3B2B", fontSize: "0.9rem" }} />
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>{t("form.procedure")}</label>
            <select value={procSeleccionado} onChange={function(e) { setProcSeleccionado(e.target.value); }} style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.9rem" }}>
              <option value="">{t("form.procedurePlaceholder")}</option>
              {citasAtendidas.map(function(p, i) { return <option key={i} value={p}>{p}</option>; })}
            </select>
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>{t("form.experience")}</label>
            <textarea value={texto} onChange={function(e) { setTexto(e.target.value); }} rows={4} placeholder={t("form.experiencePlaceholder")}
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.9rem", resize: "vertical" }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 6 }}>{t("form.rating")}</label>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
              {[1,2,3,4,5].map(function(i) {
                return (
                  <button key={i} type="button"
                    onMouseEnter={function() { setHoverStar(i); }} onMouseLeave={function() { setHoverStar(0); }}
                    onClick={function() { setPuntuacion(i); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    {i <= (hoverStar || puntuacion) ? <FaStar size={26} color="#C0A080" /> : <FaRegStar size={26} color="#C0A080" />}
                  </button>
                );
              })}
            </div>
            {puntuacion > 0 && <span style={{ fontSize: "0.78rem", color: "var(--brand)" }}>{ratingLabels[puntuacion]}</span>}
          </div>

          <button onClick={handleEnviar} disabled={enviando}
            style={{ width: "100%", background: "linear-gradient(135deg, var(--brand-deep), #B08968)", color: "var(--brand-contrast)", border: "none", borderRadius: 100, padding: "0.7rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", opacity: enviando ? 0.7 : 1 }}>
            {enviando ? t("form.submitting") : t("form.submit")}
          </button>
        </div>
      )}

      {loading && <p style={{ color: "var(--text-soft)", fontStyle: "italic" }}>{t("loading")}</p>}

      {!loading && comentarios.length > 0 && (
        <div style={{ display: "flex", gap: "1.2rem", overflowX: "auto", padding: "0.5rem 0.5rem 1rem", scrollbarWidth: "thin" }}>
          {comentarios.map(function(c) {
            return (
              <div key={c.id} className="dark-aware-card" style={{ minWidth: 270, maxWidth: 310, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "transform 0.3s", flexShrink: 0 }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = ""; }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4E3B2B", fontSize: "1.1rem", fontWeight: 700 }}>{c.nombre.charAt(0).toUpperCase()}</div>
                <h4 style={{ fontWeight: 600, color: "#4E3B2B", fontSize: "0.95rem", margin: 0 }}>{c.nombre}</h4>
                <span className="comentario-proc-pill" style={{ background: "var(--surface-soft)", color: "var(--brand-deep)", padding: "0.2rem 0.8rem", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600 }}>{c.procedimiento}</span>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(function(i) { return c.puntuacion >= i ? <FaStar key={i} size={14} color="#C0A080" /> : <FaRegStar key={i} size={14} color="#C0A080" />; })}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", fontStyle: "italic", lineHeight: 1.4, textAlign: "center" }}>&quot;{c.texto.length > 140 ? c.texto.slice(0, 140) + "..." : c.texto}&quot;</p>
                <span style={{ fontSize: "0.72rem", color: "#8B7A6E" }}>{new Date(c.creado_en).toLocaleDateString(intlLocale, { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && comentarios.length === 0 && <p style={{ color: "var(--text-soft)", fontStyle: "italic" }}>{t("emptyState")}</p>}
    </section>
  );
}
