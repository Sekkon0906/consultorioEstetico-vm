"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface TotalesMes {
  totalOnline: number;
  totalConsultorio: number;
  totalEsperado: number;
}

/**
 * Llama al backend para obtener los ingresos de un mes concreto.
 * @param year  Año completo (ej: 2025)
 * @param monthIdx Índice de mes 0-11 (0 = enero, 11 = diciembre)
 */
export async function calcularIngresos(
  year?: number,
  monthIdx?: number
): Promise<TotalesMes> {
  const hoy = new Date();
  const y = year ?? hoy.getFullYear();
  const m = monthIdx ?? hoy.getMonth(); // 0-11

  const url = `${API_BASE_URL}/ingresos/totales?year=${y}&month=${m}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al obtener ingresos:", res.statusText);
    return {
      totalOnline: 0,
      totalConsultorio: 0,
      totalEsperado: 0,
    };
  }

  const data: {
    ok: boolean;
    totalOnline: number;
    totalConsultorio: number;
    totalEsperado: number;
  } = await res.json();

  if (!data.ok) {
    console.error("Respuesta de ingresos no OK:", data);
    return {
      totalOnline: 0,
      totalConsultorio: 0,
      totalEsperado: 0,
    };
  }

  return {
    totalOnline: data.totalOnline ?? 0,
    totalConsultorio: data.totalConsultorio ?? 0,
    totalEsperado: data.totalEsperado ?? 0,
  };
}
