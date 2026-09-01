/**
 * Procedimientos: cliente de la API propia.
 *
 * Antes hablaba con Supabase directamente, saltándose el backend. Eso
 * significaba que las reglas de quién puede escribir vivían en las políticas
 * RLS de Supabase y no en la API, y que apagar Supabase rompía el sitio
 * aunque la base ya estuviera migrada.
 *
 * Ahora pasa por Express, que es donde verifyToken y requireRole deciden.
 * El día del corte, este archivo no cambia: solo cambia a qué base apunta el
 * servidor.
 */

import type { Procedimiento } from "@/types/domain";
import { cached, invalidate } from "@/lib/cache";
import { apiFetch, apiAuth } from "@/lib/apiCliente";

const PROC_TTL = 60_000; // 60s

/** Invalida el caché de procedimientos (llamar tras crear/editar/borrar). */
export function bustProcedimientosCache(): void {
  invalidate("procedimientos:");
}

/** GET todos los procedimientos — público (cacheado). */
export async function getProcedimientosApi(opts?: { fresh?: boolean }): Promise<Procedimiento[]> {
  return cached("procedimientos:all", PROC_TTL,
    () => apiFetch<Procedimiento[]>("/procedimientos"), opts);
}

/** GET procedimiento por id — público (cacheado). */
export async function getProcedimientoByIdApi(
  id: string | number,
  opts?: { fresh?: boolean }
): Promise<Procedimiento> {
  return cached(`procedimientos:${id}`, PROC_TTL,
    () => apiFetch<Procedimiento>(`/procedimientos/${id}`), opts);
}

/** GET galería de un procedimiento — público. */
export async function getGaleriaProcedimientoApi(id: string | number) {
  return apiFetch<Array<{
    id: number; tipo: string; url: string;
    titulo: string | null; descripcion: string | null; orden: number;
  }>>(`/procedimientos/${id}/galeria`);
}

/** POST crear — admin. */
export async function createProcedimientoApi(
  payload: Omit<Procedimiento, "id" | "galeria">
): Promise<Procedimiento> {
  const creado = await apiAuth<Procedimiento>("/procedimientos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  bustProcedimientosCache();
  return creado;
}

/** PUT actualizar — admin. */
export async function updateProcedimientoApi(
  id: string | number,
  payload: Partial<Omit<Procedimiento, "id">>
): Promise<Procedimiento> {
  const actualizado = await apiAuth<Procedimiento>(`/procedimientos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  bustProcedimientosCache();
  return actualizado;
}

/** DELETE — admin. */
export async function deleteProcedimientoApi(id: string | number): Promise<void> {
  await apiAuth(`/procedimientos/${id}`, { method: "DELETE" });
  bustProcedimientosCache();
}
