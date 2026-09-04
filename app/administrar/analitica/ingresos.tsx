"use client";

import { useState, useEffect } from "react";
import HistorialReportes from "./historialReportes";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import {
  getResumenApi,
  getCitasPorMesApi,
  getRankingProcedimientosApi,
} from "@/services/analiticaApi";
import { CheckCircle, XCircle, Clock, Calendar, Users, Activity } from "lucide-react";

var MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function IngresosPage() {
  var [stats, setStats] = useState<any>(null);
  var [topProcs, setTopProcs] = useState<any[]>([]);
  var [citasMes, setCitasMes] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [fallo, setFallo] = useState<string | null>(null);

  useEffect(function() {
    async function load() {
      try {
        var [resumen, porMes, ranking] = await Promise.all([
          getResumenApi(),
          getCitasPorMesApi(6),
          getRankingProcedimientosApi(),
        ]);

        setStats({
          totalCitas: resumen.total_citas_historico,
          atendidas: resumen.total_atendidas,
          canceladas: resumen.total_canceladas,
          pendientes: resumen.total_pendientes + resumen.total_confirmadas,
          citasHoy: resumen.citas_hoy,
          pacientes: resumen.usuarios_registrados,
        });

        setTopProcs(
          ranking
            .filter(function(p) { return p.total_citas > 0; })
            .map(function(p) { return { nombre: p.nombre, total: p.total_citas }; })
            .slice(0, 6)
        );

        // El backend devuelve los meses en orden descendente; se invierte para
        // pintarlos de izquierda (más antiguo) a derecha (más reciente).
        setCitasMes(
          [...porMes].reverse().map(function(r) {
            return { mes: MESES[(r.mes_num || 1) - 1], total: r.total_citas, atendidas: r.atendidas };
          })
        );
      } catch (e: any) {
        // Antes solo hacia console.error, asi que al fallar la pantalla se
        // quedaba con el titulo y NADA debajo: parecia que el consultorio no
        // tenia datos, cuando lo que pasaba es que no se pudieron leer.
        console.error(e);
        setFallo(e?.message || "No se pudieron cargar las estadisticas");
      }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0" }}><div className="spinner-border" style={{ color: "var(--brand)" }} /></div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.5rem" }}>Analitica del Consultorio</h2>

      {fallo && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)", borderRadius: 14, padding: "1rem 1.2rem", color: "var(--text)" }}>
          <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, margin: 0 }}>
              {/sesi[oó]n|token|401|autoriz/i.test(fallo) ? "Tu sesion caduco" : "No se pudieron cargar las estadisticas"}
            </p>
            <p style={{ color: "var(--text-soft)", fontSize: "0.86rem", margin: "0.2rem 0 0" }}>
              {/sesi[oó]n|token|401|autoriz/i.test(fallo)
                ? "Vuelve a entrar y las cifras se cargan solas."
                : fallo}
            </p>
          </div>
        </div>
      )}

      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "2rem" }}>
            {/* Los mismos tokens que usan las citas en el resto del panel.
                Iban en verdes y rojos fijos de modo claro, asi que una cita
                "atendida" era de un verde aqui y de otro en la agenda: eso
                deja de ser un codigo de color y pasa a ser decoracion. */}
            <KPI icon={<CheckCircle size={18} />} label="Atendidas" value={stats.atendidas} color="var(--estado-atendida)" />
            <KPI icon={<Clock size={18} />} label="Pendientes / Confirmadas" value={stats.pendientes} color="var(--estado-pendiente)" />
            <KPI icon={<XCircle size={18} />} label="Canceladas" value={stats.canceladas} color="var(--estado-cancelada)" />
            <KPI icon={<Activity size={18} />} label="Citas hoy" value={stats.citasHoy} color="var(--estado-confirmada)" />
            <KPI icon={<Users size={18} />} label="Pacientes registrados" value={stats.pacientes} color="var(--estado-global)" />
            <KPI icon={<Calendar size={18} />} label="Total historico" value={stats.totalCitas} color="var(--brand)" />
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "2rem" }}>
            <h4 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>Citas por mes</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={citasMes}>
                <XAxis dataKey="mes" tick={{ fill: "var(--text-soft)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-soft)", fontSize: 12 }} />
                <Tooltip /* Sin background, recharts pinta el tooltip en blanco fijo: en
                   modo oscuro salia una tarjeta blanca flotando sobre el negro. */
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text)" }}
                labelStyle={{ color: "var(--text)" }}
                itemStyle={{ color: "var(--text-soft)" }} />
                <Bar dataKey="total" name="Total" fill="var(--brand-soft)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="atendidas" name="Atendidas" fill="var(--estado-atendida)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.5rem" }}>
            <h4 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>Top procedimientos</h4>
            {topProcs.map(function(p, i) {
              var pct = stats.totalCitas > 0 ? Math.round((p.total / stats.totalCitas) * 100) : 0;
              return (
                <motion.div key={p.nombre} initial={{ x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.5rem 0.8rem", borderRadius: 12, background: i % 2 === 0 ? "var(--surface-soft)" : "transparent", marginBottom: "0.3rem" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand)", color: "var(--brand-contrast)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.85rem", margin: 0 }}>{p.nombre}</p>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: 3 }}><div style={{ height: "100%", borderRadius: 2, background: "var(--brand)", width: pct + "%" }} /></div>
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{p.total}</span>
                </motion.div>
              );
            })}
          </div>

          {/* El historial de ingresos existia como componente y no lo
              renderizaba nadie: codigo escrito, probado y muerto. Es lo
              unico de esta pantalla que habla de dinero — el resto son
              recuentos —, asi que va debajo del todo pero va. */}
          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>Reportes mensuales</h4>
            <HistorialReportes />
          </div>
        </>
      )}
    </div>
  );
}

function KPI(props: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <motion.div initial={{ y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
      {/* Era `props.color + "18"`, o sea pegarle un alfa hexadecimal al
          final del color. Eso solo funciona si el color ES un hexadecimal:
          con `var(--estado-atendida)` produce "var(--estado-atendida)18",
          que el navegador descarta, y el icono se quedaba sin fondo.
          color-mix sí sabe mezclar el valor ya resuelto de una variable. */}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, ${props.color} 14%, var(--surface))`, display: "flex", alignItems: "center", justifyContent: "center", color: props.color, flexShrink: 0 }}>{props.icon}</div>
      <div>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{props.label}</p>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{props.value}</p>
      </div>
    </motion.div>
  );
}