const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// BD snake_case → frontend camelCase
function mapCita(row) {
  return {
    id:                  row.id,
    userId:              row.user_id,
    nombres:             row.nombres,
    apellidos:           row.apellidos,
    telefono:            row.telefono,
    correo:              row.correo,
    procedimiento:       row.procedimiento,
    tipoCita:            row.tipo_cita,
    nota:                row.nota,
    fecha:               row.fecha,
    hora:                row.hora,
    estado:              row.estado,
    pagado:              row.pagado,
    monto:               row.monto,
    montoPagado:         row.monto_pagado,
    montoRestante:       row.monto_restante,
    metodoPago:          row.metodo_pago,
    tipoPagoConsultorio: row.tipo_pago_consultorio,
    tipoPagoOnline:      row.tipo_pago_online,
    creadaPor:           row.creada_por,
    fechaCreacion:       row.creado_en,
    motivoCancelacion:   row.motivo_cancelacion,
  };
}

// GET /citas
router.get("/", verifyToken, async (req, res) => {
  try {
    const { fecha } = req.query;
    const { id: userId, rol } = req.user;

    let sql = `SELECT id, user_id, nombres, apellidos, telefono, correo,
                      procedimiento, tipo_cita, nota, fecha, hora, estado,
                      pagado, monto, monto_pagado, monto_restante,
                      metodo_pago, tipo_pago_consultorio, tipo_pago_online,
                      creada_por, creado_en, motivo_cancelacion
               FROM citas`;
    const values = [];
    const conditions = [];

    if (rol === "usuario") {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(userId);
    }
    if (fecha) {
      conditions.push(`fecha = $${values.length + 1}`);
      values.push(fecha);
    }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY fecha ASC, hora ASC";

    const { rows } = await pool.query(sql, values);
    return res.json({ ok: true, citas: rows.map(mapCita) });
  } catch (err) {
    console.error("Error GET /citas:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener citas" });
  }
});

// POST /citas — acepta camelCase y snake_case del frontend
router.post("/", verifyToken, requireRole(["usuario", "admin", "ayudante", "developer"]), async (req, res) => {
  try {
    const {
      userId, user_id,
      tipoCita, tipo_cita,
      procedimientoId, procedimiento_id,
      nombres, apellidos, telefono, correo,
      procedimiento, nota, fecha, hora,
      metodoPago, metodo_pago,
      tipoPagoConsultorio, tipo_pago_consultorio,
      tipoPagoOnline, tipo_pago_online,
    } = req.body;

    const ownerId      = userId      ?? user_id      ?? req.user.id;
    const tipoCitaVal  = tipoCita    ?? tipo_cita    ?? "valoracion";
    const procId       = procedimientoId ?? procedimiento_id ?? null;
    const metPago      = metodoPago  ?? metodo_pago  ?? null;
    const tipoPagoCons = tipoPagoConsultorio ?? tipo_pago_consultorio ?? null;
    const tipoPagoOnl  = tipoPagoOnline ?? tipo_pago_online ?? null;

    // Verificar disponibilidad
    const { rows: ocupada } = await pool.query(
      `SELECT id FROM citas WHERE fecha=$1 AND hora=$2 AND estado NOT IN ('cancelada')`,
      [fecha, hora]
    );
    if (ocupada.length) {
      return res.status(409).json({ ok: false, error: "Hora no disponible para esa fecha" });
    }

    const { rows } = await pool.query(
      `INSERT INTO citas (
         user_id, nombres, apellidos, telefono, correo,
         procedimiento, procedimiento_id, tipo_cita,
         nota, fecha, hora, estado, pagado,
         metodo_pago, tipo_pago_consultorio, tipo_pago_online, creada_por
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendiente',false,$12,$13,$14,'usuario')
       RETURNING id, user_id, nombres, apellidos, telefono, correo,
                 procedimiento, tipo_cita, nota, fecha, hora, estado,
                 pagado, monto, monto_pagado, monto_restante,
                 metodo_pago, tipo_pago_consultorio, tipo_pago_online,
                 creada_por, creado_en`,
      [ownerId, nombres, apellidos || "", telefono || "", correo || "",
       procedimiento, procId, tipoCitaVal, nota || null, fecha, hora,
       metPago, tipoPagoCons, tipoPagoOnl]
    );

    return res.status(201).json({ ok: true, cita: mapCita(rows[0]) });
  } catch (err) {
    console.error("Error POST /citas:", err);
    return res.status(500).json({ ok: false, error: "Error al crear cita" });
  }
});

// PUT /citas/:id
router.put("/:id", verifyToken, async (req, res) => {
  const { rol, id: userId } = req.user;
  const { id } = req.params;

  try {
    if (rol === "usuario") {
      if (req.body.estado !== "cancelada") {
        return res.status(403).json({ ok: false, error: "Solo puedes cancelar tus propias citas" });
      }
      await pool.query(
        `UPDATE citas SET estado='cancelada', actualizado_en=NOW() WHERE id=$1 AND user_id=$2`,
        [id, userId]
      );
      return res.json({ ok: true });
    }

    const allowed = ["fecha", "hora", "estado", "nota", "motivo_cancelacion",
                     "metodo_pago", "tipo_pago_consultorio", "tipo_pago_online",
                     "pagado", "monto", "monto_pagado", "monto_restante"];
    const sets = [], values = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = $${values.length + 1}`);
        values.push(req.body[key]);
      }
    }
    if (!sets.length) return res.status(400).json({ ok: false, error: "Sin campos para actualizar" });
    sets.push(`actualizado_en = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE citas SET ${sets.join(", ")} WHERE id = $${values.length}`,
      values
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /citas/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar cita" });
  }
});

// POST /citas/:id/confirmar-pago — admin
router.post("/:id/confirmar-pago", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, monto_pagado, metodo_pago, tipo_pago_consultorio } = req.body;

    const montoPagadoFinal = monto_pagado ?? 0;
    const pagado = montoPagadoFinal >= monto;
    const montoRestante = Math.max(monto - montoPagadoFinal, 0);

    await pool.query(
      `UPDATE citas SET pagado=$1, monto=$2, monto_pagado=$3, monto_restante=$4,
                        metodo_pago=$5, tipo_pago_consultorio=$6, estado=$7,
                        actualizado_en=NOW()
       WHERE id=$8`,
      [pagado, monto, montoPagadoFinal, montoRestante,
       metodo_pago || "Consultorio", tipo_pago_consultorio || null,
       pagado ? "atendida" : "confirmada", id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error confirmar-pago:", err);
    return res.status(500).json({ ok: false, error: "Error al confirmar pago" });
  }
});

// DELETE /citas/:id — admin
router.delete("/:id", verifyToken, requireRole(["admin", "ayudante", "developer"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM citas WHERE id = $1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /citas/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar cita" });
  }
});

module.exports = router;