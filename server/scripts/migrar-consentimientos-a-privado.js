/**
 * Mueve los consentimientos firmados del bucket público al privado.
 *
 * POR QUÉ HACE FALTA
 * Mientras `R2_BUCKET_PRIVADO` no existía, el código tenía un plan B: usar
 * el bucket normal, que es público. Los archivos que se firmaron en ese
 * periodo siguen ahí aunque ya exista el bucket privado, porque el objeto
 * no se mueve solo. Este script los mueve.
 *
 * QUÉ MUEVE, EXACTAMENTE
 * Solo las claves que la base de datos referencia en `citas.firma_url` y
 * `citas.consentimiento_pdf`. No barre el bucket entero: si algo no está
 * referenciado, moverlo no arregla nada y sí puede romper algo que no
 * conocemos.
 *
 * CÓMO SE COMPORTA
 * · Copia primero, verifica que llegó, y SOLO ENTONCES borra el original.
 *   Al revés se pierde un documento clínico si algo falla en medio.
 * · Es idempotente: si ya está en el privado, lo salta. Se puede correr dos
 *   veces sin miedo.
 * · Por defecto NO borra el original. Hay que pasar `--borrar` a propósito,
 *   porque borrar del bucket público es la única parte irreversible.
 * · `--dry` enseña qué haría sin tocar nada.
 *
 * USO
 *   node server/scripts/migrar-consentimientos-a-privado.js --dry
 *   node server/scripts/migrar-consentimientos-a-privado.js
 *   node server/scripts/migrar-consentimientos-a-privado.js --borrar
 */

require("dotenv").config();
const {
  S3Client,
  CopyObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { pool } = require("../src/lib/db");

const SECO = process.argv.includes("--dry");
const BORRAR = process.argv.includes("--borrar");

const PUBLICO = process.env.R2_BUCKET;
const PRIVADO = process.env.R2_BUCKET_PRIVADO;

function salirCon(mensaje) {
  console.error(`\n✖ ${mensaje}\n`);
  process.exit(1);
}

if (!PRIVADO) {
  salirCon(
    "R2_BUCKET_PRIVADO no está definida. Créala en Cloudflare R2 (sin acceso\n" +
    "  público), añade la variable, y vuelve a ejecutar."
  );
}
if (PRIVADO === PUBLICO) {
  salirCon("R2_BUCKET_PRIVADO y R2_BUCKET son el mismo bucket. No hay nada que mover.");
}

const cliente = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function existe(bucket, clave) {
  try {
    await cliente.send(new HeadObjectCommand({ Bucket: bucket, Key: clave }));
    return true;
  } catch {
    return false;
  }
}

async function mover(clave) {
  // Las claves antiguas se guardaron alguna vez como URL completa. Esas no
  // se tocan aquí: mover el objeto no arreglaría la fila, que seguiría
  // apuntando a una dirección pública. Se avisan para tratarlas aparte.
  if (/^https?:\/\//.test(clave)) return { estado: "url-heredada" };

  if (await existe(PRIVADO, clave)) return { estado: "ya-estaba" };
  if (!(await existe(PUBLICO, clave))) return { estado: "no-encontrado" };
  if (SECO) return { estado: "moveria" };

  await cliente.send(
    new CopyObjectCommand({
      Bucket: PRIVADO,
      Key: clave,
      CopySource: `${PUBLICO}/${clave}`,
    })
  );

  // Verificar ANTES de borrar. Copiar puede fallar en silencio si el token
  // no tiene permiso de escritura sobre el bucket nuevo.
  if (!(await existe(PRIVADO, clave))) return { estado: "copia-fallida" };

  if (BORRAR) {
    await cliente.send(new DeleteObjectCommand({ Bucket: PUBLICO, Key: clave }));
    return { estado: "movido-y-borrado" };
  }
  return { estado: "copiado" };
}

(async () => {
  const { rows } = await pool.query(
    `SELECT id, firma_url, consentimiento_pdf
       FROM citas
      WHERE firma_url IS NOT NULL OR consentimiento_pdf IS NOT NULL`
  );

  const claves = [];
  for (const r of rows) {
    if (r.firma_url) claves.push({ cita: r.id, campo: "firma_url", clave: r.firma_url });
    if (r.consentimiento_pdf)
      claves.push({ cita: r.id, campo: "consentimiento_pdf", clave: r.consentimiento_pdf });
  }

  console.log(`\n${PUBLICO}  →  ${PRIVADO}`);
  console.log(`${claves.length} archivo(s) referenciados por ${rows.length} cita(s).`);
  if (SECO) console.log("Modo --dry: no se toca nada.");
  if (!BORRAR && !SECO) console.log("Sin --borrar: el original se queda en el bucket público.");
  console.log("");

  const cuenta = {};
  for (const { cita, campo, clave } of claves) {
    const { estado } = await mover(clave);
    cuenta[estado] = (cuenta[estado] || 0) + 1;
    console.log(`  ${estado.padEnd(18)} ${campo.padEnd(20)} ${clave}  (cita ${cita})`);
  }

  console.log("\nResumen:");
  for (const [k, v] of Object.entries(cuenta)) console.log(`  ${k}: ${v}`);

  if (cuenta["url-heredada"]) {
    console.log(
      "\n⚠ Hay filas que guardan una URL pública completa en vez de la clave.\n" +
      "  Mover el objeto no las arregla: seguirían apuntando al bucket público.\n" +
      "  Hay que reescribir esas filas a la clave antes de migrarlas."
    );
  }
  if (cuenta["copia-fallida"]) {
    console.log(
      "\n⚠ Alguna copia no llegó. Lo más probable: el token de R2 no tiene\n" +
      "  permiso de escritura sobre el bucket nuevo. NADA se borró."
    );
  }
  if (!BORRAR && (cuenta["copiado"] || 0) > 0) {
    console.log(
      "\nCuando compruebes que los consentimientos se abren bien desde el perfil,\n" +
      "vuelve a ejecutar con --borrar para quitarlos del bucket público."
    );
  }

  await pool.end();
})().catch((e) => {
  console.error("\n✖ Falló la migración:", e.message);
  process.exit(1);
});
