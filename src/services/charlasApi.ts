/**
 * Charlas / formación continua: cliente de la API propia.
 *
 * Antes el frontend leía la tabla `charlas` (con la galería embebida) directo
 * de Supabase. Ahora pasa por GET /charlas, que hace el mismo JOIN en el
 * servidor y devuelve la galería ya agregada.
 */

import { apiFetch, apiAuth } from "@/lib/apiCliente";

export interface CharlaGaleriaItem {
  id: string;
  url: string;
  tipo: string;
  orden: number;
}

export interface CharlaApi {
  id: string;
  titulo: string;
  descripcion: string;
  detalle: string | null;
  imagen: string | null;
  fecha: string | null;
  creado_en: string;
  galeria: CharlaGaleriaItem[];
}

/** GET todas las charlas con su galería — público. */
export async function getCharlasApi(): Promise<CharlaApi[]> {
  return apiFetch<CharlaApi[]>("/charlas", { clave: "charlas" });
}

/** POST crear — admin. */
export async function createCharlaApi(payload: Record<string, unknown>) {
  return apiAuth<CharlaApi>("/charlas", {
    method: "POST",
    body: JSON.stringify(payload),
    clave: "charla",
  });
}

/** PUT actualizar — admin. */
export async function updateCharlaApi(id: string, payload: Record<string, unknown>) {
  return apiAuth<CharlaApi>(`/charlas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    clave: "charla",
  });
}

/** DELETE — admin. */
export async function deleteCharlaApi(id: string): Promise<void> {
  await apiAuth(`/charlas/${id}`, { method: "DELETE" });
}
