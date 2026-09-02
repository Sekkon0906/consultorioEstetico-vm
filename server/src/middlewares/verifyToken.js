const { pool } = require("../lib/db");
const { verificarAccessToken } = require("../services/autenticacion");

/**
 * Verifica el access token propio (emitido por /auth2) y adjunta req.user.
 *
 * Antes también aceptaba el JWT de Supabase Auth, para poder migrar el
 * frontend pantalla por pantalla. Ya no queda nada del frontend usando
 * Supabase, así que ese segundo camino —y la dependencia de supabaseAdmin—
 * se eliminaron.
 *
 * req.user = { id (uuid), email, rol, nombres, apellidos }
 */

/**
 * El rol SIEMPRE sale de `admin_users`, nunca de `usuarios.rol`: esa columna
 * la puede editar el propio usuario desde el formulario de perfil. Antes este
 * middleware leía `usuarios.rol`, lo que dejaba la puerta a auto-ascenderse a
 * administrador. (El trigger enforce_usuarios_rol ya lo impedía en la base;
 * esto lo cierra también en la API.)
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

  let carga;
  try {
    carga = verificarAccessToken(token);
  } catch {
    return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
  }

  if (!carga?.sub) {
    return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
  }

  const usuario = await resolverUsuario(carga.sub, carga.email);
  if (!usuario) {
    return res.status(403).json({ ok: false, error: "Usuario no encontrado en el sistema" });
  }

  req.user = usuario;
  return next();
}

module.exports = verifyToken;
