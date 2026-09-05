const express     = require("express");
const router      = express.Router();
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const marketing   = require("../lib/marketing");

// Mapea BD snake_case → frontend camelCase
/**
 * @param rolReal  El rol que resolvió `verifyToken` a partir de
 *   `admin_users`. Se pasa aparte a propósito: la columna `usuarios.rol`
 *   que viene en `row` NO es la autoridad —el propio usuario puede
 *   editarla desde su perfil— y devolverla aquí rompía el panel de
 *   administración. `verifyToken` resolvía bien el rol y autorizaba los
 *   endpoints, pero `/usuarios/me` respondía con el valor de la columna,
 *   así que el frontend (que decide con `user.rol === "admin"`) nunca veía
 *   al administrador y el enlace "Administrar" no aparecía. Peor: al
 *   recargar la página se perdía el rol, porque esta es la ruta que
 *   AuthContext usa para rehidratar la sesión.
 */
function mapUsuario(row, email, rolReal) {
  return {
    id:                      row.id,
    nombres:                 row.nombres,
    apellidos:               row.apellidos,
    rol:                     rolReal ?? row.rol,
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
    return res.json({ ok: true, user: mapUsuario(rows[0], req.user.email, req.user.rol) });
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

    return res.json({ ok: true, user: mapUsuario(rows[0], req.user.email, req.user.rol) });
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

/* ── Permiso para correos comerciales ──────────────────────────────────────
   Va en su propio endpoint y NO como un campo mas de PUT /usuarios/me.

   El PUT construye el UPDATE con los campos que lleguen, asi que meter aqui
   `acepta_marketing` funcionaria… y seria un error: guardar el permiso exige
   ademas sellar la fecha y el origen, y eso se perderia en cuanto alguien
   editara su telefono y el campo viajara de vuelta sin sello. Un consentimiento
   sin fecha no sirve para demostrar nada.

   Aparte, tenerlo separado deja el rastro claro en los registros: una llamada
   a esta ruta es siempre una decision sobre publicidad, nunca un efecto
   secundario de guardar el perfil. */
router.put("/me/marketing", verifyToken, async (req, res) => {
  try {
    /* `=== true` y no valor verdadero: un formulario manda "false" o "" con
       facilidad, y las dos son verdaderas al evaluarlas. Con el permiso
       comercial, dudar significa que no. */
    const acepta = req.body?.acepta === true;
    await marketing.fijarPermiso(req.user.id, acepta, "perfil");
    return res.json({ ok: true, aceptaMarketing: acepta });
  } catch (err) {
    console.error("Error PUT /usuarios/me/marketing:", err);
    return res.status(500).json({ ok: false, error: "No se pudo guardar la preferencia" });
  }
});

/* Baja SIN iniciar sesion. Es el enlace del pie de cada correo comercial.
   Quien esta harto de recibir correos no va a buscar su contrasena para dejar
   de recibirlos, asi que exigir sesion aqui equivale a no ofrecer la baja.

   Va sin `verifyToken` a proposito y se apoya en la firma. Responde lo mismo
   con firma buena o mala: si dijera "esa firma no vale" estaria confirmando
   que el id existe, que es el unico dato que se filtraria por aqui. */
router.post("/baja-correos", async (req, res) => {
  const { u, f } = req.body || {};
  try {
    if (u && marketing.firmaValida(u, f)) {
      await marketing.fijarPermiso(u, false, null);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error POST /usuarios/baja-correos:", err);
    return res.status(500).json({ ok: false, error: "No se pudo procesar la baja" });
  }
});

module.exports = router;