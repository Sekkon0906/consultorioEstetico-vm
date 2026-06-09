// Caché en memoria, ligero y sin dependencias, para lecturas públicas.
//
// Qué resuelve:
//  - Deduplicación: si varios componentes piden lo mismo a la vez, se hace
//    UNA sola consulta a Supabase y todos comparten la misma promesa.
//  - TTL: el resultado se reutiliza durante `ttlMs` sin volver a pegarle a la
//    base de datos en cada navegación/montaje dentro de la misma sesión.
//
// NO usa cookies ni localStorage: es memoria del runtime del navegador (se
// limpia al recargar). Por eso no afecta la política de cookies/consentimiento.
//
// El admin debe pasar `{ fresh: true }` (o invalidar tras mutar) para ver
// siempre el dato más reciente.

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  opts?: { fresh?: boolean }
): Promise<T> {
  const now = Date.now();

  if (!opts?.fresh) {
    const hit = store.get(key) as Entry<T> | undefined;
    if (hit && hit.expires > now) return hit.value;

    const pending = inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;
  }

  const p = (async () => {
    try {
      const value = await fetcher();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Invalida todas las entradas cuya clave empiece por `prefix`. */
export function invalidate(prefix: string): void {
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
