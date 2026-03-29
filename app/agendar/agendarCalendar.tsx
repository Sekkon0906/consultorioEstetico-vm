"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PALETTE } from "./page";
import { supabase } from "@/lib/supabaseClient";

const nombresMes = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

const HORAS_BASE = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM",
  "04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM",
];

export default function AgendarCalendar({
  fecha, hora, onFechaSelect, onHoraSelect, usuario,
}: {
  fecha: Date | null; hora: string;
  onFechaSelect: (v: Date) => void; onHoraSelect: (v: string) => void;
  usuario?: any;
}) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [horasOcupadas, setHorasOcupadas] = useState<Set<string>>(new Set());
  const [bloqueosGlobales, setBloqueosGlobales] = useState<Set<string>>(new Set());
  const [loadingHoras, setLoadingHoras] = useState(false);

  useEffect(() => {
    supabase.from("bloqueos_globales").select("hora").then(({ data, error }) => {
      if (!error && data) setBloqueosGlobales(new Set(data.map((b: any) => b.hora)));
    });
  }, []);

  const generarDias = () => {
    const primerDia = new Date(anio, mes, 1).getDay() || 7;
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 1; i < primerDia; i++) dias.push(null);
    for (let d = 1; d <= diasEnMes; d++) dias.push(d);
    return dias;
  };

  const cargarHorasOcupadas = async (fechaISO: string) => {
    setLoadingHoras(true);
    try {
      const [bloqueosRes, citasRes] = await Promise.all([
        supabase.from("bloqueos_horas").select("hora").eq("fecha", fechaISO),
        supabase.from("citas").select("hora, estado").eq("fecha", fechaISO),
      ]);
      const ocupadas = new Set<string>();
      bloqueosGlobales.forEach((h) => ocupadas.add(h));
      if (!bloqueosRes.error) (bloqueosRes.data ?? []).forEach((b: any) => ocupadas.add(b.hora));
      if (!citasRes.error) (citasRes.data ?? []).filter((c: any) => c.estado !== "cancelada").forEach((c: any) => ocupadas.add(c.hora));
      setHorasOcupadas(ocupadas);
    } catch (err) { console.error("Error cargando horas:", err); }
    finally { setLoadingHoras(false); }
  };

  const handleDiaClick = (dia: number | null) => {
    if (!dia) return;
    const dateObj = new Date(anio, mes, dia);
    const hoyStart = new Date(); hoyStart.setHours(0, 0, 0, 0);
    if (dateObj < hoyStart) return;
    const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setSelectedDate(iso);
    onFechaSelect(dateObj);
    onHoraSelect("");
    cargarHorasOcupadas(iso);
  };

  const esDomingo = (dia: number) => new Date(anio, mes, dia).getDay() === 0;
  const esPasado = (dia: number) => { const d = new Date(anio, mes, dia); const h = new Date(); h.setHours(0,0,0,0); return d < h; };
  const diasMes = generarDias();

  return (
    <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
      <div className="rounded-3xl p-5 shadow-md" style={{ background: "#FBF7F2", border: "1px solid #E9DED2" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: PALETTE.text, width: 36, height: 36 }}>&lsaquo;</button>
          <h3 className="fw-bold m-0" style={{ color: PALETTE.text, fontSize: "1.1rem" }}>{nombresMes[mes]} {anio}</h3>
          <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: PALETTE.text, width: 36, height: 36 }}>&rsaquo;</button>
        </div>
        <div className="d-grid mb-2" style={{ gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
          {["L","M","X","J","V","S","D"].map((d) => (<div key={d} style={{ fontSize: "0.75rem", color: PALETTE.textSoft, fontWeight: 700, paddingBottom: 4 }}>{d}</div>))}
        </div>
        <div className="d-grid" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {diasMes.map((dia, i) => {
            if (!dia) return <div key={`e-${i}`} />;
            const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const isSelected = iso === selectedDate;
            const disabled = esPasado(dia) || esDomingo(dia);
            return (
              <motion.button key={dia} whileHover={disabled ? {} : { scale: 1.15 }} whileTap={disabled ? {} : { scale: 0.95 }}
                onClick={() => handleDiaClick(dia)} disabled={disabled}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", backgroundColor: isSelected ? PALETTE.main : disabled ? "transparent" : "#fff", color: isSelected ? "#fff" : disabled ? "#ccc" : PALETTE.text, fontWeight: isSelected ? 700 : 400, cursor: disabled ? "not-allowed" : "pointer", fontSize: "0.85rem", boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                {dia}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl p-5 shadow-md" style={{ background: "#FBF7F2", border: "1px solid #E9DED2" }}>
        <h3 className="fw-bold mb-4 text-center" style={{ color: PALETTE.text, fontSize: "1.1rem" }}>
          {selectedDate ? `Horas disponibles - ${selectedDate}` : "Selecciona un dia"}
        </h3>
        {!selectedDate && <p className="text-center" style={{ color: PALETTE.textSoft }}>Elige un dia en el calendario para ver las horas disponibles.</p>}
        {selectedDate && loadingHoras && <div className="text-center py-4"><div className="spinner-border spinner-border-sm" style={{ color: PALETTE.main }} role="status" /></div>}
        {selectedDate && !loadingHoras && (
          <div className="d-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {HORAS_BASE.filter((h) => !bloqueosGlobales.has(h)).map((h) => {
              const ocupada = horasOcupadas.has(h);
              const isSelected = hora === h;
              return (
                <motion.button key={h} whileHover={ocupada ? {} : { scale: 1.06 }} whileTap={ocupada ? {} : { scale: 0.96 }}
                  disabled={ocupada} onClick={() => onHoraSelect(h)} className="rounded-pill py-2 px-1 fw-semibold"
                  style={{ fontSize: "0.78rem", border: "none", backgroundColor: isSelected ? PALETTE.main : ocupada ? "#F0E8E0" : "#fff", color: isSelected ? "#fff" : ocupada ? "#ccc" : PALETTE.text, cursor: ocupada ? "not-allowed" : "pointer", boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.06)" }}>
                  {h}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}