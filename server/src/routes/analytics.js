const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * GET /analytics/resumen
 * KPIs generales: citas hoy, este mes, histórico, pacientes únicos.
 */
router.get(
  "/resumen",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM v_resumen_consultorio`);
      return res.json({ ok: true, data: rows[0] });
    } catch (err) {
      console.error("Error GET /analytics/resumen:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener resumen" });
    }
  }
);

/**
 * GET /analytics/procedimientos
 * Ranking de procedimientos más solicitados con tasa de completado.
 */
router.get(
  "/procedimientos",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM v_procedimientos_mas_solicitados`);
      return res.json({ ok: true, data: rows });
    } catch (err) {
      console.error("Error GET /analytics/procedimientos:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener analytics de procedimientos" });
    }
  }
);

/**
 * GET /analytics/top-mes
 * Top 5 procedimientos del mes actual.
 */
router.get(
  "/top-mes",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM v_top_procedimientos_mes_actual`);
      return res.json({ ok: true, data: rows });
    } catch (err) {
      console.error("Error GET /analytics/top-mes:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener top del mes" });
    }
  }
);

/**
 * GET /analytics/citas-por-mes
 * Tendencia mensual de citas (últimos 12 meses).
 */
router.get(
  "/citas-por-mes",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      const { meses = 12 } = req.query;
      const { rows } = await pool.query(
        `SELECT * FROM v_citas_por_mes
         WHERE mes >= NOW() - INTERVAL '${parseInt(meses)} months'
         ORDER BY mes DESC`
      );
      return res.json({ ok: true, data: rows });
    } catch (err) {
      console.error("Error GET /analytics/citas-por-mes:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener citas por mes" });
    }
  }
);

/**
 * GET /analytics/procedimientos-por-mes?anio=2025&mes=3
 * Qué procedimientos se pidieron en un mes específico.
 */
router.get(
  "/procedimientos-por-mes",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      const { anio, mes } = req.query;
      let sql = `SELECT * FROM v_procedimientos_por_mes`;
      const values = [];

      if (anio && mes) {
        sql += ` WHERE anio = $1 AND mes = $2`;
        values.push(parseInt(anio), parseInt(mes));
      } else if (anio) {
        sql += ` WHERE anio = $1`;
        values.push(parseInt(anio));
      }

      sql += ` ORDER BY anio DESC, mes DESC, total DESC`;

      const { rows } = await pool.query(sql, values);
      return res.json({ ok: true, data: rows });
    } catch (err) {
      console.error("Error GET /analytics/procedimientos-por-mes:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener analytics por mes" });
    }
  }
);

module.exports = router;