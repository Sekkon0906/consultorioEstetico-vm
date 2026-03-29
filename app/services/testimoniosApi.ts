// app/services/testimoniosApi.ts
// Usa Supabase directamente, sin backend Express.

import type { Testimonio } from "../types/domain";
import { supabase } from "@/lib/supabaseClient";

function mapRow(row: Record<string, unknown>): Testimonio {
  return {
    id: row.id as number,
    nombre: (row.nombre as string) || "",
    texto: (row.texto as string) || "",
    video: (row.video as string) || "",
    thumb: (row.thumb as string) || "",
    activo: !!row.activo,
    destacado: !!row.destacado,
    creadoEn: (row.creado_en as string) || "",
  };
}

/** GET todos los testimonios - publico */
export async function getTestimoniosApi(): Promise<Testimonio[]> {
  const { data, error } = await supabase
    .from("testimonios")
    .select("id, nombre, texto, video, thumb, activo, destacado, creado_en")
    .order("destacado", { ascending: false })
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

/** POST crear testimonio - admin */
export async function createTestimonioApi(
  payload: Omit<Testimonio, "id" | "creadoEn">
): Promise<Testimonio> {
  const { data, error } = await supabase
    .from("testimonios")
    .insert({
      nombre: payload.nombre,
      texto: payload.texto,
      video: payload.video || "",
      thumb: payload.thumb || "",
      activo: payload.activo ?? true,
      destacado: payload.destacado ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

/** PUT actualizar testimonio - admin */
export async function updateTestimonioApi(
  id: number,
  payload: Partial<Omit<Testimonio, "id" | "creadoEn">>
): Promise<Testimonio> {
  const updates: Record<string, unknown> = { actualizado_en: new Date().toISOString() };

  if (payload.nombre !== undefined) updates.nombre = payload.nombre;
  if (payload.texto !== undefined) updates.texto = payload.texto;
  if (payload.video !== undefined) updates.video = payload.video;
  if (payload.thumb !== undefined) updates.thumb = payload.thumb;
  if (payload.activo !== undefined) updates.activo = payload.activo;
  if (payload.destacado !== undefined) updates.destacado = payload.destacado;

  const { data, error } = await supabase
    .from("testimonios")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

/** DELETE testimonio - admin */
export async function deleteTestimonioApi(id: number): Promise<void> {
  const { error } = await supabase.from("testimonios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function activarTestimonioApi(id: number): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: true });
}

export async function desactivarTestimonioApi(id: number): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: false });
}
