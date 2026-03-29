const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");

// Mapea BD snake_case → frontend camelCase
function mapUsuario(row, email) {
  return {
    id:                      row.id,
    nombres:                 row.nombres,
    apellidos:               row.apellidos,
    rol:                     row.rol,
    photo:                   row.photo,
    telefono:                row.telefono,
    edad:                    row.edad,
    genero:                  row.genero,
    antecedentes:            row.antecedentes,
    antecedentesDescripcion: row.antecedentes_descripcion,
    alergias:                row.alergias,
    alergiasDescripcion:     row.alergias_descripcion,
    medicamentos:            row.medicamentos,
    medicamentosDescripcion: row.medicamentos_descripcion,
    creadoEn:                row.creado_en,
    email,
  };
}

// GET /usuarios/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombres, apellidos, rol, photo, telefono, edad, genero,
              antecedentes, antecedentes_descripcion,
              alergias, alergias_descripcion,
              medicamentos, medicamentos_descripcion, creado_en
       FROM usuarios WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    return res.json({ ok: true, user: mapUsuario(rows[0], req.user.email) });
  } catch (err) {
    console.error("Error GET /usuarios/me:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
});

// PUT /usuarios/me — acepta camelCase y snake_case
router.put("/me", verifyToken, async (req, res) => {
  try {
    const campos  = [];
    const valores = [];

    // Mapa camelCase → columna BD
    const campoMap = {
      nombres:                 "nombres",
      apellidos:               "apellidos",
      telefono:                "telefono",
      edad:                    "edad",
      genero:                  "genero",
      photo:                   "photo",
      antecedentes:            "antecedentes",
      antecedentesDescripcion: "antecedentes_descripcion",
      alergias:                "alergias",
      alergiasDescripcion:     "alergias_descripcion",
      medicamentos:            "medicamentos",
      medicamentosDescripcion: "medicamentos_descripcion",
      // también acepta snake_case directo
      antecedentes_descripcion: "antecedentes_descripcion",
      alergias_descripcion:     "alergias_descripcion",
      medicamentos_descripcion: "medicamentos_descripcion",
    };

    const yaAgregados = new Set();
    for (const [key, col] of Object.entries(campoMap)) {
      if (req.body[key] !== undefined && !yaAgregados.has(col)) {
        campos.push(`${col} = $${valores.length + 1}`);
        valores.push(req.body[key]);
        yaAgregados.add(col);
      }
    }

    if (!campos.length) {
      return res.status(400).json({ ok: false, error: "No hay campos para actualizar" });
    }

    campos.push(`actualizado_en = NOW()`);
    valores.push(req.user.id);

    const { rows } = await pool.query(
      `UPDATE usuarios SET ${campos.join(", ")}
       WHERE id = $${valores.length}
       RETURNING id, nombres, apellidos, rol, photo, telefono, edad, genero,
                 antecedentes, antecedentes_descripcion,
                 alergias, alergias_descripcion,
                 medicamentos, medicamentos_descripcion, creado_en`,
      valores
    );

    return res.json({ ok: true, user: mapUsuario(rows[0], req.user.email) });
  } catch (err) {
    console.error("Error PUT /usuarios/me:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar perfil" });
  }
});

// GET /usuarios — solo admin
router.get("/", verifyToken, requireRole(["admin", "developer"]), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombres, apellidos, rol, photo, telefono, creado_en
       FROM usuarios ORDER BY creado_en DESC`
    );
    return res.json({ ok: true, usuarios: rows });
  } catch (err) {
    console.error("Error GET /usuarios:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener usuarios" });
  }
});

module.exports = router;