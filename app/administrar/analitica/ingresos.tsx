"use client";

import { useState, useEffect } from "react";
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0" }}><div className="spinner-border" style={{ color: "var(--brand)" }} /></div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: "var(--text)", marginBottom: "1.5rem" }}>Analitica del Consultorio</h2>

      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "2rem" }}>
            <KPI icon={<CheckCircle size={18} />} label="Atendidas" value={stats.atendidas} color="#2E7D32" />
            <KPI icon={<Clock size={18} />} label="Pendientes / Confirmadas" value={stats.pendientes} color="#F9A825" />
            <KPI icon={<XCircle size={18} />} label="Canceladas" value={stats.canceladas} color="#C62828" />
            <KPI icon={<Activity size={18} />} label="Citas hoy" value={stats.citasHoy} color="#1565C0" />
            <KPI icon={<Users size={18} />} label="Pacientes registrados" value={stats.pacientes} color="#6A1B9A" />
            <KPI icon={<Calendar size={18} />} label="Total historico" value={stats.totalCitas} color="var(--brand)" />
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "2rem" }}>
            <h4 style={{ fontWeight: 600, color: "var(--text)", marginBottom: "1rem" }}>Citas por mes</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={citasMes}>
                <XAxis dataKey="mes" tick={{ fill: "var(--text-soft)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-soft)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="total" name="Total" fill="var(--brand-soft)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="atendidas" name="Atendidas" fill="#66BB6A" radius={[6, 6, 0, 0]} />
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
        </>
      )}
    </div>
  );
}

function KPI(props: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <motion.div initial={{ y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: props.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: props.color, flexShrink: 0 }}>{props.icon}</div>
      <div>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{props.label}</p>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{props.value}</p>
      </div>
    </motion.div>
  );
}