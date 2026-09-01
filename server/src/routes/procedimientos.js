const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

/**
 * Procedimientos.
 *
 * Este archivo devolvía solo 8 de los 15 campos que la tabla tiene, así que
 * el frontend no podía usarlo: le faltaban las promociones, la subcategoría
 * y los interruptores de galería. Por eso seguía hablando con Supabase
 * directamente, saltándose esta API.
 *
 * Ahora está a la par con la tabla, que es lo que permite desconectar
 * Supabase del frontend.
 */

const COLUMNAS = `id, nombre, descripcion, descripcion_completa, precio, imagen,
                  categoria, subcategoria, duracion_min, destacado,
                  en_promocion, precio_promocional, promocion_hasta,
                  mostrar_galeria_home, mostrar_galeria_procedimientos`;

/** Columnas de la base -> campos que espera el frontend. */
function mapRow(row) {
  return {
    id:            row.id,
    nombre:        row.nombre,
    desc:          row.descripcion,            // el frontend usa "desc"
    descripcion:   row.descripcion,            // y también el nombre largo
    descCompleta:  row.descripcion_completa || "",
    precio:        row.precio,
    imagen:        row.imagen,
    categoria:     row.categoria,
    subcategoria:  row.subcategoria || null,
    duracionMin:   row.duracion_min,
    destacado:     !!row.destacado,
    enPromocion:   !!row.en_promocion,
    precioPromocional: row.precio_promocional || null,
    promocionHasta:    row.promocion_hasta || null,
    // Estas dos tienen valor por defecto distinto: en la home se muestra solo
    // lo que la doctora marque; en /procedimientos se muestra todo salvo lo
    // que desmarque. Un null aquí debe respetar ese criterio.
    mostrarGaleriaHome:
      row.mostrar_galeria_home == null ? false : !!row.mostrar_galeria_home,
    mostrarGaleriaProcedimientos:
      row.mostrar_galeria_procedimientos == null ? true : !!row.mostrar_galeria_procedimientos,
  };
}

/** Cuerpo del frontend -> columnas de la base. Acepta ambos nombres. */
function normalizeBody(body) {
  return {
    nombre:               body.nombre ?? null,
    descripcion:          body.desc ?? body.descripcion ?? null,
    descripcion_completa: body.descCompleta ?? body.descripcion_completa ?? "",
    precio:               body.precio ?? "0",
    imagen:               body.imagen ?? "",
    categoria:            body.categoria ?? "Facial",
    subcategoria:         body.subcategoria ?? null,
    duracion_min:         body.duracionMin ?? body.duracion_min ?? null,
    destacado:            body.destacado ?? false,
    en_promocion:         body.enPromocion ?? body.en_promocion ?? false,
    precio_promocional:   body.precioPromocional ?? body.precio_promocional ?? null,
    promocion_hasta:      body.promocionHasta ?? body.promocion_hasta ?? null,
    mostrar_galeria_home:
      body.mostrarGaleriaHome ?? body.mostrar_galeria_home ?? false,
    mostrar_galeria_procedimientos:
      body.mostrarGaleriaProcedimientos ?? body.mostrar_galeria_procedimientos ?? true,
  };
}

// GET /procedimientos — público
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM procedimientos ORDER BY categoria ASC, nombre ASC`
    );
    return res.json({ ok: true, data: rows.map(mapRow) });
  } catch (err) {
    console.error("Error GET /procedimientos:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener procedimientos" });
  }
});

// GET /procedimientos/:id — público
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM procedimientos WHERE id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "No encontrado" });
    return res.json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error GET /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener procedimiento" });
  }
});

// GET /procedimientos/:id/galeria — público
router.get("/:id/galeria", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, tipo, url, titulo, descripcion, orden
         FROM procedimiento_galeria
        WHERE procedimiento_id = $1
        ORDER BY orden ASC`,
      [req.params.id]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error GET /procedimientos/:id/galeria:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener la galería" });
  }
});

// POST /procedimientos — admin
router.post("/", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const c = normalizeBody(req.body);
    if (!c.nombre?.trim() || !c.descripcion?.trim())
      return res.status(400).json({ ok: false, error: "Nombre y descripción son obligatorios" });

    const { rows } = await pool.query(
      `INSERT INTO procedimientos
         (nombre, descripcion, descripcion_completa, precio, imagen, categoria,
          subcategoria, duracion_min, destacado, en_promocion, precio_promocional,
          promocion_hasta, mostrar_galeria_home, mostrar_galeria_procedimientos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${COLUMNAS}`,
      [c.nombre, c.descripcion, c.descripcion_completa, c.precio, c.imagen, c.categoria,
       c.subcategoria, c.duracion_min, c.destacado, c.en_promocion, c.precio_promocional,
       c.promocion_hasta, c.mostrar_galeria_home, c.mostrar_galeria_procedimientos]
    );
    return res.status(201).json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error POST /procedimientos:", err);
    return res.status(500).json({ ok: false, error: "Error al crear procedimiento" });
  }
});

// PUT /procedimientos/:id — admin
router.put("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const c = normalizeBody(req.body);
    const { rows } = await pool.query(
      `UPDATE procedimientos SET
         nombre=$1, descripcion=$2, descripcion_completa=$3, precio=$4, imagen=$5,
         categoria=$6, subcategoria=$7, duracion_min=$8, destacado=$9,
         en_promocion=$10, precio_promocional=$11, promocion_hasta=$12,
         mostrar_galeria_home=$13, mostrar_galeria_procedimientos=$14,
         actualizado_en=NOW()
       WHERE id=$15
       RETURNING ${COLUMNAS}`,
      [c.nombre, c.descripcion, c.descripcion_completa, c.precio, c.imagen, c.categoria,
       c.subcategoria, c.duracion_min, c.destacado, c.en_promocion, c.precio_promocional,
       c.promocion_hasta, c.mostrar_galeria_home, c.mostrar_galeria_procedimientos,
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "No encontrado" });
    return res.json({ ok: true, data: mapRow(rows[0]) });
  } catch (err) {
    console.error("Error PUT /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar procedimiento" });
  }
});

// DELETE /procedimientos/:id — admin
router.delete("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    // La galería cuelga del procedimiento y no tiene ON DELETE CASCADE, así
    // que se borra primero: si no, la llave foránea rechaza el borrado.
    await pool.query("DELETE FROM procedimiento_galeria WHERE procedimiento_id = $1", [req.params.id]);
    await pool.query("DELETE FROM procedimientos WHERE id = $1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /procedimientos/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar procedimiento" });
  }
});

module.exports = router;
