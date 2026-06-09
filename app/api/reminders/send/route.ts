// API de recordatorios — envía email 24h antes de cada cita.
//
// Diseñado para correr como Cron Job (Vercel Cron, GitHub Actions, cualquier
// scheduler externo). Protegido por header `Authorization: Bearer <CRON_SECRET>`.
//
// Flujo:
//   1. Verifica el secreto.
//   2. Calcula la fecha de "mañana" en zona horaria America/Bogota.
//   3. Selecciona citas con esa fecha que no tengan recordatorio_enviado_en
//      y cuyo estado sea 'pendiente' o 'confirmada'.
//   4. Por cada cita: envía email vía Resend y actualiza recordatorio_enviado_en.
//   5. Devuelve resumen JSON con counts.
//
// Requiere envs:
//   - CRON_SECRET                — string aleatorio, único por entorno.
//   - SUPABASE_SERVICE_ROLE_KEY  — solo server-side, bypasses RLS.
//   - NEXT_PUBLIC_SUPABASE_URL   — la URL del proyecto.
//   - RESEND_API_KEY             — API key de https://resend.com
//   - RESEND_FROM                — ej. "Clínica Vanessa <citas@tu-dominio.com>"

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs"; // necesitamos node, no edge
export const dynamic = "force-dynamic";

interface CitaParaRecordatorio {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string;
  telefono: string | null;
  procedimiento: string;
  fecha: string;
  hora: string;
  estado: string;
}

function fechaManianaBogota(): string {
  // Hoy + 1 día, en zona horaria America/Bogota (UTC-5, sin DST).
  // Construimos YYYY-MM-DD con Intl, no con setDate (evita off-by-one).
  const ahora = new Date();
  const ahoraBogota = new Date(
    ahora.toLocaleString("en-US", { timeZone: "America/Bogota" })
  );
  ahoraBogota.setDate(ahoraBogota.getDate() + 1);
  const y = ahoraBogota.getFullYear();
  const m = String(ahoraBogota.getMonth() + 1).padStart(2, "0");
  const d = String(ahoraBogota.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildEmailHtml(cita: CitaParaRecordatorio): string {
  const fmtFecha = new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const nombreCompleto = `${cita.nombres} ${cita.apellidos ?? ""}`.trim();
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Recordatorio de cita</title>
</head>
<body style="margin:0;padding:24px;background:#F6F4EF;font-family:'Helvetica Neue',Arial,sans-serif;color:#3E2E22;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:#FFFDF9;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(58,42,26,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#B08968,#C9AD8D);padding:28px 32px;text-align:center;">
        <h1 style="margin:0;font-family:'Playfair Display',serif;color:#FFFDF9;font-size:24px;font-weight:700;letter-spacing:0.02em;">Consultorio JM</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 14px;font-size:16px;">Hola <strong>${nombreCompleto}</strong>,</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#5A4A3A;">
          Te recordamos amablemente que tienes una cita programada con nosotros mañana.
          Por favor confirma tu asistencia o avísanos si necesitas reagendar.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7EFE3;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
          <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Procedimiento:</strong> ${cita.procedimiento}</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Fecha:</strong> ${fmtFecha}</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">Hora:</strong> ${cita.hora}</td></tr>
        </table>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5A4A3A;">
          📍 <strong>Dirección:</strong> Carrera 5 #11-24, Torre Empresarial, Consultorio 502, Ibagué (Tolima).
        </p>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#5A4A3A;">
          📲 Si necesitas reagendar o cancelar, escríbenos por WhatsApp al <a href="https://wa.me/573155445748" style="color:#B08968;text-decoration:none;font-weight:600;">315 5445748</a>.
        </p>
        <div style="text-align:center;margin-top:28px;">
          <a href="https://wa.me/573155445748?text=Confirmo%20mi%20cita%20del%20${encodeURIComponent(fmtFecha)}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#B08968,#C9AD8D);color:#FFFDF9;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">Confirmar por WhatsApp</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 32px;background:#F3EBDF;text-align:center;font-size:12px;color:#8B7060;">
        Este recordatorio se envía automáticamente 24 h antes de tu cita.<br/>
        Consultorio JM · Ibagué, Tolima.
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

async function handleReminderSend(req: Request) {
  // 1. Auth: header Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";

  // 2. Vars de entorno
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM;
  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_KEY || !RESEND_FROM) {
    return NextResponse.json(
      { error: "Missing env config" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const resend = new Resend(RESEND_KEY);

  // 3. Fecha objetivo = mañana en zona Bogota
  const fechaTarget = fechaManianaBogota();

  // 4. Citas elegibles
  const { data: citas, error } = await supabase
    .from("citas")
    .select("id, nombres, apellidos, correo, telefono, procedimiento, fecha, hora, estado")
    .eq("fecha", fechaTarget)
    .in("estado", ["pendiente", "confirmada"])
    .is("recordatorio_enviado_en", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lista = (citas ?? []) as CitaParaRecordatorio[];

  // Modo dry-run: solo cuenta candidatos, no envía ni marca
  if (dryRun) {
    return NextResponse.json({
      fechaTarget,
      dryRun: true,
      total: lista.length,
      candidatos: lista.map((c) => ({ id: c.id, correo: c.correo, hora: c.hora })),
    });
  }

  // 5. Enviar y marcar
  let enviados = 0;
  let fallidos = 0;
  const errores: { id: number; reason: string }[] = [];

  for (const c of lista) {
    if (!c.correo) {
      fallidos++;
      errores.push({ id: c.id, reason: "sin correo" });
      continue;
    }
    try {
      const res = await resend.emails.send({
        from: RESEND_FROM,
        to: c.correo,
        subject: `Recordatorio: tu cita es mañana — ${c.procedimiento}`,
        html: buildEmailHtml(c),
      });
      if (res.error) throw new Error(res.error.message);

      const { error: updErr } = await supabase
        .from("citas")
        .update({ recordatorio_enviado_en: new Date().toISOString() })
        .eq("id", c.id);
      if (updErr) throw updErr;

      enviados++;
    } catch (err: any) {
      fallidos++;
      errores.push({ id: c.id, reason: err?.message ?? "unknown" });
    }
  }

  return NextResponse.json({
    fechaTarget,
    total: lista.length,
    enviados,
    fallidos,
    errores,
  });
}

// Vercel Cron envía GET con `Authorization: Bearer <CRON_SECRET>` automático
// si la env CRON_SECRET está seteada en el proyecto. POST queda disponible
// para schedulers externos (GitHub Actions, cron-job.org, etc).
export async function GET(req: Request) {
  return handleReminderSend(req);
}
export async function POST(req: Request) {
  return handleReminderSend(req);
}

// Para revisar candidatos sin enviar, llamar con ?dry=1
// → handleReminderSend devuelve { dryRun:true, total, candidatos:[...] }
