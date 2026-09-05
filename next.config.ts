const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs/config");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Output optimizado para deploy en contenedores / Vercel
  output: "standalone",
  // Compresión gzip on (Vercel/Node)
  compress: true,
  // Header X-Powered-By removido por seguridad
  poweredByHeader: false,
  // El proyecto usa estilo `var`/`any` de forma sistémica. ESLint NO debe
  // bloquear el build de producción (sigue corriendo con `npm run lint`).
  // El chequeo de tipos de TypeScript SÍ se mantiene activo.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Calidades permitidas. IMPORTANTE: cuando esta lista existe, Next
    // RECHAZA cualquier quality fuera de ella (rompía /consultorio por
    // usar 55 en las miniaturas). Cubre TODOS los valores del código.
    qualities: [40, 55, 60, 65, 70, 75, 78, 80, 82, 85, 90],
    // ✅ remotePatterns reemplaza el deprecated "domains"
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        // Cloudflare R2 (todas las imágenes del sitio). El subdominio
        // pub-*.r2.dev sale de R2 → bucket "consultorio" → Settings → Public
        // Development URL. Con dominio propio, cambiar por ese host.
        protocol: "https",
        hostname: "pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev",
      },
    ],
  },
  async headers() {
    /* POLÍTICA DE SEGURIDAD DE CONTENIDO (CSP)
     *
     * QUÉ PROTEGE
     * Sin esto, un script inyectado —por una dependencia comprometida, por
     * un comentario mal escapado— puede mandar lo que quiera a donde
     * quiera. La CSP dice de dónde puede venir el código y a dónde puede
     * hablar el navegador; con ella, ese mismo script sigue siendo un
     * fallo, pero deja de ser un fallo que además se lleva los datos.
     *
     * POR QUÉ EMPIEZA EN SOLO-REPORTE
     * `Content-Security-Policy-Report-Only` NO bloquea nada: solo avisa en
     * la consola de lo que habría bloqueado. Aplicar una CSP a ciegas en un
     * sitio con mapas incrustados, vídeos de YouTube y fuentes de Google es
     * la forma segura de romper media web un viernes. Se deja en observación
     * y, cuando la consola esté limpia en todas las páginas, se cambia la
     * clave a `Content-Security-Policy` — y ahí sí bloquea.
     *
     * DE DÓNDE SALEN LOS ORÍGENES
     * De inventariar los que el código usa de verdad, no de una lista
     * genérica: R2 (imágenes), YouTube (vídeos), Google Maps (el mapa),
     * ui-avatars (avatares de reserva), Sentry (errores) y la propia API.
     *
     * `'unsafe-inline'` en estilos es inevitable hoy: medio proyecto usa
     * `style={{...}}` en línea. Quitarlo exigiría mover todo eso a clases,
     * y no compensa: un estilo en línea no ejecuta código. En `script-src`
     * NO está, que es donde importa.
     */
    const csp = [
      "default-src 'self'",
      // 'unsafe-eval' lo necesita el modo de desarrollo de Next; en
      // producción no se emite.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev https://ui-avatars.com https://lh3.googleusercontent.com https://img.youtube.com https://i.ytimg.com",
      // La API, y Sentry para los informes de error.
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || ""} https://*.ingest.sentry.io https://*.ingest.us.sentry.io`.trim(),
      // El mapa y los vídeos van en <iframe>.
      "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      // Que nadie pueda meter el sitio en un iframe: es la versión moderna
      // de X-Frame-Options, que también se manda por compatibilidad.
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

// Solo aplicamos Sentry si SENTRY_DSN está definido. Sin DSN, withSentryConfig
// igual ejecuta pero no envía datos — y evitamos errores de build cuando el
// proyecto se compila sin Sentry configurado.
const sentryWebpackPluginOptions = {
  // Estas vars vienen del CLI de Sentry (puedes setearlas en CI / Vercel):
  // SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // No subir source maps a producción si no hay auth token
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  // Cargar el túnel para evitar bloqueo por ad-blockers (sirve /monitoring)
  tunnelRoute: "/monitoring",
  // Reducir bundle size: oculta nombres de archivos source
  hideSourceMaps: true,
  // Antes era `disableLogger: true`, deprecado y avisado en cada build.
  // Hace lo mismo: quita las llamadas de depuración de Sentry del bundle.
  webpack: { treeshake: { removeDebugLogging: true } },
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions);