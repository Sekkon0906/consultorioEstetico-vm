/**
 * Analítica del panel: cliente de la API propia.
 *
 * Antes cada pantalla traía todas las citas a memoria y contaba en el
 * navegador. Ahora el conteo lo hacen las vistas del servidor
 * (v_resumen_consultorio, v_citas_por_mes, v_top_procedimientos_mes_actual).
 */

import { apiAuth } from "@/lib/apiCliente";

export interface ResumenConsultorio {
  total_citas_historico: number;
  total_atendidas: number;
  total_canceladas: number;
  total_pendientes: number;
  total_confirmadas: number;
  citas_este_mes: number;
  citas_hoy: number;
  pacientes_unicos: number;
  usuarios_registrados: number;
}

export interface CitasPorMes {
  mes: string;
  anio: number;
  mes_num: number;
  total_citas: number;
  atendidas: number;
  canceladas: number;
  pendientes: number;
  confirmadas: number;
}

export interface TopProcedimiento {
  procedimiento: string;
  categoria: string | null;
  imagen: string | null;
  total: number;
  atendidas: number;
  tasa_exito_pct: number | null;
}

export interface ReporteMensual {
  id: string;
  mes: number;
  anio: number;
  totalOnline: number;
  totalConsultorio: number;
  totalEsperado: number;
  archivoUrl: string | null;
  fechaGeneracion: string;
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export async function getResumenApi(): Promise<ResumenConsultorio> {
  const d = await apiAuth<Record<string, unknown>>("/analytics/resumen");
  return {
    total_citas_historico: num(d.total_citas_historico),
    total_atendidas: num(d.total_atendidas),
    total_canceladas: num(d.total_canceladas),
    total_pendientes: num(d.total_pendientes),
    total_confirmadas: num(d.total_confirmadas),
    citas_este_mes: num(d.citas_este_mes),
    citas_hoy: num(d.citas_hoy),
    pacientes_unicos: num(d.pacientes_unicos),
    usuarios_registrados: num(d.usuarios_registrados),
  };
}

export async function getCitasPorMesApi(meses = 12): Promise<CitasPorMes[]> {
  const rows = await apiAuth<Record<string, unknown>[]>(`/analytics/citas-por-mes?meses=${meses}`);
  return rows.map((r) => ({
    mes: String(r.mes),
    anio: num(r.anio),
    mes_num: num(r.mes_num),
    total_citas: num(r.total_citas),
    atendidas: num(r.atendidas),
    canceladas: num(r.canceladas),
    pendientes: num(r.pendientes),
    confirmadas: num(r.confirmadas),
  }));
}

export async function getTopMesApi(): Promise<TopProcedimiento[]> {
  const rows = await apiAuth<Record<string, unknown>[]>("/analytics/top-mes");
  return rows.map((r) => ({
    procedimiento: String(r.procedimiento || ""),
    categoria: (r.categoria as string) ?? null,
    imagen: (r.imagen as string) ?? null,
    total: num(r.total),
    atendidas: num(r.atendidas),
    tasa_exito_pct: r.tasa_exito_pct == null ? null : Number(r.tasa_exito_pct),
  }));
}

/** Ranking histórico de procedimientos (todas las épocas). */
export async function getRankingProcedimientosApi(): Promise<
  Array<{ nombre: string; total_citas: number; total_atendidas: number }>
> {
  const rows = await apiAuth<Record<string, unknown>[]>("/analytics/procedimientos");
  return rows.map((r) => ({
    nombre: String(r.nombre || ""),
    total_citas: num(r.total_citas),
    total_atendidas: num(r.total_atendidas),
  }));
}

export async function getReportesApi(): Promise<ReporteMensual[]> {
  const rows = await apiAuth<Record<string, unknown>[]>("/reportes", { clave: "reportes" });
  return rows.map((r) => ({
    id: String(r.id),
    mes: num(r.mes),
    anio: num(r.anio),
    totalOnline: num(r.total_online),
    totalConsultorio: num(r.total_consultorio),
    totalEsperado: num(r.total_esperado),
    archivoUrl: (r.archivo_url as string) ?? null,
    fechaGeneracion: String(r.fecha_generacion || ""),
  }));
}
