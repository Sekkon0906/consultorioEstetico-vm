// app/src/lib/configuracion.ts
//
// Configuración editable del consultorio. Sustituye los valores que hoy están
// escritos a mano en Footer, agendarPago, FirmaConsentimiento y las páginas
// legales.
//
// Los DEFAULTS son los valores actuales del código: si la API no responde, el
// sitio se pinta igual que hoy en vez de mostrar huecos vacíos.

export type ConfigSitio = Record<string, string>;

export const CONFIG_DEFAULTS: ConfigSitio = {
  contacto_whatsapp:          "573155445748",
  contacto_telefono_visible:  "+57 315 544 5748",
  contacto_email:             "dra.vanessamedinao@gmail.com",
  contacto_instagram:         "https://www.instagram.com/dravanessamedinao28/",
  contacto_facebook:          "",
  contacto_tiktok:            "",

  ubicacion_direccion:        "Carrera 5ta #11-24",
  ubicacion_edificio:         "Edificio Torre Empresarial",
  ubicacion_consultorio:      "Consultorio 502",
  ubicacion_ciudad:           "Ibagué",
  ubicacion_departamento:     "Tolima",
  ubicacion_pais:             "Colombia",
  ubicacion_maps_lat:         "",
  ubicacion_maps_lng:         "",

  horario_texto:              "Lunes a Sábado, 9:00 a.m. - 6:00 p.m.",
  horario_hora_apertura:      "09:00",
  horario_hora_cierre:        "18:00",

  legal_razon_social:         "Julieth Vanessa Medina Orjuela",
  legal_nit:                  "",
  legal_registro_profesional: "",
  legal_tarjeta_profesional:  "",

  marca_nombre:               "Dra. Julieth Vanessa Medina Orjuela",
  marca_especialidad:         "Medicina Estética y Antienvejecimiento",
  marca_promocion_activa:     "false",
  marca_promocion_texto:      "",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Lee la configuración desde la API. Pensada para Server Components, donde
 * `revalidate` deja el resultado cacheado unos minutos: son datos que cambian
 * pocas veces al año y los pide cada página del sitio.
 */
export async function getConfig(): Promise<ConfigSitio> {
  try {
    const res = await fetch(`${BASE_URL}/configuracion`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return CONFIG_DEFAULTS;
    const json = await res.json();
    if (!json?.ok || !json.data) return CONFIG_DEFAULTS;
    // Los defaults van primero: una clave nueva en el código sigue teniendo
    // valor aunque la migración todavía no se haya corrido en ese entorno.
    return { ...CONFIG_DEFAULTS, ...json.data };
  } catch {
    return CONFIG_DEFAULTS;
  }
}

// ── Derivados de uso frecuente ───────────────────────────────────────────────

/** Dirección completa en una línea, saltando las partes vacías. */
export function direccionCompleta(c: ConfigSitio): string {
  return [
    c.ubicacion_direccion,
    c.ubicacion_edificio,
    c.ubicacion_consultorio,
    [c.ubicacion_ciudad, c.ubicacion_departamento].filter(Boolean).join(" - "),
  ]
    .filter((p) => p && p.trim())
    .join(". ");
}

/** Enlace de WhatsApp con mensaje opcional ya codificado. */
export function enlaceWhatsApp(c: ConfigSitio, texto?: string): string {
  const numero = (c.contacto_whatsapp || "").replace(/\D/g, "");
  const base = `https://wa.me/${numero}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** Redes sociales configuradas, en orden y sin las vacías. */
export function redesSociales(c: ConfigSitio): { nombre: string; href: string; icon: string }[] {
  return [
    { nombre: "Instagram", href: c.contacto_instagram, icon: "fab fa-instagram" },
    { nombre: "Facebook",  href: c.contacto_facebook,  icon: "fab fa-facebook" },
    { nombre: "TikTok",    href: c.contacto_tiktok,    icon: "fab fa-tiktok" },
    { nombre: "WhatsApp",  href: enlaceWhatsApp(c),    icon: "fab fa-whatsapp" },
  ].filter((r) => r.href && r.href.trim());
}
