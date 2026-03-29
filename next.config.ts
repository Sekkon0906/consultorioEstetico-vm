/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
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
        // ✅ Supabase Storage — AGREGA TU PROJECT REF aquí
        // Lo encuentras en: supabase.com → tu proyecto → Settings → API → Project URL
        // Ejemplo: si tu URL es https://abcdefgh.supabase.co → hostname es "abcdefgh.supabase.co"
        protocol: "https",
        hostname: "ibpkihfjripvizismhsk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;