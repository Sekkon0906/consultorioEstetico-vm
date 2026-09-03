/**
 * Instrumentación de Next.js — Sentry para servidor y edge.
 *
 * Antes esto vivía en tres archivos sueltos en la raíz
 * (`sentry.server.config.ts`, `sentry.edge.config.ts` y
 * `sentry.client.config.ts`). Los dos primeros eran **idénticos línea por
 * línea**, así que se funden aquí: la configuración es la misma y el runtime
 * lo decide `NEXT_RUNTIME`.
 *
 * El del navegador pasó a `instrumentation-client.ts`, que es el nombre que
 * Next.js espera. El nombre viejo estaba deprecado y **deja de funcionar con
 * Turbopack**, que es a donde va Next.js — el build lo avisaba en cada
 * compilación.
 *
 * Resultado: de 4 archivos de instrumentación en la raíz a 2, con los nombres
 * que la herramienta reconoce.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Config común de servidor y edge: era la misma en ambos archivos. */
function iniciarSentry() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    // Igual que en el cliente: en desarrollo no se envía nada. El entorno
    // se etiquetaba pero el evento salía igual, y los errores del dev
    // server acababan en el proyecto de producción.
    enabled: process.env.NODE_ENV === "production",
    // Muestreo bajo para no agotar el cupo gratuito.
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    // Nunca datos personales por defecto: es un consultorio médico.
    sendDefaultPii: false,
  });
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    iniciarSentry();
  }
}

/** Captura errores de Server Actions, RSC y route handlers. */
export const onRequestError = Sentry.captureRequestError;
