/**
 * Comentarios / reseñas de pacientes: cliente de la API propia.
 */

import { apiFetch, apiAuth } from "@/lib/apiCliente";

export interface ComentarioPublico {
  id: number;
  nombre: string;
  procedimiento: string;
  texto: string;
  puntuacion: number;
  creado_en: string;
}

export interface ComentarioAdmin extends ComentarioPublico {
  user_id: string | null;
  aprobado: boolean;
}

/** Reseñas aprobadas — público. */
export async function getComentariosApi(): Promise<ComentarioPublico[]> {
  return apiFetch<ComentarioPublico[]>("/comentarios", { clave: "comentarios" });
}

/** ¿Puede opinar el usuario en sesión, y sobre qué procedimientos? */
export async function getElegibilidadComentarioApi(): Promise<{
  procedimientos: string[];
  yaComento: boolean;
}> {
  return apiAuth<{ procedimientos: string[]; yaComento: boolean }>(
    "/comentarios/elegibilidad"
  );
}

export async function crearComentarioApi(payload: {
  procedimiento: string;
  texto: string;
  puntuacion: number;
}): Promise<void> {
  await apiAuth("/comentarios", { method: "POST", body: JSON.stringify(payload) });
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function getComentariosAdminApi(): Promise<ComentarioAdmin[]> {
  return apiAuth<ComentarioAdmin[]>("/comentarios/admin", { clave: "comentarios" });
}

export async function aprobarComentarioApi(id: number, aprobado: boolean): Promise<void> {
  await apiAuth(`/comentarios/${id}`, {
    method: "PUT",
    body: JSON.stringify({ aprobado }),
  });
}

export async function eliminarComentarioApi(id: number): Promise<void> {
  await apiAuth(`/comentarios/${id}`, { method: "DELETE" });
}
