// POST /api/citas/notify
//
// Notificaciones por correo de citas (best-effort, llamado por el cliente
// tras una mutación). Dos eventos:
//   - evento "nueva"  → avisa a la DOCTORA que alguien agendó una cita.
//   - evento "estado" → avisa al PACIENTE que su cita cambió de estado.
//
// Seguridad: requiere Bearer token de Supabase. El contenido del correo SIEMPRE
// se arma con datos releídos de la BD (service role), nunca con lo que mande el
// cliente, así no se puede falsificar. El que llama debe ser el dueño de la
// cita o un administrador.
//
// Envs:
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//   - RESEND_FROM
//   - NOTIFY_DOCTOR_EMAIL   (destinatario de los avisos de nuevas citas)

import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRAND = "Consultorio JM";

interface CitaRow {
  id: string;
  user_id: string | null;
  nombres: string;
  apellidos: string | null;
  correo: string;
  telefono: string | null;
  procedimiento: string;
  fecha: string;
  hora: string;
  estado: string | null;
  motivo_cancelacion: string | null;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

function fmtFecha(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shell(titulo: string, inner: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${escapeHtml(titulo)}</title></head>
<body style="margin:0;padding:24px;background:#F6F4EF;font-family:'Helvetica Neue',Arial,sans-serif;color:#3E2E22;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:#FFFDF9;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(58,42,26,0.08);">
    <tr><td style="background:linear-gradient(135deg,#B08968,#C9AD8D);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-family:'Playfair Display',serif;color:#FFFDF9;font-size:22px;font-weight:700;">${escapeHtml(titulo)}</h1>
    </td></tr>
    <tr><td style="padding:32px;">${inner}</td></tr>
    <tr><td style="padding:18px 32px;background:#F3EBDF;text-align:center;font-size:12px;color:#8B7060;">
      ${BRAND} · Ibagué, Tolima.
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function htmlNuevaCita(c: CitaRow): string {
  const paciente = `${c.nombres} ${c.apellidos ?? ""}`.trim();
  const inner = `
    <p style="margin:0 0 14px;font-size:16px;">Tienes una <strong>nueva cita agendada</strong>.</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7EFE3;border-radius:12px;padding:18px 20px;margin-bottom:18px;">
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Paciente:</strong> ${escapeHtml(paciente)}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Procedimiento:</strong> ${escapeHtml(c.procedimiento)}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Fecha:</strong> ${escapeHtml(fmtFecha(c.fecha))}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Hora:</strong> ${escapeHtml(c.hora)}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Teléfono:</strong> ${escapeHtml(c.telefono ?? "—")}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Correo:</strong> ${escapeHtml(c.correo ?? "—")}</td></tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://clinicavanessamedina.com")}/administrar?section=citas" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#B08968,#C9AD8D);color:#FFFDF9;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Ver en el panel</a>
    </div>`;
  return shell("Nueva cita agendada", inner);
}

function htmlCambioEstado(c: CitaRow): string {
  const paciente = `${c.nombres} ${c.apellidos ?? ""}`.trim();
  const estado = (c.estado ?? "").toLowerCase();
  const mensajes: Record<string, string> = {
    confirmada: "¡Buenas noticias! Tu cita ha sido <strong>confirmada</strong>. Te esperamos.",
    cancelada: "Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.",
    atendida: "Tu cita figura como <strong>atendida</strong>. ¡Gracias por tu visita!",
    pendiente: "Tu cita quedó <strong>pendiente</strong> de confirmación.",
    reagendada: "Tu cita fue <strong>reagendada</strong>.",
  };
  const mensaje = mensajes[estado] || `El estado de tu cita cambió a <strong>${escapeHtml(c.estado ?? "—")}</strong>.`;
  const motivoBlock =
    estado === "cancelada" && c.motivo_cancelacion
      ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5A4A3A;"><strong style="color:#3A2A1A;">Motivo:</strong> ${escapeHtml(c.motivo_cancelacion)}</p>`
      : "";
  const inner = `
    <p style="margin:0 0 14px;font-size:16px;">Hola <strong>${escapeHtml(paciente)}</strong>,</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5A4A3A;">${mensaje}</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7EFE3;border-radius:12px;padding:18px 20px;margin-bottom:18px;">
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Procedimiento:</strong> ${escapeHtml(c.procedimiento)}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Fecha:</strong> ${escapeHtml(fmtFecha(c.fecha))}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Hora:</strong> ${escapeHtml(c.hora)}</td></tr>
    </table>
    ${motivoBlock}
    <div style="text-align:center;margin-top:24px;">
      <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://clinicavanessamedina.com")}/perfil/citas_agendadas" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#B08968,#C9AD8D);color:#FFFDF9;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Ver mi cita</a>
    </div>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#8B7060;text-align:center;">
      ¿Dudas? Escríbenos por WhatsApp al
      <a href="https://wa.me/573155445748" style="color:#B08968;text-decoration:none;font-weight:600;">315 5445748</a>.
    </p>`;
  return shell("Actualización de tu cita", inner);
}

async function isAdmin(admin: SupabaseClient, uid: string): Promise<boolean> {
  // Fuente de verdad nueva: admin_users. Fallback: usuarios.rol (compatibilidad).
  const { data: au } = await admin.from("admin_users").select("uid").eq("uid", uid).maybeSingle();
  if (au) return true;
  const { data: perfil } = await admin.from("usuarios").select("rol").eq("id", uid).maybeSingle();
  return !!perfil && ["admin", "developer", "ayudante"].includes(perfil.rol as string);
}

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM;
  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_KEY || !RESEND_FROM) {
    return NextResponse.json({ error: "Missing env" }, { status: 500 });
  }

  // 1. Auth
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const callerId = userData.user.id;

  // 2. Body
  let body: { evento?: string; citaId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const evento = body.evento;
  const citaId = body.citaId;
  if (!citaId || (evento !== "nueva" && evento !== "estado")) {
    return NextResponse.json({ error: "evento|citaId inválidos" }, { status: 400 });
  }

  // 3. Releer la cita real (service role)
  const { data: cit, error: cerr } = await admin
    .from("citas")
    .select("id, user_id, nombres, apellidos, correo, telefono, procedimiento, fecha, hora, estado, motivo_cancelacion")
    .eq("id", citaId)
    .single();
  if (cerr || !cit) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  const cita = cit as CitaRow;

  // 4. Autorización: dueño de la cita o admin
  const esAdmin = await isAdmin(admin, callerId);
  const esDueno = cita.user_id != null && cita.user_id === callerId;
  if (!esAdmin && !esDueno) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resend = new Resend(RESEND_KEY);

  // 5. Enviar según evento
  if (evento === "nueva") {
    const doctorEmail = process.env.NOTIFY_DOCTOR_EMAIL;
    if (!doctorEmail) {
      return NextResponse.json({ error: "NOTIFY_DOCTOR_EMAIL no configurado" }, { status: 500 });
    }
    const res = await resend.emails.send({
      from: RESEND_FROM,
      to: doctorEmail,
      subject: `Nueva cita: ${cita.procedimiento} — ${fmtFecha(cita.fecha)} ${cita.hora}`,
      html: htmlNuevaCita(cita),
    });
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 502 });
    return NextResponse.json({ ok: true, evento, to: "doctora" });
  }

  // evento === "estado"  → al paciente
  if (!cita.correo) {
    return NextResponse.json({ error: "Paciente sin correo" }, { status: 422 });
  }
  const res = await resend.emails.send({
    from: RESEND_FROM,
    to: cita.correo,
    subject: `Actualización de tu cita — ${cita.procedimiento}`,
    html: htmlCambioEstado(cita),
  });
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 502 });
  return NextResponse.json({ ok: true, evento, to: "paciente" });
}
