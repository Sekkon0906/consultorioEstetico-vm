// server/src/services/testimonios.js
const { pool } = require("../lib/db");

/**
 * Obtener todos los testimonios activos
 */
async function getTestimonios() {
  const [rows] = await pool.query(
    `SELECT id, nombre, texto, video, thumb, activo, destacado, creadoEn
     FROM testimonios
     WHERE activo = 1
     ORDER BY destacado DESC, creadoEn DESC`
  );
  return rows;
}

/**
 * Crear testimonio
 */
async function createTestimonio({ nombre, texto, video, thumb, activo = 1, destacado = 0 }) {
  const [result] = await pool.query(
    `INSERT INTO testimonios
      (nombre, texto, video, thumb, activo, destacado, creadoEn)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [nombre, texto, video, thumb, activo, destacado]
  );

  const [rows] = await pool.query(
    `SELECT id, nombre, texto, video, thumb, activo, destacado, creadoEn
     FROM testimonios
     WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

/**
 * Actualizar testimonio
 */
async function updateTestimonio(id, data) {
  const campos = [];
  const valores = [];

  if (data.nombre != null)    { campos.push("nombre = ?");    valores.push(data.nombre); }
  if (data.texto != null)     { campos.push("texto = ?");     valores.push(data.texto); }
  if (data.video != null)     { campos.push("video = ?");     valores.push(data.video); }
  if (data.thumb != null)     { campos.push("thumb = ?");     valores.push(data.thumb); }
  if (data.activo != null)    { campos.push("activo = ?");    valores.push(data.activo); }
  if (data.destacado != null) { campos.push("destacado = ?"); valores.push(data.destacado); }

  if (!campos.length) return null;

  valores.push(id);

  await pool.query(
    `UPDATE testimonios
     SET ${campos.join(", ")}
     WHERE id = ?`,
    valores
  );

  const [rows] = await pool.query(
    `SELECT id, nombre, texto, video, thumb, activo, destacado, creadoEn
     FROM testimonios
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

/**
 * Eliminar (duro) o podrías hacer soft delete: activo = 0
 */
async function deleteTestimonio(id) {
  await pool.query("DELETE FROM testimonios WHERE id = ?", [id]);
  return true;
}

module.exports = {
  getTestimonios,
  createTestimonio,
  updateTestimonio,
  deleteTestimonio,
};
