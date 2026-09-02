// src/lib/imagenes.ts
// Imágenes públicas del sitio. Ahora se sirven desde Cloudflare R2.
// El subdominio pub-*.r2.dev sale de R2 → bucket "consultorio" → Settings →
// Public Development URL. Con dominio propio, cambiar solo esta constante.
const B = "https://pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev/ConsultorioImagenes";

export const IMG = {
  logo: `${B}/Logo/LogoJM.jpg`,

  homeCarrusel: [
    `${B}/ImagenesPublicas/carrucel_home1.jpg`,
    `${B}/ImagenesPublicas/carrucel_home2.jpg`,
    `${B}/ImagenesPublicas/carrucel_home3.jpg`,
    `${B}/ImagenesPublicas/carrucel_home4.jpg`,
    `${B}/ImagenesPublicas/carrucel_home5.jpg`,
    `${B}/ImagenesPublicas/carrucel_home6.jpg`,
  ],

  drCarrusel: [
    `${B}/ImagenesPublicas/carrucel_dr1.jpg`,
    `${B}/ImagenesPublicas/carrucel_dr2.jpg`,
    `${B}/ImagenesPublicas/carrucel_dr3.jpg`,
    `${B}/ImagenesPublicas/carrucel_dr4.jpg`,
    `${B}/ImagenesPublicas/carrucel_dr5.jpg`,
  ],

  previewVideo: `${B}/ImagenesPublicas/preview_video.jpg`,
  heroDoctora: `${B}/ImagenesPublicas/doctora-hero.jpg`,
  galeria3dBg: `${B}/ImagenesPublicas/Galeriaa3D.jpg`,

  inspiracion: `${B}/Personas/inspiracion_dr.jpg`,
  doctora: `${B}/Personas/doctora.jpg`,

  consultorioPrincipal: `${B}/Lugar/consultorioPrinci.png`,
  consultorioRelleno: [
    `${B}/Lugar/consultorioRelle1.png`,
    `${B}/Lugar/consultorioRelle2.png`,
    `${B}/Lugar/consultorioRelle3.png`,
    `${B}/Lugar/consultorioRelle4.png`,
    `${B}/Lugar/consultorioRelle5.png`,
  ],
};
