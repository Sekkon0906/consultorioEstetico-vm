// Sentry — inicialización del cliente (browser).
// Cargado automáticamente por @sentry/nextjs cuando el archivo
// está en la raíz del proyecto.
import * as Sentry from "@sentry/nextjs";
import { getConsent } from "@/lib/cookieConsent";

// Instrumenta las navegaciones del App Router (lo pide @sentry/nextjs v10+).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Session Replay graba la interacción del usuario → cuenta como cookie/
// almacenamiento de analítica. Solo se activa si el usuario dio
// consentimiento de "analytics". El reporte de errores en sí (sin replay)
// es diagnóstico esencial para mantener el sitio funcionando.
function buildReplay() {
  return Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true });
}

if (SENTRY_DSN) {
  const analyticsAllowed = getConsent().analytics;

  Sentry.init({
    dsn: SENTRY_DSN,
    // Solo en producción. Antes solo se ETIQUETABA el entorno, pero se
    // enviaba igual: un error de compilación mientras alguien programa en
    // su portátil llegaba al mismo proyecto que los de la doctora, gastaba
    // cupo del plan gratuito y mandaba correo de alerta. Los errores de
    // desarrollo ya se ven en la terminal y en la consola del navegador.
    enabled: process.env.NODE_ENV === "production",
    // Sample muy bajo en performance para no llenar el cupo gratuito
    tracesSampleRate: 0.1,
    // Replay solo cuando hay error — útil para depurar UX
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    environment: process.env.NODE_ENV,
    // No mandar PII salvo lo que tú permitas explícitamente
    sendDefaultPii: false,
    // Ignora errores comunes que ensucian los reportes
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed",
      "Non-Error promise rejection captured",
      // Errores de extensiones de navegador
      /chrome-extension/i,
      /moz-extension/i,
    ],
    // Replay SOLO con consentimiento de analítica.
    integrations: analyticsAllowed ? [buildReplay()] : [],
  });

  // Si el usuario acepta las cookies de analítica más tarde, activamos el
  // Replay sin necesidad de recargar la página.
  if (typeof window !== "undefined") {
    let replayActive = analyticsAllowed;
    window.addEventListener("cookie-consent-changed", (e: Event) => {
      const detail = (e as CustomEvent).detail as { analytics?: boolean } | undefined;
      const allowed = detail?.analytics ?? getConsent().analytics;
      if (allowed && !replayActive) {
        Sentry.addIntegration(buildReplay());
        replayActive = true;
      }
    });
  }
}
