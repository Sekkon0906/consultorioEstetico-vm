#!/usr/bin/env node
/**
 * Levanta el esquema y el contenido del sitio en una base Postgres vacía.
 *
 * Ejecuta, en orden, los .sql del repo contra `DATABASE_URL`. Es el equivalente
 * a la tanda de `psql -f …` de la guía, pero sin depender de tener `psql`
 * instalado: usa el cliente `pg` que ya está en las dependencias del backend.
 *
 * Los archivos usan `IF NOT EXISTS` / `CREATE OR REPLACE`, así que correrlo dos
 * veces no rompe nada (salvo los INSERT de contenido, que sí fallan por clave
 * duplicada — para eso está --solo-esquema).
 *
 * USO
 *   DATABASE_URL='postgres://…' node scripts/cargar-esquema.js
 *   DATABASE_URL='postgres://…' node scripts/cargar-esquema.js --solo-esquema
 *   DATABASE_URL='postgres://…' node scripts/cargar-esquema.js --con-auth-propia
 *
 * Por defecto incluye 002_auth_propia.sql (el proyecto va hacia el corte de
 * Supabase Auth). Usa --sin-auth-propia si quieres la base sin esas tablas.
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const args = process.argv.slice(2);
const SOLO_ESQUEMA = args.includes("--solo-esquema");
const SIN_AUTH_PROPIA = args.includes("--sin-auth-propia");

const RAIZ = path.join(__dirname, "..", "sql");

const ESQUEMA = [
  "schema/000_baseline.sql",
  "migraciones/001_configuracion_sitio.sql",
  ...(SIN_AUTH_PROPIA ? [] : ["migraciones/002_auth_propia.sql"]),
  "migraciones/003_auditoria_ia.sql",
  "migraciones/004_integraciones_ia.sql",
  "migraciones/005_vista_resumen.sql",
  "indexes.sql",
];

const CONTENIDO = ["datos/010_contenido.sql"];

const ARCHIVOS = SOLO_ESQUEMA ? ESQUEMA : [...ESQUEMA, ...CONTENIDO];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }

  // Para DDL conviene la conexión DIRECTA, no la del pooler: PgBouncer en modo
  // transacción tropieza con algunas sentencias de sesión. Si el string trae
  // "-pooler", se le quita solo para esta carga.
  const urlDirecta = url.replace("-pooler.", ".");

  const client = new Client({ connectionString: urlDirecta });
  await client.connect();
  console.log("Conectado.\n");

  try {
    for (const rel of ARCHIVOS) {
      const abs = path.join(RAIZ, rel);
      const sql = fs.readFileSync(abs, "utf8");
      process.stdout.write(`▶ ${rel} … `);
      const t0 = Date.now();
      await client.query(sql);
      console.log(`ok (${Date.now() - t0} ms)`);
    }

    // Resumen
    const { rows } = await client.query(`
      SELECT table_name,
             (xpath('/row/c/text()',
                    query_to_xml(format('SELECT count(*) AS c FROM %I', table_name),
                                 false, true, '')))[1]::text::int AS filas
        FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name
    `);
    console.log("\nTablas creadas:");
    for (const r of rows) console.log(`  ${r.table_name.padEnd(28)} ${r.filas} filas`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
