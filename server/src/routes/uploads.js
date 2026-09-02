const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const almacenamiento = require("../lib/almacenamiento");

/**
 * Subida de imágenes para el panel (procedimientos, testimonios, charlas).
 *
 * Antes el frontend subía directo a Supabase Storage con la anon key y armaba
 * la URL a mano. Ahora el archivo pasa por aquí: el servidor valida el tipo,
 * genera un nombre aleatorio (no se puede escribir fuera de la carpeta ni
 * subir un .html ejecutable) y lo guarda en R2.
 */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB (los videos van por URL, no por aquí)
});

// Carpetas permitidas. Lo que no está en la lista, no entra.
const CARPETAS = new Set([
  "procedimientos", "testimonios", "charlas", "imagenesPublicas", "logo",
]);

// POST /uploads/imagen — admin. Campo del formulario: "archivo".
router.post(
  "/imagen",
  verifyToken,
  requireRole(["admin", "developer"]),
  upload.single("archivo"),
  async (req, res) => {
    try {
      if (!almacenamiento.estaConfigurado()) {
        return res.status(503).json({ ok: false, error: "El almacenamiento no está configurado en el servidor." });
      }
      if (!req.file) {
        return res.status(400).json({ ok: false, error: "No llegó ningún archivo (campo 'archivo')." });
      }

      const carpeta = String(req.body.carpeta || "").trim();
      if (!CARPETAS.has(carpeta)) {
        return res.status(400).json({ ok: false, error: `Carpeta no permitida: '${carpeta}'` });
      }

      const r = await almacenamiento.subirArchivo(req.file.buffer, {
        carpeta,
        tipoMime: req.file.mimetype,
        nombreOriginal: req.file.originalname,
      });
      if (!r.ok) return res.status(400).json(r);

      return res.status(201).json({ ok: true, url: r.url, clave: r.clave });
    } catch (err) {
      console.error("Error POST /uploads/imagen:", err);
      return res.status(500).json({ ok: false, error: "Error al subir la imagen" });
    }
  }
);

module.exports = router;
