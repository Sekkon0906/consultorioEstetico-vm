const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// Mapea BD snake_case → frontend camelCase
function mapRow(row) {
  return {
    id:        row.id,
    nombre:    row.nombre,
    texto:     row.texto,
    video:     row.video     || "",
    thumb:     row.thumb     || "",
    activo:    !!row.activo,
    destacado: !!row.destacado,
    creadoEn:  row.creado_en,
  };
}

// GET /testimonios — público, devuelve todos (el front filtra por activo)
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, texto, video, thumb, activo, destacado, creado_en
       FROM testimonios
       ORDER BY destacado DESC, creado_en DESC`
    );
    return res.json({ ok: true, testimonios: rows.map(mapRow) });
  } catch (err) {
    console.error("Error GET /testimonios:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener testimonios" });
  }
});

// POST /testimonios — admin
router.post("/", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const {
      nombre, texto,
      video    = "",
      thumb    = "",
      activo   = true,
      destacado = false,
    } = req.body;

    if (!nombre?.trim() || !texto?.trim()) {
      return res.status(400).json({ ok: false, error: "Nombre y texto son obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO testimonios (nombre, texto, video, thumb, activo, destacado)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, nombre, texto, video, thumb, activo, destacado, creado_en`,
      [nombre, texto, video, thumb, activo, destacado]
    );
    return res.status(201).json({ ok: true, testimonio: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error POST /testimonios:", err);
    return res.status(500).json({ ok: false, error: "Error al crear testimonio" });
  }
});

// PUT /testimonios/:id — admin
router.put("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { id } = req.params;
    const campos  = [];
    const valores = [];

    const editables = ["nombre", "texto", "video", "thumb", "activo", "destacado"];
    for (const campo of editables) {
      if (req.body[campo] !== undefined) {
        campos.push(`${campo} = $${valores.length + 1}`);
        valores.push(req.body[campo]);
      }
    }

    if (!campos.length)
      return res.status(400).json({ ok: false, error: "Sin campos para actualizar" });

    campos.push(`actualizado_en = NOW()`);
    valores.push(id);

    const { rows } = await pool.query(
      `UPDATE testimonios SET ${campos.join(", ")}
       WHERE id = $${valores.length}
       RETURNING id, nombre, texto, video, thumb, activo, destacado, creado_en`,
      valores
    );

    if (!rows.length)
      return res.status(404).json({ ok: false, error: "Testimonio no encontrado" });

    return res.json({ ok: true, testimonio: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error PUT /testimonios/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar testimonio" });
  }
});

// DELETE /testimonios/:id — admin
router.delete("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM testimonios WHERE id = $1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /testimonios/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar testimonio" });
  }
});

module.exports = router;