/**
 * Perfil del usuario y cliente HTTP heredado.
 *
 * Antes esto hablaba con Supabase directamente (leía la tabla `usuarios` con la
 * anon key y decidía el rol en el cliente). Ahora pasa por la API propia:
 * `GET/PUT /usuarios/me`, donde `verifyToken` valida la sesión y el rol sale de
 * `admin_users` en el servidor, nunca del cliente.
 */

import { cabecerasAuth } from "./sesion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Resultado = { ok: boolean; user: Record<string, unknown> | null };

/** El perfil del usuario en sesión (incluye ficha médica). */
export async function getCurrentUser(): Promise<Resultado> {
  try {
    const res = await fetch(`${BASE_URL}/usuarios/me`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await cabecerasAuth()) },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok || !body.user) return { ok: false, user: null };
    return { ok: true, user: body.user };
  } catch (err) {
    console.error("Error en getCurrentUser:", err);
    return { ok: false, user: null };
  }
}

/** Actualiza el perfil. Acepta camelCase; el backend mapea a las columnas. */
export async function updateCurrentUser(
  updates: Record<string, unknown>
): Promise<Resultado> {
  try {
    const res = await fetch(`${BASE_URL}/usuarios/me`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await cabecerasAuth()) },
      body: JSON.stringify(updates),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok || !body.user) return { ok: false, user: null };
    return { ok: true, user: body.user };
  } catch (err) {
    console.error("Error en updateCurrentUser:", err);
    return { ok: false, user: null };
  }
}

// ============================================================
// Cliente HTTP heredado. Para nuevas funcionalidades usar
// src/lib/apiCliente.ts (apiFetch / apiAuth).
// ============================================================

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await cabecerasAuth()) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
