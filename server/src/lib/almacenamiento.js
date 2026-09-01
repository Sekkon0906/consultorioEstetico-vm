/**
 * Almacenamiento de archivos compatible con S3 (pensado para Cloudflare R2).
 *
 * Reemplaza Supabase Storage, donde hoy viven las imágenes de procedimientos,
 * las firmas de consentimiento y los PDF generados.
 *
 * POR QUÉ R2 Y NO S3 DE AMAZON: R2 no cobra por transferencia de salida, que
 * en un sitio lleno de fotos es justamente el costo que se dispara. Y habla el
 * mismo protocolo, así que este archivo sirve igual para S3, Backblaze o
 * MinIO — solo cambia el endpoint.
 *
 * SIN CONFIGURAR NO ROMPE NADA: si faltan las variables, `estaConfigurado()`
 * devuelve false y las rutas pueden seguir usando Supabase mientras dure la
 * transición. Eso permite migrar bucket por bucket en vez de todo de golpe.
 *
 * VARIABLES DE ENTORNO
 *   R2_ACCOUNT_ID          ID de cuenta de Cloudflare (del panel de R2).
 *   R2_ACCESS_KEY_ID       Clave de acceso del token de API de R2.
 *   R2_SECRET_ACCESS_KEY   Secreto de ese token.
 *   R2_BUCKET              Nombre del bucket, ej: "consultorio".
 *   R2_PUBLIC_URL          URL pública del bucket, ej: "https://archivos.tudominio.com".
 *                          Es la base con la que se arman las URLs guardadas en la
 *                          base de datos, así que conviene que sea un subdominio
 *                          propio y no la URL de r2.dev: si algún día se cambia de
 *                          proveedor, no hay que reescribir cada fila.
 *   R2_ENDPOINT            Opcional. Solo para otro proveedor S3.
 */

const crypto = require("crypto");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

function estaConfigurado() {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    (process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT)
  );
}

let clienteCache = null;
function getCliente() {
  if (!estaConfigurado()) return null;
  if (clienteCache) return clienteCache;

  clienteCache = new S3Client({
    // R2 ignora la región pero el SDK exige uuna; "auto" es lo que documenta
    // Cloudflare.
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ||
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return clienteCache;
}

/** Tipos permitidos. Lista blanca, no negra: lo que no está, no entra. */
const TIPOS_PERMITIDOS = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "application/pdf",
  "video/mp4", "video/webm",
]);

const EXTENSION_POR_TIPO = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "image/avif": ".avif", "image/gif": ".gif", "application/pdf": ".pdf",
  "video/mp4": ".mp4", "video/webm": ".webm",
};

/**
 * Construye una ruta segura dentro del bucket.
 * El nombre original NO se usa tal cual: se descarta y se genera uno
 * aleatorio, conservando solo la extensión que corresponde al tipo declarado.
 * Así no hay forma de escribir fuera de la carpeta con nombres como
 * "../../otra-cosa", ni de subir un .html que el navegador ejecute.
 */
function construirRuta(carpeta, tipoMime, nombreOriginal = "") {
  const carpetaLimpia = String(carpeta).replace(/[^a-zA-Z0-9_/-]/g, "").replace(/^\/+|\/+$/g, "");
  if (!carpetaLimpia) throw new Error("Carpeta inválida");

  const extension =
    EXTENSION_POR_TIPO[tipoMime] ||
    (path.extname(nombreOriginal).match(/^\.[a-zA-Z0-9]{1,5}$/) ? path.extname(nombreOriginal).toLowerCase() : "");

  return `${carpetaLimpia}/${Date.now()}_${crypto.randomBytes(6).toString("hex")}${extension}`;
}

/**
 * Sube un archivo y devuelve su URL pública.
 * @param {Buffer} contenido
 * @param {{carpeta: string, tipoMime: string, nombreOriginal?: string}} opciones
 * @returns {Promise<{ok: boolean, url?: string, clave?: string, error?: string}>}
 */
async function subirArchivo(contenido, { carpeta, tipoMime, nombreOriginal }) {
  const cliente = getCliente();
  if (!cliente) return { ok: false, error: "El almacenamiento no está configurado en el servidor." };

  if (!TIPOS_PERMITIDOS.has(tipoMime)) {
    return { ok: false, error: `Tipo de archivo no permitido: ${tipoMime}` };
  }
  if (!Buffer.isBuffer(contenido) || contenido.length === 0) {
    return { ok: false, error: "El archivo llegó vacío." };
  }

  const clave = construirRuta(carpeta, tipoMime, nombreOriginal);

  try {
    await cliente.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: clave,
      Body: contenido,
      ContentType: tipoMime,
      // Un año de caché: los nombres llevan marca de tiempo y aleatorio, así
      // que un archivo nunca cambia de contenido bajo la misma clave.
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return { ok: true, url: urlPublica(clave), clave };
  } catch (err) {
    console.error("[almacenamiento] Falló la subida:", err);
    return { ok: false, error: String(err && err.message) };
  }
}

async function borrarArchivo(clave) {
  const cliente = getCliente();
  if (!cliente) return { ok: false, error: "El almacenamiento no está configurado." };
  try {
    await cliente.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: clave,
    }));
    return { ok: true };
  } catch (err) {
    console.error("[almacenamiento] Falló el borrado:", err);
    return { ok: false, error: String(err && err.message) };
  }
}

async function existeArchivo(clave) {
  const cliente = getCliente();
  if (!cliente) return false;
  try {
    await cliente.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: clave }));
    return true;
  } catch {
    return false;
  }
}

function urlPublica(clave) {
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return base ? `${base}/${clave}` : clave;
}

/**
 * Extrae la clave a partir de una URL pública. Sirve para borrar un archivo
 * cuando en la base solo se guardó la URL completa, que es el caso hoy.
 */
function claveDesdeUrl(url) {
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  if (base && url.startsWith(base)) return url.slice(base.length + 1);
  return null;
}

module.exports = {
  estaConfigurado,
  subirArchivo,
  borrarArchivo,
  existeArchivo,
  urlPublica,
  claveDesdeUrl,
  TIPOS_PERMITIDOS,
};
