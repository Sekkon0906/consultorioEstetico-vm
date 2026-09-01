const express  = require("express");
const router   = express.Router();
const supabase = require("../lib/supabaseAdmin");
const { pool } = require("../lib/db");

const { rolDe, sembrarAdminSiHaceFalta } = require("../lib/roles");

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

    // 2. Buscar usuario existente por UUID (id = auth.uid)
    const { rows: existing } = await pool.query(
      `SELECT id, nombres, apellidos, rol, photo, telefono
       FROM usuarios WHERE id = $1 LIMIT 1`,
      [user.id]
    );

    if (existing.length) {
      // Si admin_users está vacía, la primera cuenta de la lista de arranque
      // queda como administradora. Con la tabla ya poblada esto no hace nada.
      await sembrarAdminSiHaceFalta(user.id, email);

      // Refrescar la foto desde Google (avatar_url) en cada login.
      // Si Google no envía foto, se conserva la almacenada.
      if (photoURL && photoURL !== existing[0].photo) {
        const { rows: updated } = await pool.query(
          `UPDATE usuarios SET photo = $1
           WHERE id = $2
           RETURNING id, nombres, apellidos, photo, telefono`,
          [photoURL, user.id]
        );
        return res.json({ ok: true, user: { ...updated[0], rol: await rolDe(user.id), email } });
      }
      return res.json({ ok: true, user: { ...existing[0], rol: await rolDe(user.id), email } });
    }

    // 3. Crear usuario nuevo (el trigger ya pudo haberlo creado).
    // `rol` no se envía: lo fija el trigger enforce_usuarios_rol, y quien
    // manda de verdad es admin_users.
    const { rows: created } = await pool.query(
      `INSERT INTO usuarios (id, nombres, apellidos, email, photo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         nombres = EXCLUDED.nombres,
         email   = COALESCE(usuarios.email, EXCLUDED.email),
         photo   = COALESCE(EXCLUDED.photo, usuarios.photo)
       RETURNING id, nombres, apellidos, photo, telefono`,
      [user.id, nombres || "Paciente", apellidos || "", email, photoURL]
    );

    await sembrarAdminSiHaceFalta(user.id, email);

    return res.status(201).json({
      ok: true,
      user: { ...created[0], rol: await rolDe(user.id), email },
    });
  } catch (err) {
    console.error("Error /auth/callback:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

module.exports = router;