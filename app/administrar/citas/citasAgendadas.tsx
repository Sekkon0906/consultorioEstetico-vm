"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE } from "../../agendar/palette";
import { Cita, getCitasByDayAPI, getCitasAPI, confirmarCitaAPI, cancelarCitaAPI, solicitarReagendaAPI } from "./helpers";
import SolicitudesReagenda from "@/components/SolicitudesReagenda";
import CitasAgendadasCard from "./citasAgendadasCard";
import CitasAgendadasModal from "./citasAgendadasModal";
import { ChevronUp, ChevronDown, CalendarDays, Inbox, Phone, Mail, Calendar, Clock } from "lucide-react";
import { aISOLocal } from "@/lib/fechas";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const HORAS = ["08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM"];

export default function CitasAgendadas() {
  const [isClient, setIsClient] = useState(false);
  const [mes, setMes] = useState(0);
  const [anio, setAnio] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [buzonGeneral, setBuzonGeneral] = useState(false);
  const [detalle, setDetalle] = useState<Cita | null>(null);
  const [ascendente, setAscendente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [recargar, setRecargar] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [todasCitas, setTodasCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  // Modals
  const [confirmModal, setConfirmModal] = useState<Cita | null>(null);
  const [cancelModal, setCancelModal] = useState<Cita | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [reagendarModal, setReagendarModal] = useState<Cita | null>(null);
  const [reagendarFecha, setReagendarFecha] = useState("");
  const [reagendarHora, setReagendarHora] = useState("");
  const [reagendarMotivo, setReagendarMotivo] = useState("");
  const [reagendarSaving, setReagendarSaving] = useState(false);
  const [reagendarOk, setReagendarOk] = useState(false);
  const [reagendarError, setReagendarError] = useState<string | null>(null);
  const [motivoModal, setMotivoModal] = useState<Cita | null>(null);
  const [resumenModal, setResumenModal] = useState<Cita | null>(null);

  useEffect(() => { const h = new Date(); setMes(h.getMonth()); setAnio(h.getFullYear()); setIsClient(true); }, []);
  useEffect(() => { getCitasAPI().then(setTodasCitas).catch(console.error); }, [recargar]);

  useEffect(() => {
    if (!isClient) return;
    setLoadingCitas(true);
    if (buzonGeneral) {
      getCitasAPI().then((data) => {
        let f = filtroEstado !== "todos" ? data.filter((c) => c.estado === filtroEstado) : data;
        f.sort((a, b) => ascendente ? a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora) : b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
        setCitas(f);
      }).catch(console.error).finally(() => setLoadingCitas(false));
    } else if (selectedDate) {
      getCitasByDayAPI(selectedDate, filtroEstado).then((data) => {
        data.sort((a, b) => ascendente ? a.hora.localeCompare(b.hora) : b.hora.localeCompare(a.hora));
        setCitas(data);
      }).catch(console.error).finally(() => setLoadingCitas(false));
    } else { setCitas([]); setLoadingCitas(false); }
  }, [selectedDate, buzonGeneral, filtroEstado, ascendente, recargar, isClient]);

  const resumen = useMemo(() => {
    const b = { pendiente: 0, confirmada: 0, atendida: 0, cancelada: 0 };
    citas.forEach((c) => { if (b[c.estado as keyof typeof b] !== undefined) b[c.estado as keyof typeof b]++; });
    return b;
  }, [citas]);

  const citasPerDay = useMemo(() => {
    const m: Record<string, number> = {};
    todasCitas.forEach((c) => { m[c.fecha] = (m[c.fecha] || 0) + 1; });
    return m;
  }, [todasCitas]);

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const generarDias: (number | null)[] = [];
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  for (let i = 0; i < offset; i++) generarDias.push(null);
  for (let d = 1; d <= diasEnMes; d++) generarDias.push(d);

  const handleDateClick = (d: number | null) => {
    if (d == null) return;
    setSelectedDate(aISOLocal(new Date(anio, mes, d)));
    setBuzonGeneral(false);
  };

  // Handlers
  const doConfirm = async () => { if (!confirmModal) return; try { await confirmarCitaAPI(confirmModal.id); } catch (e) { console.error(e); } setConfirmModal(null); setRecargar((v) => !v); };
  const doCancel = async () => { if (!cancelModal || !cancelMotivo.trim()) return; try { await cancelarCitaAPI(cancelModal.id, cancelMotivo); } catch (e) { console.error(e); } setCancelModal(null); setCancelMotivo(""); setRecargar((v) => !v); };
  const doReagendar = async () => {
    if (!reagendarModal || !reagendarFecha || !reagendarHora) return;
    if (!reagendarMotivo.trim()) { setReagendarError("Indica el motivo de la solicitud."); return; }
    setReagendarSaving(true);
    setReagendarError(null);
    try {
      await solicitarReagendaAPI(
        reagendarModal.id,
        reagendarModal.userId,
        reagendarFecha,
        reagendarHora,
        reagendarMotivo.trim()
      );
      setReagendarOk(true);
      setRecargar((v) => !v);
      setTimeout(() => {
        setReagendarModal(null);
        setReagendarOk(false);
        setReagendarMotivo("");
      }, 2200);
    } catch (e) {
      setReagendarError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
    } finally {
      setReagendarSaving(false);
    }
  };

  if (!isClient) return <div className="text-center py-20 [color:var(--text-soft)]">Cargando citas...</div>;

  const IS: React.CSSProperties = { width: "100%", padding: "0.5rem 0.8rem", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text)", background: "var(--bg-elevated)" };

  return (
    <div className="p-6 space-y-6 relative">
      <h2 className="text-2xl font-semibold text-center flex items-center justify-center gap-2" style={{ color: PALETTE.main }}>
        <CalendarDays size={22} /> Citas Agendadas
      </h2>

      {/* Las solicitudes de cambio de fecha van ARRIBA DEL TODO y solo si
          hay alguna. Cada una es una persona esperando respuesta: meterlas
          en una seccion aparte, a la que se entra si uno se acuerda, es
          garantizar que se queden sin contestar. */}
      <SolicitudesReagenda onResuelta={() => setRecargar((r) => !r)} />

      <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
        {/* CALENDARIO */}
        <div className="[background:var(--surface)] p-6 rounded-xl shadow-md w-full md:w-[45%] flex flex-col items-center" style={{ border: "1px solid var(--border)" }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setBuzonGeneral(true); setSelectedDate(null); }}
            className={buzonGeneral ? "admin-cal-buzon is-active" : "admin-cal-buzon"}
            style={{ width: "100%", padding: "0.6rem", borderRadius: 12, marginBottom: "1rem", fontWeight: 600, fontSize: "0.88rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Inbox size={16} /> Buzon general
          </motion.button>

          <div className="flex justify-between items-center mb-4 w-full">
            <button type="button" onClick={() => { if (mes === 0) { setMes(11); setAnio((a) => a - 1); } else setMes((m) => m - 1); }} className="[color:var(--brand)] hover:[color:var(--brand-soft)] text-lg font-semibold">{"<"}</button>
            <span className="[color:var(--brand)] font-bold capitalize tracking-wide text-lg">{MESES[mes]} {anio}</span>
            <button type="button" onClick={() => { if (mes === 11) { setMes(0); setAnio((a) => a + 1); } else setMes((m) => m + 1); }} className="[color:var(--brand)] hover:[color:var(--brand-soft)] text-lg font-semibold">{">"}</button>
          </div>

          <div className="grid grid-cols-7 w-full mb-2">
            {["Lun","Mar","Mie","Jue","Vie","Sab","Dom"].map((d) => (
              <div key={d} className="text-center font-semibold [color:var(--text-soft)] text-sm border-b [border-color:var(--border)] pb-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 w-full mb-4">
            {generarDias.map((d, i) => {
              const iso = d != null ? aISOLocal(new Date(anio, mes, d)) : "";
              const sel = selectedDate === iso && !buzonGeneral;
              const cnt = d != null ? citasPerDay[iso] || 0 : 0;
              const hoy = d != null && new Date(anio, mes, d).toDateString() === new Date().toDateString();
              return (
                <motion.button key={i} type="button" whileTap={{ scale: 0.9 }} onClick={() => handleDateClick(d)} disabled={d == null}
                  className={`admin-cal-day h-10 w-full rounded-md text-sm font-medium transition-all relative ${d == null ? "is-empty" : sel ? "is-selected" : hoy ? "is-today" : ""}`}>
                  {d ?? ""}
                  {cnt > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: "var(--brand)", padding: "0 3px" }}>{cnt}</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 [background:var(--surface)] p-6 rounded-xl shadow-md border [border-color:var(--border)] min-h-[400px]">
          {!selectedDate && !buzonGeneral ? (
            <p className="[color:var(--text-soft)] text-center mt-16 italic">Selecciona un dia o el buzon general.</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <h3 className="text-lg font-semibold [color:var(--brand)]">{buzonGeneral ? "Todas las citas" : `Citas del ${selectedDate}`}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={IS}>
                    <option value="todos">Todos</option><option value="pendiente">Pendientes</option><option value="confirmada">Confirmadas</option><option value="atendida">Atendidas</option><option value="cancelada">Canceladas</option>
                  </select>
                  <button type="button" onClick={() => setAscendente((p) => !p)} className="flex items-center gap-1 text-sm [color:var(--text-soft)] hover:[color:var(--brand)]">
                    {ascendente ? <><ChevronUp size={16} /> Asc</> : <><ChevronDown size={16} /> Desc</>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-sm font-medium">
                <div className="rounded-lg py-2 text-center" style={{ background: "var(--estado-pendiente-bg)", border: "1px solid var(--estado-pendiente-borde)", color: "var(--estado-pendiente)" }}>Pendientes: {resumen.pendiente}</div>
                <div className="rounded-lg py-2 text-center" style={{ background: "var(--estado-confirmada-bg)", border: "1px solid var(--estado-confirmada-borde)", color: "var(--estado-confirmada)" }}>Confirmadas: {resumen.confirmada}</div>
                <div className="rounded-lg py-2 text-center" style={{ background: "var(--estado-atendida-bg)", border: "1px solid var(--estado-atendida-borde)", color: "var(--estado-atendida)" }}>Atendidas: {resumen.atendida}</div>
                <div className="rounded-lg py-2 text-center" style={{ background: "var(--estado-cancelada-bg)", border: "1px solid var(--estado-cancelada-borde)", color: "var(--estado-cancelada)" }}>Canceladas: {resumen.cancelada}</div>
              </div>
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
                {loadingCitas ? <p className="[color:var(--text-soft)] text-center mt-20 italic">Cargando...</p>
                : citas.length > 0 ? citas.map((c) => (
                  <CitasAgendadasCard key={c.id} cita={c} onVerDetalles={setDetalle}
                    onConfirmar={setConfirmModal}
                    onCancelar={(c) => { setCancelModal(c); setCancelMotivo(""); }}
                    onReagendar={(c) => { setReagendarModal(c); setReagendarFecha(c.fecha); setReagendarHora(c.hora); setReagendarMotivo(""); setReagendarOk(false); setReagendarError(null); }}
                    onVerMotivo={setMotivoModal} onVerResumen={setResumenModal} />
                )) : <p className="[color:var(--text-soft)] text-center mt-20 italic">No hay citas.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Factura modal */}
      <AnimatePresence>{detalle && <CitasAgendadasModal cita={detalle} onClose={() => setDetalle(null)} onUpdated={() => { setDetalle(null); setRecargar((v) => !v); }} />}</AnimatePresence>

      {/* CONFIRMAR */}
      <AnimatePresence>{confirmModal && (
        <Overlay onClose={() => setConfirmModal(null)}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: "1rem" }}>Confirmar cita</h4>
          <InfoBlock cita={confirmModal} />
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", marginTop: "1.5rem" }}>
            <BtnM label="Cancelar" bg="var(--surface-soft)" color="var(--text)" onClick={() => setConfirmModal(null)} />
            <BtnM label="Confirmar" bg="#2D6A4F" color="#fff" onClick={doConfirm} />
          </div>
        </Overlay>
      )}</AnimatePresence>

      {/* CANCELAR */}
      <AnimatePresence>{cancelModal && (
        <Overlay onClose={() => setCancelModal(null)}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: "1rem" }}>Cancelar cita</h4>
          <InfoBlock cita={cancelModal} />
          <textarea value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} rows={3} placeholder="Motivo de la cancelacion..." style={{ ...IS, marginTop: "1rem", resize: "vertical" as const }} />
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", marginTop: "1.2rem" }}>
            <BtnM label="Volver" bg="var(--surface-soft)" color="var(--text)" onClick={() => setCancelModal(null)} />
            <BtnM label="Confirmar cancelacion" bg={cancelMotivo.trim() ? "#C62828" : "var(--border)"} color={cancelMotivo.trim() ? "#fff" : "var(--text-muted)"} onClick={doCancel} disabled={!cancelMotivo.trim()} />
          </div>
        </Overlay>
      )}</AnimatePresence>

      {/* SOLICITAR REAGENDA AL CLIENTE (pt 10) */}
      <AnimatePresence>{reagendarModal && (
        <Overlay onClose={() => setReagendarModal(null)}>
          {reagendarOk ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--estado-atendida-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.4rem" }}>Solicitud enviada</h4>
              <p style={{ fontSize: "0.88rem", color: "var(--text-soft)", margin: 0 }}>
                La solicitud de reagenda quedó registrada. El cliente deberá confirmarla;
                la cita no se mueve hasta que la apruebe.
              </p>
            </div>
          ) : (
            <>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: "0.3rem" }}>Solicitar reagenda al cliente</h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "1rem" }}>
                Se enviará una solicitud al cliente con la nueva propuesta. La cita actual NO se modifica hasta que el cliente confirme.
              </p>
              <InfoBlock cita={reagendarModal} />
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>Nueva fecha</label>
                    <input type="date" value={reagendarFecha} onChange={(e) => setReagendarFecha(e.target.value)} style={IS} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>Nueva hora</label>
                    <select value={reagendarHora} onChange={(e) => setReagendarHora(e.target.value)} style={IS}>
                      {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: 4 }}>Motivo de la reagenda *</label>
                  <textarea value={reagendarMotivo} onChange={(e) => { setReagendarMotivo(e.target.value); if (reagendarError) setReagendarError(null); }} rows={3} placeholder="Explica al cliente por qué se propone reagendar..." style={{ ...IS, resize: "vertical" as const }} />
                </div>
              </div>
              {reagendarError && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: "0.6rem", textAlign: "center" }}>{reagendarError}</p>}
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", marginTop: "1.2rem" }}>
                <BtnM label="Cancelar" bg="var(--surface-soft)" color="var(--text)" onClick={() => setReagendarModal(null)} />
                <BtnM label={reagendarSaving ? "Enviando..." : "Enviar solicitud"} bg="var(--brand)" color="#fff" onClick={doReagendar} disabled={reagendarSaving || !reagendarFecha || !reagendarHora || !reagendarMotivo.trim()} />
              </div>
            </>
          )}
        </Overlay>
      )}</AnimatePresence>

      {/* VER MOTIVO */}
      <AnimatePresence>{motivoModal && (
        <Overlay onClose={() => setMotivoModal(null)}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: "1rem" }}>Motivo de cancelación</h4>
          <div className="admin-citas-motivo" style={{ background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", borderRadius: 14, padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--danger)", fontStyle: "italic", margin: 0 }}>{motivoModal.motivoCancelacion || "Sin motivo registrado"}</p>
          </div>
          <div style={{ textAlign: "center", marginTop: "1.2rem" }}><BtnM label="Cerrar" bg="var(--surface-soft)" color="var(--text)" onClick={() => setMotivoModal(null)} /></div>
        </Overlay>
      )}</AnimatePresence>

      {/* VER RESUMEN */}
      <AnimatePresence>{resumenModal && (
        <Overlay onClose={() => setResumenModal(null)}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: "1rem" }}>Resumen de cita atendida</h4>
          <InfoBlock cita={resumenModal} />
          <div style={{ textAlign: "center", marginTop: "1.2rem" }}><BtnM label="Cerrar" bg="var(--brand)" color="#fff" onClick={() => setResumenModal(null)} /></div>
        </Overlay>
      )}</AnimatePresence>
    </div>
  );
}

/* ---- Sub-components ---- */

function InfoBlock({ cita }: { cita: Cita }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "var(--text)", border: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{cita.nombres} {cita.apellidos}</div>
      <div style={{ color: "var(--brand)", fontWeight: 600 }}>{cita.procedimiento}</div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", color: "var(--text-soft)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {cita.telefono}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> {cita.correo}</span>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", color: "var(--text-soft)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {cita.fecha}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {cita.hora}</span>
      </div>
      {cita.nota && <div style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Nota: {cita.nota}</div>}
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
        className="dark-aware-card admin-citas-modal"
        style={{ background: "var(--surface)", color: "var(--text)", borderRadius: 24, padding: "2rem", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function BtnM({ label, bg, color, onClick, disabled }: { label: string; bg: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button whileTap={disabled ? {} : { scale: 0.96 }} onClick={onClick} disabled={disabled}
      style={{ padding: "0.6rem 1.4rem", borderRadius: 100, border: "none", background: bg, color, fontWeight: 600, fontSize: "0.85rem", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      {label}
    </motion.button>
  );
}