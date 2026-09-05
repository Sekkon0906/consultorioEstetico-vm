/**
 * Autenticación propia: JWT, argon2 y Google OAuth.
 *
 * Reemplaza Supabase Auth. Las tablas que usa (`usuarios.email`,
 * `usuarios.password_hash`, `sesiones`, `tokens_unicos`) las crea la migración
 * server/sql/migraciones/002_auth_propia.sql.
 *
 * DECISIONES DE SEGURIDAD, y por qué:
 *
 *  1. argon2id para las contraseñas. Es el ganador del Password Hashing
 *     Competition y resiste ataques con GPU mucho mejor que bcrypt.
 *  2. El access token vive 15 minutos; el refresh, 30 días. Si roban el
 *     access, la ventana es corta; el refresh se puede revocar.
 *  3. El refresh token se guarda HASHEADO en la base. Si alguien se lleva la
 *     tabla `sesiones`, no obtiene tokens usables.
 *  4. Lo mismo con los tokens de verificación y recuperación (`tokens_unicos`).
 *  5. El rol NUNCA sale de `usuarios.rol`, que el propio usuario podría llegar
 *     a modificar: la autoridad es la tabla `admin_users`. Es el mismo patrón
 *     que ya aplicaba la función is_admin() de Supabase.
 *  6. `solicitarRecuperacion` responde igual exista o no la cuenta, para no
 *     revelar qué correos están registrados.
 *
 * VARIABLES DE ENTORNO
 *   JWT_SECRET             Obligatoria. Firma los access tokens. Genera una con
 *                          `openssl rand -base64 48`. Cambiarla cierra todas
 *                          las sesiones abiertas.
 *   GOOGLE_CLIENT_ID       Del cliente OAuth en Google Cloud Console.
 *   GOOGLE_CLIENT_SECRET   Del mismo cliente.
 */

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { pool } = require("../lib/db");
const { correoVerificacion, correoRecuperacion } = require("../lib/correo");

const VIDA_ACCESS = "15m";
const VIDA_REFRESH_DIAS = 30;
const VIDA_VERIFICACION_HORAS = 24;
const VIDA_RECUPERACION_HORAS = 1;

// ── Utilidades ──────────────────────────────────────────────────────────────

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Falta JWT_SECRET en el servidor.");
  return s;
}

/** Token opaco de 32 bytes. Lo que viaja al usuario; en la base va el hash. */
function generarTokenOpaco() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashearToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function esAdmin(userId) {
  const { rows } = await pool.query("SELECT 1 FROM admin_users WHERE uid = $1", [userId]);
  return rows.length > 0;
}

/** Datos públicos del usuario. Nunca incluye password_hash. */
async function perfilPublico(userId) {
  const { rows } = await pool.query(
    `SELECT id, nombres, apellidos, email, telefono, photo, email_verificado, proveedor,
            acepta_marketing
       FROM usuarios WHERE id = $1`,
    [userId]
  );
  if (!rows.length) return null;
  const u = rows[0];
  return { ...u, rol: (await esAdmin(userId)) ? "admin" : "usuario" };
}

// ── Tokens de sesión ────────────────────────────────────────────────────────

function firmarAccessToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email, rol: usuario.rol },
    jwtSecret(),
    { expiresIn: VIDA_ACCESS }
  );
}

function verificarAccessToken(token) {
  return jwt.verify(token, jwtSecret());
}

async function crearSesion(userId, { userAgent, ip } = {}) {
  const refresh = generarTokenOpaco();
  const expira = new Date(Date.now() + VIDA_REFRESH_DIAS * 864e5);
  await pool.query(
    `INSERT INTO sesiones (user_id, token_hash, user_agent, ip, expira_en)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hashearToken(refresh), userAgent || null, ip || null, expira]
  );
  return { refreshToken: refresh, expiraEn: expira };
}

/** Rota el refresh token: el viejo se revoca y se emite uno nuevo. */
async function refrescarSesion(refreshToken, { userAgent, ip } = {}) {
  const { rows } = await pool.query(
    `SELECT id, user_id FROM sesiones
      WHERE token_hash = $1 AND revocada_en IS NULL AND expira_en > now()`,
    [hashearToken(refreshToken)]
  );
  if (!rows.length) return { ok: false, error: "Sesión inválida o expirada." };

  await pool.query("UPDATE sesiones SET revocada_en = now() WHERE id = $1", [rows[0].id]);

  const usuario = await perfilPublico(rows[0].user_id);
  if (!usuario) return { ok: false, error: "La cuenta ya no existe." };

  const nueva = await crearSesion(usuario.id, { userAgent, ip });
  return { ok: true, accessToken: firmarAccessToken(usuario), ...nueva, usuario };
}

async function cerrarSesion(refreshToken) {
  await pool.query(
    "UPDATE sesiones SET revocada_en = now() WHERE token_hash = $1 AND revocada_en IS NULL",
    [hashearToken(refreshToken)]
  );
  return { ok: true };
}

async function cerrarTodasLasSesiones(userId) {
  await pool.query(
    "UPDATE sesiones SET revocada_en = now() WHERE user_id = $1 AND revocada_en IS NULL",
    [userId]
  );
  return { ok: true };
}

// ── Tokens de un solo uso ───────────────────────────────────────────────────

async function emitirTokenUnico(userId, proposito, horas) {
  const token = generarTokenOpaco();
  await pool.query(
    `INSERT INTO tokens_unicos (user_id, token_hash, proposito, expira_en)
     VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)`,
    [userId, hashearToken(token), proposito, String(horas)]
  );
  return token;
}

/** Consume un token: lo valida y lo marca usado en una sola operación atómica,
 *  para que no sirva dos veces aunque lleguen dos peticiones a la vez. */
async function consumirTokenUnico(token, proposito) {
  const { rows } = await pool.query(
    `UPDATE tokens_unicos SET usado_en = now()
      WHERE token_hash = $1 AND proposito = $2
        AND usado_en IS NULL AND expira_en > now()
      RETURNING user_id`,
    [hashearToken(token), proposito]
  );
  return rows.length ? rows[0].user_id : null;
}

// ── Registro e inicio de sesión con contraseña ──────────────────────────────

async function registrar({
  email, password, nombres, apellidos, telefono,
  // Ficha médica del formulario de registro. Se guarda en el mismo INSERT que
  // la cuenta: no hay sesión todavía (falta verificar el correo), así que no
  // se puede escribir después con PUT /usuarios/me.
  edad, genero,
  antecedentes, antecedentesDescripcion,
  alergias, alergiasDescripcion,
  medicamentos, medicamentosDescripcion,
  // Permiso EXPRESO para correos comerciales. Nada que ver con los correos
  // del servicio —cita confirmada, recordatorio, contrasena—, que se envian
  // igual: esos los pidio quien pidio una cita.
  aceptaMarketing,
}) {
  const correo = normalizarEmail(email);
  if (!correo.includes("@")) return { ok: false, error: "El correo no es válido." };
  if (!password || password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const { rows: existe } = await pool.query(
    "SELECT id FROM usuarios WHERE lower(email) = $1", [correo]
  );
  if (existe.length) return { ok: false, error: "Ya existe una cuenta con ese correo." };

  // genero tiene un CHECK (Masculino|Femenino|Otro): cualquier otra cosa → null.
  const generoValido = ["Masculino", "Femenino", "Otro"].includes(genero) ? genero : null;
  const edadNum = Number.isFinite(Number(edad)) && Number(edad) > 0 ? Number(edad) : null;

  /* El permiso comercial se lee como `=== true` y no como valor verdadero.
     Es a proposito: si el formulario manda "false", "0" o "" —cosas que un
     campo de formulario manda con facilidad—, cualquiera de ellas es
     verdadera al evaluarla, y acabariamos dando por consentido a alguien que
     no marco nada. Con el permiso comercial, dudar significa que no. */
  const quiereMarketing = aceptaMarketing === true;

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const { rows } = await pool.query(
    `INSERT INTO usuarios (
       nombres, apellidos, email, password_hash, telefono, proveedor,
       edad, genero,
       antecedentes, antecedentes_descripcion,
       alergias, alergias_descripcion,
       medicamentos, medicamentos_descripcion,
       acepta_marketing, marketing_aceptado_en, marketing_origen
     )
     VALUES ($1,$2,$3,$4,$5,'password',$6,$7,$8,$9,$10,$11,$12,$13,
             $14, CASE WHEN $14 THEN now() ELSE NULL END,
             CASE WHEN $14 THEN 'registro' ELSE NULL END)
     RETURNING id`,
    [
      nombres || "", apellidos || "", correo, hash, telefono || null,
      edadNum, generoValido,
      antecedentes || "", antecedentesDescripcion || "",
      alergias || "", alergiasDescripcion || "",
      medicamentos || "", medicamentosDescripcion || "",
      quiereMarketing,
    ]
  );
  const userId = rows[0].id;

  const token = await emitirTokenUnico(userId, "verificar_email", VIDA_VERIFICACION_HORAS);
  await correoVerificacion({ para: correo, nombre: nombres, token });

  return { ok: true, usuario: await perfilPublico(userId) };
}

async function iniciarSesion({ email, password, userAgent, ip }) {
  const correo = normalizarEmail(email);
  const { rows } = await pool.query(
    "SELECT id, password_hash, proveedor FROM usuarios WHERE lower(email) = $1", [correo]
  );

  // Mismo mensaje exista o no la cuenta: no se revela qué correos hay
  // registrados. Y se verifica contra un hash señuelo cuando no existe, para
  // que el tiempo de respuesta no delate la diferencia.
  const generico = { ok: false, error: "Correo o contraseña incorrectos." };
  if (!rows.length) {
    await argon2.verify(
      "$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0c2E$3P9K1p9hV5vTxG0zZ0J1cA",
      password || "x"
    ).catch(() => {});
    return generico;
  }

  const u = rows[0];
  if (!u.password_hash) {
    return { ok: false, error: `Esta cuenta entra con ${u.proveedor === "google" ? "Google" : "otro método"}.` };
  }

  const valida = await argon2.verify(u.password_hash, password || "").catch(() => false);
  if (!valida) return generico;

  await pool.query("UPDATE usuarios SET ultimo_acceso_en = now() WHERE id = $1", [u.id]);
  const usuario = await perfilPublico(u.id);
  const sesion = await crearSesion(u.id, { userAgent, ip });
  return { ok: true, accessToken: firmarAccessToken(usuario), ...sesion, usuario };
}

// ── Verificación de correo ──────────────────────────────────────────────────

async function verificarEmail(token) {
  const userId = await consumirTokenUnico(token, "verificar_email");
  if (!userId) return { ok: false, error: "El enlace no es válido o ya venció." };
  await pool.query("UPDATE usuarios SET email_verificado = true WHERE id = $1", [userId]);
  return { ok: true };
}

async function reenviarVerificacion(email) {
  const correo = normalizarEmail(email);
  const { rows } = await pool.query(
    "SELECT id, nombres, email_verificado FROM usuarios WHERE lower(email) = $1", [correo]
  );
  // Respuesta idéntica siempre, por lo mismo que en iniciarSesion.
  if (rows.length && !rows[0].email_verificado) {
    const token = await emitirTokenUnico(rows[0].id, "verificar_email", VIDA_VERIFICACION_HORAS);
    await correoVerificacion({ para: correo, nombre: rows[0].nombres, token });
  }
  return { ok: true };
}

// ── Recuperación de contraseña ──────────────────────────────────────────────

async function solicitarRecuperacion(email) {
  const correo = normalizarEmail(email);
  const { rows } = await pool.query(
    "SELECT id, nombres FROM usuarios WHERE lower(email) = $1", [correo]
  );
  if (rows.length) {
    const token = await emitirTokenUnico(rows[0].id, "recuperar_password", VIDA_RECUPERACION_HORAS);
    await correoRecuperacion({ para: correo, nombre: rows[0].nombres, token });
  }
  return { ok: true };
}

async function restablecerPassword({ token, password }) {
  if (!password || password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }
  const userId = await consumirTokenUnico(token, "recuperar_password");
  if (!userId) return { ok: false, error: "El enlace no es válido o ya venció." };

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  await pool.query(
    "UPDATE usuarios SET password_hash = $1, email_verificado = true WHERE id = $2",
    [hash, userId]
  );
  // Cambiar la contraseña cierra las demás sesiones: si alguien había entrado
  // sin permiso, este es el momento en que pierde el acceso.
  await cerrarTodasLasSesiones(userId);
  return { ok: true };
}

// ── Google OAuth ────────────────────────────────────────────────────────────

function googleConfigurado() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

let googleCache = null;
function clienteGoogle(redirectUri) {
  if (!googleConfigurado()) return null;
  if (!googleCache) {
    // Se carga AQUÍ y no arriba a propósito: google-auth-library exige Node
    // >= 22, y con el require en la cabecera un entorno con Node viejo tumbaba
    // el servidor ENTERO al arrancar — por una función opcional que quizá ni
    // esté configurada. Así, si el módulo no carga, lo único que deja de
    // funcionar es el botón de Google.
    let OAuth2Client;
    try {
      ({ OAuth2Client } = require("google-auth-library"));
    } catch (err) {
      console.error(
        "[auth] No se pudo cargar google-auth-library; el inicio de sesión con " +
        "Google queda deshabilitado. El resto de la API sigue funcionando.", err.message
      );
      return null;
    }
    googleCache = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }
  return googleCache;
}

/**
 * Intercambia el código de OAuth por el perfil, y crea o vincula la cuenta.
 * La vinculación se hace por `google_sub` (el id estable de Google) y, si no
 * hay, por correo: así quien se registró con contraseña y luego entra con
 * Google cae en la MISMA cuenta y no en una duplicada.
 */
async function entrarConGoogle({ code, redirectUri, userAgent, ip }) {
  const cliente = clienteGoogle(redirectUri);
  if (!cliente) return { ok: false, error: "El inicio de sesión con Google no está configurado." };

  let perfil;
  try {
    const { tokens } = await cliente.getToken({ code, redirect_uri: redirectUri });
    const ticket = await cliente.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    perfil = ticket.getPayload();
  } catch (err) {
    console.error("[auth] Falló el intercambio con Google:", err);
    return { ok: false, error: "No se pudo verificar la cuenta de Google." };
  }

  if (!perfil?.email || !perfil.email_verified) {
    return { ok: false, error: "La cuenta de Google no tiene un correo verificado." };
  }

  const correo = normalizarEmail(perfil.email);
  const sub = perfil.sub;

  let { rows } = await pool.query("SELECT id FROM usuarios WHERE google_sub = $1", [sub]);

  if (!rows.length) {
    const { rows: porCorreo } = await pool.query(
      "SELECT id FROM usuarios WHERE lower(email) = $1", [correo]
    );
    if (porCorreo.length) {
      await pool.query(
        `UPDATE usuarios SET google_sub = $1, email_verificado = true,
                             photo = COALESCE(photo, $2)
          WHERE id = $3`,
        [sub, perfil.picture || null, porCorreo[0].id]
      );
      rows = porCorreo;
    } else {
      const nombres = perfil.given_name || (perfil.name || "").split(" ")[0] || "";
      const apellidos = perfil.family_name || "";
      const { rows: creado } = await pool.query(
        `INSERT INTO usuarios (nombres, apellidos, email, google_sub, photo,
                               proveedor, email_verificado)
         VALUES ($1, $2, $3, $4, $5, 'google', true)
         RETURNING id`,
        [nombres, apellidos, correo, sub, perfil.picture || null]
      );
      rows = creado;
    }
  }

  const userId = rows[0].id;
  await pool.query("UPDATE usuarios SET ultimo_acceso_en = now() WHERE id = $1", [userId]);

  const usuario = await perfilPublico(userId);
  const sesion = await crearSesion(userId, { userAgent, ip });
  return { ok: true, accessToken: firmarAccessToken(usuario), ...sesion, usuario };
}

/** URL a la que se manda al usuario para que elija su cuenta de Google. */
function urlAutorizacionGoogle(redirectUri, state) {
  const cliente = clienteGoogle(redirectUri);
  if (!cliente) return null;
  return cliente.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    redirect_uri: redirectUri,
    state,
    prompt: "select_account",
  });
}

module.exports = {
  registrar,
  iniciarSesion,
  refrescarSesion,
  cerrarSesion,
  cerrarTodasLasSesiones,
  verificarEmail,
  reenviarVerificacion,
  solicitarRecuperacion,
  restablecerPassword,
  entrarConGoogle,
  urlAutorizacionGoogle,
  googleConfigurado,
  verificarAccessToken,
  perfilPublico,
  esAdmin,
};
