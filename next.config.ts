const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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
        // ✅ Supabase Storage — AGREGA TU PROJECT REF aquí
        // Lo encuentras en: supabase.com → tu proyecto → Settings → API → Project URL
        // Ejemplo: si tu URL es https://abcdefgh.supabase.co → hostname es "abcdefgh.supabase.co"
        protocol: "https",
        hostname: "ibpkihfjripvizismhsk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
  disableLogger: true,
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions);