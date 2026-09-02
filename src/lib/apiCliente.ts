/**
 * Cliente HTTP de la API propia. Capa compartida por todos los servicios.
 *
 * Antes cada servicio hablaba con Supabase por su cuenta y, al migrarlos, cada
 * uno iba a repetir el mismo `fetch` con su manejo de errores y su forma de
 * adjuntar el token. Esa repetición es la que hace que un día uno de ellos se
 * quede sin el `credentials: "include"` y falle solo en producción.
 *
 * Aquí está una vez: la URL base, las cabeceras, el token y el desempaquetado
 * de la respuesta.
 *
 * SOBRE EL ENVOLTORIO DE LA RESPUESTA
 * La API no es del todo consistente: unos endpoints devuelven { ok, data },
 * otros { ok, testimonios }, otros { ok, citas }. Se soporta con el parámetro
 * `clave` en vez de reescribir todas las rutas del backend de golpe, que es un
 * cambio que rompería el panel mientras se hace. Uniformarlo queda pendiente y
 * anotado; mientras tanto, la irregularidad vive aquí y no en cada servicio.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ErrorApi extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

interface Opciones extends RequestInit {
  /** Clave del cuerpo donde viene el resultado. Por defecto "data". */
  clave?: string;
  /** Si adjunta el token de sesión. */
  autenticado?: boolean;
}

export async function apiFetch<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { clave = "data", autenticado = false, headers, ...resto } = opciones;

  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (autenticado) {
    // Import dinámico: mantiene la lógica de sesión fuera del bundle de las
    // páginas públicas que solo hacen lecturas sin token.
    const { cabecerasAuth } = await import("./sesion");
    Object.assign(cabeceras, await cabecerasAuth());
  }

  const res = await fetch(`${API}${ruta}`, {
    ...resto,
    headers: cabeceras,
    // La cookie del refresh token viaja en cada petición: sin esto la sesión
    // no sobrevive a recargar la página.
    credentials: "include",
  });

  const cuerpo = await res.json().catch(() => null);

  if (!res.ok || cuerpo?.ok === false) {
    throw new ErrorApi(res.status, cuerpo?.error || `Error ${res.status}`);
  }

  return (cuerpo?.[clave] ?? cuerpo) as T;
}

/** Atajo para peticiones que exigen sesión. */
export function apiAuth<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  return apiFetch<T>(ruta, { ...opciones, autenticado: true });
}
