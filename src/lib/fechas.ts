/**
 * Fechas de calendario (la fecha de una cita, de una charla).
 *
 * Una fecha de cita NO es un instante: es un día del calendario. Tratarla
 * como instante es lo que produce los dos fallos clásicos, y los dos se
 * habían dado ya en este proyecto:
 *
 * - **"Invalid Date" en pantalla.** El patrón repartido por el código era
 *   `new Date(fecha + "T12:00:00")`, que asume recibir "2026-09-03". Cuando
 *   el backend mandaba el timestamp completo, quedaba
 *   "2026-09-03T05:00:00.000ZT12:00:00" → fecha inválida. Y no saltaba
 *   ningún try/catch, porque `toLocaleDateString` sobre una fecha inválida
 *   **devuelve el texto "Invalid Date"** en vez de lanzar.
 *
 * - **El día corrido.** Construir la fecha a medianoche y luego formatearla
 *   en otra zona horaria la mueve al día anterior. Por eso aquí se ancla al
 *   mediodía: ninguna zona horaria del mundo tiene doce horas de desfase,
 *   así que el día del calendario se conserva.
 *
 * El origen está arreglado —`server/src/lib/db.js` devuelve las columnas
 * `date` como texto "YYYY-MM-DD"— pero esta función acepta las dos formas.
 * Una paciente no debería ver "Invalid Date" porque un endpoint nuevo
 * serialice distinto.
 */

/** Convierte lo que llegue a un Date anclado al mediodía, o null si no es una fecha. */
export function aFechaLocal(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  // Se queda con "YYYY-MM-DD", venga solo o dentro de un timestamp completo.
  const soloDia = String(fecha).slice(0, 10);
  const d = new Date(soloDia + "T12:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha de calendario. Si no se puede interpretar, devuelve el
 * valor original en vez de "Invalid Date": un dato en bruto es feo, pero
 * "Invalid Date" parece que la aplicación se rompió.
 */
export function formatearFecha(
  fecha: string | null | undefined,
  locale: string,
  opciones: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const d = aFechaLocal(fecha);
  if (!d) return fecha ? String(fecha) : "";
  return d.toLocaleDateString(locale, opciones);
}
