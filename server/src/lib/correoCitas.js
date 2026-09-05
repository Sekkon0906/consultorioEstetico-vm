/**
 * Correos relacionados con citas: aviso a la doctora de una cita nueva, aviso
 * al paciente de un cambio de estado, propuesta de reagenda y recordatorio.
 *
 * Antes vivían en rutas de Next.js (app/api/*) que releían la cita con la
 * service_role key de Supabase. Ahora se envían desde el backend, en la misma
 * operación que provoca el aviso, con los datos que ya tiene a mano.
 *
 * Todo es best-effort: `enviarCorreo` nunca lanza. Si RESEND no está
 * configurado, se registra en consola y la operación principal sigue.
 */

const { enviarCorreo } = require("./correo");

const MARCA = "Consultorio JM";

function sitioUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Correo de la doctora que recibe los avisos de citas nuevas. */
function correoDoctora() {
  return process.env.NOTIFY_DOCTOR_EMAIL || process.env.CORREO_DOCTORA || null;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

function fmtFecha(iso) {
  try {
    return new Date(String(iso) + "T12:00:00").toLocaleDateString("es-CO", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return String(iso); }
}

/**
 * `shell` con un tercer parametro: el enlace de baja.
 *
 * Va como argumento y NO siempre puesto, porque la baja solo debe aparecer en
 * los correos comerciales. Ponerla en un recordatorio de cita seria peor que
 * inutil: sugiere que se puede dejar de recibir el aviso de una cita medica,
 * y quien lo pulse se quedara esperando un recordatorio que ya no llega.
 *
 * Dicho de otro modo: el pie de baja se pasa a proposito en cada envio
 * comercial, en vez de salir solo. Si algun dia alguien se olvida de pasarlo,
 * el fallo es que un correo comercial no lleva baja —visible y corregible—, y
 * no que un correo de servicio la lleva de mas, que es silencioso.
 */
function shell(titulo, inner, urlBaja) {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#F6F4EF;font-family:'Helvetica Neue',Arial,sans-serif;color:#3E2E22;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:#FFFDF9;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(58,42,26,0.08);">
  <tr><td style="background:linear-gradient(135deg,#B08968,#C9AD8D);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;font-family:'Playfair Display',serif;color:#FFFDF9;font-size:22px;font-weight:700;">${esc(titulo)}</h1>
  </td></tr>
  <tr><td style="padding:32px;">${inner}</td></tr>
  <tr><td style="padding:18px 32px;background:#F3EBDF;text-align:center;font-size:12px;color:#8B7060;">${MARCA} · Ibagué, Tolima.${
    urlBaja
      ? `<br><a href="${urlBaja}" style="color:#8B7060;text-decoration:underline;">Dejar de recibir promociones</a>`
      : ""
  }</td></tr>
</table></body></html>`;
}

function filas(pares) {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7EFE3;border-radius:12px;padding:18px 20px;margin:0 0 18px;">${
    pares.filter(([, v]) => v != null && v !== "").map(([k, v]) =>
      `<tr><td style="padding:6px 0;font-size:14px;color:#6C584C;"><strong style="color:#3A2A1A;">${esc(k)}:</strong> ${esc(v)}</td></tr>`
    ).join("")
  }</table>`;
}

function boton(texto, url) {
  return `<div style="text-align:center;margin-top:24px;"><a href="${esc(url)}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#B08968,#C9AD8D);color:#FFFDF9;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px;">${esc(texto)}</a></div>`;
}

// ── Correos concretos ───────────────────────────────────────────────────────

/** Aviso a la doctora: alguien agendó una cita. */
function avisarNuevaCitaADoctora(cita) {
  const para = correoDoctora();
  if (!para) {
    console.warn("[correo] NOTIFY_DOCTOR_EMAIL sin configurar: no se avisa de la cita nueva.");
    return Promise.resolve({ ok: false, motivo: "sin_destinatario" });
  }
  const paciente = `${cita.nombres || ""} ${cita.apellidos || ""}`.trim();
  const inner =
    `<p style="margin:0 0 14px;font-size:16px;">Tienes una <strong>nueva cita agendada</strong>.</p>` +
    filas([
      ["Paciente", paciente],
      ["Procedimiento", cita.procedimiento],
      ["Fecha", fmtFecha(cita.fecha)],
      ["Hora", cita.hora],
      ["Teléfono", cita.telefono],
      ["Correo", cita.correo],
    ]) +
    boton("Ver en el panel", `${sitioUrl()}/administrar?section=citas`);
  return enviarCorreo({
    para,
    asunto: `Nueva cita: ${cita.procedimiento} — ${fmtFecha(cita.fecha)} ${cita.hora}`,
    html: shell("Nueva cita agendada", inner),
  });
}

const MENSAJE_ESTADO = {
  confirmada: "¡Buenas noticias! Tu cita ha sido <strong>confirmada</strong>. Te esperamos.",
  cancelada: "Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.",
  atendida: "Tu cita figura como <strong>atendida</strong>. ¡Gracias por tu visita!",
  pendiente: "Tu cita quedó <strong>pendiente</strong> de confirmación.",
};

/** Aviso al paciente: su cita cambió de estado. */
function avisarCambioEstadoAPaciente(cita) {
  if (!cita.correo) return Promise.resolve({ ok: false, motivo: "sin_correo" });
  const estado = String(cita.estado || "").toLowerCase();
  const mensaje = MENSAJE_ESTADO[estado] || `El estado de tu cita cambió a <strong>${esc(cita.estado)}</strong>.`;
  const motivo =
    estado === "cancelada" && cita.motivo_cancelacion
      ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5A4A3A;"><strong style="color:#3A2A1A;">Motivo:</strong> ${esc(cita.motivo_cancelacion)}</p>`
      : "";
  const inner =
    `<p style="margin:0 0 14px;font-size:16px;">Hola <strong>${esc(`${cita.nombres || ""} ${cita.apellidos || ""}`.trim())}</strong>,</p>` +
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5A4A3A;">${mensaje}</p>` +
    filas([
      ["Procedimiento", cita.procedimiento],
      ["Fecha", fmtFecha(cita.fecha)],
      ["Hora", cita.hora],
    ]) + motivo +
    boton("Ver mi cita", `${sitioUrl()}/perfil/citas_agendadas`);
  return enviarCorreo({
    para: cita.correo,
    asunto: `Actualización de tu cita — ${cita.procedimiento}`,
    html: shell("Actualización de tu cita", inner),
  });
}

/** Aviso al paciente: la doctora propone mover su cita. */
function avisarReagendaAPaciente({ correo, nombres, apellidos, procedimiento, nueva_fecha, nueva_hora, motivo }) {
  if (!correo) return Promise.resolve({ ok: false, motivo: "sin_correo" });
  const inner =
    `<p style="margin:0 0 14px;font-size:16px;">Hola <strong>${esc(`${nombres || ""} ${apellidos || ""}`.trim())}</strong>,</p>` +
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5A4A3A;">El consultorio propone <strong>mover tu cita</strong>. Entra a tu perfil para aceptar o rechazar el cambio.</p>` +
    filas([
      ["Procedimiento", procedimiento],
      ["Nueva fecha", fmtFecha(nueva_fecha)],
      ["Nueva hora", nueva_hora],
      ["Motivo", motivo],
    ]) +
    boton("Revisar la propuesta", `${sitioUrl()}/perfil/citas_agendadas`);
  return enviarCorreo({
    para: correo,
    asunto: `Propuesta para reagendar tu cita — ${procedimiento}`,
    html: shell("Propuesta de reagenda", inner),
  });
}

/** Recordatorio al paciente: su cita es mañana. */
function recordatorioAPaciente(cita) {
  if (!cita.correo) return Promise.resolve({ ok: false, motivo: "sin_correo" });
  const inner =
    `<p style="margin:0 0 14px;font-size:16px;">Hola <strong>${esc(`${cita.nombres || ""} ${cita.apellidos || ""}`.trim())}</strong>,</p>` +
    `<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#5A4A3A;">Te recordamos que tienes una cita programada con nosotros mañana. Por favor confirma tu asistencia o avísanos si necesitas reagendar.</p>` +
    filas([
      ["Procedimiento", cita.procedimiento],
      ["Fecha", fmtFecha(cita.fecha)],
      ["Hora", cita.hora],
    ]) +
    `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5A4A3A;">📍 Carrera 5 #11-24, Torre Empresarial, Consultorio 502, Ibagué (Tolima).</p>` +
    `<p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#5A4A3A;">📲 Para reagendar o cancelar, escríbenos por WhatsApp al <a href="https://wa.me/573155445748" style="color:#B08968;text-decoration:none;font-weight:600;">315 5445748</a>.</p>` +
    boton("Confirmar por WhatsApp", `https://wa.me/573155445748?text=${encodeURIComponent("Confirmo mi cita del " + fmtFecha(cita.fecha))}`);
  return enviarCorreo({
    para: cita.correo,
    asunto: `Recordatorio: tu cita es mañana — ${cita.procedimiento}`,
    html: shell("Recordatorio de cita", inner),
  });
}

module.exports = {
  avisarNuevaCitaADoctora,
  avisarCambioEstadoAPaciente,
  avisarReagendaAPaciente,
  recordatorioAPaciente,
};
