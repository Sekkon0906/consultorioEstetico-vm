const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// BD guarda "fecha", frontend espera "fechaISO"
function mapBloqueo(row) {
  return {
    id:       row.id,
    fechaISO: row.fecha instanceof Date
      ? row.fecha.toISOString().slice(0, 10)
      : String(row.fecha).slice(0, 10),
    hora:     row.hora,
    motivo:   row.motivo,
  };
}

// GET /bloqueos-horas?fechaISO=YYYY-MM-DD — público, acepta ?fecha= también
router.get("/", async (req, res) => {
  try {
    const fechaParam = req.query.fechaISO ?? req.query.fecha ?? null;
    let rows;

    if (fechaParam) {
      ({ rows } = await pool.query(
        `SELECT id, fecha, hora, motivo FROM bloqueos_horas WHERE fecha=$1 ORDER BY hora ASC`,
        [fechaParam]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT id, fecha, hora, motivo FROM bloqueos_horas ORDER BY fecha DESC, hora ASC`
      ));
    }

    return res.json({ ok: true, bloqueos: rows.map(mapBloqueo) });
  } catch (err) {
    console.error("Error GET /bloqueos-horas:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener bloqueos" });
  }
});

// POST /bloqueos-horas — admin
router.post("/", verifyToken, requireRole(["admin", "ayudante", "developer"]), async (req, res) => {
  try {
    const fechaISO = req.body.fechaISO ?? req.body.fecha;
    const { hora, motivo = "Bloqueo manual" } = req.body;

    if (!fechaISO || !hora) {
      return res.status(400).json({ ok: false, error: "'fechaISO' y 'hora' son obligatorios" });
    }

    await pool.query(
      `INSERT INTO bloqueos_horas (fecha, hora, motivo) VALUES ($1,$2,$3)
       ON CONFLICT (fecha, hora) DO NOTHING`,
      [fechaISO, hora, motivo]
    );

    const { rows } = await pool.query(
      `SELECT id, fecha, hora, motivo FROM bloqueos_horas WHERE fecha=$1 AND hora=$2 LIMIT 1`,
      [fechaISO, hora]
    );

    return res.status(201).json({ ok: true, bloqueo: rows[0] ? mapBloqueo(rows[0]) : null });
  } catch (err) {
    console.error("Error POST /bloqueos-horas:", err);
    return res.status(500).json({ ok: false, error: "Error al crear bloqueo" });
  }
});

// DELETE /bloqueos-horas/:id — por ID (desde citasApi.ts)
router.delete("/:id(\\d+)", verifyToken, requireRole(["admin", "ayudante", "developer"]), async (req, res) => {
  try {
    await pool.query(`DELETE FROM bloqueos_horas WHERE id=$1`, [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /bloqueos-horas/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar bloqueo" });
  }
});

// DELETE /bloqueos-horas/:fechaISO/:hora — por fecha+hora (panel horarios)
router.delete("/:fechaISO/:hora", verifyToken, requireRole(["admin", "ayudante", "developer"]), async (req, res) => {
  try {
    const hora = decodeURIComponent(req.params.hora);
    await pool.query(
      `DELETE FROM bloqueos_horas WHERE fecha=$1 AND hora=$2`,
      [req.params.fechaISO, hora]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /bloqueos-horas/:fechaISO/:hora:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar bloqueo" });
  }
});

module.exports = router;