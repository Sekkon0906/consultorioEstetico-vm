// Cliente ligero para disparar notificaciones por correo tras una mutación.
// Best-effort: si falla (sin sesión, red, etc.) no rompe el flujo principal.

import { supabase } from "@/lib/supabaseClient";

async function postNotify(evento: "nueva" | "estado", citaId: string | number): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
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
