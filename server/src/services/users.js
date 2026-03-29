const { pool } = require("../lib/db");

const ADMIN_EMAILS = ["medinapipe123@gmail.com", "admin@clinicavm.com"];

function resolveRole(email) {
  return ADMIN_EMAILS.includes(email) ? "admin" : "usuario";
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, nombres, apellidos, email, rol, photo FROM usuarios
     WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function createUserFromSupabase({ email, displayName, photoURL }) {
  const [nombres, ...rest] = (displayName || "").split(" ");
  const apellidos = rest.join(" ");
  const rol = resolveRole(email);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombres, apellidos, email, photo, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombres, apellidos, email, rol, photo`,
    [nombres || "Paciente", apellidos || "", email, photoURL || null, rol]
  );
  return rows[0];
}

async function getOrCreateUserFromSupabase(supabaseUser) {
  const email = supabaseUser.email;
  if (!email) throw new Error("El usuario de Supabase no trae email.");

  const displayName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    "";
  const photoURL = supabaseUser.user_metadata?.avatar_url || null;

  const existing = await findUserByEmail(email);
  if (existing) return existing;

  return await createUserFromSupabase({ email, displayName, photoURL });
}

module.exports = { findUserByEmail, createUserFromSupabase, getOrCreateUserFromSupabase };