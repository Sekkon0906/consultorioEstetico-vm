/**
 * Permiso para correos comerciales.
 *
 * Solo gobierna promociones y fidelidad. Los correos del servicio —cita
 * confirmada, recordatorio, reagenda, contraseña— se envían igual: los pidió
 * quien pidió una cita, y sin ellos la cita no funciona.
 */

import { apiFetch, apiAuth } from "@/lib/apiCliente";

/** Cambia la preferencia desde el perfil. Requiere sesión. */
export async function fijarMarketingApi(acepta: boolean): Promise<void> {
  await apiAuth("/usuarios/me/marketing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acepta }),
  });
}

/**
 * Baja desde el enlace del correo. NO requiere sesión, a propósito: quien
 * está harto de recibir correos no va a buscar su contraseña para dejar de
 * recibirlos, y exigirle sesión equivale a no ofrecerle la baja.
 *
 * El servidor responde lo mismo con firma buena o mala, así que aquí no hay
 * forma —ni falta— de distinguirlas: se dice que quedó hecho.
 */
export async function darDeBajaApi(u: string, f: string): Promise<void> {
  await apiFetch("/usuarios/baja-correos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ u, f }),
  });
}
