/**
 * Cliente de sesión. Único sitio del frontend que sabe de dónde sale el token.
 *
 * POR QUÉ EXISTE
 * Había nueve llamadas a `supabase.auth.getSession()` repartidas por el
 * frontend, todas para lo mismo: sacar el token y ponerlo en la cabecera
 * Authorization. Con eso, cambiar de proveedor de autenticación obligaba a
 * tocar nueve archivos y arriesgarse a olvidar uno — y el que se olvide deja
 * a alguien sin poder entrar.
 *
 * Ahora todas preguntan aquí. El día del corte, apagar Supabase Auth es
 * cambiar este archivo y nada más.
 *
 * DÓNDE VIVE EL TOKEN
 * El access token se guarda SOLO en memoria, no en localStorage: lo que está
 * en localStorage lo puede leer cualquier script que se cuele en la página.
 * Al recargar se pide uno nuevo con el refresh token, que viaja en una cookie
 * httpOnly — inaccesible para el JavaScript de la página por definición.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface UsuarioSesion {
  id: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  rol: string;
  photo?: string | null;
  telefono?: string | null;
}

/** Solo en memoria, a propósito. Ver la nota de arriba. */
let accessToken: string | null = null;
let usuarioActual: UsuarioSesion | null = null;
/** Evita que varias peticiones simultáneas disparen varios refresh a la vez. */
let refrescoEnCurso: Promise<string | null> | null = null;

function guardarSesion(datos: { accessToken?: string; usuario?: UsuarioSesion }) {
  if (datos.accessToken) accessToken = datos.accessToken;
  if (datos.usuario) usuarioActual = datos.usuario;
}

export function limpiarSesionLocal() {
  accessToken = null;
  usuarioActual = null;
}

export function usuarioEnMemoria(): UsuarioSesion | null {
  return usuarioActual;
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...opciones,
    // Imprescindible: sin esto el navegador no manda ni recibe la cookie del
    // refresh token, y la sesión no sobreviviría a recargar la página.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opciones.headers || {}) },
  });
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cuerpo?.error || `Error ${res.status}`);
  return cuerpo as T;
}

/**
 * Renueva el access token usando la cookie de refresh.
 * Si ya hay un refresco en curso se devuelve el mismo, para que diez
 * peticiones simultáneas no disparen diez renovaciones (y, peor, no roten el
 * refresh token diez veces invalidándose entre ellas).
 */
async function refrescar(): Promise<string | null> {
  if (refrescoEnCurso) return refrescoEnCurso;

  refrescoEnCurso = (async () => {
    try {
      const r = await pedir<{ ok: boolean; accessToken: string; usuario: UsuarioSesion }>(
        "/auth2/refresh",
        { method: "POST" }
      );
      guardarSesion(r);
      return r.accessToken;
    } catch {
      limpiarSesionLocal();
      return null;
    } finally {
      refrescoEnCurso = null;
    }
  })();

  return refrescoEnCurso;
}

/**
 * El token para la cabecera Authorization.
 * Este es el reemplazo de las nueve llamadas a supabase.auth.getSession().
 */
export async function obtenerToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  // ¿Hay cookie de refresh válida? Si no, no hay sesión.
  return refrescar();
}

/** Cabeceras listas para una petición autenticada. */
export async function cabecerasAuth(): Promise<Record<string, string>> {
  const token = await obtenerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Acciones de sesión ──────────────────────────────────────────────────────

export async function iniciarSesion(email: string, password: string) {
  const r = await pedir<{ ok: boolean; accessToken: string; usuario: UsuarioSesion }>(
    "/auth2/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  guardarSesion(r);
  return r.usuario;
}

export async function registrar(datos: {
  email: string; password: string;
  nombres?: string; apellidos?: string; telefono?: string;
  edad?: number | string; genero?: string;
  antecedentes?: string; antecedentesDescripcion?: string;
  alergias?: string; alergiasDescripcion?: string;
  medicamentos?: string; medicamentosDescripcion?: string;
}) {
  return pedir<{ ok: boolean; usuario: UsuarioSesion; mensaje: string }>(
    "/auth2/registro",
    { method: "POST", body: JSON.stringify(datos) }
  );
}

export async function cerrarSesion() {
  try {
    await pedir("/auth2/logout", { method: "POST" });
  } catch {
    // Cerrar sesión no debe fallar de cara al usuario: si el servidor no
    // responde, igual se limpia lo local y se sale.
  }
  limpiarSesionLocal();
}

export async function solicitarRecuperacion(email: string) {
  return pedir<{ ok: boolean; mensaje: string }>("/auth2/recuperar", {
    method: "POST", body: JSON.stringify({ email }),
  });
}

export async function restablecerPassword(token: string, password: string) {
  return pedir<{ ok: boolean }>("/auth2/recuperar/confirmar", {
    method: "POST", body: JSON.stringify({ token, password }),
  });
}

export async function verificarEmail(token: string) {
  return pedir<{ ok: boolean }>("/auth2/verificar", {
    method: "POST", body: JSON.stringify({ token }),
  });
}

/** Manda al usuario a elegir su cuenta de Google. Es una navegación real,
 *  no fetch: el servidor responde con una redirección a Google. */
export function entrarConGoogle(volverA = "/") {
  window.location.href = `${API}/auth2/google?volverA=${encodeURIComponent(volverA)}`;
}

/**
 * Al volver de Google, el access token llega en el fragmento de la URL
 * (#access_token=...). Se recoge y se limpia de la barra de direcciones para
 * que no quede en el historial ni se comparta al copiar el enlace.
 */
export function recogerTokenDeUrl(): boolean {
  if (typeof window === "undefined" || !window.location.hash) return false;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (!token) return false;

  accessToken = token;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

/** ¿Está lista la autenticación propia en el servidor? */
export async function estadoAuth() {
  return pedir<{ ok: boolean; data: { google: boolean; correo: boolean; jwt: boolean } }>(
    "/auth2/estado"
  );
}
