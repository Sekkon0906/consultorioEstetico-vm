// app/services/citasApi.ts
import type { Cita, BloqueoHora } from "../types/domain";
import { supabase } from "@/lib/supabaseClient";

function mapCita(row: Record<string, unknown>): Cita {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    nombres: (row.nombres as string) || "",
    apellidos: (row.apellidos as string) || "",
    telefono: (row.telefono as string) || "",
    correo: (row.correo as string) || "",
    procedimiento: (row.procedimiento as string) || "",
    tipoCita: (row.tipo_cita as Cita["tipoCita"]) || "valoracion",
    nota: (row.nota as string) || null,
    fecha: (row.fecha as string) || "",
    hora: (row.hora as string) || "",
    estado: (row.estado as Cita["estado"]) || "pendiente",
    pagado: !!row.pagado,
    monto: (row.monto as number) ?? null,
    montoPagado: (row.monto_pagado as number) ?? null,
    montoRestante: (row.monto_restante as number) ?? null,
    metodoPago: (row.metodo_pago as Cita["metodoPago"]) ?? null,
    tipoPagoConsultorio: (row.tipo_pago_consultorio as Cita["tipoPagoConsultorio"]) ?? null,
    tipoPagoOnline: (row.tipo_pago_online as Cita["tipoPagoOnline"]) ?? null,
    creadaPor: (row.creada_por as Cita["creadaPor"]) || "usuario",
    fechaCreacion: (row.creado_en as string) || "",
    motivoCancelacion: (row.motivo_cancelacion as string) || null,
    qrCita: (row.qr_cita as string) || null,
  };
}

const CITA_COLUMNS =
  "id, user_id, nombres, apellidos, telefono, correo, procedimiento, tipo_cita, nota, fecha, hora, estado, pagado, monto, monto_pagado, monto_restante, metodo_pago, tipo_pago_consultorio, tipo_pago_online, creada_por, creado_en, motivo_cancelacion";

export async function getCitasByDayApi(fechaISO: string): Promise<Cita[]> {
  const { data, error } = await supabase.from("citas").select(CITA_COLUMNS).eq("fecha", fechaISO).order("hora", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCita);
}

export async function getCitasApi(): Promise<Cita[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: userData } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
  const isAdmin = userData?.rol === "admin" || userData?.rol === "developer" || userData?.rol === "ayudante";
  let query = supabase.from("citas").select(CITA_COLUMNS);
  if (!isAdmin) query = query.eq("user_id", user.id);
  const { data, error } = await query.order("fecha", { ascending: true }).order("hora", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCita);
}

export async function getMisCitasApi(): Promise<Cita[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data, error } = await supabase.from("citas").select(CITA_COLUMNS).eq("user_id", user.id).order("fecha", { ascending: false }).order("hora", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCita);
}

export async function createCitaApi(payload: Omit<Cita, "id" | "fechaCreacion">): Promise<Cita> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: ocupada } = await supabase.from("citas").select("id").eq("fecha", payload.fecha).eq("hora", payload.hora).neq("estado", "cancelada");
  if (ocupada && ocupada.length > 0) throw new Error("Hora no disponible para esa fecha");
  const { data, error } = await supabase.from("citas").insert({
    user_id: payload.userId || user.id, nombres: payload.nombres, apellidos: payload.apellidos || "",
    telefono: payload.telefono || "", correo: payload.correo || "", procedimiento: payload.procedimiento,
    tipo_cita: payload.tipoCita || "valoracion", nota: payload.nota || null, fecha: payload.fecha, hora: payload.hora,
    estado: "pendiente", pagado: false, metodo_pago: payload.metodoPago || null,
    tipo_pago_consultorio: payload.tipoPagoConsultorio || null, tipo_pago_online: payload.tipoPagoOnline || null, creada_por: "usuario",
  }).select(CITA_COLUMNS).single();
  if (error) throw new Error(error.message);
  return mapCita(data);
}

export async function updateCitaApi(id: number, payload: Partial<Omit<Cita, "id" | "fechaCreacion">>): Promise<void> {
  const updates: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
  const campoMap: Record<string, string> = {
    fecha: "fecha", hora: "hora", estado: "estado", nota: "nota",
    motivoCancelacion: "motivo_cancelacion", motivo_cancelacion: "motivo_cancelacion",
    metodoPago: "metodo_pago", metodo_pago: "metodo_pago",
    tipoPagoConsultorio: "tipo_pago_consultorio", tipo_pago_consultorio: "tipo_pago_consultorio",
    tipoPagoOnline: "tipo_pago_online", tipo_pago_online: "tipo_pago_online",
    pagado: "pagado", monto: "monto", montoPagado: "monto_pagado", monto_pagado: "monto_pagado",
    montoRestante: "monto_restante", monto_restante: "monto_restante",
  };
  for (const [key, col] of Object.entries(campoMap)) {
    if ((payload as Record<string, unknown>)[key] !== undefined) updates[col] = (payload as Record<string, unknown>)[key];
  }
  const { error } = await supabase.from("citas").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCitaApi(id: number): Promise<void> {
  const { error } = await supabase.from("citas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// BLOQUEOS DE HORA - columna real en BD es "fecha", no "fecha_iso"

function mapBloqueo(row: Record<string, unknown>): BloqueoHora {
  const fechaRaw = row.fecha as string;
  const fechaClean = fechaRaw ? (typeof fechaRaw === "string" ? fechaRaw.slice(0, 10) : String(fechaRaw).slice(0, 10)) : "";
  return {
    id: row.id as number,
    fechaISO: fechaClean,
    hora: (row.hora as string) || "",
    motivo: (row.motivo as string) || "",
  };
}

export async function getBloqueosPorFechaApi(fechaISO: string): Promise<BloqueoHora[]> {
  const { data, error } = await supabase.from("bloqueos_horas").select("id, fecha, hora, motivo").eq("fecha", fechaISO);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBloqueo);
}

export async function createBloqueoHoraApi(payload: Omit<BloqueoHora, "id">): Promise<BloqueoHora> {
  const { data, error } = await supabase.from("bloqueos_horas").insert({ fecha: payload.fechaISO, hora: payload.hora, motivo: payload.motivo }).select().single();
  if (error) throw new Error(error.message);
  return mapBloqueo(data);
}

export async function deleteBloqueoHoraApi(id: number): Promise<void> {
  const { error } = await supabase.from("bloqueos_horas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBloqueoHoraByFechaApi(fechaISO: string, hora: string): Promise<void> {
  const { error } = await supabase.from("bloqueos_horas").delete().eq("fecha", fechaISO).eq("hora", hora);
  if (error) throw new Error(error.message);
}