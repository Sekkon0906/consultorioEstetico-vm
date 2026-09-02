import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clínica Dra. Vanessa Medina",
    short_name: "Dra. Vanessa Medina",
    description:
      "Medicina estética y antienvejecimiento en Ibagué — Tolima.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#B08968",
    orientation: "portrait",
    icons: [
      {
        src: "https://pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev/ConsultorioImagenes/Logo/LogoJM.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
    categories: ["medical", "health", "lifestyle"],
    lang: "es-CO",
  };
}
