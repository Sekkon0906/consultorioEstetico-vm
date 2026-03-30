// app/services/procedimientosApi.ts
// Usa Supabase directamente, sin backend Express.

import type { Procedimiento } from "../types/domain";
import { supabase } from "@/lib/supabaseClient";

function mapRow(row: Record<string, unknown>): Procedimiento {
  return {
    id: row.id as number,
    nombre: row.nombre as string,
    desc: (row.descripcion as string) || "",
    descCompleta: (row.descripcion_completa as string) || "",
    precio: (row.precio as string) || "0",
    imagen: (row.imagen as string) || "",
    categoria: row.categoria as Procedimiento["categoria"],
    duracionMin: (row.duracion_min as number) ?? null,
    destacado: !!row.destacado,
  };
}

/** GET todos los procedimientos - publico */
export async function getProcedimientosApi(): Promise<Procedimiento[]> {
  const { data, error } = await supabase
    .from("procedimientos")
    .select("id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, duracion_min, destacado")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

/** GET procedimiento por ID - publico */
export async function getProcedimientoByIdApi(id: string | number): Promise<Procedimiento> {
  const { data, error } = await supabase
    .from("procedimientos")
    .select("id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, duracion_min, destacado")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Procedimiento no encontrado");
  return mapRow(data);
}

/** POST crear procedimiento - admin */
export async function createProcedimientoApi(
  payload: Omit<Procedimiento, "id" | "galeria">
): Promise<Procedimiento> {
  const { data, error } = await supabase
    .from("procedimientos")
    .insert({
      nombre: payload.nombre,
      descripcion: payload.desc,
      descripcion_completa: payload.descCompleta || "",
      precio: payload.precio,
      imagen: payload.imagen,
      categoria: payload.categoria,
      duracion_min: payload.duracionMin ?? null,
      destacado: payload.destacado ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

/** PUT actualizar procedimiento - admin */
export async function updateProcedimientoApi(
  id: string | number,
  payload: Partial<Omit<Procedimiento, "id">>
): Promise<Procedimiento> {
  const updates: Record<string, unknown> = { actualizado_en: new Date().toISOString() };

  if (payload.nombre !== undefined) updates.nombre = payload.nombre;
  if (payload.desc !== undefined) updates.descripcion = payload.desc;
  if (payload.descCompleta !== undefined) updates.descripcion_completa = payload.descCompleta;
  if (payload.precio !== undefined) updates.precio = payload.precio;
  if (payload.imagen !== undefined) updates.imagen = payload.imagen;
  if (payload.categoria !== undefined) updates.categoria = payload.categoria;
  if (payload.duracionMin !== undefined) updates.duracion_min = payload.duracionMin;
  if (payload.destacado !== undefined) updates.destacado = payload.destacado;

  const { data, error } = await supabase
    .from("procedimientos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

/** DELETE procedimiento - admin */
export async function deleteProcedimientoApi(id: string | number): Promise<void> {
  const { error } = await supabase.from("procedimientos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}