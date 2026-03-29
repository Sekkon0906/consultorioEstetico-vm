import { supabase } from "@/lib/supabaseClient";

export type EstadoCita = "pendiente" | "confirmada" | "atendida" | "cancelada";

export interface Cita {
  id: number;
  userId: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  procedimiento: string;
  tipoCita: "valoracion" | "implementacion";
  nota: string | null;
  fecha: string;
  hora: string;
  metodoPago: "Consultorio" | "Online" | null;
  tipoPagoConsultorio: "Efectivo" | "Tarjeta" | null;
  tipoPagoOnline: "PayU" | "PSE" | null;
  pagado: boolean;
  monto: number | null;
  montoPagado: number | null;
  montoRestante: number | null;
  creadaPor: "usuario" | "doctora";
  fechaCreacion: string;
  estado: EstadoCita;
  qrCita: string | null;
  motivoCancelacion: string | null;
}

const CITA_COLUMNS =
  "id, user_id, nombres, apellidos, telefono, correo, procedimiento, tipo_cita, nota, fecha, hora, estado, pagado, monto, monto_pagado, monto_restante, metodo_pago, tipo_pago_consultorio, tipo_pago_online, creada_por, creado_en, motivo_cancelacion";

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
    estado: (row.estado as EstadoCita) || "pendiente",
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
    qrCita: null,
  };
}

/** GET citas por dia */
export async function getCitasByDayAPI(
  fecha: string,
  estado?: string
): Promise<Cita[]> {
  let query = supabase
    .from("citas")
    .select(CITA_COLUMNS)
    .eq("fecha", fecha)
    .order("hora", { ascending: true });

  if (estado && estado !== "todos") {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCita);
}

/** GET todas las citas */
export async function getCitasAPI(): Promise<Cita[]> {
  const { data, error } = await supabase
    .from("citas")
    .select(CITA_COLUMNS)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCita);
}

export async function confirmarCitaAPI(id: number): Promise<void> {
  const { error } = await supabase
    .from("citas")
    .update({ estado: "confirmada", actualizado_en: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function cancelarCitaAPI(id: number, motivo: string): Promise<void> {
  const { error } = await supabase
    .from("citas")
    .update({
      estado: "cancelada",
      motivo_cancelacion: motivo,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateCitaAPI(
  id: number,
  updates: Partial<Record<string, unknown>>
): Promise<void> {
  const allowed: Record<string, string> = {
    fecha: "fecha",
    hora: "hora",
    estado: "estado",
    nota: "nota",
    motivo_cancelacion: "motivo_cancelacion",
    metodo_pago: "metodo_pago",
    tipo_pago_consultorio: "tipo_pago_consultorio",
    tipo_pago_online: "tipo_pago_online",
    pagado: "pagado",
    monto: "monto",
    monto_pagado: "monto_pagado",
    monto_restante: "monto_restante",
  };

  const dbUpdates: Record<string, unknown> = {
    actualizado_en: new Date().toISOString(),
  };

  for (const [key, col] of Object.entries(allowed)) {
    if (updates[key] !== undefined) {
      dbUpdates[col] = updates[key];
    }
  }

  const { error } = await supabase.from("citas").update(dbUpdates).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Confirmar pago de cita */
export async function confirmarPagoCitaAPI(
  id: number,
  datos: {
    monto: number;
    monto_pagado: number;
    metodo_pago?: string;
    tipo_pago_consultorio?: string;
  }
): Promise<void> {
  const montoPagado = datos.monto_pagado ?? 0;
  const pagado = montoPagado >= datos.monto;
  const montoRestante = Math.max(datos.monto - montoPagado, 0);

  const { error } = await supabase
    .from("citas")
    .update({
      pagado,
      monto: datos.monto,
      monto_pagado: montoPagado,
      monto_restante: montoRestante,
      metodo_pago: datos.metodo_pago || "Consultorio",
      tipo_pago_consultorio: datos.tipo_pago_consultorio || null,
      estado: pagado ? "atendida" : "confirmada",
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export function formatCurrency(value: number): string {
  return "$ " + value.toLocaleString("es-CO");
}

export function ordenarCitasPorHora(citas: Cita[], asc = true): Cita[] {
  return [...citas].sort((a, b) => {
    return asc
      ? parseHora(a.hora) - parseHora(b.hora)
      : parseHora(b.hora) - parseHora(a.hora);
  });
}

function parseHora(hora: string): number {
  if (!hora) return 0;
  const match12 = hora.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    if (match12[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (match12[3].toUpperCase() === "AM" && hour === 12) hour = 0;
    return hour * 60 + minutes;
  }
  const match24 = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  return 0;
}
