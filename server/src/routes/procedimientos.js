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

// ── Galería de un procedimiento (admin) ─────────────────────────────────────

// POST /procedimientos/:id/galeria — añade una imagen o video
router.post("/:id/galeria", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { tipo = "imagen", url, titulo = "" } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: "'url' es obligatoria" });

    const { rows: ord } = await pool.query(
      "SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM procedimiento_galeria WHERE procedimiento_id = $1",
      [req.params.id]
    );
    const { rows } = await pool.query(
      `INSERT INTO procedimiento_galeria (procedimiento_id, tipo, url, titulo, orden)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, tipo, url, titulo, descripcion, orden`,
      [req.params.id, tipo, url, titulo, ord[0].siguiente]
    );
    return res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("Error POST /procedimientos/:id/galeria:", err);
    return res.status(500).json({ ok: false, error: "Error al añadir a la galería" });
  }
});

// PUT /procedimientos/:id/galeria/orden — reordena { orden: [{id, orden}, …] }
router.put("/:id/galeria/orden", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  const cliente = await pool.connect();
  try {
    const items = Array.isArray(req.body?.orden) ? req.body.orden : [];
    await cliente.query("BEGIN");
    for (const it of items) {
      await cliente.query(
        "UPDATE procedimiento_galeria SET orden = $1 WHERE id = $2 AND procedimiento_id = $3",
        [it.orden, it.id, req.params.id]
      );
    }
    await cliente.query("COMMIT");
    return res.json({ ok: true });
  } catch (err) {
    await cliente.query("ROLLBACK").catch(() => {});
    console.error("Error PUT /procedimientos/:id/galeria/orden:", err);
    return res.status(500).json({ ok: false, error: "Error al reordenar" });
  } finally {
    cliente.release();
  }
});

// DELETE /procedimientos/galeria/:itemId — elimina un elemento
router.delete("/galeria/:itemId", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM procedimiento_galeria WHERE id = $1", [req.params.itemId]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /procedimientos/galeria/:itemId:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar el elemento" });
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

/**
 * Qué nombre acepta cada columna desde el cliente.
 *
 * Se usa para el UPDATE PARCIAL: solo se tocan las columnas cuyo campo
 * viene de verdad en el cuerpo.
 */
const CAMPOS_EDITABLES = {
  nombre:                         ["nombre"],
  descripcion:                    ["desc", "descripcion"],
  descripcion_completa:           ["descCompleta", "descripcion_completa"],
  precio:                         ["precio"],
  imagen:                         ["imagen"],
  categoria:                      ["categoria"],
  subcategoria:                   ["subcategoria"],
  duracion_min:                   ["duracionMin", "duracion_min"],
  destacado:                      ["destacado"],
  en_promocion:                   ["enPromocion", "en_promocion"],
  precio_promocional:             ["precioPromocional", "precio_promocional"],
  promocion_hasta:                ["promocionHasta", "promocion_hasta"],
  mostrar_galeria_home:           ["mostrarGaleriaHome", "mostrar_galeria_home"],
  mostrar_galeria_procedimientos: ["mostrarGaleriaProcedimientos", "mostrar_galeria_procedimientos"],
};

// PUT /procedimientos/:id — admin
router.put("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    /* ACTUALIZACIÓN PARCIAL, y no es una comodidad: era una bomba.
     *
     * Antes esto reescribía LAS CATORCE columnas con lo que trajera
     * `normalizeBody`, que rellena con valores por defecto lo que no venga.
     * O sea que un PUT con solo `{ precio }` no cambiaba el precio: cambiaba
     * el precio y además borraba la descripción, vaciaba la imagen, ponía la
     * categoría en "Facial" y quitaba el destacado. Funcionaba únicamente
     * porque el único sitio que llamaba mandaba siempre el objeto entero, y
     * eso no es una garantía: es una casualidad que se rompe la primera vez
     * que alguien edita un campo suelto.
     *
     * Ahora se construye el SET con las columnas que de verdad vienen en el
     * cuerpo. Lo que no viene, no se toca.
     */
    const sets = [];
    const valores = [];
    for (const [columna, alias] of Object.entries(CAMPOS_EDITABLES)) {
      const clave = alias.find((a) => a in req.body);
      if (clave === undefined) continue;
      valores.push(normalizeBody({ [clave]: req.body[clave] })[columna]);
      sets.push(`${columna}=$${valores.length}`);
    }

    if (!sets.length) {
      return res.status(400).json({ ok: false, error: "Nada que actualizar" });
    }

    valores.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE procedimientos SET
         ${sets.join(", ")}, actualizado_en=NOW()
       WHERE id=$${valores.length}
       RETURNING ${COLUMNAS}`,
      valores
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
