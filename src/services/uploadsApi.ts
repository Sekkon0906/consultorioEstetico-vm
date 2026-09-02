/**
 * Subida de imágenes al almacenamiento (R2), vía la API propia.
 * Antes cada lista de admin subía directo a Supabase Storage con la anon key.
 */

import { apiAuth } from "@/lib/apiCliente";

export type CarpetaImagen =
  | "procedimientos"
  | "testimonios"
  | "charlas"
  | "imagenesPublicas"
  | "logo";

/** Sube un archivo y devuelve su URL pública. */
export async function subirImagenApi(file: File, carpeta: CarpetaImagen): Promise<string> {
  const fd = new FormData();
  fd.append("carpeta", carpeta);
  fd.append("archivo", file);
  return apiAuth<string>("/uploads/imagen", { method: "POST", body: fd, clave: "url" });
}
