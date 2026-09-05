/**
 * Comprueba que la clave del copiloto funciona, sin pasar por el panel.
 *
 * PARA QUÉ
 * Cuando el asistente no responde, el fallo puede estar en cinco sitios: no
 * hay clave, la clave es inválida, el modelo no existe, la cuenta no tiene
 * saldo, o el panel no está llegando al servidor. Desde la interfaz todos se
 * ven igual —"no responde"— y hay que adivinar.
 *
 * Esto los separa: dice de dónde sale la clave, hace UNA llamada mínima real,
 * y traduce el error a lenguaje llano.
 *
 * NUNCA IMPRIME LA CLAVE
 * Ni entera ni en trozos. Sí dice cuántos caracteres tiene y de qué fuente
 * viene, que es lo que hace falta para saber si está leyendo la que crees.
 *
 * USO
 *   node server/scripts/probar-copiloto.js
 *
 * CUESTA DINERO, MUY POCO
 * Una llamada de unas 30 fichas de entrada y 10 de salida. Con Haiku 4.5
 * ($1 por millón de entrada) son menos de cinco milésimas de centavo. Pero es
 * una llamada real: si la cuenta no tiene saldo, este script lo dirá.
 */

/* La ruta del `.env` va explicita. `dotenv` lo busca por defecto en el
   directorio DESDE EL QUE se ejecuta, asi que corriendo esto desde la raiz del
   repositorio no encontraba `server/.env` y el script decia "no hay clave"
   teniendo una puesta: justo el diagnostico equivocado que viene a evitar. */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const Anthropic = require("@anthropic-ai/sdk");
const { pool } = require("../src/lib/db");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

function linea(etiqueta, valor) {
  console.log(`  ${etiqueta.padEnd(26)} ${valor}`);
}

/**
 * Mismo orden que usa el copiloto: primero la que la doctora guardó cifrada
 * desde el panel, y si no hay, la del entorno. Se replica aquí a propósito en
 * vez de importarla: si algún día las dos se separan, esta prueba dejaría de
 * comprobar lo que el copiloto usa de verdad, y este script existe justo para
 * detectar esa clase de desajuste.
 */
async function resolverClave() {
  if (process.env.SECRETS_ENCRYPTION_KEY) {
    try {
      const { rows } = await pool.query(
        `select pgp_sym_decrypt(api_key_cifrada, $1) as clave
           from integraciones_ia where proveedor = 'anthropic'`,
        [process.env.SECRETS_ENCRYPTION_KEY]
      );
      if (rows[0]?.clave) return { clave: rows[0].clave, origen: "panel (cifrada en la base)" };
    } catch (err) {
      console.log(`  ⚠ No se pudo leer la clave guardada: ${err.message}`);
      console.log("    Suele ser que SECRETS_ENCRYPTION_KEY no es la misma con la que se guardó.");
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { clave: process.env.ANTHROPIC_API_KEY, origen: "variable de entorno del servidor" };
  }
  return { clave: null, origen: null };
}

(async () => {
  console.log("\n── Copiloto: comprobación de la clave ──────────────────────\n");

  const { clave, origen } = await resolverClave();

  linea("Modelo configurado", MODELO);
  linea("SECRETS_ENCRYPTION_KEY", process.env.SECRETS_ENCRYPTION_KEY ? "presente" : "ausente");

  if (!clave) {
    console.log("\n✖ No hay ninguna clave.\n");
    console.log("  Dos formas de ponerla:\n");
    console.log("  1) En el servidor (Railway → Variables):");
    console.log("       ANTHROPIC_API_KEY=sk-ant-...\n");
    console.log("  2) Desde el panel, si SECRETS_ENCRYPTION_KEY está puesta:");
    console.log("       Administrar → Asistente → pegar la clave.\n");
    console.log("  Se saca en console.anthropic.com → API Keys.\n");
    await pool.end();
    process.exit(1);
  }

  linea("Clave encontrada en", origen);
  linea("Longitud", `${clave.length} caracteres`);
  /* El prefijo sí se enseña: no es secreto y distingue una clave normal de una
     de administración, que es un error de copiar y pegar sorprendentemente
     común y que da un 401 idéntico. */
  linea("Empieza por", clave.slice(0, 7) + "…");

  if (!clave.startsWith("sk-ant-")) {
    console.log("\n  ⚠ Una clave de Anthropic empieza por 'sk-ant-'. Esta no.");
  }
  if (clave.startsWith("sk-ant-admin")) {
    console.log("\n  ⚠ Esto parece una clave de ADMINISTRACIÓN, no de API.");
    console.log("    Las de administración no sirven para conversar; dan 401.");
  }

  console.log("\n  Haciendo una llamada real…\n");

  try {
    const api = new Anthropic({ apiKey: clave });
    const t0 = Date.now();
    const r = await api.messages.create({
      model: MODELO,
      max_tokens: 16,
      messages: [{ role: "user", content: "Responde solo: listo" }],
    });
    const ms = Date.now() - t0;

    const texto = r.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();

    console.log("✔ LA CLAVE FUNCIONA.\n");
    linea("Respondió", JSON.stringify(texto));
    linea("Modelo que respondió", r.model);
    linea("Fichas", `${r.usage.input_tokens} de entrada, ${r.usage.output_tokens} de salida`);
    linea("Tardó", `${ms} ms`);
    console.log("\n  El asistente del panel debería funcionar ya.\n");
  } catch (err) {
    console.log("✖ LA LLAMADA FALLÓ.\n");
    /* Se traduce el error en vez de volcarlo tal cual: el mensaje de la API es
       correcto pero no dice qué hacer, y quien corre esto quiere saber qué
       tocar, no qué pasó. */
    if (err instanceof Anthropic.AuthenticationError) {
      console.log("  La clave no es válida (401).");
      console.log("  Suele ser: se copió incompleta, se revocó, o es de otra cuenta.");
    } else if (err instanceof Anthropic.NotFoundError) {
      console.log(`  El modelo "${MODELO}" no existe o tu cuenta no lo tiene (404).`);
      console.log("  Revisa ANTHROPIC_MODEL. Valores buenos hoy: claude-haiku-4-5,");
      console.log("  claude-sonnet-5, claude-opus-5.");
    } else if (err instanceof Anthropic.RateLimitError) {
      console.log("  Límite de peticiones (429). La clave es válida.");
      console.log("  Espera un momento y vuelve a intentarlo.");
    } else if (err instanceof Anthropic.BadRequestError) {
      console.log(`  La petición no es válida (400): ${err.message}`);
      console.log("  Si menciona 'credit balance', la cuenta no tiene saldo.");
    } else if (err instanceof Anthropic.APIConnectionError) {
      console.log("  No se pudo llegar a la API. Revisa la conexión o el proxy.");
    } else {
      console.log(`  ${err?.status ? `HTTP ${err.status}: ` : ""}${err.message}`);
    }
    console.log("");
    await pool.end();
    process.exit(1);
  }

  await pool.end();
})().catch((e) => {
  console.error("\n✖ Error inesperado:", e.message, "\n");
  process.exit(1);
});
