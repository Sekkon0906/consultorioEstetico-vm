const express  = require("express");
const router   = express.Router();
const supabase = require("../lib/supabaseAdmin");
const { pool } = require("../lib/db");

const ADMIN_EMAILS = ["medinapipe123@gmail.com", "admin@clinicavm.com"];

function resolveRol(email) {
  return ADMIN_EMAILS.includes(email) ? "admin" : "usuario";
}

/**
 * POST /auth/callback
 * El frontend envía el access_token de Supabase tras login/registro.
 * Se sincroniza con public.usuarios y se devuelve el perfil completo.
 */
router.post("/callback", async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ ok: false, error: "Falta access_token" });
    }

    // 1. Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ ok: false, error: "Token inválido" });
    }

    const email      = user.email;
    const fullName   = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const photoURL   = user.user_metadata?.avatar_url || null;
    const [nombres, ...rest] = fullName.trim().split(" ");
    const apellidos  = rest.join(" ");
    const rol        = resolveRol(email);

    // 2. Buscar usuario existente por UUID (id = auth.uid)
    const { rows: existing } = await pool.query(
      `SELECT id, nombres, apellidos, rol, photo, telefono
       FROM usuarios WHERE id = $1 LIMIT 1`,
      [user.id]
    );

    if (existing.length) {
      return res.json({ ok: true, user: { ...existing[0], email } });
    }

    // 3. Crear usuario nuevo (el trigger ya pudo haberlo creado)
    const { rows: created } = await pool.query(
      `INSERT INTO usuarios (id, nombres, apellidos, rol, photo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         nombres = EXCLUDED.nombres,
         photo   = COALESCE(EXCLUDED.photo, usuarios.photo)
       RETURNING id, nombres, apellidos, rol, photo, telefono`,
      [user.id, nombres || "Paciente", apellidos || "", rol, photoURL]
    );

    return res.status(201).json({ ok: true, user: { ...created[0], email } });
  } catch (err) {
    console.error("Error /auth/callback:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

module.exports = router;