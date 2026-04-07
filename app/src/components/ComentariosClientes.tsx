"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
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
    supabase.from("comentarios_pacientes").select("id, nombre, procedimiento, texto, puntuacion, creado_en")
      .eq("aprobado", true).order("creado_en", { ascending: false }).limit(20)
      .then(function(res) { if (res.data) setComentarios(res.data); setLoading(false); });
  }, []);

  useEffect(function() {
    if (!user) return;
    // Get procedures where patient was attended
    supabase.from("citas").select("procedimiento").eq("user_id", user.id).eq("estado", "atendida")
      .then(function(res) {
        if (res.data) setCitasAtendidas([...new Set(res.data.map(function(c: any) { return c.procedimiento; }))]);
      });
    // Check if already commented
    supabase.from("comentarios_pacientes").select("id").eq("user_id", user.id).limit(1)
      .then(function(res) { if (res.data && res.data.length > 0) setYaComento(true); });
  }, [user]);

  var nombreCompleto = user ? ((user.nombres || "") + " " + (user.apellidos || "")).trim() : "";
  var puedeOpinar = citasAtendidas.length > 0 && !yaComento;

  var handleEnviar = async function() {
    if (!procSeleccionado || !texto.trim() || puntuacion === 0) { setMensaje("Completa todos los campos."); return; }
    setEnviando(true); setMensaje(null);
    try {
      var res = await supabase.from("comentarios_pacientes").insert({
        user_id: user?.id || null, nombre: nombreCompleto, procedimiento: procSeleccionado,
        texto: texto.trim(), puntuacion: puntuacion, aprobado: false,
      });
      if (res.error) throw new Error(res.error.message);
      setMensaje("Comentario enviado. Sera visible una vez aprobado por la doctora.");
      setTexto(""); setPuntuacion(0); setProcSeleccionado(""); setShowForm(false); setYaComento(true);
    } catch (e: any) { setMensaje("Error: " + e.message); }
    finally { setEnviando(false); }
  };

  var etiqueta = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  return (
    <section style={{ position: "relative", zIndex: 10, padding: "4rem 1.5rem", textAlign: "center", backgroundColor: "#FAF7F2", color: "#4E3B2B", borderTop: "1px solid #E9DED2", borderBottom: "1px solid #E9DED2" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>Comentarios de Nuestros Pacientes</h2>
      <p style={{ fontSize: "0.88rem", fontStyle: "italic", color: "#6C584C", marginBottom: "1.5rem" }}>Experiencias reales de quienes confiaron en nosotros</p>

      {/* Button to leave comment - only if attended and hasn't commented */}
      {user && puedeOpinar && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button onClick={function() { setShowForm(!showForm); }} style={{ background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", borderRadius: 100, padding: "0.7rem 2rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
            {showForm ? "Cerrar formulario" : "Dejar mi comentario"}
          </button>
        </div>
      )}

      {user && yaComento && (
        <p style={{ fontSize: "0.82rem", color: "#8A7565", marginBottom: "1rem", fontStyle: "italic" }}>Ya enviaste tu comentario. Gracias por compartir tu experiencia.</p>
      )}

      {mensaje && <div style={{ maxWidth: 500, margin: "0 auto 1rem", padding: "0.8rem 1.2rem", borderRadius: 12, background: "#E9DED2", color: "#4E3B2B", border: "1px solid #D4C4B0", fontSize: "0.88rem" }}>{mensaje}</div>}

      {/* Comment form */}
      {showForm && (
        <div style={{ maxWidth: 520, margin: "0 auto 2rem", padding: "1.8rem", borderRadius: 18, background: "#FFFDF9", border: "1px solid #E9DED2", textAlign: "left", boxShadow: "0 4px 16px rgba(78,59,43,0.06)" }}>
          <h4 style={{ fontWeight: 600, color: "#4E3B2B", marginBottom: "1.2rem", textAlign: "center" }}>Cuenta tu experiencia</h4>
          
          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 4 }}>Tu nombre</label>
            <input value={nombreCompleto} disabled style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #E9DED2", background: "#F5EEE6", color: "#4E3B2B", fontSize: "0.9rem" }} />
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 4 }}>Procedimiento realizado</label>
            <select value={procSeleccionado} onChange={function(e) { setProcSeleccionado(e.target.value); }} style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #E9DED2", fontSize: "0.9rem" }}>
              <option value="">Selecciona...</option>
              {citasAtendidas.map(function(p, i) { return <option key={i} value={p}>{p}</option>; })}
            </select>
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 4 }}>Tu experiencia</label>
            <textarea value={texto} onChange={function(e) { setTexto(e.target.value); }} rows={4} placeholder="Cuentanos como fue..."
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #E9DED2", fontSize: "0.9rem", resize: "vertical" }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6C584C", display: "block", marginBottom: 6 }}>Puntuacion</label>
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
            {puntuacion > 0 && <span style={{ fontSize: "0.78rem", color: "#B08968" }}>{etiqueta[puntuacion]}</span>}
          </div>

          <button onClick={handleEnviar} disabled={enviando}
            style={{ width: "100%", background: "linear-gradient(135deg, #8B6A4B, #B08968)", color: "white", border: "none", borderRadius: 100, padding: "0.7rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", opacity: enviando ? 0.7 : 1 }}>
            {enviando ? "Enviando..." : "Enviar comentario"}
          </button>
        </div>
      )}

      {/* Comments display */}
      {loading && <p style={{ color: "#6C584C", fontStyle: "italic" }}>Cargando comentarios...</p>}

      {!loading && comentarios.length > 0 && (
        <div style={{ display: "flex", gap: "1.2rem", overflowX: "auto", padding: "0.5rem 0.5rem 1rem", scrollbarWidth: "thin" }}>
          {comentarios.map(function(c) {
            return (
              <div key={c.id} style={{ minWidth: 270, maxWidth: 310, background: "#FFFDF9", border: "1px solid #E9DED2", borderRadius: 16, padding: "1.2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "transform 0.3s", flexShrink: 0 }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = ""; }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E9DED2", display: "flex", alignItems: "center", justifyContent: "center", color: "#4E3B2B", fontSize: "1.1rem", fontWeight: 700 }}>{c.nombre.charAt(0).toUpperCase()}</div>
                <h4 style={{ fontWeight: 600, color: "#4E3B2B", fontSize: "0.95rem", margin: 0 }}>{c.nombre}</h4>
                <span style={{ background: "#F5EEE6", color: "#8B6A4B", padding: "0.2rem 0.8rem", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600 }}>{c.procedimiento}</span>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(function(i) { return c.puntuacion >= i ? <FaStar key={i} size={14} color="#C0A080" /> : <FaRegStar key={i} size={14} color="#C0A080" />; })}
                </div>
                <p style={{ fontSize: "0.85rem", color: "#6C584C", fontStyle: "italic", lineHeight: 1.4, textAlign: "center" }}>&quot;{c.texto.length > 140 ? c.texto.slice(0, 140) + "..." : c.texto}&quot;</p>
                <span style={{ fontSize: "0.72rem", color: "#8B7A6E" }}>{new Date(c.creado_en).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && comentarios.length === 0 && <p style={{ color: "#6C584C", fontStyle: "italic" }}>Se el primero en compartir tu experiencia.</p>}
    </section>
  );
}