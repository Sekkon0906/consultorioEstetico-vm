/**
 * Envío de correo transaccional vía Resend.
 *
 * Reemplaza los correos que hoy manda Supabase Auth (verificación de cuenta y
 * recuperación de contraseña). Las notificaciones de citas ya se envían desde
 * las rutas de Next.js con este mismo proveedor.
 *
 * SIN CONFIGURAR NO ROMPE NADA: si falta RESEND_API_KEY, `enviarCorreo`
 * registra el intento en consola y devuelve { ok:false, motivo:"sin_configurar" }.
 * Quien lo llama decide qué hacer. Así el servidor arranca y el registro de
 * usuarios funciona incluso antes de tener el dominio verificado.
 *
 * VARIABLES DE ENTORNO
 *   RESEND_API_KEY   Clave de Resend (empieza con "re_").
 *   CORREO_DESDE     Remitente, ej: "Dra. Vanessa Medina <no-responder@tudominio.com>".
 *                    El dominio debe estar verificado en Resend con SPF y DKIM,
 *                    o los correos caen en spam.
 *   APP_URL          URL pública del sitio, para armar los enlaces.
 */

const { Resend } = require("resend");

const REMITENTE_POR_DEFECTO = "Consultorio <onboarding@resend.dev>";

let clienteCache = null;
function getCliente() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!clienteCache) clienteCache = new Resend(process.env.RESEND_API_KEY);
  return clienteCache;
}

function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Envía un correo. Nunca lanza: los fallos de correo no deben tumbar un
 * registro ni un cambio de contraseña.
 * @returns {Promise<{ok: boolean, id?: string, motivo?: string}>}
 */
async function enviarCorreo({ para, asunto, html, texto }) {
  const cliente = getCliente();
  if (!cliente) {
    console.warn(`[correo] RESEND_API_KEY sin configurar. No se envió "${asunto}" a ${para}.`);
    return { ok: false, motivo: "sin_configurar" };
  }
  try {
    const { data, error } = await cliente.emails.send({
      from: process.env.CORREO_DESDE || REMITENTE_POR_DEFECTO,
      to: para,
      subject: asunto,
      html,
      text: texto,
    });
    if (error) {
      console.error("[correo] Resend devolvió error:", error);
      return { ok: false, motivo: String(error.message || error) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[correo] Falló el envío:", err);
    return { ok: false, motivo: String(err && err.message) };
  }
}

// ── Plantilla base ──────────────────────────────────────────────────────────
// HTML de correo, no de web: tablas y estilos en línea, porque los clientes de
// correo ignoran hojas de estilo y buena parte de CSS moderno.
function plantilla({ titulo, cuerpo, botonTexto, botonUrl, pie }) {
  const boton = botonUrl
    ? `<tr><td style="padding:8px 0 24px">
         <a href="${botonUrl}" style="display:inline-block;background:#B08968;color:#ffffff;
            text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;
            font-size:15px">${botonTexto}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#FAF9F7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F7;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:520px;background:#FFFFFF;border:1px solid #E9DED2;border-radius:16px;padding:32px">
      <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;
                     font-weight:700;color:#3A2A1A;padding-bottom:16px">${titulo}</td></tr>
      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;
                     color:#5A4A3A;padding-bottom:24px">${cuerpo}</td></tr>
      ${boton}
      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;
                     color:#8A7565;border-top:1px solid #E9DED2;padding-top:16px">
        ${pie || "Si no esperabas este correo, puedes ignorarlo."}
      </td></tr>
    </table>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8A7565;margin-top:16px">
      Dra. Julieth Vanessa Medina Orjuela · Medicina Estética · Ibagué, Tolima
    </p>
  </td></tr>
</table>
</body></html>`;
}

// ── Correos concretos ───────────────────────────────────────────────────────

function correoVerificacion({ para, nombre, token }) {
  const url = `${appUrl()}/auth/verificar?token=${encodeURIComponent(token)}`;
  return enviarCorreo({
    para,
    asunto: "Confirma tu correo",
    html: plantilla({
      titulo: `Hola${nombre ? `, ${nombre}` : ""}`,
      cuerpo: "Para terminar de crear tu cuenta, confirma que este correo es tuyo. El enlace vence en 24 horas.",
      botonTexto: "Confirmar mi correo",
      botonUrl: url,
      pie: "Si no creaste ninguna cuenta, puedes ignorar este correo.",
    }),
    texto: `Confirma tu correo entrando a: ${url}\n\nEl enlace vence en 24 horas.`,
  });
}

function correoRecuperacion({ para, nombre, token }) {
  const url = `${appUrl()}/recuperar/nueva?token=${encodeURIComponent(token)}`;
  return enviarCorreo({
    para,
    asunto: "Recupera tu contraseña",
    html: plantilla({
      titulo: `Hola${nombre ? `, ${nombre}` : ""}`,
      cuerpo: "Recibimos una solicitud para cambiar tu contraseña. El enlace vence en 1 hora y solo sirve una vez.",
      botonTexto: "Crear contraseña nueva",
      botonUrl: url,
      pie: "Si no pediste cambiar tu contraseña, ignora este correo: tu clave actual sigue funcionando.",
    }),
    texto: `Cambia tu contraseña entrando a: ${url}\n\nEl enlace vence en 1 hora.`,
  });
}

module.exports = {
  enviarCorreo,
  plantilla,
  correoVerificacion,
  correoRecuperacion,
};
