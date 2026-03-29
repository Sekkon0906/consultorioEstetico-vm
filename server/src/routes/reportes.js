const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// GET /reportes — solo admin
router.get(
  "/",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, mes, anio, total_online, total_consultorio,
                total_esperado, archivo_url, fecha_generacion
         FROM reportes_mensuales
         ORDER BY fecha_generacion DESC`
      );
      return res.json({ ok: true, reportes: rows });
    } catch (err) {
      console.error("Error GET /reportes:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener reportes" });
    }
  }
);

// POST /reportes — guarda o actualiza el reporte del mes
router.post(
  "/",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      const {
        mes, anio,
        total_online = 0,
        total_consultorio = 0,
        total_esperado = 0,
        archivo_url = null,
      } = req.body;

      if (!mes || !anio) {
        return res.status(400).json({ ok: false, error: "'mes' y 'anio' son obligatorios" });
      }

      const { rows } = await pool.query(
        `INSERT INTO reportes_mensuales
           (mes, anio, total_online, total_consultorio, total_esperado, archivo_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (mes, anio) DO UPDATE SET
           total_online       = EXCLUDED.total_online,
           total_consultorio  = EXCLUDED.total_consultorio,
           total_esperado     = EXCLUDED.total_esperado,
           archivo_url        = EXCLUDED.archivo_url,
           fecha_generacion   = NOW()
         RETURNING *`,
        [mes, anio, total_online, total_consultorio, total_esperado, archivo_url]
      );

      return res.status(201).json({ ok: true, reporte: rows[0] });
    } catch (err) {
      console.error("Error POST /reportes:", err);
      return res.status(500).json({ ok: false, error: "Error al guardar reporte" });
    }
  }
);

module.exports = router;