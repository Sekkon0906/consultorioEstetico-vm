const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * Galería de la sección "Por qué confiarme".
 *
 * Sustituye al vídeo de presentación: grabarlo se estaba complicando, así
 * que el bloque pasa a fotos que la doctora administra — bioseguridad,
 * esterilización y los equipos con los que trabaja.
 *
 * La lectura es pública (la home la pinta); escribir es solo de admin.
 */

function mapFoto(r) {
  return {
    id:          r.id,
    url:         r.url,
    titulo:      r.titulo || "",
    descripcion: r.descripcion || "",
    orden:       r.orden,
  };
}

// GET /galeria-confianza — público.
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, url, titulo, descripcion, orden
         FROM galeria_confianza
        ORDER BY orden ASC, id ASC`
    );
    return res.json({ ok: true, data: rows.map(mapFoto) });
  } catch (err) {
    console.error("Error GET /galeria-confianza:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener la galería" });
  }
});

// POST /galeria-confianza — admin. Añade una foto al final.
router.post("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { url, titulo, descripcion } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ ok: false, error: "Falta la URL de la imagen." });
    }
    // Al final de la lista: quien sube una foto nueva no espera que se cuele
    // delante de las que ya ordenó.
    const { rows } = await pool.query(
      `INSERT INTO galeria_confianza (url, titulo, descripcion, orden)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(orden) + 1 FROM galeria_confianza), 0))
       RETURNING id, url, titulo, descripcion, orden`,
      [url, titulo || "", descripcion || ""]
    );
    return res.status(201).json({ ok: true, data: mapFoto(rows[0]) });
  } catch (err) {
    console.error("Error POST /galeria-confianza:", err);
    return res.status(500).json({ ok: false, error: "Error al guardar la foto" });
  }
});

// PUT /galeria-confianza/:id — admin. Pie de foto y orden.
router.put("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { titulo, descripcion, orden } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE galeria_confianza
          SET titulo      = COALESCE($1, titulo),
              descripcion = COALESCE($2, descripcion),
              orden       = COALESCE($3, orden)
        WHERE id = $4
      RETURNING id, url, titulo, descripcion, orden`,
      [titulo ?? null, descripcion ?? null, orden ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "Foto no encontrada" });
    return res.json({ ok: true, data: mapFoto(rows[0]) });
  } catch (err) {
    console.error("Error PUT /galeria-confianza/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar la foto" });
  }
});

// DELETE /galeria-confianza/:id — admin.
router.delete("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM galeria_confianza WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ ok: false, error: "Foto no encontrada" });
    // El archivo se queda en R2 a propósito: puede estar referenciado desde
    // otra parte (la miniatura sembrada, por ejemplo) y borrarlo aquí sería
    // borrarlo para todos. La limpieza del bucket es una tarea aparte.
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /galeria-confianza/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar la foto" });
  }
});

module.exports = router;
