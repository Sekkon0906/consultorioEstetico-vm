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

// Clave del frontend → carpeta real en R2 (misma estructura que la bóveda
// que se migró desde Supabase). Lo que no está en el mapa, no entra.
const CARPETAS = {
  procedimientos:   "Procedimientos",
  testimonios:      "Testimonios",
  charlas:          "Charlas",
  imagenesPublicas: "ConsultorioImagenes/ImagenesPublicas",
  logo:             "ConsultorioImagenes/Logo",
};

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

      const clave = String(req.body.carpeta || "").trim();
      const carpetaR2 = CARPETAS[clave];
      if (!carpetaR2) {
        return res.status(400).json({ ok: false, error: `Carpeta no permitida: '${clave}'` });
      }

      const r = await almacenamiento.subirArchivo(req.file.buffer, {
        carpeta: carpetaR2,
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
