"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PALETTE } from "./palette";
import { supabase } from "@/lib/supabaseClient";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const HORAS_BASE = ["08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM"];

function BgCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let anim: number;
    const resize = () => { const p = c.parentElement; if (!p) return; c.width = p.offsetWidth; c.height = p.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; da: number; }
    const ps: P[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * (c.width || 900), y: Math.random() * (c.height || 500),
      vx: (Math.random() - 0.5) * 0.3, vy: -0.08 - Math.random() * 0.15,
      r: 1.5 + Math.random() * 3.5, a: Math.random(), da: 0.004 + Math.random() * 0.007,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.a > 1) p.da = -Math.abs(p.da);
        if (p.a < 0) { p.da = Math.abs(p.da); p.y = c.height + 5; p.x = Math.random() * c.width; }
        if (p.y < -10) { p.y = c.height + 5; p.x = Math.random() * c.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176,137,104,${Math.max(0, p.a * 0.2)})`;
        ctx.fill();
      }
      anim = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

export default function AgendarCalendar({ fecha, hora, onFechaSelect, onHoraSelect, usuario }: {
  fecha: Date | null; hora: string; onFechaSelect: (v: Date) => void; onHoraSelect: (v: string) => void; usuario?: any;
}) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [horasOcupadas, setHorasOcupadas] = useState<Set<string>>(new Set());
  const [bloqueosGlobales, setBloqueosGlobales] = useState<Set<string>>(new Set());
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasKey, setHorasKey] = useState(0);

  useEffect(() => {
    supabase.from("bloqueos_globales").select("hora").then(({ data }) => {
      if (data) setBloqueosGlobales(new Set(data.map((b: any) => b.hora)));
    });
  }, []);

  const generarDias = () => {
    const p = new Date(anio, mes, 1).getDay() || 7;
    const d = new Date(anio, mes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 1; i < p; i++) dias.push(null);
    for (let i = 1; i <= d; i++) dias.push(i);
    return dias;
  };

  const cargarHoras = async (iso: string) => {
    setLoadingHoras(true);
    try {
      const [bRes, cRes] = await Promise.all([
        supabase.from("bloqueos_horas").select("hora").eq("fecha", iso),
        supabase.from("citas").select("hora, estado").eq("fecha", iso),
      ]);
      const occ = new Set<string>();
      bloqueosGlobales.forEach(h => occ.add(h));
      if (!bRes.error) (bRes.data ?? []).forEach((b: any) => occ.add(b.hora));
      if (!cRes.error) (cRes.data ?? []).filter((c: any) => c.estado !== "cancelada").forEach((c: any) => occ.add(c.hora));
      setHorasOcupadas(occ);
    } catch (e) { console.error(e); }
    finally { setLoadingHoras(false); setHorasKey(k => k + 1); }
  };

  const handleDia = (dia: number | null) => {
    if (!dia) return;
    const d = new Date(anio, mes, dia); const h2 = new Date(); h2.setHours(0, 0, 0, 0);
    if (d < h2 || d.getDay() === 0) return;
    const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setSelectedDate(iso); onFechaSelect(d); onHoraSelect(""); cargarHoras(iso);
  };

  const esPasado = (dia: number) => { const d = new Date(anio, mes, dia); const h2 = new Date(); h2.setHours(0, 0, 0, 0); return d < h2; };
  const esHoy = (dia: number) => { const d = new Date(anio, mes, dia); const h2 = new Date(); return d.toDateString() === h2.toDateString(); };
  const esDomingo = (dia: number) => new Date(anio, mes, dia).getDay() === 0;
  const horasFiltradas = HORAS_BASE.filter(h => !bloqueosGlobales.has(h));

  // Convierte "08:30 AM" a minutos desde medianoche
  const horaAMinutos = (h: string): number => {
    const m = h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  // ¿La fecha seleccionada es hoy?
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const esHoySeleccionado = selectedDate === hoyISO;
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();
  // Una hora ya no es reservable si hoy y ya pasó (con 30 min de margen)
  const horaPasada = (h: string): boolean =>
    esHoySeleccionado && horaAMinutos(h) <= minutosAhora + 30;

  const hayHorasDisponibles = horasFiltradas.some(
    (h) => !horasOcupadas.has(h) && !horaPasada(h)
  );

  return (
    <>
      <style>{`
        .cal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .cal-card { padding: 2.6rem; }
        .cal-day-btn { width: 54px; height: 54px; font-size: 1.05rem; }
        .cal-month-title { font-size: 1.65rem; }
        .cal-hours-title { font-size: 1.5rem; }
        .cal-hour-btn { padding: 0.9rem 0.4rem; font-size: 0.95rem; }
        .cal-wrap { padding: 1.5rem 1rem; }
        @media (max-width: 900px) {
          .cal-grid { grid-template-columns: 1fr; gap: 1.2rem; }
          .cal-card { padding: 1.4rem; }
          .cal-day-btn { width: 42px; height: 42px; font-size: 0.92rem; }
          .cal-month-title { font-size: 1.25rem; }
          .cal-hours-title { font-size: 1.2rem; }
          .cal-hour-btn { padding: 0.65rem 0.25rem; font-size: 0.82rem; }
          .cal-wrap { padding: 1rem 0.6rem; }
        }
        @media (max-width: 420px) {
          .cal-day-btn { width: 36px; height: 36px; font-size: 0.82rem; }
          .cal-hour-btn { padding: 0.55rem 0.2rem; font-size: 0.78rem; }
          .cal-card { padding: 1rem; }
        }
      `}</style>

      <div className="cal-wrap" style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
        <BgCanvas />
        <div style={{ position: "absolute", width: 300, height: 300, top: "-8%", right: "-3%", borderRadius: "50%", background: "radial-gradient(circle, rgba(176,137,104,0.07) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

        <div className="cal-grid" style={{ position: "relative", zIndex: 1 }}>
          {/* CALENDAR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="cal-card"
            style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 22, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 8px 30px rgba(78,59,43,0.06)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "#E9DED2", border: "none", color: "#4E3B2B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-chevron-left" style={{ fontSize: "0.7rem" }} />
              </motion.button>
              <h3 className="cal-month-title" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#3A2A1A", margin: 0 }}>{MESES[mes]} {anio}</h3>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "#E9DED2", border: "none", color: "#4E3B2B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-chevron-right" style={{ fontSize: "0.7rem" }} />
              </motion.button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "0.5rem" }}>
              {["L","M","X","J","V","S","D"].map(d => <div key={d} style={{ fontSize: "0.95rem", fontWeight: 700, color: "#8A7565", paddingBottom: 10 }}>{d}</div>)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7 }}>
              {generarDias().map((dia, i) => {
                if (!dia) return <div key={`e-${i}`} />;
                const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                const sel = iso === selectedDate;
                const disabled = esPasado(dia) || esDomingo(dia);
                const today = esHoy(dia);
                return (
                  <motion.button key={dia}
                    whileHover={disabled ? {} : { scale: 1.2 }} whileTap={disabled ? {} : { scale: 0.9 }}
                    onClick={() => handleDia(dia)} disabled={disabled}
                    className="cal-day-btn"
                    style={{
                      borderRadius: "50%", margin: "0 auto",
                      border: today && !sel ? "2px solid #B08968" : "none",
                      background: sel ? "linear-gradient(135deg, #B08968, #C9AD8D)" : disabled ? "transparent" : "rgba(255,255,255,0.8)",
                      color: sel ? "white" : disabled ? "#ccc" : "#3A2A1A",
                      fontWeight: sel || today ? 700 : 400,
                      cursor: disabled ? "not-allowed" : "pointer",
                      boxShadow: sel ? "0 4px 14px rgba(176,137,104,0.35)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}>
                    {dia}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* HOURS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="cal-card"
            style={{ background: "rgba(255,253,250,0.95)", backdropFilter: "blur(10px)", borderRadius: 22, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 8px 30px rgba(78,59,43,0.06)" }}>

            <h3 className="cal-hours-title" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.3rem", textAlign: "center" }}>
              {selectedDate ? "Horas disponibles" : "Selecciona un dia"}
            </h3>

            {selectedDate && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", fontSize: "0.85rem", color: "#8A7565", marginBottom: "1.2rem" }}>
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
              </motion.p>
            )}

            {!selectedDate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #E9DED2, #F5EEE6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <i className="fas fa-calendar-day" style={{ color: "#B08968", fontSize: "1.4rem" }} />
                </div>
                <p style={{ color: "#8A7565", fontSize: "0.92rem" }}>Elige un dia en el calendario</p>
              </motion.div>
            )}

            {selectedDate && loadingHoras && (
              <div style={{ textAlign: "center", padding: "3rem 0" }}><div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} /></div>
            )}

            {selectedDate && !loadingHoras && !hayHorasDisponibles && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #F3DDD2, #F5EEE6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <i className="fas fa-clock" style={{ color: "#B08968", fontSize: "1.3rem" }} />
                </div>
                <p style={{ color: "#8A7565", fontSize: "0.95rem", margin: 0 }}>
                  {esHoySeleccionado
                    ? "Ya no hay horas disponibles para hoy. Elige otro día."
                    : "No hay horas disponibles para este día."}
                </p>
              </motion.div>
            )}

            {selectedDate && !loadingHoras && hayHorasDisponibles && (
              <div key={horasKey} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {horasFiltradas.map((h, i) => {
                  const occ = horasOcupadas.has(h) || horaPasada(h);
                  const sel = hora === h;
                  return (
                    <motion.button key={h}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.025 }}
                      whileHover={occ ? {} : { scale: 1.06 }}
                      whileTap={occ ? {} : { scale: 0.95 }}
                      disabled={occ} onClick={() => onHoraSelect(h)}
                      className="cal-hour-btn"
                      style={{
                        borderRadius: 12, border: "none", fontWeight: 600,
                        background: sel ? "linear-gradient(135deg, #B08968, #C9AD8D)" : occ ? "rgba(176,137,104,0.04)" : "rgba(255,255,255,0.9)",
                        color: sel ? "white" : occ ? "#ccc" : "#3A2A1A",
                        cursor: occ ? "not-allowed" : "pointer",
                        boxShadow: sel ? "0 4px 14px rgba(176,137,104,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
                      }}>
                      {h}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}