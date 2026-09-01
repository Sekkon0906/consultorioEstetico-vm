require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

/**
 * Cliente de Supabase con la clave de servicio.
 *
 * SE CREA BAJO DEMANDA, no al importar. Antes este archivo lanzaba en el
 * `require` si faltaban las variables, así que el servidor entero no
 * arrancaba sin Supabase — incluso para servir rutas que no lo tocan.
 * Como la autenticación propia (/auth2) y el resto de la API hablan con
 * Postgres directo, esa dependencia dura ya no tiene sentido: el día que se
 * apague Supabase, el backend debe seguir en pie.
 *
 * Ahora el error aparece solo si algo intenta USAR Supabase sin
 * configuración, con un mensaje que dice qué hacer.
 *
 * Se expone un objeto con la misma forma que el cliente real (`auth.getUser`,
 * `storage`, `from`) para no tocar quien ya lo usa.
 */

let clienteReal = null;

function obtenerCliente() {
  if (clienteReal) return clienteReal;

  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !clave) {
    throw new Error(
      "Se intentó usar Supabase pero faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
      "Si ya migraste fuera de Supabase, la ruta que llamó aquí todavía apunta al " +
      "camino viejo y hay que moverla a la API propia."
    );
  }

  clienteReal = createClient(url, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return clienteReal;
}

/** true si hay configuración de Supabase. Permite decidir sin provocar el error. */
function supabaseDisponible() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Fachada perezosa: cada propiedad se resuelve contra el cliente real en el
// momento en que se lee, no al importar el módulo.
const supabase = {
  get auth()    { return obtenerCliente().auth; },
  get storage() { return obtenerCliente().storage; },
  from(...args) { return obtenerCliente().from(...args); },
  rpc(...args)  { return obtenerCliente().rpc(...args); },
};

module.exports = supabase;
module.exports.supabaseDisponible = supabaseDisponible;
module.exports.obtenerCliente = obtenerCliente;
