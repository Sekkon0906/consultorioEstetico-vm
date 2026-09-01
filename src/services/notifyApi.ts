// Cliente ligero para disparar notificaciones por correo tras una mutación.
// Best-effort: si falla (sin sesión, red, etc.) no rompe el flujo principal.

import { obtenerToken } from "@/lib/sesion";

async function postNotify(evento: "nueva" | "estado", citaId: string | number): Promise<void> {
  try {
    // El token sale de lib/sesion, que sabe si viene de la sesión propia o
    // de Supabase. Este archivo ya no necesita saberlo.
    const token = await obtenerToken();
    if (!token) return;

    await fetch("/api/citas/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ evento, citaId: String(citaId) }),
    });
  } catch {
    /* notificación complementaria: se ignora cualquier error */
  }
}

/** Avisa a la doctora que se agendó una nueva cita. */
export const notificarNuevaCita = (citaId: string | number) => postNotify("nueva", citaId);

/** Avisa al paciente que su cita cambió de estado. */
export const notificarCambioEstado = (citaId: string | number) => postNotify("estado", citaId);
