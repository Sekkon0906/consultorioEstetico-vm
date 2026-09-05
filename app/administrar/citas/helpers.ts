/**
 * Helpers del panel de citas (admin).
 *
 * Antes hablaba con Supabase directo: entre otras cosas leía el listado
 * completo de citas —con nombres, teléfonos y correos— usando la anon key.
 * Ahora pasa por la API propia, donde verifyToken/requireRole deciden.
 */

import type { Cita } from "@/types/domain";
import {
  confirmarPagoCitaApi,
  getCitasApi,
  getCitasByDayApi,
  updateCitaApi,
} from "@/services/citasApi";
import { proponerReagendaApi } from "@/services/reagendasApi";

/* EL TIPO Y LOS ESTADOS SALEN DEL DOMINIO, NO SE REESCRIBEN AQUI.
 *
 * Habia una copia completa de `Cita` en este archivo, y ya habia derivado:
 * declaraba `firmaFecha`, que faltaba en el dominio, y ponia como
 * obligatorios campos que el dominio marca opcionales. Un tipo escrito dos
 * veces es un tipo que en algun momento dice dos cosas distintas sobre la
 * misma tabla — y aqui esa tabla son las citas de los pacientes.
 *
 * Se re-exportan para no tocar los cinco archivos del panel que los
 * importan desde aqui: el objetivo es que haya UNA definicion, no mover
 * imports de sitio.
 */
export type { Cita } from "@/types/domain";
export type { EstadoCita } from "@/types/domain";

/**
 * GET citas por día.
 *
 * La peticion la hace `services/citasApi`, no este archivo: antes estaba
 * escrita aqui con su propia llamada a `apiAuth`, identica a la del
 * servicio. Dos implementaciones de la misma peticion son dos sitios donde
 * arreglar el dia que cambie la ruta o la clave de cache.
 *
 * Lo que SI se queda aqui es el filtro por estado y el orden por hora: eso
 * no es hablar con la API, es comportamiento del panel —cambia de estado
 * sin recargar— y no tiene por que vivir en la capa de servicios.
 */
export async function getCitasByDayAPI(fecha: string, estado?: string): Promise<Cita[]> {
  const citas = await getCitasByDayApi(fecha);
  const lista = estado && estado !== "todos" ? citas.filter((c) => c.estado === estado) : citas;
  return ordenarCitasPorHora(lista);
}

/** GET todas las citas. */
export async function getCitasAPI(): Promise<Cita[]> {
  return getCitasApi();
}

// El backend avisa al paciente por correo cuando PUT /citas/:id cambia el estado.
export async function confirmarCitaAPI(id: string): Promise<void> {
  await updateCitaApi(id, { estado: "confirmada" });
}

export async function cancelarCitaAPI(id: string, motivo: string): Promise<void> {
  await updateCitaApi(id, { estado: "cancelada", motivo_cancelacion: motivo });
}

export async function updateCitaAPI(
  id: string,
  updates: Partial<Record<string, unknown>>
): Promise<void> {
  await updateCitaApi(id, updates as Record<string, unknown>);
}

/**
 * La doctora propone mover una cita. NO la mueve directamente: crea una
 * solicitud en `reagendas` para que el paciente la confirme.
 * `userId` se conserva en la firma por compatibilidad; el backend lo saca de
 * la propia cita.
 */
export async function solicitarReagendaAPI(
  citaId: string,
  _userId: string,
  nuevaFecha: string,
  nuevaHora: string,
  motivo: string
): Promise<{ id: string }> {
  const id = await proponerReagendaApi({ citaId, nuevaFecha, nuevaHora, motivo });
  return { id };
}

export async function confirmarPagoCitaAPI(
  id: string,
  datos: {
    monto: number;
    monto_pagado: number;
    metodo_pago?: string;
    tipo_pago_consultorio?: string;
  }
): Promise<void> {
  await confirmarPagoCitaApi(id, datos);
}

export function formatCurrency(value: number): string {
  return "$ " + value.toLocaleString("es-CO");
}

export function ordenarCitasPorHora(citas: Cita[], asc = true): Cita[] {
  return [...citas].sort((a, b) =>
    asc ? parseHora(a.hora) - parseHora(b.hora) : parseHora(b.hora) - parseHora(a.hora)
  );
}

function parseHora(hora: string): number {
  if (!hora) return 0;
  const match12 = hora.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    if (match12[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (match12[3].toUpperCase() === "AM" && hour === 12) hour = 0;
    return hour * 60 + minutes;
  }
  const match24 = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  return 0;
}
