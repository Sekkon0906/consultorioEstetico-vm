// app/services/procedimientosApi.ts
// Usa Supabase directamente, sin backend Express.

import type { Procedimiento } from "@/types/domain";
import { supabase } from "@/lib/supabaseClient";
import { cached, invalidate } from "@/lib/cache";

const PROC_TTL = 60_000; // 60s

/** Invalida el caché de procedimientos (llamar tras crear/editar/borrar). */
export function bustProcedimientosCache(): void {
  invalidate("procedimientos:");
}

function mapRow(row: Record<string, unknown>): Procedimiento {
  return {
    id: row.id as number,
    nombre: row.nombre as string,
    desc: (row.descripcion as string) || "",
    descCompleta: (row.descripcion_completa as string) || "",
    precio: (row.precio as string) || "0",
    imagen: (row.imagen as string) || "",
    categoria: row.categoria as Procedimiento["categoria"],
    subcategoria: (row.subcategoria as string) || null,
    duracionMin: (row.duracion_min as number) ?? null,
    destacado: !!row.destacado,
    enPromocion: !!row.en_promocion,
    precioPromocional: (row.precio_promocional as string) || null,
    promocionHasta: (row.promocion_hasta as string) || null,
    mostrarGaleriaHome: row.mostrar_galeria_home == null ? false : !!row.mostrar_galeria_home,
    mostrarGaleriaProcedimientos:
      row.mostrar_galeria_procedimientos == null ? true : !!row.mostrar_galeria_procedimientos,
  };
}

/* SELECT base con todos los campos. Si alguna columna nueva no existe
   aún en BD, hay fallback al SELECT mínimo. */
const SELECT_FIELDS =
  "id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, subcategoria, duracion_min, destacado, en_promocion, precio_promocional, promocion_hasta, mostrar_galeria_home, mostrar_galeria_procedimientos";

/** GET todos los procedimientos - publico (cacheado) */
export async function getProcedimientosApi(opts?: { fresh?: boolean }): Promise<Procedimiento[]> {
  return cached("procedimientos:all", PROC_TTL, async () => {
    const { data, error } = await supabase
      .from("procedimientos")
      .select(SELECT_FIELDS)
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      // Fallback si la columna subcategoria aún no existe en BD
      const { data: data2, error: err2 } = await supabase
        .from("procedimientos")
        .select("id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, duracion_min, destacado")
        .order("categoria", { ascending: true })
        .order("nombre", { ascending: true });
      if (err2) throw new Error(err2.message);
      return (data2 ?? []).map(mapRow);
    }
    return (data ?? []).map(mapRow);
  }, opts);
}

/** GET procedimiento por ID - publico (cacheado) */
export async function getProcedimientoByIdApi(id: string | number, opts?: { fresh?: boolean }): Promise<Procedimiento> {
  return cached(`procedimientos:${id}`, PROC_TTL, async () => {
    const { data, error } = await supabase
      .from("procedimientos")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();

    if (error || !data) {
      // Fallback sin subcategoria
      const { data: data2, error: err2 } = await supabase
        .from("procedimientos")
        .select("id, nombre, descripcion, descripcion_completa, precio, imagen, categoria, duracion_min, destacado")
        .eq("id", id)
        .single();
      if (err2 || !data2) throw new Error("Procedimiento no encontrado");
      return mapRow(data2);
    }
    return mapRow(data);
  }, opts);
}

/** POST crear procedimiento - admin */
export async function createProcedimientoApi(
  payload: Omit<Procedimiento, "id" | "galeria">
): Promise<Procedimiento> {
  const insertObj: Record<string, unknown> = {
    nombre: payload.nombre,
    descripcion: payload.desc,
    descripcion_completa: payload.descCompleta || "",
    precio: payload.precio,
    imagen: payload.imagen,
    categoria: payload.categoria,
    duracion_min: payload.duracionMin ?? null,
    destacado: payload.destacado ?? false,
  };
  if (payload.subcategoria !== undefined) {
    insertObj.subcategoria = payload.subcategoria || null;
  }
  const { data, error } = await supabase
    .from("procedimientos")
    .insert(insertObj)
    .select()
    .single();

  if (error) throw new Error(error.message);
  bustProcedimientosCache();
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
  if (payload.subcategoria !== undefined) updates.subcategoria = payload.subcategoria || null;
  if (payload.enPromocion !== undefined) updates.en_promocion = payload.enPromocion;
  if (payload.precioPromocional !== undefined)
    updates.precio_promocional = payload.precioPromocional || null;
  if (payload.promocionHasta !== undefined)
    updates.promocion_hasta = payload.promocionHasta || null;
  if (payload.mostrarGaleriaHome !== undefined)
    updates.mostrar_galeria_home = payload.mostrarGaleriaHome;
  if (payload.mostrarGaleriaProcedimientos !== undefined)
    updates.mostrar_galeria_procedimientos = payload.mostrarGaleriaProcedimientos;

  const { data, error } = await supabase
    .from("procedimientos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  bustProcedimientosCache();
  return mapRow(data);
}

/** DELETE procedimiento - admin */
export async function deleteProcedimientoApi(id: string | number): Promise<void> {
  const { error } = await supabase.from("procedimientos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  bustProcedimientosCache();
}