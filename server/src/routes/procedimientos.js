const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// ✅ Mapea columnas BD → campos que espera el frontend
function mapRow(row) {
  return {
    id:          row.id,
    nombre:      row.nombre,
    desc:        row.descripcion,   // ← frontend usa "desc"
    descripcion: row.descripcion,   // ← también disponible
    precio:      row.precio,
    imagen:      row.imagen,
    categoria:   row.categoria,
    duracionMin: row.duracion_min,  // ← frontend usa camelCase
    destacado:   row.destacado,
  };
}

// ✅ Normaliza body del frontend → columnas de la BD
function normalizeBody(body) {
  return {
    nombre:       body.nombre       ?? null,
    descripcion:  body.desc         ?? body.descripcion ?? null,
    precio:       body.precio       ?? "0",
    imagen:       body.imagen       ?? "",
    categoria:    body.categoria    ?? "Facial",
    duracion_min: body.duracionMin  ?? body.duracion_min ?? null,
    destacado:    body.destacado    ?? false,
  };
}

// GET /procedimientos — público
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, precio, imagen, categoria, duracion_min, destacado
       FROM procedimientos ORDER BY categoria ASC, nombre ASC`
    );
    return res.json({ ok: true, data: rows.map(mapRow) });
  } catch (err) {
    console.error("Error GET /procedimientos:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener procedimientos" });
  }
});

// GET /procedimientos/:id — público
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, precio, imagen, categoria, duracion_min, destacado
       FROM procedimientos WHERE id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "No encontrado" });
    return res.json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error GET /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener procedimiento" });
  }
});

// POST /procedimientos — admin
router.post("/", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen, categoria, duracion_min, destacado }
      = normalizeBody(req.body);
    if (!nombre?.trim() || !descripcion?.trim())
      return res.status(400).json({ ok: false, error: "Nombre y descripción son obligatorios" });
    const { rows } = await pool.query(
      `INSERT INTO procedimientos (nombre, descripcion, precio, imagen, categoria, duracion_min, destacado)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, descripcion, precio, imagen, categoria, duracion_min, destacado]
    );
    return res.status(201).json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error POST /procedimientos:", err);
    return res.status(500).json({ ok: false, error: "Error al crear procedimiento" });
  }
});

// PUT /procedimientos/:id — admin
router.put("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen, categoria, duracion_min, destacado }
      = normalizeBody(req.body);
    const { rows } = await pool.query(
      `UPDATE procedimientos SET nombre=$1, descripcion=$2, precio=$3, imagen=$4,
       categoria=$5, duracion_min=$6, destacado=$7, actualizado_en=NOW()
       WHERE id=$8 RETURNING *`,
      [nombre, descripcion, precio, imagen, categoria, duracion_min, destacado, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "No encontrado" });
    return res.json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error PUT /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar procedimiento" });
  }
});

// DELETE /procedimientos/:id — admin
router.delete("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM procedimientos WHERE id = $1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar procedimiento" });
  }
});

module.exports = router;