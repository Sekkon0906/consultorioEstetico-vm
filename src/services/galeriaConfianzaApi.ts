import { apiFetch, apiAuth } from "@/lib/apiCliente";

/**
 * Galería de la sección "Por qué confiarme" — bioseguridad, esterilización
 * y equipos. Sustituye al vídeo de presentación.
 */
export interface FotoConfianza {
  id: number;
  url: string;
  titulo: string;
  descripcion: string;
  orden: number;
}

/** Lectura pública: la pinta la home. */
export async function getGaleriaConfianzaApi(): Promise<FotoConfianza[]> {
  return apiFetch<FotoConfianza[]>("/galeria-confianza", { clave: "data" });
}

/** Añade una foto al final de la galería. Admin. */
export async function addFotoConfianzaApi(datos: {
  url: string;
  titulo?: string;
  descripcion?: string;
}): Promise<FotoConfianza> {
  return apiAuth<FotoConfianza>("/galeria-confianza", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Cambia el pie o el orden de una foto. Admin. */
export async function updateFotoConfianzaApi(
  id: number,
  datos: { titulo?: string; descripcion?: string; orden?: number }
): Promise<FotoConfianza> {
  return apiAuth<FotoConfianza>(`/galeria-confianza/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

/** Quita una foto de la galería. Admin. */
export async function deleteFotoConfianzaApi(id: number): Promise<void> {
  await apiAuth(`/galeria-confianza/${id}`, { method: "DELETE" });
}
