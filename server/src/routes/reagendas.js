const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// POST /citas/:id/solicitar-reagenda — usuario solicita reagendar
router.post(
  "/citas/:id/solicitar-reagenda",
  verifyToken,
  requireRole(["usuario"]),
  async (req, res) => {
    try {
      const { id: citaId } = req.params;
      const { nueva_fecha, nueva_hora, motivo } = req.body;

      if (!nueva_fecha || !nueva_hora) {
        return res.status(400).json({ ok: false, error: "nueva_fecha y nueva_hora son obligatorios" });
      }

      // Verificar que la cita pertenece al usuario
      const { rows: cita } = await pool.query(
        `SELECT id FROM citas WHERE id=$1 AND user_id=$2 LIMIT 1`,
        [citaId, req.user.id]
      );

      if (!cita.length) {
        return res.status(404).json({ ok: false, error: "Cita no encontrada" });
      }

      const { rows } = await pool.query(
        `INSERT INTO reagendas (cita_id, user_id, nueva_fecha, nueva_hora, motivo)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [citaId, req.user.id, nueva_fecha, nueva_hora, motivo || ""]
      );

      return res.status(201).json({ ok: true, reagenda: rows[0] });
    } catch (err) {
      console.error("Error POST solicitar-reagenda:", err);
      return res.status(500).json({ ok: false, error: "Error al solicitar reagenda" });
    }
  }
);

// POST /reagendas — la doctora propone mover una cita; el paciente confirma.
// (Dirección opuesta a /citas/:id/solicitar-reagenda, que la pide el paciente.)
router.post(
  "/reagendas",
  verifyToken,
  requireRole(["admin", "ayudante", "developer"]),
  async (req, res) => {
    try {
      const { citaId, cita_id, nuevaFecha, nueva_fecha, nuevaHora, nueva_hora, motivo } = req.body || {};
      const cid = citaId ?? cita_id;
      const nf  = nuevaFecha ?? nueva_fecha;
      const nh  = nuevaHora ?? nueva_hora;
      if (!cid || !nf || !nh) {
        return res.status(400).json({ ok: false, error: "citaId, nuevaFecha y nuevaHora son obligatorios" });
      }

      const { rows: cita } = await pool.query(
        "SELECT user_id FROM citas WHERE id = $1 LIMIT 1", [cid]
      );
      if (!cita.length) return res.status(404).json({ ok: false, error: "Cita no encontrada" });

      const { rows } = await pool.query(
        `INSERT INTO reagendas (cita_id, user_id, nueva_fecha, nueva_hora, motivo)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [cid, cita[0].user_id, nf, nh, motivo || ""]
      );
      return res.status(201).json({ ok: true, id: rows[0].id });
    } catch (err) {
      console.error("Error POST /reagendas:", err);
      return res.status(500).json({ ok: false, error: "Error al crear la solicitud" });
    }
  }
);

// GET /reagendas/mias — el paciente ve las propuestas pendientes sobre sus citas
router.get(
  "/reagendas/mias",
  verifyToken,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, cita_id, nueva_fecha, nueva_hora, motivo, estado, creada_en
           FROM reagendas
          WHERE user_id = $1 AND estado = 'pendiente'
          ORDER BY creada_en DESC`,
        [req.user.id]
      );
      return res.json({ ok: true, reagendas: rows });
    } catch (err) {
      console.error("Error GET /reagendas/mias:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener tus solicitudes" });
    }
  }
);

// POST /reagendas/:id/aceptar — el paciente acepta: se mueve su cita
router.post(
  "/reagendas/:id/aceptar",
  verifyToken,
  async (req, res) => {
    const cliente = await pool.connect();
    try {
      const { rows } = await cliente.query(
        `SELECT r.id, r.cita_id, r.nueva_fecha, r.nueva_hora
           FROM reagendas r
          WHERE r.id = $1 AND r.user_id = $2 AND r.estado = 'pendiente'
          LIMIT 1`,
        [req.params.id, req.user.id]
      );
      if (!rows.length) return res.status(404).json({ ok: false, error: "Solicitud no encontrada" });
      const re = rows[0];

      await cliente.query("BEGIN");
      await cliente.query(
        "UPDATE citas SET fecha=$1, hora=$2, actualizado_en=NOW() WHERE id=$3",
        [re.nueva_fecha, re.nueva_hora, re.cita_id]
      );
      await cliente.query("UPDATE reagendas SET estado='aprobada' WHERE id=$1", [re.id]);
      await cliente.query("COMMIT");
      return res.json({ ok: true });
    } catch (err) {
      await cliente.query("ROLLBACK").catch(() => {});
      console.error("Error POST /reagendas/:id/aceptar:", err);
      return res.status(500).json({ ok: false, error: "Error al aceptar la solicitud" });
    } finally {
      cliente.release();
    }
  }
);

// POST /reagendas/:id/rechazar-paciente — el paciente rechaza la propuesta
router.post(
  "/reagendas/:id/rechazar-paciente",
  verifyToken,
  async (req, res) => {
    try {
      const { rowCount } = await pool.query(
        "UPDATE reagendas SET estado='rechazada' WHERE id=$1 AND user_id=$2 AND estado='pendiente'",
        [req.params.id, req.user.id]
      );
      if (!rowCount) return res.status(404).json({ ok: false, error: "Solicitud no encontrada" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("Error POST /reagendas/:id/rechazar-paciente:", err);
      return res.status(500).json({ ok: false, error: "Error al rechazar la solicitud" });
    }
  }
);

// GET /reagendas — admin ve todas las solicitudes pendientes
router.get(
  "/reagendas",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT r.id, r.cita_id, r.nueva_fecha, r.nueva_hora, r.motivo, r.estado, r.creada_en,
                c.procedimiento, c.nombres, c.apellidos, c.fecha AS fecha_actual, c.hora AS hora_actual
         FROM reagendas r
         JOIN citas c ON c.id = r.cita_id
         ORDER BY r.creada_en DESC`
      );
      return res.json({ ok: true, reagendas: rows });
    } catch (err) {
      console.error("Error GET /reagendas:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener solicitudes" });
    }
  }
);

// POST /reagendas/:id/aprobar — admin aprueba y mueve la cita
router.post(
  "/reagendas/:id/aprobar",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { rows: reRows } = await pool.query(
        `SELECT * FROM reagendas WHERE id=$1 LIMIT 1`, [id]
      );

      if (!reRows.length) return res.status(404).json({ ok: false, error: "Solicitud no encontrada" });

      const re = reRows[0];

      // Actualizar fecha y hora de la cita original
      await pool.query(
        `UPDATE citas SET fecha=$1, hora=$2, actualizado_en=NOW() WHERE id=$3`,
        [re.nueva_fecha, re.nueva_hora, re.cita_id]
      );

      // Marcar reagenda como aprobada
      await pool.query(
        `UPDATE reagendas SET estado='aprobada' WHERE id=$1`, [id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error("Error POST /reagendas/:id/aprobar:", err);
      return res.status(500).json({ ok: false, error: "Error al aprobar reagenda" });
    }
  }
);

// POST /reagendas/:id/rechazar — admin rechaza
router.post(
  "/reagendas/:id/rechazar",
  verifyToken,
  requireRole(["admin", "developer"]),
  async (req, res) => {
    try {
      await pool.query(
        `UPDATE reagendas SET estado='rechazada' WHERE id=$1`, [req.params.id]
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("Error POST /reagendas/:id/rechazar:", err);
      return res.status(500).json({ ok: false, error: "Error al rechazar reagenda" });
    }
  }
);

module.exports = router;