const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * Avisos del sitio.
 *
 * Los publica la doctora desde su Claude, por el conector. Aquí solo se leen
 * para pintarlos, y se pueden retirar desde el panel.
 *
 * LA CADUCIDAD SE APLICA AL LEER, NO CON UNA TAREA PROGRAMADA
 * Un aviso caducado deja de verse porque la consulta no lo trae, no porque
 * algo lo haya apagado a medianoche. Así no hace falta un cron, no hay
 * ventana en la que un aviso vencido siga visible porque la tarea no corrió,
 * y el registro se conserva tal como se escribió.
 */

const MAXIMO_A_LA_VEZ = 3;

function mapAviso(r) {
  return {
    id:     r.id,
    titulo: r.titulo,
    cuerpo: r.cuerpo || "",
    tipo:   r.tipo,
    hasta:  r.hasta,
  };
}

/**
 * Los vigentes de hoy. Público: lo pinta la portada.
 */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, titulo, cuerpo, tipo, hasta
         FROM avisos_sitio
        WHERE activo
          AND (desde IS NULL OR desde <= CURRENT_DATE)
          AND (hasta IS NULL OR hasta >= CURRENT_DATE)
        ORDER BY
          /* Lo que afecta a una cita ya agendada va primero. Si un cierre por
             vacaciones queda debajo de una oferta, la oferta se ha llevado la
             atención que hacía falta para el cierre. */
          CASE tipo WHEN 'importante' THEN 0 WHEN 'promocion' THEN 1 ELSE 2 END,
          orden,
          creado_en DESC
        LIMIT $1`,
      [MAXIMO_A_LA_VEZ]
    );
    res.json(rows.map(mapAviso));
  } catch (e) {
    console.error("[avisos] listar:", e.message);
    /* Se responde con lista vacía y no con un error. Esto es un adorno de la
       portada: si la tabla todavía no existe —la migración 012 se aplica
       después de desplegar— la home tiene que seguir cargando igual. */
    res.json([]);
  }
});

/**
 * Todos, para el panel. Solo administradoras.
 */
router.get("/todos", verifyToken, requireRole(["admin"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, titulo, cuerpo, tipo, activo, desde, hasta, creado_en, creado_por
         FROM avisos_sitio ORDER BY activo DESC, creado_en DESC LIMIT 100`
    );
    res.json(rows);
  } catch (e) {
    console.error("[avisos] todos:", e.message);
    res.status(500).json({ error: "No se pudieron leer los avisos." });
  }
});

/**
 * Retirar. No borra: apaga.
 */
router.delete("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE avisos_sitio SET activo = FALSE WHERE id = $1 RETURNING id`,
      [Number(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: "No existe ese aviso." });
    res.json({ ok: true });
  } catch (e) {
    console.error("[avisos] retirar:", e.message);
    res.status(500).json({ error: "No se pudo retirar el aviso." });
  }
});

module.exports = router;
