// POST /api/reagenda/notify
// Envia un email al paciente avisándole que la doctora propuso una nueva
// fecha/hora para su cita. La reagenda ya quedó persistida en BD por el
// admin; este handler solo notifica.
//
// Auth: requiere un Bearer token de Supabase válido cuyo usuario tenga
// rol 'admin' o 'developer' en la tabla `usuarios`.
//
// Body: { reagendaId: number }
//
// Requiere envs:
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY  — para bypasear RLS al leer cita + paciente
//   - RESEND_API_KEY
//   - RESEND_FROM

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReagendaRow {
  id: number;
  cita_id: number;
  nueva_fecha: string;
  nueva_hora: string;
  motivo: string | null;
  estado: string;
}

interface CitaRow {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string;
  procedimiento: string;
  fecha: string;
  hora: string;
}

function buildHtml(opts: {
  paciente: string;
  procedimiento: string;
  fechaActual: string;
  horaActual: string;
  nuevaFecha: string;
  nuevaHora: string;
  motivo: string | null;
}) {
  const motivoBlock = opts.motivo
    ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5A4A3A;"><strong style="color:#3A2A1A;">Motivo:</strong> ${escapeHtml(opts.motivo)}</p>`
    : "";
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>Propuesta de reagenda</title></head>
<body style="margin:0;padding:24px;background:#F6F4EF;font-family:'Helvetica Neue',Arial,sans-serif;color:#3E2E22;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:#FFFDF9;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(58,42,26,0.08);">
    <tr><td style="background:linear-gradient(135deg,#B08968,#C9AD8D);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-family:'Playfair Display',serif;color:#FFFDF9;font-size:22px;font-weight:700;">Propuesta de cambio de cita</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 14px;font-size:16px;">Hola <strong>${escapeHtml(opts.paciente)}</strong>,</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5A4A3A;">
        La doctora Vanessa Medina necesita reagendar tu cita. A continuación te
        proponemos una nueva fecha y hora. Por favor entra a tu perfil para
        <strong>aceptar</strong> o <strong>rechazar</strong> el cambio.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
        <tr>
          <td width="50%" style="vertical-align:top;padding-right:8px;">
            <div style="background:#F3EBDF;border-radius:12px;padding:14px;">
              <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B7060;font-weight:700;margin-bottom:6px;">Tu cita actual</div>
              <div style="font-size:14px;color:#3A2A1A;font-weight:600;">${escapeHtml(opts.fechaActual)}</div>
              <div style="font-size:14px;color:#3A2A1A;">${escapeHtml(opts.horaActual)}</div>
            </div>
          </td>
          <td width="50%" style="vertical-align:top;padding-left:8px;">
            <div style="background:linear-gradient(135deg,#F0E0CC,#E8D2B4);border-radius:12px;padding:14px;border:1px solid rgba(176,137,104,0.4);">
              <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B5A12;font-weight:700;margin-bottom:6px;">Nueva propuesta</div>
              <div style="font-size:14px;color:#3A2A1A;font-weight:700;">${escapeHtml(opts.nuevaFecha)}</div>
              <div style="font-size:14px;color:#3A2A1A;font-weight:700;">${escapeHtml(opts.nuevaHora)}</div>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 6px;font-size:14px;color:#5A4A3A;"><strong style="color:#3A2A1A;">Procedimiento:</strong> ${escapeHtml(opts.procedimiento)}</p>
      ${motivoBlock}

      <div style="text-align:center;margin-top:24px;">
        <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://clinicavanessamedina.com")}/perfil/citas_agendadas" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#B08968,#C9AD8D);color:#FFFDF9;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Ver mi cita</a>
      </div>

      <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#8B7060;text-align:center;">
        Si tienes dudas, escríbenos por WhatsApp al
        <a href="https://wa.me/573155445748" style="color:#B08968;text-decoration:none;font-weight:600;">315 5445748</a>.
      </p>
    </td></tr>
    <tr><td style="padding:18px 32px;background:#F3EBDF;text-align:center;font-size:12px;color:#8B7060;">
      Consultorio JM · Ibagué, Tolima.
    </td></tr>
  </table>
</body>
</html>`.trim();
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

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM;
  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_KEY || !RESEND_FROM) {
    return NextResponse.json({ error: "Missing env" }, { status: 500 });
  }

  // 1. Auth — token Bearer de Supabase
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cliente con service role para leer perfil del caller y bypass RLS
  const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const callerId = userData.user.id;
  const { data: perfil, error: perfilErr } = await admin
    .from("usuarios")
    .select("rol")
    .eq("id", callerId)
    .single();
  if (perfilErr || !perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
  }
  if (!["admin", "developer", "ayudante"].includes(perfil.rol as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Body
  let body: { reagendaId?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!body.reagendaId) {
    return NextResponse.json({ error: "reagendaId required" }, { status: 400 });
  }

  // 3. Datos de la reagenda + cita
  const { data: reag, error: rerr } = await admin
    .from("reagendas")
    .select("id, cita_id, nueva_fecha, nueva_hora, motivo, estado")
    .eq("id", body.reagendaId)
    .single();
  if (rerr || !reag) {
    return NextResponse.json({ error: "Reagenda no encontrada" }, { status: 404 });
  }
  const reagenda = reag as ReagendaRow;

  const { data: cit, error: cerr } = await admin
    .from("citas")
    .select("id, nombres, apellidos, correo, procedimiento, fecha, hora")
    .eq("id", reagenda.cita_id)
    .single();
  if (cerr || !cit) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  const cita = cit as CitaRow;
  if (!cita.correo) {
    return NextResponse.json({ error: "Paciente sin correo" }, { status: 422 });
  }

  // 4. Enviar email
  const resend = new Resend(RESEND_KEY);
  const html = buildHtml({
    paciente: `${cita.nombres} ${cita.apellidos ?? ""}`.trim(),
    procedimiento: cita.procedimiento,
    fechaActual: fmtFecha(cita.fecha),
    horaActual: cita.hora,
    nuevaFecha: fmtFecha(reagenda.nueva_fecha),
    nuevaHora: reagenda.nueva_hora,
    motivo: reagenda.motivo,
  });

  const res = await resend.emails.send({
    from: RESEND_FROM,
    to: cita.correo,
    subject: `Propuesta de cambio para tu cita — ${cita.procedimiento}`,
    html,
  });

  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, reagendaId: reagenda.id });
}
