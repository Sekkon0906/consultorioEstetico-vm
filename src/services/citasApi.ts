/**
 * Citas y bloqueos de hora: cliente de la API propia.
 *
 * Antes cada función hablaba con Supabase directo. Dos eran un problema de
 * seguridad: `getCitasApi` resolvía el rol leyendo `usuarios.rol` desde el
 * navegador (esa columna la edita el propio usuario), y `getCitasByDayApi`
 * traía citas con nombres y teléfonos usando solo la anon key. Ahora el rol lo
 * decide `verifyToken` en el servidor y las horas ocupadas para agendar salen
 * de `/disponibilidad`, sin dato de paciente.
 */

import type { Cita, BloqueoHora } from "@/types/domain";
import { apiFetch, apiAuth } from "@/lib/apiCliente";
import { notificarNuevaCita } from "./notifyApi";

// ── Citas ───────────────────────────────────────────────────────────────────

/** Todas las citas de un día (con datos de paciente) — admin. */
export async function getCitasByDayApi(fechaISO: string): Promise<Cita[]> {
  return apiAuth<Cita[]>(`/citas?fecha=${encodeURIComponent(fechaISO)}`, { clave: "citas" });
}

/** Citas visibles para la sesión: todas si es admin, las propias si no. */
export async function getCitasApi(): Promise<Cita[]> {
  return apiAuth<Cita[]>("/citas", { clave: "citas" });
}

/** Siempre las citas de la sesión, aunque sea admin (para /perfil). */
export async function getMisCitasApi(): Promise<Cita[]> {
  return apiAuth<Cita[]>("/citas?mias=1", { clave: "citas" });
}

export async function createCitaApi(
  payload: Omit<Cita, "id" | "fechaCreacion">
): Promise<Cita> {
  const cita = await apiAuth<Cita>("/citas", {
    method: "POST",
    body: JSON.stringify(payload),
    clave: "cita",
  });
  // Aviso a la doctora (best-effort, no bloquea la creación).
  void notificarNuevaCita(cita.id);
  return cita;
}

export async function updateCitaApi(
  id: string,
  payload: Partial<Omit<Cita, "id" | "fechaCreacion">>
): Promise<void> {
  // El backend acepta camelCase y snake_case; se manda tal cual.
  await apiAuth(`/citas/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteCitaApi(id: string): Promise<void> {
  await apiAuth(`/citas/${id}`, { method: "DELETE" });
}

// ── Bloqueos de hora por fecha ──────────────────────────────────────────────

export async function getBloqueosPorFechaApi(fechaISO: string): Promise<BloqueoHora[]> {
  return apiFetch<BloqueoHora[]>(
    `/bloqueos-horas?fechaISO=${encodeURIComponent(fechaISO)}`,
    { clave: "bloqueos" }
  );
}

export async function createBloqueoHoraApi(
  payload: Omit<BloqueoHora, "id">
): Promise<BloqueoHora> {
  return apiAuth<BloqueoHora>("/bloqueos-horas", {
    method: "POST",
    body: JSON.stringify({ fechaISO: payload.fechaISO, hora: payload.hora, motivo: payload.motivo }),
    clave: "bloqueo",
  });
}

export async function deleteBloqueoHoraByFechaApi(fechaISO: string, hora: string): Promise<void> {
  await apiAuth(
    `/bloqueos-horas/${encodeURIComponent(fechaISO)}/${encodeURIComponent(hora)}`,
    { method: "DELETE" }
  );
}

// ── Bloqueos globales (horas tachadas todos los días) ───────────────────────

/** Solo las horas — para el calendario público. */
export async function getBloqueosGlobalesApi(): Promise<string[]> {
  const data = await apiFetch<{ globales: string[] }>("/disponibilidad");
  return data.globales ?? [];
}

export async function addBloqueoGlobalApi(hora: string, motivo?: string): Promise<void> {
  await apiAuth("/disponibilidad/globales", {
    method: "POST",
    body: JSON.stringify({ hora, motivo }),
  });
}

export async function removeBloqueoGlobalApi(hora: string): Promise<void> {
  await apiAuth(`/disponibilidad/globales/${encodeURIComponent(hora)}`, { method: "DELETE" });
}

// ── Disponibilidad de un día (horas ocupadas, sin dato de paciente) ─────────

export async function getDisponibilidadApi(
  fechaISO: string
): Promise<{ globales: string[]; ocupadas: string[] }> {
  const data = await apiFetch<{ globales: string[]; ocupadas?: string[] }>(
    `/disponibilidad?fecha=${encodeURIComponent(fechaISO)}`
  );
  return { globales: data.globales ?? [], ocupadas: data.ocupadas ?? [] };
}
