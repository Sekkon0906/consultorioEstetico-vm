/**
 * Permiso para correos comerciales, y la baja sin iniciar sesión.
 *
 * LAS DOS CLASES DE CORREO
 * Los del servicio —cita confirmada, recordatorio, reagenda, contraseña— se
 * envían siempre: los pidió quien pidió una cita, y sin ellos la cita no
 * funciona. Los comerciales —promociones, fidelidad— solo si la persona lo
 * aceptó expresamente (Ley 1581).
 *
 * Este módulo gobierna ÚNICAMENTE los segundos. Ninguna función de aquí debe
 * llegar a tocar un recordatorio: dejar a alguien sin su aviso de cita por no
 * haber querido publicidad sería el error caro de este archivo.
 *
 * POR QUÉ EL ENLACE DE BAJA VA FIRMADO Y NO GUARDADO
 * Cada correo comercial tiene que llevar su enlace para darse de baja, y ese
 * enlace tiene que funcionar sin iniciar sesión: quien está harto de recibir
 * correos no va a buscar su contraseña para dejar de recibirlos.
 *
 * Se podría emitir un token de un solo uso y guardarlo, como los de verificar
 * correo. No se hace, por tres razones:
 *
 *   · Habría que escribir una fila por destinatario y por envío. Un correo a
 *     500 personas serían 500 inserciones antes de mandar nada.
 *   · Un token de un solo uso se gasta. Si alguien pulsa dos veces —o si su
 *     cliente de correo precarga el enlace, cosa que hacen— la segunda vez
 *     falla y parece que la baja no funcionó.
 *   · Caducan. Un correo viejo se reenvía y su enlace ya no sirve.
 *
 * Una firma HMAC no tiene ninguno de esos problemas: no ocupa nada, vale
 * siempre, y aun así nadie puede fabricar la de otra persona sin el secreto
 * del servidor. Lo que NO da es caducidad, y aquí eso es una ventaja: el
 * derecho a darse de baja no caduca.
 *
 * Y da igual que sea idempotente: darse de baja dos veces es darse de baja.
 */

const crypto = require("crypto");
const { pool } = require("./db");

/* El mismo secreto que firma las sesiones. No hace falta uno propio: el
   alcance de esta firma es "este id puede darse de baja", que es lo menos
   sensible que se firma en todo el proyecto. Uno más sería una variable más
   que configurar mal. */
function secreto() {
  return process.env.JWT_SECRET || "";
}

/** Firma corta y a prueba de URL para un id de usuario. */
function firmar(userId) {
  return crypto
    .createHmac("sha256", secreto())
    .update(`baja-correos:${userId}`)
    .digest("base64url")
    .slice(0, 32);
}

/**
 * Comprueba la firma en tiempo constante.
 *
 * `timingSafeEqual` y no `===`: comparar cadenas con `===` sale antes en el
 * primer carácter distinto, y ese tiempo se puede medir para ir adivinando la
 * firma carácter a carácter. Aquí el daño sería pequeño —dar de baja a otro—,
 * pero la comparación correcta no cuesta nada más.
 */
function firmaValida(userId, firma) {
  if (!firma || typeof firma !== "string") return false;
  const esperada = Buffer.from(firmar(userId));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length) return false;
  return crypto.timingSafeEqual(esperada, recibida);
}

/** La URL que va al pie de cada correo comercial. */
function enlaceDeBaja(userId) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/baja-correos?u=${userId}&f=${firmar(userId)}`;
}

/**
 * Cambia el permiso.
 *
 * Al DAR de baja no se borran `marketing_aceptado_en` ni `marketing_origen`:
 * son la prueba de que los envíos anteriores fueron legítimos. Borrarlas
 * dejaría al consultorio sin poder demostrar nada ante una queja, que es
 * justo la situación en la que hace falta.
 */
async function fijarPermiso(userId, acepta, origen) {
  if (acepta) {
    await pool.query(
      `UPDATE usuarios
          SET acepta_marketing = true,
              marketing_aceptado_en = now(),
              marketing_origen = $2
        WHERE id = $1`,
      [userId, origen]
    );
  } else {
    await pool.query(
      "UPDATE usuarios SET acepta_marketing = false WHERE id = $1",
      [userId]
    );
  }
}

/**
 * A quién se le puede escribir una promoción.
 *
 * Se filtra también por `email_verificado`: un correo sin verificar puede ser
 * de otra persona —alguien se equivocó al teclear— y mandarle publicidad a un
 * tercero que nunca pidió nada es exactamente lo que la ley prohíbe.
 */
async function destinatariosComerciales() {
  const { rows } = await pool.query(
    `SELECT id, nombres, email
       FROM usuarios
      WHERE acepta_marketing = true
        AND email_verificado = true
        AND email IS NOT NULL
      ORDER BY creado_en`
  );
  return rows;
}

module.exports = { firmar, firmaValida, enlaceDeBaja, fijarPermiso, destinatariosComerciales };
