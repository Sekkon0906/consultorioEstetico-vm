require("dotenv").config();
const { Pool, types } = require("pg");

/**
 * Las columnas `date` se devuelven como texto "YYYY-MM-DD", no como Date.
 *
 * Por defecto `pg` convierte un `date` de Postgres a un `Date` de JavaScript,
 * que es un INSTANTE en el tiempo. Pero la fecha de una cita no es un
 * instante: es un día del calendario. Al convertirla, el driver le pega la
 * medianoche EN LA ZONA HORARIA DEL SERVIDOR, y al serializar a JSON sale
 * como "2026-09-03T05:00:00.000Z".
 *
 * Eso rompía dos cosas:
 *
 * 1. En "Mis citas agendadas" el cliente hacía `new Date(fecha + "T12:00:00")`
 *    contando con recibir "2026-09-03". Con el timestamp completo el
 *    resultado era "…000ZT12:00:00" → Invalid Date, que es lo que se veía
 *    literalmente en la tarjeta. (`toLocaleDateString` sobre una fecha
 *    inválida DEVUELVE el texto "Invalid Date"; no lanza, así que el
 *    try/catch de alrededor nunca saltaba.)
 *
 * 2. Peor, y todavía sin dar la cara: hoy sale bien de casualidad porque el
 *    servidor corre en UTC-5 y la medianoche local cae dentro del mismo día
 *    en UTC. Si el servidor arrancara en UTC —un contenedor recién desplegado
 *    lo hace— el 2026-09-03 se serializaría como "…T00:00:00.000Z" y un
 *    navegador en Colombia lo mostraría como el 2 de septiembre. Una cita
 *    médica corrida un día.
 *
 * Devolver el texto tal cual lo elimina de raíz: no hay zona horaria que
 * aplicar porque no hay instante que construir. 1082 es el OID del tipo
 * `date` en Postgres.
 */
types.setTypeParser(1082, (valor) => valor);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Tuning de rendimiento (pt 14) — valores seguros
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err);
});

module.exports = { pool };