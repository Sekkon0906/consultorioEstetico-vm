const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * Comentarios / reseñas de pacientes.
 *
 * Antes el frontend leía y escribía `comentarios_pacientes` directo con la
 * anon key: la elegibilidad para opinar (¿tiene citas atendidas?) salía de una
 * consulta a `citas` desde el navegador, con lo que eso implica. Aquí el
 * servidor cruza las citas del propio usuario y solo devuelve el resultado.
 */

// GET /comentarios — público, solo aprobados
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, procedimiento, texto, puntuacion, creado_en
         FROM comentarios_pacientes
        WHERE aprobado = true
        ORDER BY creado_en DESC
        LIMIT 20`
    );
    return res.json({ ok: true, comentarios: rows });
  } catch (err) {
    console.error("Error GET /comentarios:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener comentarios" });
  }
});

// GET /comentarios/elegibilidad — ¿puede opinar el usuario, y sobre qué?
router.get("/elegibilidad", verifyToken, async (req, res) => {
  try {
    const [{ rows: procs }, { rows: yaComento }] = await Promise.all([
      pool.query(
        `SELECT DISTINCT procedimiento
           FROM citas
          WHERE user_id = $1 AND estado = 'atendida' AND procedimiento <> ''`,
        [req.user.id]
      ),
      pool.query(
        "SELECT 1 FROM comentarios_pacientes WHERE user_id = $1 LIMIT 1",
        [req.user.id]
      ),
    ]);
    return res.json({
      ok: true,
      data: {
        procedimientos: procs.map((r) => r.procedimiento),
        yaComento: yaComento.length > 0,
      },
    });
  } catch (err) {
    console.error("Error GET /comentarios/elegibilidad:", err);
    return res.status(500).json({ ok: false, error: "Error al comprobar elegibilidad" });
  }
});

// POST /comentarios — el paciente deja una reseña (queda sin aprobar)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { procedimiento, texto, puntuacion } = req.body || {};
    const punt = Number(puntuacion);
    if (!procedimiento || !texto?.trim() || !(punt >= 1 && punt <= 5)) {
      return res.status(400).json({ ok: false, error: "Faltan campos o la puntuación no es válida" });
    }

    // Solo puede opinar de un procedimiento que se le atendió, y una sola vez.
    const [{ rows: atendida }, { rows: previo }] = await Promise.all([
      pool.query(
        `SELECT 1 FROM citas
          WHERE user_id = $1 AND estado = 'atendida' AND procedimiento = $2 LIMIT 1`,
        [req.user.id, procedimiento]
      ),
      pool.query("SELECT 1 FROM comentarios_pacientes WHERE user_id = $1 LIMIT 1", [req.user.id]),
    ]);
    if (!atendida.length) {
      return res.status(403).json({ ok: false, error: "Solo puedes opinar de un procedimiento que te hayan hecho" });
    }
    if (previo.length) {
      return res.status(409).json({ ok: false, error: "Ya dejaste una reseña" });
    }

    const nombre =
      `${req.user.nombres || ""} ${req.user.apellidos || ""}`.trim() || "Paciente";

    await pool.query(
      `INSERT INTO comentarios_pacientes (user_id, nombre, procedimiento, texto, puntuacion, aprobado)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [req.user.id, nombre, procedimiento, texto.trim(), punt]
    );
    return res.status(201).json({ ok: true, mensaje: "Gracias. Tu reseña se publicará tras revisarla." });
  } catch (err) {
    console.error("Error POST /comentarios:", err);
    return res.status(500).json({ ok: false, error: "Error al enviar la reseña" });
  }
});

// ── Admin ───────────────────────────────────────────────────────────────────

// GET /comentarios/admin — todos, aprobados o no
router.get(
  "/admin",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, user_id, nombre, procedimiento, texto, puntuacion, aprobado, creado_en
           FROM comentarios_pacientes
          ORDER BY creado_en DESC`
      );
      return res.json({ ok: true, comentarios: rows });
    } catch (err) {
      console.error("Error GET /comentarios/admin:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener comentarios" });
    }
  }
);

// PUT /comentarios/:id — aprobar / desaprobar
router.put(
  "/:id",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      const { aprobado } = req.body || {};
      const { rows } = await pool.query(
        "UPDATE comentarios_pacientes SET aprobado = $1 WHERE id = $2 RETURNING id, aprobado",
        [Boolean(aprobado), req.params.id]
      );
      if (!rows.length) return res.status(404).json({ ok: false, error: "No encontrado" });
      return res.json({ ok: true, comentario: rows[0] });
    } catch (err) {
      console.error("Error PUT /comentarios/:id:", err);
      return res.status(500).json({ ok: false, error: "Error al actualizar" });
    }
  }
);

// DELETE /comentarios/:id
router.delete(
  "/:id",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      await pool.query("DELETE FROM comentarios_pacientes WHERE id = $1", [req.params.id]);
      return res.json({ ok: true });
    } catch (err) {
      console.error("Error DELETE /comentarios/:id:", err);
      return res.status(500).json({ ok: false, error: "Error al eliminar" });
    }
  }
);

module.exports = router;
