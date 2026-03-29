// app/administrar/testimonios/helpers.ts

// Ya no usamos localDB aquí. En su lugar, llamamos a la API real.
import {
  activarTestimonioApi,
  desactivarTestimonioApi,
} from "../../services/testimoniosApi";

/**
 *  Activa un testimonio en la BD real
 */
export async function activarTestimonio(id: number): Promise<void> {
  await activarTestimonioApi(id);
}

/**
 *  Desactiva un testimonio en la BD real
 */
export async function desactivarTestimonio(id: number): Promise<void> {
  await desactivarTestimonioApi(id);
}

/**
 *  Validar URL de video (YouTube o no-cookie)
 */
export function validarVideoURL(url: string): boolean {
  const regex =
    /^(https:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|embed\/)?[\w-]+)/;
  return regex.test(url);
}
