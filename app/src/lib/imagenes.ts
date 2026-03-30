// app/src/lib/imagenes.ts
const B = "https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/ConsultorioImagenes";

export const IMG = {
  logo: `${B}/logo/LogoJM.jpg`,

  homeCarrusel: [
    `${B}/imagenesPublicas/carrucel_home1.jpg`,
    `${B}/imagenesPublicas/carrucel_home2.jpg`,
    `${B}/imagenesPublicas/carrucel_home3.jpg`,
    `${B}/imagenesPublicas/carrucel_home4.jpg`,
    `${B}/imagenesPublicas/carrucel_home5.jpg`,
    `${B}/imagenesPublicas/carrucel_home6.jpg`,
  ],

  drCarrusel: [
    `${B}/imagenesPublicas/carrucel_dr1.jpg`,
    `${B}/imagenesPublicas/carrucel_dr2.jpg`,
    `${B}/imagenesPublicas/carrucel_dr3.jpg`,
    `${B}/imagenesPublicas/carrucel_dr4.jpg`,
    `${B}/imagenesPublicas/carrucel_dr5.jpg`,
  ],

  previewVideo: `${B}/imagenesPublicas/preview_video.jpg`,

  inspiracion: `${B}/personas/inspiracion_dr.jpg`,
  doctora: `${B}/personas/doctora.jpg`,

  consultorioPrincipal: `${B}/lugar/consultorioPrinci.png`,
  consultorioRelleno: [
    `${B}/lugar/consultorioRelle1.png`,
    `${B}/lugar/consultorioRelle2.png`,
    `${B}/lugar/consultorioRelle3.png`,
    `${B}/lugar/consultorioRelle4.png`,
    `${B}/lugar/consultorioRelle5.png`,
  ],
};