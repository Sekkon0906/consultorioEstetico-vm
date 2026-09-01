/**
 * Protecciones de seguridad HTTP: cabeceras y límite de intentos.
 *
 * Se agrupan aquí para que index.js diga QUÉ se protege y este archivo CÓMO.
 *
 * POR QUÉ IMPORTA EL LÍMITE DE INTENTOS
 * Sin él, cualquiera puede probar contraseñas contra /auth2/login a miles por
 * minuto hasta acertar. argon2 hace cada intento costoso, pero no lo impide:
 * lo que lo impide es cortar después de unos pocos fallos. Y en un
 * consultorio médico la cuenta que se intenta abrir es la que ve las
 * historias clínicas.
 *
 * El límite se cuenta por IP. No es perfecto (una red compartida cuenta como
 * una sola), por eso los topes no son agresivos: buscan frenar un ataque
 * automatizado, no molestar a quien se equivoca de contraseña dos veces.
 */

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

/**
 * Cabeceras de seguridad.
 * `crossOriginResourcePolicy` se relaja porque el frontend vive en otro
 * dominio (Vercel) y consume esta API; con el valor por defecto el navegador
 * bloquearía las respuestas.
 */
const cabecerasSeguras = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // La API devuelve JSON, no HTML: una CSP aquí no protege nada y estorba.
  // La del sitio se configura en Next.js, que es quien sirve las páginas.
  contentSecurityPolicy: false,
});

/** Config común: cuenta por IP y responde en JSON, como el resto de la API. */
function base({ mensaje, ...opciones }) {
  // `mensaje` se saca del objeto antes de pasarlo: express-rate-limit valida
  // las opciones que recibe y aborta con ERR_ERL_UNKNOWN_OPTION ante una que
  // no conoce. Solo se usa aquí, para el texto de la respuesta.
  return rateLimit({
    standardHeaders: true,   // cabeceras RateLimit-* para que el cliente sepa
    legacyHeaders: false,
    // Railway y Vercel ponen la IP real en X-Forwarded-For. Sin esto, todas
    // las peticiones parecerían venir de la IP del proxy y un solo usuario
    // agotaría el cupo de todos.
    keyGenerator: (req) =>
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "desconocida",
    handler: (_req, res) =>
      res.status(429).json({
        ok: false,
        error: mensaje || "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
      }),
    ...opciones,
  });
}

/**
 * Intentos de inicio de sesión y registro.
 * 10 por cuarto de hora: suficiente para equivocarse varias veces, inútil
 * para probar un diccionario. Solo cuentan los intentos FALLIDOS, así que
 * entrar bien no gasta cupo.
 */
const limiteLogin = base({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  mensaje: "Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.",
});

/**
 * Envío de correos (recuperación y reenvío de verificación).
 * Más estricto: cada petición manda un correo real, así que sin tope alguien
 * podría usar el sitio para inundar el buzón de otra persona.
 */
const limiteCorreo = base({
  windowMs: 60 * 60 * 1000,
  max: 5,
  mensaje: "Ya se enviaron varios correos a esta dirección. Espera una hora.",
});

/**
 * Copiloto de IA. Cada mensaje cuesta dinero real por token, así que el tope
 * es tanto de seguridad como de factura.
 */
const limiteIa = base({
  windowMs: 60 * 60 * 1000,
  max: 60,
  mensaje: "Demasiadas consultas al asistente en poco tiempo. Espera unos minutos.",
});

/** Tope general, holgado: frena barridos automatizados sin estorbar el uso normal. */
const limiteGeneral = base({
  windowMs: 15 * 60 * 1000,
  max: 600,
});

module.exports = {
  cabecerasSeguras,
  limiteLogin,
  limiteCorreo,
  limiteIa,
  limiteGeneral,
};
