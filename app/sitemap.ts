import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://clinicavanessamedina.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const rutas = [
    "",
    "/procedimientos",
    "/agendar",
    "/perfil",
    "/testimonios",
    "/contacto",
    "/terminos",
    "/privacidad",
  ];
  return rutas.map((r) => ({
    url: `${SITE}${r}`,
    lastModified: now,
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : r === "/procedimientos" ? 0.9 : 0.6,
  }));
}
