/**
 * Testimonios: cliente de la API propia.
 *
 * Antes escribía directo en Supabase, así que quién podía crear o borrar lo
 * decidían las políticas RLS y no la API. Ahora pasa por Express, donde
 * verifyToken y requireRole lo controlan.
 */

import type { Testimonio } from "@/types/domain";
import { cached, invalidate } from "@/lib/cache";
import { apiFetch, apiAuth } from "@/lib/apiCliente";

const TEST_TTL = 60_000; // 60s

/** Invalida el caché de testimonios (llamar tras crear/editar/borrar). */
export function bustTestimoniosCache(): void {
  invalidate("testimonios:");
}

/** GET todos — público (cacheado). */
export async function getTestimoniosApi(opts?: { fresh?: boolean }): Promise<Testimonio[]> {
  return cached("testimonios:all", TEST_TTL,
    () => apiFetch<Testimonio[]>("/testimonios", { clave: "testimonios" }), opts);
}

/** POST crear — admin. */
export async function createTestimonioApi(
  payload: Omit<Testimonio, "id" | "creadoEn">
): Promise<Testimonio> {
  const creado = await apiAuth<Testimonio>("/testimonios", {
    method: "POST",
    clave: "testimonio",
    body: JSON.stringify(payload),
  });
  bustTestimoniosCache();
  return creado;
}

/** PUT actualizar — admin. */
export async function updateTestimonioApi(
  id: string,
  payload: Partial<Omit<Testimonio, "id" | "creadoEn">>
): Promise<Testimonio> {
  const actualizado = await apiAuth<Testimonio>(`/testimonios/${id}`, {
    method: "PUT",
    clave: "testimonio",
    body: JSON.stringify(payload),
  });
  bustTestimoniosCache();
  return actualizado;
}

/** DELETE — admin. */
export async function deleteTestimonioApi(id: string): Promise<void> {
  await apiAuth(`/testimonios/${id}`, { method: "DELETE" });
  bustTestimoniosCache();
}

export async function activarTestimonioApi(id: string): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: true });
}

export async function desactivarTestimonioApi(id: string): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: false });
}
