const supabase = require("../lib/supabaseAdmin");
const { pool }  = require("../lib/db");

/**
 * Verifica el JWT de Supabase y adjunta req.user con los datos
 * del usuario desde public.usuarios.
 * 
 * req.user = { id (uuid), email, rol, nombres, apellidos }
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verificar JWT con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ ok: false, error: "Token inválido o expirado" });
    }

    // Buscar en public.usuarios por UUID (id = auth.uid())
    const { rows } = await pool.query(
      `SELECT id, nombres, apellidos, rol
       FROM usuarios
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (!rows.length) {
      return res.status(403).json({ ok: false, error: "Usuario no encontrado en el sistema" });
    }

    req.user = {
      id:       rows[0].id,        // uuid
      email:    user.email,        // viene del JWT de Supabase
      rol:      rows[0].rol,
      nombres:  rows[0].nombres,
      apellidos: rows[0].apellidos,
    };

    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ ok: false, error: "Token inválido" });
  }
}

module.exports = verifyToken;