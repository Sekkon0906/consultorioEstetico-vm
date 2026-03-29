"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface Comentario {
  id: number; nombre: string; procedimiento: string;
  texto: string; puntuacion: number; creado_en: string;
}

interface CitaAtendida { procedimiento: string; }

export default function ComentariosClientes() {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [citasAtendidas, setCitasAtendidas] = useState<CitaAtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [procSeleccionado, setProcSeleccionado] = useState("");
  const [texto, setTexto] = useState("");
  const [puntuacion, setPuntuacion] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => { cargarComentarios(); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("citas").select("procedimiento").eq("user_id", user.id).eq("estado", "atendida")
      .then(({ data }) => {
        if (data) {
          const unicos = Array.from(new Set(data.map((c: any) => c.procedimiento))).map((p) => ({ procedimiento: p }));
          setCitasAtendidas(unicos);
        }
      });
  }, [user]);

  const cargarComentarios = async () => {
    const { data } = await supabase.from("comentarios_pacientes")
      .select("id, nombre, procedimiento, texto, puntuacion, creado_en")
      .eq("aprobado", true).order("creado_en", { ascending: false }).limit(20);
    if (data) setComentarios(data);
    setLoading(false);
  };

  const nombreCompleto = user ? `${user.nombres || ""} ${user.apellidos || ""}`.trim() : "";
  const puedeOpinar = citasAtendidas.length > 0;

  const handleEnviar = async () => {
    if (!procSeleccionado) { setMensaje("Selecciona un procedimiento."); return; }
    if (!texto.trim()) { setMensaje("Escribe tu experiencia."); return; }
    if (puntuacion === 0) { setMensaje("Selecciona una puntuacion."); return; }
    setEnviando(true); setMensaje(null);
    try {
      const { error } = await supabase.from("comentarios_pacientes").insert({
        user_id: user?.id || null, nombre: nombreCompleto,
        procedimiento: procSeleccionado, texto: texto.trim(),
        puntuacion, aprobado: false,
      });
      if (error) throw new Error(error.message);
      setMensaje("Comentario enviado. Sera visible una vez aprobado.");
      setTexto(""); setPuntuacion(0); setProcSeleccionado(""); setShowForm(false);
    } catch (err: any) { setMensaje("Error al enviar: " + err.message); }
    finally { setEnviando(false); }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) stars.push(rating >= i ? <FaStar key={i} color="#C0A080" /> : <FaRegStar key={i} color="#C0A080" />);
    return stars;
  };

  const etiqueta = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  return (
    <section className="relative z-10 py-16 px-6 text-center" style={{ backgroundColor: "#FAF7F2", color: "#4E3B2B", borderTop: "1px solid #E9DED2", borderBottom: "1px solid #E9DED2" }}>
      <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Comentarios de Nuestros Pacientes</h2>
      <p className="text-sm italic text-[#6C584C] mb-6">Experiencias reales de quienes confiaron en nosotros</p>

      {/* Boton solo si tiene citas atendidas */}
      {user && puedeOpinar && (
        <div className="mb-8">
          <button onClick={() => setShowForm(!showForm)} className="btn rounded-pill px-5 py-2 fw-semibold" style={{ backgroundColor: "#B08968", color: "#fff", border: "none" }}>
            {showForm ? "Cerrar formulario" : "Dejar mi comentario"}
          </button>
        </div>
      )}

      {mensaje && (
        <div className="mx-auto mb-4 p-3 rounded-3 text-center" style={{ maxWidth: 500, backgroundColor: "#E9DED2", color: "#4E3B2B", border: "1px solid #D4C4B0" }}>{mensaje}</div>
      )}

      {showForm && (
        <div className="mx-auto mb-8 p-5 rounded-4 shadow-sm text-start" style={{ maxWidth: 550, backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
          <h4 className="fw-semibold mb-4 text-center" style={{ color: "#4E3B2B" }}>Cuenta tu experiencia</h4>
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "#6C584C" }}>Tu nombre</label>
            <input className="form-control" value={nombreCompleto} disabled style={{ borderColor: "#E9DED2", backgroundColor: "#F5EEE6" }} />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "#6C584C" }}>Procedimiento realizado</label>
            <select className="form-select" value={procSeleccionado} onChange={(e) => setProcSeleccionado(e.target.value)} style={{ borderColor: "#E9DED2" }}>
              <option value="">Selecciona un procedimiento...</option>
              {citasAtendidas.map((c, i) => <option key={i} value={c.procedimiento}>{c.procedimiento}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold" style={{ color: "#6C584C" }}>Tu experiencia</label>
            <textarea className="form-control" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cuentanos como fue tu experiencia..." style={{ borderColor: "#E9DED2" }} />
          </div>
          <div className="mb-4 text-center">
            <label className="form-label small fw-semibold d-block" style={{ color: "#6C584C" }}>Puntuacion</label>
            <div className="d-flex justify-content-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onMouseEnter={() => setHoverStar(i)} onMouseLeave={() => setHoverStar(0)} onClick={() => setPuntuacion(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                  {i <= (hoverStar || puntuacion) ? <FaStar size={28} color="#C0A080" /> : <FaRegStar size={28} color="#C0A080" />}
                </button>
              ))}
            </div>
            {puntuacion > 0 && <span className="small" style={{ color: "#B08968" }}>{etiqueta[puntuacion]}</span>}
          </div>
          <button onClick={handleEnviar} disabled={enviando} className="btn w-100 rounded-pill fw-semibold py-2" style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>
            {enviando ? "Enviando..." : "Enviar comentario"}
          </button>
        </div>
      )}

      {loading && <p className="text-[#6C584C] italic animate-pulse">Cargando comentarios...</p>}

      {!loading && comentarios.length > 0 && (
        <div className="flex gap-6 overflow-x-auto px-4 py-4" style={{ scrollbarWidth: "thin" }}>
          {comentarios.map((c) => (
            <div key={c.id} className="min-w-[280px] max-w-[320px] bg-[#FFFDF9] border border-[#E9DED2] rounded-xl shadow-sm flex flex-col items-center justify-between p-4 transition-transform duration-300 hover:scale-105">
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56, backgroundColor: "#E9DED2", color: "#4E3B2B", fontSize: "1.2rem", fontWeight: 700 }}>{c.nombre.charAt(0).toUpperCase()}</div>
              <h4 className="font-semibold text-[#4E3B2B] mb-1">{c.nombre}</h4>
              <span className="badge rounded-pill mb-2 px-3 py-1" style={{ backgroundColor: "#F5EEE6", color: "#8B6A4B", fontSize: "0.72rem" }}>{c.procedimiento}</span>
              <div className="flex justify-center mb-2">{renderStars(c.puntuacion)}</div>
              <p className="text-[#6C584C] text-sm italic mb-2" style={{ lineHeight: "1.4" }}>&quot;{c.texto.length > 150 ? c.texto.slice(0, 150) + "..." : c.texto}&quot;</p>
              <span className="text-xs text-[#8B7A6E]">{new Date(c.creado_en).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && comentarios.length === 0 && <p className="text-[#6C584C] italic">Se el primero en compartir tu experiencia.</p>}
    </section>
  );
}