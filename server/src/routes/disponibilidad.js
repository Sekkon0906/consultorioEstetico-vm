const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * Disponibilidad de horas para agendar.
 *
 * El frontend del calendario necesitaba tres consultas directas a Supabase
 * (bloqueos_globales, bloqueos_horas por fecha, citas por fecha) para pintar
 * qué horas están libres. La de `citas` era la peor: pedía el listado de citas
 * de una fecha con la anon key, y solo RLS impedía que devolviera nombres y
 * teléfonos. Aquí el servidor devuelve SOLO las horas ocupadas, sin ningún
 * dato de paciente.
 *
 *   GET /disponibilidad                 → { globales: ["08:00 AM", …] }
 *   GET /disponibilidad?fecha=YYYY-MM-DD → { globales, ocupadas: [...] }
 *
 * `ocupadas` mezcla los bloqueos manuales de esa fecha y las horas con una
 * cita activa. El bloqueo global se devuelve aparte porque el calendario lo
 * usa para filtrar la lista base de horas, no solo para tachar.
 */

// GET /disponibilidad — público
router.get("/", async (req, res) => {
  try {
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : null;

    const { rows: glob } = await pool.query(
      "SELECT hora FROM bloqueos_globales ORDER BY hora ASC"
    );
    const globales = glob.map((r) => r.hora);

    if (!fecha) {
      return res.json({ ok: true, data: { globales } });
    }

    const [{ rows: bloq }, { rows: citas }] = await Promise.all([
      pool.query("SELECT hora FROM bloqueos_horas WHERE fecha = $1", [fecha]),
      pool.query(
        "SELECT hora FROM citas WHERE fecha = $1 AND estado <> 'cancelada'",
        [fecha]
      ),
    ]);

    const ocupadas = [
      ...new Set([...bloq.map((r) => r.hora), ...citas.map((r) => r.hora)]),
    ];

    return res.json({ ok: true, data: { globales, ocupadas } });
  } catch (err) {
    console.error("Error GET /disponibilidad:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener la disponibilidad" });
  }
});

// ── Bloqueos globales (horas tachadas todos los días) — admin ────────────────

// GET /disponibilidad/globales — admin (con motivo)
router.get(
  "/globales",
  verifyToken,
  requireRole(["admin", "ayudante", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, hora, motivo FROM bloqueos_globales ORDER BY hora ASC"
      );
      return res.json({ ok: true, globales: rows });
    } catch (err) {
      console.error("Error GET /disponibilidad/globales:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener bloqueos globales" });
    }
  }
);

// POST /disponibilidad/globales — admin
router.post(
  "/globales",
  verifyToken,
  requireRole(["admin", "ayudante", "developer"]),
  async (req, res) => {
    try {
      const { hora, motivo } = req.body || {};
      if (!hora) return res.status(400).json({ ok: false, error: "'hora' es obligatoria" });
      await pool.query(
        `INSERT INTO bloqueos_globales (hora, motivo) VALUES ($1, $2)
         ON CONFLICT (hora) DO NOTHING`,
        [hora, motivo || "Bloqueo global"]
      );
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("Error POST /disponibilidad/globales:", err);
      return res.status(500).json({ ok: false, error: "Error al crear bloqueo global" });
    }
  }
);

// DELETE /disponibilidad/globales/:hora — admin
router.delete(
  "/globales/:hora",
  verifyToken,
  requireRole(["admin", "ayudante", "developer"]),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM bloqueos_globales WHERE hora = $1",
        [decodeURIComponent(req.params.hora)]
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("Error DELETE /disponibilidad/globales/:hora:", err);
      return res.status(500).json({ ok: false, error: "Error al eliminar bloqueo global" });
    }
  }
);

module.exports = router;
