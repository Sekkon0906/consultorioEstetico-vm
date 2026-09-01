/**
 * Quién es administrador. Fuente única de verdad.
 *
 * Antes esta lista estaba copiada en TRES archivos —`services/users.js`,
 * `routes/auth.js` y, lo peor, `app/src/lib/api.ts`, que se empaqueta y se
 * envía al navegador de cualquier visitante. Además de repetir la lista en
 * sitios que podían quedar desincronizados, publicaba exactamente qué cuenta
 * hay que atacar para entrar al panel.
 *
 * LA AUTORIDAD ES LA TABLA `admin_users`, NO ESTA LISTA.
 * `usuarios.rol` es una columna que el propio usuario puede editar desde su
 * perfil, así que no sirve para decidir permisos; y un correo en una lista
 * del código tampoco, porque para cambiarlo hay que desplegar.
 *
 * Esta lista solo sirve para el ARRANQUE: sembrar `admin_users` la primera
 * vez, cuando la tabla está vacía y todavía no hay forma de nombrar a nadie
 * administrador. A partir de ahí manda la tabla. Se puede sobrescribir con
 * la variable ADMIN_EMAILS_INICIALES sin tocar código.
 */

const { pool } = require("./db");

const CORREOS_ADMIN_INICIALES = (process.env.ADMIN_EMAILS_INICIALES ||
  "medinapipe123@gmail.com,admin@clinicavm.com")
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

/** ¿Está este usuario en admin_users? Es la única pregunta que decide permisos. */
async function esAdmin(userId) {
  if (!userId) return false;
  const { rows } = await pool.query("SELECT 1 FROM admin_users WHERE uid = $1", [userId]);
  return rows.length > 0;
}

/**
 * Siembra `admin_users` con la cuenta indicada SOLO si la tabla está vacía y
 * el correo está en la lista de arranque.
 *
 * Sin esto, un despliegue nuevo (base recién creada) se quedaría sin ningún
 * administrador y sin manera de nombrar uno desde la interfaz: habría que
 * entrar a la base a mano. Con la tabla ya poblada no hace nada, así que
 * nadie puede "colarse" registrándose con uno de estos correos más tarde.
 */
async function sembrarAdminSiHaceFalta(userId, email) {
  if (!userId || !email) return false;
  if (!CORREOS_ADMIN_INICIALES.includes(String(email).toLowerCase())) return false;

  const { rows } = await pool.query("SELECT count(*)::int AS n FROM admin_users");
  if (rows[0].n > 0) return false;

  await pool.query(
    "INSERT INTO admin_users (uid, note) VALUES ($1, $2) ON CONFLICT (uid) DO NOTHING",
    [userId, "Sembrado automáticamente: primer administrador del sistema"]
  );
  console.log(`[roles] ${email} quedó como primer administrador (admin_users estaba vacía).`);
  return true;
}

/** Etiqueta de rol para las respuestas de la API. */
async function rolDe(userId) {
  return (await esAdmin(userId)) ? "admin" : "usuario";
}

module.exports = { esAdmin, rolDe, sembrarAdminSiHaceFalta, CORREOS_ADMIN_INICIALES };
