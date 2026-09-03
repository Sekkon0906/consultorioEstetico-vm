"use client";

import { useEffect, useState } from "react";
import { getReportesApi } from "@/services/analiticaApi";

interface Reporte {
  id: string; mes: number; anio: number;
  fechaGeneracion: string;
  totalOnline: number; totalConsultorio: number; totalEsperado: number;
  archivoURL?: string;
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmt = (v: number) => `$${Number(v).toLocaleString("es-CO")}`;

export default function HistorialReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportesApi();
        setReportes(
          data.map((r) => ({
            id: r.id,
            mes: r.mes,
            anio: r.anio,
            fechaGeneracion: r.fechaGeneracion,
            totalOnline: r.totalOnline,
            totalConsultorio: r.totalConsultorio,
            totalEsperado: r.totalEsperado,
            archivoURL: r.archivoUrl ?? undefined,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" style={{ color: "var(--brand)" }} role="status" />
      </div>
    );
  }

  if (reportes.length === 0) {
    return (
      <div className="p-4 text-center rounded-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-soft)", fontStyle: "italic" }}>
        No hay reportes guardados todavía.
      </div>
    );
  }

  return (
    <div className="rounded-4 overflow-hidden shadow-sm" style={{ border: "1px solid var(--border)" }}>
      <h5 className="fw-semibold px-4 py-3 m-0" style={{ backgroundColor: "var(--border)", color: "var(--text)" }}>
        Historial de Reportes
      </h5>
      <div className="overflow-x-auto">
        <table className="table table-sm mb-0" style={{ fontSize: "0.88rem" }}>
          <thead style={{ backgroundColor: "var(--surface-soft)" }}>
            <tr>
              <th style={{ color: "var(--text)", fontWeight: 600 }}>Período</th>
              <th style={{ color: "var(--text)", fontWeight: 600 }}>Online</th>
              <th style={{ color: "var(--text)", fontWeight: 600 }}>Consultorio</th>
              <th style={{ color: "var(--text)", fontWeight: 600 }}>Esperado</th>
              <th style={{ color: "var(--text)", fontWeight: 600 }}>Generado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--surface-soft)" }}>
                <td className="fw-semibold" style={{ color: "var(--text)" }}>
                  {MESES[(r.mes || 1) - 1]} {r.anio}
                </td>
                <td style={{ color: "#1B4F72" }}>{fmt(r.totalOnline)}</td>
                <td style={{ color: "var(--success)" }}>{fmt(r.totalConsultorio)}</td>
                <td style={{ color: "#7F5539" }}>{fmt(r.totalEsperado)}</td>
                <td style={{ color: "var(--text-soft)", fontSize: "0.8rem" }}>
                  {new Date(r.fechaGeneracion).toLocaleDateString("es-CO")}
                </td>
                <td>
                  {r.archivoURL && (
                    <a href={r.archivoURL} target="_blank" rel="noopener noreferrer"
                      className="btn btn-xs rounded-pill px-2 py-1"
                      style={{ fontSize: "0.72rem", backgroundColor: "var(--border)", color: "var(--text)", border: "none" }}
                    >
                       PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}