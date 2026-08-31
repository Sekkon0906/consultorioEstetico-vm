const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// ✅ Filas → objeto plano { clave: valor } que consume el frontend
function mapValores(rows) {
  const out = {};
  for (const r of rows) out[r.clave] = r.valor;
  return out;
}

// ✅ Filas → estructura agrupada para el formulario de administración
function mapCampos(rows) {
  const grupos = {};
  for (const r of rows) {
    if (!grupos[r.grupo]) grupos[r.grupo] = [];
    grupos[r.grupo].push({
      clave:    r.clave,
      valor:    r.valor,
      etiqueta: r.etiqueta,
      ayuda:    r.ayuda,
      tipo:     r.tipo,
      orden:    r.orden,
    });
  }
  return grupos;
}

// GET /configuracion — público.
// Devuelve solo { clave: valor }: es lo que el sitio necesita para pintarse.
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT clave, valor FROM configuracion_sitio`
    );
    return res.json({ ok: true, data: mapValores(rows) });
  } catch (err) {
    console.error("Error GET /configuracion:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener la configuración" });
  }
});

// GET /configuracion/campos — admin.
// Incluye etiquetas, ayudas y tipos para construir el formulario.
router.get("/campos", verifyToken, requireRole(["admin"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT clave, valor, grupo, etiqueta, ayuda, tipo, orden
       FROM configuracion_sitio ORDER BY grupo ASC, orden ASC`
    );
    return res.json({ ok: true, data: mapCampos(rows) });
  } catch (err) {
    console.error("Error GET /configuracion/campos:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener los campos" });
  }
});

// PUT /configuracion — admin. Body: { clave: valor, ... }
//
// Solo actualiza claves que YA existen: la semilla de 001 define el catálogo,
// así que un cliente no puede inventar claves nuevas ni ensuciar la tabla.
router.put("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  const cambios = req.body && typeof req.body === "object" ? req.body : null;
  if (!cambios || Array.isArray(cambios) || !Object.keys(cambios).length) {
    return res.status(400).json({ ok: false, error: "Se esperaba un objeto { clave: valor }" });
  }

  const claves = Object.keys(cambios);
  if (claves.length > 100) {
    return res.status(400).json({ ok: false, error: "Demasiadas claves en una sola petición" });
  }
  for (const k of claves) {
    if (typeof cambios[k] !== "string") {
      return res.status(400).json({ ok: false, error: `El valor de "${k}" debe ser texto` });
    }
    if (cambios[k].length > 5000) {
      return res.status(400).json({ ok: false, error: `El valor de "${k}" excede 5000 caracteres` });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE configuracion_sitio AS c
          SET valor = v.valor,
              actualizado_en = now(),
              actualizado_por = $2
         FROM unnest($1::text[], $3::text[]) AS v(clave, valor)
        WHERE c.clave = v.clave
      RETURNING c.clave, c.valor`,
      [claves, req.user.id, claves.map((k) => cambios[k])]
    );

    await client.query("COMMIT");

    const desconocidas = claves.filter((k) => !rows.some((r) => r.clave === k));
    return res.json({
      ok: true,
      data: mapValores(rows),
      ...(desconocidas.length ? { ignoradas: desconocidas } : {}),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error PUT /configuracion:", err);
    return res.status(500).json({ ok: false, error: "Error al guardar la configuración" });
  } finally {
    client.release();
  }
});

module.exports = router;
