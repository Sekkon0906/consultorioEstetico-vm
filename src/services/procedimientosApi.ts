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
import { cabecerasAuth } from "@/lib/sesion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PROC_TTL = 60_000; // 60s

/** Invalida el caché de procedimientos (llamar tras crear/editar/borrar). */
export function bustProcedimientosCache(): void {
  invalidate("procedimientos:");
}

interface Respuesta<T> { ok: boolean; data: T; error?: string }

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...(opciones.headers || {}) },
  });
  const cuerpo: Respuesta<T> = await res.json().catch(() => ({ ok: false, data: null as T }));
  if (!res.ok || !cuerpo.ok) throw new Error(cuerpo.error || `Error ${res.status}`);
  return cuerpo.data;
}

/** Igual que `pedir`, pero adjuntando el token. Para lo que exige ser admin. */
async function pedirAutenticado<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  return pedir<T>(ruta, { ...opciones, headers: { ...(await cabecerasAuth()), ...(opciones.headers || {}) } });
}

/** GET todos los procedimientos — público (cacheado). */
export async function getProcedimientosApi(opts?: { fresh?: boolean }): Promise<Procedimiento[]> {
  return cached("procedimientos:all", PROC_TTL,
    () => pedir<Procedimiento[]>("/procedimientos"), opts);
}

/** GET procedimiento por id — público (cacheado). */
export async function getProcedimientoByIdApi(
  id: string | number,
  opts?: { fresh?: boolean }
): Promise<Procedimiento> {
  return cached(`procedimientos:${id}`, PROC_TTL,
    () => pedir<Procedimiento>(`/procedimientos/${id}`), opts);
}

/** GET galería de un procedimiento — público. */
export async function getGaleriaProcedimientoApi(id: string | number) {
  return pedir<Array<{
    id: number; tipo: string; url: string;
    titulo: string | null; descripcion: string | null; orden: number;
  }>>(`/procedimientos/${id}/galeria`);
}

/** POST crear — admin. */
export async function createProcedimientoApi(
  payload: Omit<Procedimiento, "id" | "galeria">
): Promise<Procedimiento> {
  const creado = await pedirAutenticado<Procedimiento>("/procedimientos", {
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
  const actualizado = await pedirAutenticado<Procedimiento>(`/procedimientos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  bustProcedimientosCache();
  return actualizado;
}

/** DELETE — admin. */
export async function deleteProcedimientoApi(id: string | number): Promise<void> {
  await pedirAutenticado(`/procedimientos/${id}`, { method: "DELETE" });
  bustProcedimientosCache();
}
