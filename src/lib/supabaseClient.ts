import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno."
  );
}

/**
 * Lock pass-through.
 *
 * Por defecto supabase-js usa `navigator.locks` para coordinar el token de
 * auth. En Next.js (App Router), al navegar entre páginas sin recargar, ese
 * lock puede quedar bloqueado y TODAS las consultas (incluso públicas) se
 * quedan colgadas en "Cargando..." hasta hacer F5. Sustituirlo por un lock
 * que simplemente ejecuta la función elimina el deadlock. La app usa una sola
 * pestaña/cliente, así que no se pierde coordinación real.
 */
const passThroughLock = <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: passThroughLock,
  },
});
