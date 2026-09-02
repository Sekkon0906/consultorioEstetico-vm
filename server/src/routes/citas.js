const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const almacenamiento = require("../lib/almacenamiento");
const correoCitas = require("../lib/correoCitas");

const subirConsentimiento = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

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
    qrCita:                 row.qr_url || null,
    consentimientoFirmado: !!row.consentimiento_firmado,
    firmaUrl:              row.firma_url || null,
    firmaFecha:            row.firma_fecha || null,
    consentimientoPdf:     row.consentimiento_pdf || null,
  };
}

// GET /citas
router.get("/", verifyToken, async (req, res) => {
  try {
    const { fecha } = req.query;
    // ?mias=1 fuerza "solo las mías" aunque el rol sea admin (para /perfil).
    const soloMias = req.query.mias === "1" || req.query.mias === "true";
    const { id: userId, rol } = req.user;

    let sql = `SELECT id, user_id, nombres, apellidos, telefono, correo,
                      procedimiento, tipo_cita, nota, fecha, hora, estado,
                      pagado, monto, monto_pagado, monto_restante,
                      metodo_pago, tipo_pago_consultorio, tipo_pago_online,
                      creada_por, creado_en, motivo_cancelacion,
                      qr_url, consentimiento_firmado, firma_url, firma_fecha,
                      consentimiento_pdf
               FROM citas`;
    const values = [];
    const conditions = [];

    // Se filtra SALVO que sea admin, no "si es usuario". Con la versión
    // anterior, cualquier rol distinto de la cadena exacta "usuario" recibía
    // el listado completo: nombres, teléfonos y correos de todos los
    // pacientes. Así falla cerrado.
    if (rol !== "admin" || soloMias) {
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

    // Aviso a la doctora (best-effort; no bloquea la creación).
    void correoCitas.avisarNuevaCitaADoctora(rows[0]);

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
    // Se decide por lo que SÍ es admin, no por lo que no es "usuario".
    //
    // Antes esto era `if (rol === "usuario") { ...límites... }` y todo lo
    // demás caía en la rama de administración, sin requireRole y sin
    // comprobar propiedad. Es un patrón que falla ABIERTO: bastaba que el
    // rol llegara con cualquier otro valor —un rol nuevo, un null, un
    // cambio en cómo se resuelve— para que quien fuera pudiera reescribir
    // fechas, montos y estado de pago de CUALQUIER cita.
    //
    // Ahora falla cerrado: quien no es admin solo puede cancelar lo suyo.
    const esAdmin = rol === "admin";

    if (!esAdmin) {
      if (req.body.estado !== "cancelada") {
        return res.status(403).json({ ok: false, error: "Solo puedes cancelar tus propias citas" });
      }
      // El AND user_id = $2 es lo que impide cancelar la cita de otro:
      // sin esa condición, cualquiera con el id de una cita ajena la anula.
      const { rowCount } = await pool.query(
        `UPDATE citas SET estado='cancelada', actualizado_en=NOW() WHERE id=$1 AND user_id=$2`,
        [id, userId]
      );
      if (!rowCount) {
        // Mismo mensaje si la cita no existe o si es de otra persona: decir
        // "no es tuya" confirmaría que existe, y con ella el turno reservado.
        return res.status(404).json({ ok: false, error: "Cita no encontrada" });
      }
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

    const { rows: upd } = await pool.query(
      `UPDATE citas SET ${sets.join(", ")} WHERE id = $${values.length}
       RETURNING nombres, apellidos, correo, procedimiento, fecha, hora, estado, motivo_cancelacion`,
      values
    );

    // Si cambió el estado, se avisa al paciente (best-effort).
    if (req.body.estado !== undefined && upd.length) {
      void correoCitas.avisarCambioEstadoAPaciente(upd[0]);
    }
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

// POST /citas/:id/consentimiento — el paciente (o admin) sube su firma + el PDF
// El PDF se genera en el navegador con jsPDF y llega ya armado. El servidor
// solo comprueba la propiedad de la cita, guarda los dos archivos en R2 y
// marca la cita.
router.post(
  "/:id/consentimiento",
  verifyToken,
  subirConsentimiento.fields([{ name: "firma", maxCount: 1 }, { name: "pdf", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!almacenamiento.estaConfigurado()) {
        return res.status(503).json({ ok: false, error: "El almacenamiento no está configurado." });
      }
      const { id } = req.params;
      const firma = req.files?.firma?.[0];
      const pdf = req.files?.pdf?.[0];
      if (!firma || !pdf) {
        return res.status(400).json({ ok: false, error: "Faltan los archivos 'firma' y 'pdf'." });
      }

      const { rows } = await pool.query("SELECT user_id FROM citas WHERE id = $1 LIMIT 1", [id]);
      if (!rows.length) return res.status(404).json({ ok: false, error: "Cita no encontrada" });
      if (req.user.rol !== "admin" && rows[0].user_id !== req.user.id) {
        return res.status(403).json({ ok: false, error: "Esta cita no es tuya" });
      }

      const [rFirma, rPdf] = await Promise.all([
        almacenamiento.subirArchivo(firma.buffer, {
          carpeta: "ConsultorioImagenes/Firmas", tipoMime: firma.mimetype || "image/png", nombreOriginal: "firma.png",
        }),
        almacenamiento.subirArchivo(pdf.buffer, {
          carpeta: "ConsultorioImagenes/Consentimientos", tipoMime: pdf.mimetype || "application/pdf", nombreOriginal: "consentimiento.pdf",
        }),
      ]);
      if (!rFirma.ok) return res.status(400).json(rFirma);
      if (!rPdf.ok) return res.status(400).json(rPdf);

      await pool.query(
        `UPDATE citas
            SET consentimiento_firmado = true,
                firma_url = $1,
                consentimiento_pdf = $2,
                firma_fecha = NOW(),
                actualizado_en = NOW()
          WHERE id = $3`,
        [rFirma.url, rPdf.url, id]
      );

      return res.json({ ok: true, firmaUrl: rFirma.url, consentimientoPdf: rPdf.url });
    } catch (err) {
      console.error("Error POST /citas/:id/consentimiento:", err);
      return res.status(500).json({ ok: false, error: "Error al guardar el consentimiento" });
    }
  }
);

// POST /citas/recordatorios — cron: recordatorio 24 h antes de la cita.
// Protegido por `Authorization: Bearer <CRON_SECRET>`. Lo llama la ruta de
// Next app/api/reminders/send (que es a donde apunta el cron de Vercel).
// ?dry=1 solo cuenta candidatos.
function fechaMananaBogota() {
  const ahora = new Date();
  const bog = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  bog.setDate(bog.getDate() + 1);
  return `${bog.getFullYear()}-${String(bog.getMonth() + 1).padStart(2, "0")}-${String(bog.getDate()).padStart(2, "0")}`;
}

router.post("/recordatorios", async (req, res) => {
  const secreto = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  const dry = req.query.dry === "1";
  const fecha = fechaMananaBogota();

  try {
    const { rows } = await pool.query(
      `SELECT id, nombres, apellidos, correo, telefono, procedimiento, fecha, hora, estado
         FROM citas
        WHERE fecha = $1
          AND estado IN ('pendiente','confirmada')
          AND recordatorio_enviado_en IS NULL`,
      [fecha]
    );

    if (dry) {
      return res.json({ ok: true, fecha, dry: true, total: rows.length });
    }

    let enviados = 0, fallidos = 0;
    for (const c of rows) {
      const r = await correoCitas.recordatorioAPaciente(c);
      if (r.ok) {
        await pool.query("UPDATE citas SET recordatorio_enviado_en = NOW() WHERE id = $1", [c.id]);
        enviados++;
      } else {
        fallidos++;
      }
    }
    return res.json({ ok: true, fecha, total: rows.length, enviados, fallidos });
  } catch (err) {
    console.error("Error POST /citas/recordatorios:", err);
    return res.status(500).json({ ok: false, error: "Error al enviar recordatorios" });
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