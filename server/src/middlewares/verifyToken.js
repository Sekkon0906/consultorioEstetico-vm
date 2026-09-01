const supabase = require("../lib/supabaseAdmin");
const { pool }  = require("../lib/db");
const { verificarAccessToken } = require("../services/autenticacion");

/**
 * Verifica el token de la petición y adjunta req.user.
 *
 * ACEPTA DOS TIPOS DE TOKEN, a propósito:
 *
 *   1. El JWT propio que emite /auth2 (se valida en local, sin salir a red).
 *   2. El JWT de Supabase Auth, que es lo que usa el frontend hoy.
 *
 * Esa convivencia es lo que permite migrar el login pantalla por pantalla en
 * vez de cortar de golpe: mientras haya sesiones vivas de Supabase, siguen
 * funcionando. Cuando el frontend entero use /auth2 se borra el segundo
 * intento y con él la dependencia de `supabaseAdmin`.
 *
 * Se prueba primero el propio porque es una verificación de firma local:
 * si acierta, la petición se resuelve sin una llamada de red a Supabase.
 *
 * req.user = { id (uuid), email, rol, nombres, apellidos }
 */

/**
 * El rol SIEMPRE sale de `admin_users`, nunca de `usuarios.rol`.
 * Esa columna es editable por el propio usuario a través del formulario de
 * perfil; `admin_users` solo se toca desde la base. Antes este middleware
 * leía `usuarios.rol`, lo que dejaba la puerta a que alguien se ascendiera a
 * administrador editando su propio perfil. (El trigger enforce_usuarios_rol
 * ya lo impedía en la base; esto lo cierra también en la API, que es donde
 * debe decidirse.)
 */
async function resolverUsuario(userId, emailDelToken) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombres, u.apellidos, u.email,
            (a.uid IS NOT NULL) AS es_admin
       FROM usuarios u
       LEFT JOIN admin_users a ON a.uid = u.id
      WHERE u.id = $1
      LIMIT 1`,
    [userId]
  );
  if (!rows.length) return null;

  const u = rows[0];
  return {
    id: u.id,
    email: u.email || emailDelToken || null,
    rol: u.es_admin ? "admin" : "usuario",
    nombres: u.nombres,
    apellidos: u.apellidos,
  };
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  // ── 1. Token propio ───────────────────────────────────────────────────────
  // Sin JWT_SECRET configurado esto lanza; se ignora y se pasa al camino de
  // Supabase, que es el que está activo hoy.
  try {
    const carga = verificarAccessToken(token);
    if (carga?.sub) {
      const usuario = await resolverUsuario(carga.sub, carga.email);
      if (!usuario) {
        return res.status(403).json({ ok: false, error: "Usuario no encontrado en el sistema" });
      }
      req.user = usuario;
      return next();
    }
  } catch {
    // No es un token propio (o no hay JWT_SECRET). Se intenta con Supabase.
  }

  // ── 2. Token de Supabase ──────────────────────────────────────────────────
  // Si Supabase ya no está configurado (migración terminada), no hay segundo
  // camino: el token simplemente no es válido.
  if (!supabase.supabaseDisponible()) {
    return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
    }

    const usuario = await resolverUsuario(user.id, user.email);
    if (!usuario) {
      return res.status(403).json({ ok: false, error: "Usuario no encontrado en el sistema" });
    }

    req.user = usuario;
    return next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ ok: false, error: "Token inválido" });
  }
}

module.exports = verifyToken;
