/**
 * Reagendas: cliente de la API propia.
 *
 * Dos flujos sobre la misma tabla:
 *  - La doctora PROPONE mover una cita (POST /reagendas) y el paciente
 *    confirma (aceptar / rechazar) desde su perfil.
 *  - El paciente PIDE reagendar (POST /citas/:id/solicitar-reagenda) y la
 *    doctora aprueba desde el panel.
 */

import { apiFetch, apiAuth } from "@/lib/apiCliente";

export interface ReagendaPendiente {
  id: string;
  cita_id: string;
  nueva_fecha: string;
  nueva_hora: string;
  motivo: string;
  estado: string;
  creada_en: string;
}

/** Propuestas pendientes sobre las citas del paciente en sesión. */
export async function getMisReagendasApi(): Promise<ReagendaPendiente[]> {
  return apiAuth<ReagendaPendiente[]>("/reagendas/mias", { clave: "reagendas" });
}

/** El paciente acepta: la cita se mueve a la nueva fecha/hora. */
export async function aceptarReagendaApi(id: string): Promise<void> {
  await apiAuth(`/reagendas/${id}/aceptar`, { method: "POST" });
}

/** El paciente rechaza la propuesta. */
export async function rechazarReagendaApi(id: string): Promise<void> {
  await apiAuth(`/reagendas/${id}/rechazar-paciente`, { method: "POST" });
}

/** La doctora propone mover una cita. Devuelve el id de la solicitud. */
export async function proponerReagendaApi(payload: {
  citaId: string;
  nuevaFecha: string;
  nuevaHora: string;
  motivo?: string;
}): Promise<string> {
  return apiAuth<string>("/reagendas", {
    method: "POST",
    body: JSON.stringify(payload),
    clave: "id",
  });
}

/** El paciente pide reagendar su propia cita. */
export async function solicitarReagendaApi(
  citaId: string,
  payload: { nueva_fecha: string; nueva_hora: string; motivo?: string }
): Promise<void> {
  await apiAuth(`/citas/${citaId}/solicitar-reagenda`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Admin: todas las solicitudes (ambas direcciones). */
export async function getReagendasAdminApi(): Promise<Record<string, unknown>[]> {
  return apiFetch<Record<string, unknown>[]>("/reagendas", { autenticado: true, clave: "reagendas" });
}

export async function aprobarReagendaAdminApi(id: string): Promise<void> {
  await apiAuth(`/reagendas/${id}/aprobar`, { method: "POST" });
}

export async function rechazarReagendaAdminApi(id: string): Promise<void> {
  await apiAuth(`/reagendas/${id}/rechazar`, { method: "POST" });
}
