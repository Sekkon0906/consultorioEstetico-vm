const express      = require("express");
const router       = express.Router();
const { pool }     = require("../lib/db");
const verifyToken  = require("../middlewares/verifyToken");
const requireRole  = require("../middlewares/requireRole");
const supabaseAdmin = require("../lib/supabaseAdmin");
const multer       = require("multer");

// multer en memoria — no guarda en disco
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ── Upload de imagen vía backend (evita error RLS 42P17) ───────────────
// POST /charlas/upload-imagen
router.post(
  "/upload-imagen",
  verifyToken,
  requireRole(["admin", "developer"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ ok: false, error: "No se recibió ningún archivo" });

      const ext    = req.file.originalname.split(".").pop();
      const bucket = req.query.bucket || "charlas";
      const folder = req.query.folder || "";
      const path   = folder
        ? `${folder}/${Date.now()}.${ext}`
        : `${Date.now()}.${ext}`;

      const { error: upErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (upErr) throw new Error(upErr.message);

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
      return res.json({ ok: true, url: data.publicUrl });
    } catch (err) {
      console.error("Error upload-imagen:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);

// GET /charlas — público
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.titulo, c.descripcion, c.detalle, c.imagen, c.fecha, c.creado_en,
              COALESCE(
                json_agg(
                  json_build_object('id', g.id, 'url', g.url, 'tipo', g.tipo, 'orden', g.orden)
                  ORDER BY g.orden ASC
                ) FILTER (WHERE g.id IS NOT NULL),
                '[]'
              ) AS galeria
       FROM charlas c
       LEFT JOIN charla_galeria g ON g.charla_id = c.id
       GROUP BY c.id
       ORDER BY c.fecha DESC NULLS LAST, c.creado_en DESC`
    );
    return res.json({ ok: true, charlas: rows });
  } catch (err) {
    console.error("Error GET /charlas:", err);
    return res.status(500).json({ ok: false, error: "Error al obtener charlas" });
  }
});

// POST /charlas — admin
router.post("/", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { titulo, descripcion, detalle, imagen, fecha, galeria = [] } = req.body;

    if (!titulo?.trim() || !descripcion?.trim() || !detalle?.trim()) {
      return res.status(400).json({ ok: false, error: "Título, descripción y detalle son obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO charlas (titulo, descripcion, detalle, imagen, fecha)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titulo, descripcion, detalle, imagen || "", fecha || null]
    );
    const charla = rows[0];

    if (galeria.length) {
      for (let i = 0; i < galeria.length; i++) {
        const url  = typeof galeria[i] === "string" ? galeria[i] : galeria[i].url;
        const tipo = galeria[i]?.tipo || "imagen";
        await pool.query(
          `INSERT INTO charla_galeria (charla_id, url, tipo, orden) VALUES ($1,$2,$3,$4)`,
          [charla.id, url, tipo, i]
        );
      }
    }

    return res.status(201).json({ ok: true, charla });
  } catch (err) {
    console.error("Error POST /charlas:", err);
    return res.status(500).json({ ok: false, error: "Error al crear charla" });
  }
});

// PUT /charlas/:id — admin
router.put("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, detalle, imagen, fecha, galeria } = req.body;

    const { rows } = await pool.query(
      `UPDATE charlas SET titulo=$1, descripcion=$2, detalle=$3, imagen=$4, fecha=$5, actualizado_en=NOW()
       WHERE id=$6 RETURNING *`,
      [titulo, descripcion, detalle, imagen || "", fecha || null, id]
    );

    if (!rows.length) return res.status(404).json({ ok: false, error: "Charla no encontrada" });

    if (Array.isArray(galeria)) {
      await pool.query("DELETE FROM charla_galeria WHERE charla_id = $1", [id]);
      for (let i = 0; i < galeria.length; i++) {
        const url  = typeof galeria[i] === "string" ? galeria[i] : galeria[i].url;
        const tipo = galeria[i]?.tipo || "imagen";
        await pool.query(
          `INSERT INTO charla_galeria (charla_id, url, tipo, orden) VALUES ($1,$2,$3,$4)`,
          [id, url, tipo, i]
        );
      }
    }

    return res.json({ ok: true, charla: rows[0] });
  } catch (err) {
    console.error("Error PUT /charlas/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al actualizar charla" });
  }
});

// DELETE /charlas/:id — admin
router.delete("/:id", verifyToken, requireRole(["admin", "developer"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM charlas WHERE id = $1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /charlas/:id:", err);
    return res.status(500).json({ ok: false, error: "Error al eliminar charla" });
  }
});

module.exports = router;