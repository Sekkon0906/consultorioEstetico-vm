"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
    supabase.from("reportes")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setReportes(data.map((r: any) => ({
            id: r.id,
            mes: r.mes,
            anio: r.anio,
            fechaGeneracion: r.creado_en,
            totalOnline: r.total_online ?? 0,
            totalConsultorio: r.total_consultorio ?? 0,
            totalEsperado: r.total_esperado ?? 0,
            archivoURL: r.archivo_url,
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" />
      </div>
    );
  }

  if (reportes.length === 0) {
    return (
      <div className="p-4 text-center rounded-4" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2", color: "#8B7060", fontStyle: "italic" }}>
        No hay reportes guardados todavía.
      </div>
    );
  }

  return (
    <div className="rounded-4 overflow-hidden shadow-sm" style={{ border: "1px solid #E9DED2" }}>
      <h5 className="fw-semibold px-4 py-3 m-0" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>
        Historial de Reportes
      </h5>
      <div className="overflow-x-auto">
        <table className="table table-sm mb-0" style={{ fontSize: "0.88rem" }}>
          <thead style={{ backgroundColor: "#F5EEE6" }}>
            <tr>
              <th style={{ color: "#4E3B2B", fontWeight: 600 }}>Período</th>
              <th style={{ color: "#4E3B2B", fontWeight: 600 }}>Online</th>
              <th style={{ color: "#4E3B2B", fontWeight: 600 }}>Consultorio</th>
              <th style={{ color: "#4E3B2B", fontWeight: 600 }}>Esperado</th>
              <th style={{ color: "#4E3B2B", fontWeight: 600 }}>Generado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F5EEE6" }}>
                <td className="fw-semibold" style={{ color: "#4E3B2B" }}>
                  {MESES[(r.mes || 1) - 1]} {r.anio}
                </td>
                <td style={{ color: "#1B4F72" }}>{fmt(r.totalOnline)}</td>
                <td style={{ color: "#2D6A4F" }}>{fmt(r.totalConsultorio)}</td>
                <td style={{ color: "#7F5539" }}>{fmt(r.totalEsperado)}</td>
                <td style={{ color: "#8B7060", fontSize: "0.8rem" }}>
                  {new Date(r.fechaGeneracion).toLocaleDateString("es-CO")}
                </td>
                <td>
                  {r.archivoURL && (
                    <a href={r.archivoURL} target="_blank" rel="noopener noreferrer"
                      className="btn btn-xs rounded-pill px-2 py-1"
                      style={{ fontSize: "0.72rem", backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}
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