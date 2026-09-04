"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Clock, User, Phone, Mail, FileText, CheckCircle, AlertCircle, XCircle, Loader } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getMisCitasApi } from "@/services/citasApi";
import {
  getMisReagendasApi,
  aceptarReagendaApi,
  rechazarReagendaApi,
} from "@/services/reagendasApi";
import type { Cita } from "@/types/domain";
import { formatearFecha, aISOLocal } from "@/lib/fechas";

// Trae jsPDF (pesado) consigo. Se usa solo cuando el paciente abre el
// modal de firma, así que no debe formar parte de la carga inicial de "Mis citas".
const FirmaConsentimiento = dynamic(() => import("@/components/FirmaConsentimiento"), {
  ssr: false,
});

interface ReagendaPend {
  id: string;
  cita_id: string;
  nueva_fecha: string;
  nueva_hora: string;
  motivo: string;
}

/* Los mismos cuatro estados que usa el panel de la doctora, y con los
   mismos tokens: si "confirmada" es un azul aquí y otro allí, deja de ser
   un código de color y pasa a ser decoración. Los tokens se recalculan por
   tema (ver 01-tokens.css); antes iban con pasteles claros fijos que en
   oscuro quedaban como parches luminosos. */
const ESTADO_STYLES = {
  pendiente: { bg: "var(--estado-pendiente-bg)", text: "var(--estado-pendiente)", icon: Loader, step: 1 },
  confirmada: { bg: "var(--estado-confirmada-bg)", text: "var(--estado-confirmada)", icon: CheckCircle, step: 2 },
  atendida: { bg: "var(--estado-atendida-bg)", text: "var(--estado-atendida)", icon: CheckCircle, step: 3 },
  cancelada: { bg: "var(--estado-cancelada-bg)", text: "var(--estado-cancelada)", icon: XCircle, step: 0 },
} as const;

/** El nombre de cada bloque. En el componente y no en `messages/`: son
 *  cuatro palabras y ponerlas en el archivo de traducciones obliga a saltar
 *  de fichero para entender el agrupado. Cuando el sitio se traduzca de
 *  verdad se mueven con el resto. */
const ETIQUETA_GRUPO: Record<string, string> = {
  hoy: "Hoy",
  semana: "Esta semana",
  proximas: "Más adelante",
  pasadas: "Ya pasaron",
};

function ProgressBar({ estado, t }: { estado: string; t: ReturnType<typeof useTranslations> }) {
  const currentStep =
    estado === "cancelada"
      ? 0
      : ESTADO_STYLES[estado as keyof typeof ESTADO_STYLES]?.step || 0;
  const STEPS = [
    { label: t("filters.pendiente"), key: "pendiente" },
    { label: t("filters.confirmada"), key: "confirmada" },
    { label: t("filters.atendida"), key: "atendida" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.2rem" }}>
      {STEPS.map((s, i) => {
        const active = currentStep >= i + 1;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: active ? 1 : 0.8 }}
                style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: active ? "var(--brand-contrast)" : "#9B8575", background: active ? "linear-gradient(135deg, var(--brand), var(--brand-soft))" : "var(--border)", transition: "all 0.4s", boxShadow: active ? "0 2px 8px rgba(176,137,104,0.3)" : "none" }}>
                {active ? <CheckCircle size={14} /> : i + 1}
              </motion.div>
              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: active ? "var(--text)" : "#9B8575", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: 3, borderRadius: 2, margin: "0 4px", marginBottom: 18, background: currentStep > i + 1 ? "linear-gradient(90deg, var(--brand), #C9AD8D)" : "var(--border)", transition: "background 0.4s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CitasAgendadas() {
  const t = useTranslations("perfil.citas");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";
  const currencyLocale = intlLocale;

  // Ver src/lib/fechas.ts: por qué se ancla al mediodía y por qué el
  // try/catch de antes no protegía nada.
  const formatFecha = (fecha: string) => formatearFecha(fecha, intlLocale);

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [ascendente, setAscendente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [error, setError] = useState<string | null>(null);
  const [reagendas, setReagendas] = useState<Record<string, ReagendaPend>>({});
  const [reagProcesando, setReagProcesando] = useState<string | null>(null);

  const cargarReagendas = async () => {
    try {
      const lista = await getMisReagendasApi();
      const map: Record<string, ReagendaPend> = {};
      lista.forEach((r) => { map[r.cita_id] = r; });
      setReagendas(map);
    } catch {
      setReagendas({});
    }
  };

  useEffect(() => {
    setLoading(true);
    getMisCitasApi()
      .then((cs) => { setCitas(cs); return cargarReagendas(); })
      .catch(() => setError(t("errorLoad")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aceptarReagenda = async (cita: Cita, r: ReagendaPend) => {
    setReagProcesando(r.id);
    try {
      await aceptarReagendaApi(r.id);
      setCitas((prev) => prev.map((c) => c.id === cita.id ? { ...c, fecha: r.nueva_fecha, hora: r.nueva_hora } : c));
      setReagendas((prev) => { const n = { ...prev }; delete n[cita.id]; return n; });
    } catch {
      setError(t("reagenda.errorApply"));
    } finally {
      setReagProcesando(null);
    }
  };

  const rechazarReagenda = async (cita: Cita, r: ReagendaPend) => {
    setReagProcesando(r.id);
    try {
      await rechazarReagendaApi(r.id);
      setReagendas((prev) => { const n = { ...prev }; delete n[cita.id]; return n; });
    } catch {
      setError(t("reagenda.errorReject"));
    } finally {
      setReagProcesando(null);
    }
  };

  /**
   * A qué bloque pertenece una cita.
   *
   * La lista era plana y ordenada por fecha, así que para saber si tenías
   * algo esta semana había que leer fecha por fecha. Agrupar responde de un
   * vistazo la única pregunta que uno le hace a esta pantalla: qué me toca
   * ahora y qué ya pasó.
   *
   * Se compara con cadenas "YYYY-MM-DD" y no con objetos Date a propósito:
   * la fecha de una cita es un día del calendario, no un instante, y en
   * cuanto se construye un Date aparece la zona horaria y con ella el
   * riesgo de correr la cita un día (ver `lib/fechas.ts`). Comparar texto
   * ISO ordena igual que comparar fechas y no tiene ese problema.
   */
  const bloqueDe = (fecha: string, hoy: string, en7: string): string => {
    if (fecha < hoy) return "pasadas";
    if (fecha === hoy) return "hoy";
    if (fecha <= en7) return "semana";
    return "proximas";
  };

  const citasFiltradas = useMemo(() => {
    let lista = [...citas];
    if (filtroEstado !== "todos") lista = lista.filter(c => c.estado === filtroEstado);
    return lista.sort((a, b) => {
      const f = ascendente ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha);
      return f !== 0 ? f : (ascendente ? a.hora.localeCompare(b.hora) : b.hora.localeCompare(a.hora));
    });
  }, [citas, ascendente, filtroEstado]);

  /** Los bloques, en el orden en que importan, ya sin los vacíos. */
  const grupos = useMemo(() => {
    const hoy = aISOLocal(new Date());
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const en7 = aISOLocal(d);

    const orden = ascendente
      ? ["hoy", "semana", "proximas", "pasadas"]
      // Al ordenar de más nuevo a más viejo, lo pasado va primero: es lo
      // que el usuario pidió ver al invertir.
      : ["pasadas", "proximas", "semana", "hoy"];

    const cajas: Record<string, Cita[]> = {};
    for (const c of citasFiltradas) {
      const k = bloqueDe(c.fecha, hoy, en7);
      (cajas[k] ||= []).push(c);
    }
    return orden
      .filter((k) => cajas[k]?.length)
      .map((k) => ({ clave: k, citas: cajas[k] }));
  }, [citasFiltradas, ascendente]);

  const resumen = useMemo(() => ({
    pendiente: citas.filter(c => c.estado === "pendiente").length,
    confirmada: citas.filter(c => c.estado === "confirmada").length,
    atendida: citas.filter(c => c.estado === "atendida").length,
    cancelada: citas.filter(c => c.estado === "cancelada").length,
  }), [citas]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}><div className="spinner-border" style={{ color: "var(--brand)" }} /></div>;
  if (error) return <div style={{ textAlign: "center", padding: "3rem" }}><p style={{ color: "var(--estado-cancelada)" }}>{error}</p><button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.6rem 2rem", borderRadius: 100, background: "var(--brand)", color: "var(--brand-contrast)", border: "none", fontWeight: 600, cursor: "pointer" }}>{t("retry")}</button></div>;

  return (
    <div className="dark-aware-section citas-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      {/* Header */}
      <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>{t("title")}</h2>
        <div style={{ width: 40, height: 3, background: "linear-gradient(90deg, var(--brand), #C9AD8D)", borderRadius: 2, margin: "0 auto 1.2rem" }} />
      </motion.div>

      {/* Layout: filtros a la izquierda (pila) · citas a la derecha */}
      <div className="citas-layout" style={{ display: "flex", gap: "1.8rem", alignItems: "flex-start" }}>
        <style>{`@media (max-width: 820px){ .citas-layout{ flex-direction: column; } .citas-side{ position: static !important; width: 100% !important; flex-direction: row !important; flex-wrap: wrap; } }`}</style>

        {/* SIDEBAR FILTROS */}
        <div className="citas-side" style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", position: "sticky", top: 90 }}>
          {([
            { key: "todos", label: t("filters.all"), count: citas.length },
            { key: "pendiente", label: t("filters.pendiente"), count: resumen.pendiente },
            { key: "confirmada", label: t("filters.confirmada"), count: resumen.confirmada },
            { key: "atendida", label: t("filters.atendida"), count: resumen.atendida },
            { key: "cancelada", label: t("filters.cancelada"), count: resumen.cancelada },
          ]).map(({ key, label, count }) => {
            const activo = filtroEstado === key;
            return (
              <button key={key} onClick={() => setFiltroEstado(key)}
                className={"citas-filter-btn" + (activo ? " is-active" : "")}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0.6rem 1rem", borderRadius: 12, fontSize: "0.86rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "background 0.2s, box-shadow 0.2s" }}>
                {label}
                <span className="citas-filter-count">{count}</span>
              </button>
            );
          })}
          <button onClick={() => setAscendente(a => !a)}
            style={{ marginTop: "0.4rem", padding: "0.55rem 1rem", borderRadius: 12, fontSize: "0.84rem", fontWeight: 600, border: "1px solid rgba(176,137,104,0.25)", cursor: "pointer", background: "var(--surface)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {ascendente ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {t("sortByDate")}
          </button>
        </div>

        {/* COLUMNA DE CITAS */}
        <div style={{ flex: 1, minWidth: 0 }}>
      {citasFiltradas.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-soft)", padding: "2rem 0" }}>
          {filtroEstado === "todos"
            ? t("emptyAll")
            : t("emptyFiltered", { estado: t(`filters.${filtroEstado}` as any) })}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
          {grupos.map((grupo) => (
          <section key={grupo.clave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* El separador del bloque. Lleva el número al lado: el título
                solo dice cuándo, y lo que quieres saber a la vez es cuánto. */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: 0, whiteSpace: "nowrap" }}>
                {ETIQUETA_GRUPO[grupo.clave]}
              </h2>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--brand-contrast)", background: "var(--brand)", borderRadius: 100, padding: "0.1rem 0.5rem", lineHeight: 1.6 }}>
                {grupo.citas.length}
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          <AnimatePresence>
            {grupo.citas.map((cita, i) => {
              const est = ESTADO_STYLES[cita.estado as keyof typeof ESTADO_STYLES] || ESTADO_STYLES.pendiente;
              const isCancelada = cita.estado === "cancelada";
              const isConfirmada = cita.estado === "confirmada";

              return (
                <motion.div key={cita.id}
                  initial={{ y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  style={{ background: "var(--bg-elevated)", backdropFilter: "blur(8px)", borderRadius: 20, border: "1px solid rgba(176,137,104,0.12)", boxShadow: "0 4px 16px rgba(78,59,43,0.06)", overflow: "hidden", transition: "box-shadow 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(78,59,43,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(78,59,43,0.06)"; }}
                >
                  {/* Top accent bar */}
                  <div style={{ height: 4, background: isCancelada ? "#E57373" : "linear-gradient(90deg, #B08968, #C9AD8D)" }} />

                  <div style={{ padding: "1.4rem 1.7rem" }}>

                    {isCancelada ? (
                      /* === CANCELADA — vista colapsada === */
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                          <div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-soft)", margin: 0, textDecoration: "line-through", textDecorationColor: "currentColor" }}>{cita.procedimiento}</h3>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatFecha(cita.fecha)} · {cita.hora}</span>
                          </div>
                          <span className="cita-estado-pill cancelada" style={{ background: est.bg, color: est.text, padding: "0.3rem 1rem", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>{t("estadoChip.cancelada")}</span>
                        </div>
                        {cita.motivoCancelacion && (
                          <div style={{ marginTop: "0.7rem", padding: "0.55rem 0.9rem", background: "#FCE4EC", borderRadius: 10, fontSize: "0.8rem", color: "var(--estado-cancelada)", display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertCircle size={13} /> {t("labels.cancelReason")} {cita.motivoCancelacion}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Barra de progreso (única fuente del estado) */}
                        <ProgressBar estado={cita.estado} t={t} />

                        {/* Cabecera: procedimiento (izq) + fecha/hora destacada (der) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.1rem", gap: "1rem", flexWrap: "wrap" }}>
                          <div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.15rem" }}>{cita.procedimiento}</h3>
                            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {cita.tipoCita === "valoracion" ? t("labels.valoracion") : t("labels.implementacion")}
                            </span>
                          </div>
                          <div style={{ textAlign: "right", background: "linear-gradient(135deg, #FFFBF7, #F0E5D8)", border: "1px solid rgba(176,137,104,0.14)", borderRadius: 14, padding: "0.6rem 1rem", minWidth: 150 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>
                              <Clock size={14} color="var(--brand)" /> {cita.hora}
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 2 }}>{formatFecha(cita.fecha)}</div>
                          </div>
                        </div>

                        {/* Metadatos compactos (una sola línea tenue) */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 1.2rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={13} color="var(--brand)" /> {cita.nombres} {cita.apellidos}</span>
                          {cita.telefono && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={13} color="var(--brand)" /> {cita.telefono}</span>}
                          {cita.correo && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={13} color="var(--brand)" /> {cita.correo}</span>}
                          {cita.metodoPago && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="fas fa-wallet" style={{ color: "var(--brand)" }} /> {cita.metodoPago} ({cita.tipoPagoConsultorio || cita.tipoPagoOnline || ""})</span>}
                        </div>

                        {cita.nota && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.83rem", color: "var(--text-soft)", padding: "0.55rem 0.8rem", background: "var(--surface-soft)", borderRadius: 10, marginBottom: "0.8rem" }}>
                            <FileText size={14} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} /> {cita.nota}
                          </div>
                        )}

                        {/* Monto */}
                        {cita.monto != null && cita.monto > 0 && (
                          <div style={{ padding: "0.55rem 1rem", background: "linear-gradient(135deg, #FFFBF7, #F0E5D8)", borderRadius: 12, border: "1px solid rgba(176,137,104,0.1)", fontSize: "0.83rem", color: "var(--text)", marginBottom: "0.5rem" }}>
                            <strong>{t("labels.amount")}</strong> ${cita.monto.toLocaleString(currencyLocale)}
                            {cita.montoPagado != null && <span> · {t("labels.paid")} ${cita.montoPagado.toLocaleString(currencyLocale)}</span>}
                            {cita.montoRestante != null && cita.montoRestante > 0 && <span> · {t("labels.remaining")} ${cita.montoRestante.toLocaleString(currencyLocale)}</span>}
                          </div>
                        )}
                      </>
                    )}

                    {/* Solicitud de reagenda del consultorio (pt 10) */}
                    {!isCancelada && cita.estado !== "atendida" && reagendas[cita.id] && (
                      <div style={{ marginTop: "1rem", padding: "1rem 1.2rem", background: "var(--estado-pendiente-bg)", border: "1px solid var(--estado-pendiente-borde)", borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--estado-pendiente)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                          <AlertCircle size={16} /> {t("reagenda.title")}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginBottom: "0.3rem" }}>
                          {t("reagenda.newProposal")} <strong>{formatFecha(reagendas[cita.id].nueva_fecha)} — {reagendas[cita.id].nueva_hora}</strong>
                        </div>
                        {reagendas[cita.id].motivo && (
                          <div style={{ fontSize: "0.82rem", color: "var(--text-soft)", fontStyle: "italic", marginBottom: "0.7rem" }}>
                            {t("reagenda.reason")} {reagendas[cita.id].motivo}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          <button
                            disabled={reagProcesando === reagendas[cita.id].id}
                            onClick={() => aceptarReagenda(cita, reagendas[cita.id])}
                            style={{ flex: 1, minWidth: 130, padding: "0.55rem 1rem", borderRadius: 100, border: "none", background: "linear-gradient(135deg, #2E7D32, #43A047)", color: "white", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", opacity: reagProcesando === reagendas[cita.id].id ? 0.6 : 1 }}
                          >
                            {reagProcesando === reagendas[cita.id].id ? t("reagenda.applying") : t("reagenda.accept")}
                          </button>
                          <button
                            disabled={reagProcesando === reagendas[cita.id].id}
                            onClick={() => rechazarReagenda(cita, reagendas[cita.id])}
                            style={{ flex: 1, minWidth: 130, padding: "0.55rem 1rem", borderRadius: 100, border: "1px solid #E0CDB5", background: "#FFF", color: "var(--estado-cancelada)", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer", opacity: reagProcesando === reagendas[cita.id].id ? 0.6 : 1 }}
                          >
                            {t("reagenda.reject")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Consent signing button - only for confirmed citas */}
                    {isConfirmada && !cita.consentimientoFirmado && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <FirmaConsentimiento
                          citaId={cita.id}
                          pacienteNombre={`${cita.nombres} ${cita.apellidos || ""}`}
                          procedimiento={cita.procedimiento}
                          fecha={cita.fecha}
                          onFirmado={() => {
                            setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, consentimientoFirmado: true } : c));
                          }}
                        />
                      </div>
                    )}

                    {cita.consentimientoFirmado && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 600, color: "var(--estado-atendida)", background: "var(--estado-atendida-bg)", padding: "0.5rem 1.2rem", borderRadius: 100 }}>
                          <CheckCircle size={14} /> {t("consent.signed")}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          </section>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
