#!/usr/bin/env node
/**
 * Copia los archivos de Supabase Storage a Cloudflare R2 y reescribe las URLs
 * guardadas en la base de datos.
 *
 * QUÉ HACE, EN ORDEN
 *   1. Lista todos los objetos de los buckets de Supabase (`ConsultorioImagenes`
 *      y `charlas` por defecto).
 *   2. Descarga cada uno y lo sube a R2 con la MISMA ruta, prefijada por el
 *      nombre del bucket:  ConsultorioImagenes/logo/LogoJM.jpg  →  <R2>/ConsultorioImagenes/logo/LogoJM.jpg
 *   3. Reescribe, en una transacción, cada columna de la base que hoy guarda una
 *      URL `…supabase.co/storage/v1/object/public/…`, cambiando solo el prefijo
 *      del host por `R2_PUBLIC_URL`. El resto de la ruta no cambia.
 *   4. Verifica que no quede ninguna URL de Supabase Storage en esas columnas.
 *
 * POR QUÉ CONSERVA LA RUTA CON EL NOMBRE DEL BUCKET
 *   Reescribir las URLs se vuelve un único `replace(col, prefijoViejo, prefijoNuevo)`
 *   por columna. Nada de mapear archivo por archivo.
 *
 * SEGURO POR DEFECTO
 *   Sin `--apply` hace un simulacro: lista lo que copiaría y lo que reescribiría,
 *   sin tocar R2 ni la base. Con `--apply` ejecuta. La reescritura de la base va
 *   en una transacción: entra todo o nada.
 *
 * VARIABLES DE ENTORNO (todas obligatorias con --apply)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — para leer los buckets
 *   R2_ACCOUNT_ID | R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   R2_PUBLIC_URL                             — base pública del bucket R2
 *   DATABASE_URL                              — la base cuyas URLs se reescriben
 *
 * USO
 *   node scripts/migrar-storage-a-r2.js                # simulacro
 *   node scripts/migrar-storage-a-r2.js --apply        # de verdad
 *   node scripts/migrar-storage-a-r2.js --apply --solo-db     # no recopia, solo reescribe URLs
 *   node scripts/migrar-storage-a-r2.js --apply --solo-copia  # copia archivos, no toca la base
 *   node scripts/migrar-storage-a-r2.js --buckets ConsultorioImagenes,charlas
 */

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { Pool } = require("pg");

// ── Argumentos ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const SOLO_DB = args.includes("--solo-db");
const SOLO_COPIA = args.includes("--solo-copia");
const BUCKETS = (() => {
  const i = args.indexOf("--buckets");
  if (i !== -1 && args[i + 1]) return args[i + 1].split(",").map((s) => s.trim()).filter(Boolean);
  return ["ConsultorioImagenes", "charlas"];
})();

// ── Columnas de la base que guardan una URL de Storage ───────────────────────
// [tabla, columna]. Si añades una tabla con imágenes, agrégala aquí.
const COLUMNAS_URL = [
  ["procedimientos", "imagen"],
  ["procedimiento_galeria", "url"],
  ["testimonios", "video"],
  ["testimonios", "thumb"],
  ["charlas", "imagen"],
  ["charla_galeria", "url"],
  ["citas", "qr_url"],
  ["citas", "firma_url"],
  ["citas", "consentimiento_pdf"],
  ["usuarios", "photo"],
  ["reportes_mensuales", "archivo_url"],
  ["configuracion_sitio", "valor"], // EAV: cualquier ajuste puede ser una URL (logo, etc.)
];

const log = (...m) => console.log(...m);
const err = (...m) => console.error(...m);

function exigir(nombre) {
  if (!process.env[nombre]) {
    err(`Falta la variable de entorno ${nombre}`);
    process.exit(1);
  }
  return process.env[nombre];
}

// ── Clientes ────────────────────────────────────────────────────────────────
function supabaseAdmin() {
  return createClient(exigir("SUPABASE_URL"), exigir("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

function r2() {
  exigir("R2_ACCESS_KEY_ID");
  exigir("R2_SECRET_ACCESS_KEY");
  exigir("R2_BUCKET");
  return new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ||
      `https://${exigir("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ── Listar un bucket entero (recursivo, con paginación) ──────────────────────
async function listarBucket(sb, bucket, prefijo = "") {
  const encontrados = [];
  const LIMITE = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await sb.storage.from(bucket).list(prefijo, {
      limit: LIMITE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`list ${bucket}/${prefijo}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
      // Supabase marca las carpetas con id === null.
      if (item.id === null) {
        encontrados.push(...(await listarBucket(sb, bucket, ruta)));
      } else {
        encontrados.push({ bucket, ruta, tamano: item.metadata?.size ?? null, tipo: item.metadata?.mimetype ?? null });
      }
    }

    if (data.length < LIMITE) break;
    offset += LIMITE;
  }

  return encontrados;
}

async function existeEnR2(cliente, key) {
  try {
    await cliente.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ── Copia de archivos ───────────────────────────────────────────────────────
async function copiarArchivos() {
  const sb = supabaseAdmin();
  const cliente = APPLY ? r2() : null;

  let total = 0;
  let copiados = 0;
  let saltados = 0;
  let fallidos = 0;

  for (const bucket of BUCKETS) {
    log(`\n── Bucket ${bucket} ──`);
    const objetos = await listarBucket(sb, bucket);
    log(`  ${objetos.length} archivos`);
    total += objetos.length;

    for (const o of objetos) {
      const key = `${o.bucket}/${o.ruta}`;

      if (!APPLY) {
        log(`  [simulacro] copiaría  ${key}  (${o.tamano ?? "?"} bytes)`);
        continue;
      }

      if (await existeEnR2(cliente, key)) {
        saltados++;
        continue;
      }

      try {
        const { data, error } = await sb.storage.from(o.bucket).download(o.ruta);
        if (error) throw new Error(error.message);
        const buffer = Buffer.from(await data.arrayBuffer());

        await cliente.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: o.tipo || data.type || "application/octet-stream",
            CacheControl: "public, max-age=31536000, immutable",
          })
        );
        copiados++;
        if (copiados % 25 === 0) log(`  … ${copiados} copiados`);
      } catch (e) {
        fallidos++;
        err(`  ✗ ${key}: ${e.message}`);
      }
    }
  }

  log(
    `\nArchivos: ${total} en total` +
      (APPLY ? ` · ${copiados} copiados · ${saltados} ya estaban · ${fallidos} fallidos` : " (simulacro, nada copiado)")
  );
  return { fallidos };
}

// ── Reescritura de URLs en la base ──────────────────────────────────────────
async function reescribirUrls() {
  const publicBase = exigir("R2_PUBLIC_URL").replace(/\/+$/, "");
  const pool = new Pool({ connectionString: exigir("DATABASE_URL") });
  const c = await pool.connect();

  // Prefijo viejo: el host de Supabase Storage hasta "…/public/".
  //   https://<ref>.supabase.co/storage/v1/object/public/
  const REGEX_PREFIJO = "https?://[a-z0-9-]+\\.supabase\\.co/storage/v1/object/public/";
  const patronSql = `%supabase.co/storage/v1/object/public/%`;

  try {
    log(`\n── Reescritura de URLs → ${publicBase}/… ──`);
    await c.query(APPLY ? "BEGIN" : "BEGIN"); // en simulacro hacemos ROLLBACK al final

    let totalFilas = 0;

    for (const [tabla, columna] of COLUMNAS_URL) {
      // ¿existe la tabla/columna? (configuracion_sitio y reportes_mensuales
      // llegan por migración; el script no debe romper si aún no están)
      const existe = await c.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [tabla, columna]
      );
      if (existe.rowCount === 0) {
        log(`  – ${tabla}.${columna}: no existe, se omite`);
        continue;
      }

      const cuenta = await c.query(
        `SELECT count(*)::int AS n FROM ${tabla} WHERE ${columna} LIKE $1`,
        [patronSql]
      );
      const n = cuenta.rows[0].n;
      if (n === 0) {
        log(`  · ${tabla}.${columna}: 0 filas`);
        continue;
      }

      const upd = await c.query(
        `UPDATE ${tabla}
            SET ${columna} = regexp_replace(${columna}, $1, $2)
          WHERE ${columna} LIKE $3`,
        [REGEX_PREFIJO, `${publicBase}/`, patronSql]
      );
      totalFilas += upd.rowCount;
      log(`  ✓ ${tabla}.${columna}: ${upd.rowCount} filas`);
    }

    // Verificación: nada debe quedar apuntando a Supabase Storage.
    const restos = [];
    for (const [tabla, columna] of COLUMNAS_URL) {
      const existe = await c.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [tabla, columna]
      );
      if (existe.rowCount === 0) continue;
      const q = await c.query(
        `SELECT count(*)::int AS n FROM ${tabla} WHERE ${columna} LIKE $1`,
        [patronSql]
      );
      if (q.rows[0].n > 0) restos.push(`${tabla}.${columna} (${q.rows[0].n})`);
    }

    if (restos.length > 0) {
      err(`\n  ✗ Quedan URLs de Supabase sin reescribir: ${restos.join(", ")}`);
      await c.query("ROLLBACK");
      return { ok: false, filas: 0 };
    }

    if (APPLY) {
      await c.query("COMMIT");
      log(`\nURLs reescritas: ${totalFilas} filas. Commit hecho.`);
    } else {
      await c.query("ROLLBACK");
      log(`\nURLs que se reescribirían: ${totalFilas} filas. (simulacro, ROLLBACK)`);
    }
    return { ok: true, filas: totalFilas };
  } finally {
    c.release();
    await pool.end();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  log(APPLY ? "MODO: APLICAR CAMBIOS" : "MODO: SIMULACRO (usa --apply para ejecutar)");
  log(`Buckets: ${BUCKETS.join(", ")}`);

  let fallosCopia = 0;

  if (!SOLO_DB) {
    const r = await copiarArchivos();
    fallosCopia = r.fallidos;
    if (fallosCopia > 0 && APPLY && !SOLO_COPIA) {
      err("\nHubo archivos que no se copiaron. NO se reescriben las URLs (arréglalo y reintenta).");
      process.exit(1);
    }
  }

  if (!SOLO_COPIA) {
    const r = await reescribirUrls();
    if (!r.ok) process.exit(1);
  }

  log("\nListo.");
})().catch((e) => {
  err("\nError fatal:", e.message);
  process.exit(1);
});
