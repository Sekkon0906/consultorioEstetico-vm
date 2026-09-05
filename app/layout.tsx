import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

// Fuentes con display: swap → texto visible inmediatamente con fallback,
// luego se intercambia cuando descarga la web font (sin FOIT).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
  preload: true,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import NavbarClient from "@/components/NavbarClient";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import QuickAccessFab from "@/components/QuickAccessFab";
import { AuthProvider } from "@/context/AuthContext";
import { CarritoProvider } from "@/context/CarritoContext";
import { IMG } from "@/lib/imagenes";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://clinicavanessamedina.com";

// Sin esta etiqueta, los navegadores móviles asumen un ancho de 980px y
// "alejan el zoom": la página se ve extensa y sin responsive en el celular.
// width=device-width hace que el layout use el ancho real del dispositivo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dra. Vanessa Medina · Consultorio",
    template: "%s · Dra. Vanessa Medina",
  },
  description:
    "Especialista en Medicina Estética, Nutrición y Antiedad en Ibagué. Procedimientos faciales, corporales y capilares con valoración médica personalizada.",
  keywords: [
    "medicina estética Ibagué",
    "Dra Vanessa Medina",
    "procedimientos faciales",
    "tratamientos corporales",
    "rejuvenecimiento",
    "Tolima",
  ],
  authors: [{ name: "Dra. Vanessa Medina" }],
  creator: "Dra. Vanessa Medina",
  /* `app/icon.png` es EL LOGO DE LA DOCTORA, no una versión dibujada.

     Antes aquí había un SVG hecho a mano que imitaba el monograma. Pesaba
     poquísimo y cambiaba de color en modo oscuro, pero era una imitación:
     la marca del consultorio es la que es, y en la pestaña tiene que salir
     esa. Se genera a partir de `Logo/LogoJM.jpg` recortando el transparente
     sobrante y montándolo sobre la crema de la marca (`--surface`), que es
     el mismo tratamiento que ya recibe en el pie de página. Sobre placa
     clara porque el monograma es negro sobre transparente y, sin ella,
     desaparece en la barra oscura del navegador.

     Son 38 KB en vez de los 1,34 MB del original.

     Hay que declararlo A MANO. Next lo recoge solo por convención de
     archivo, pero SOLO mientras no exista este objeto `icons`: en cuanto se
     declara uno —aquí se declaró para el icono de Apple—, la convención
     deja de aplicarse y se emite únicamente lo que hay escrito. El
     resultado era una página sin `<link rel="icon">`, el navegador caía a
     `/favicon.ico`, no existía, y la pestaña salía con el globo genérico. */
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
  alternates: {
    canonical: "/",
    languages: { "es-CO": "/", "en-US": "/" },
  },
  openGraph: {
    title: "Dra. Vanessa Medina · Consultorio",
    description:
      "Medicina estética y antienvejecimiento en Ibagué — Tolima. Valoración médica personalizada con la Dra. Vanessa Medina.",
    url: SITE_URL,
    siteName: "Consultorio JM",
    images: [{ url: IMG.logo, width: 1200, height: 630, alt: "Consultorio JM" }],
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dra. Vanessa Medina · Consultorio",
    description:
      "Medicina estética y antienvejecimiento en Ibagué — Tolima.",
    images: [IMG.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const tTop = await getTranslations("topbar");

  // Script anti-flash: aplica data-theme ANTES del paint, según preferencia
  // guardada o sistema. Evita el parpadeo claro→oscuro al cargar.
  const themeInit = `(function(){try{var t=localStorage.getItem('THEME');var eff=t==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',eff);}catch(e){}})();`;

  // JSON-LD MedicalBusiness para SEO local
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Consultorio JM",
    alternateName: "Consultorio JM — Dra. Vanessa Medina",
    description:
      "Especialista en Medicina Estética, Nutrición y Antiedad en Ibagué — Tolima.",
    url: SITE_URL,
    telephone: "+57 315 5445748",
    image: `${SITE_URL}${IMG.logo}`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ibagué",
      addressRegion: "Tolima",
      addressCountry: "CO",
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61556167276406",
      "https://www.instagram.com/dravanessamedinao28/",
    ],
    medicalSpecialty: ["Dermatology", "PlasticSurgery"],
  };

  return (
    <html lang={locale} suppressHydrationWarning className={`${montserrat.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect a orígenes críticos para acelerar LCP */}
        <link rel="preconnect" href="https://pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-34cf5433a9574d4e9b6b32d8a4cfd815.r2.dev" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        {/* Theme color para barra del navegador en móvil */}
        {/* Valores literales a propósito: `theme-color` lo lee el navegador
            para pintar SU barra, fuera del documento, así que una var() de
            CSS aquí no resuelve y el navegador descartaba la etiqueta
            entera. Se declara uno por esquema. */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#E8E1D4" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0E0C11" />
        {/* Apple touch */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* El script antiflash va con `next/script` y NO como un <script>
            normal, y la diferencia no es cosmética.

            Renderizado como <script dangerouslySetInnerHTML> dentro de
            <head>, React lo trata como un nodo suyo y lo vuelve a tocar al
            hidratar. El resultado, en cada carga completa del sitio, eran
            dos errores encadenados en consola:

              SyntaxError: Invalid or unexpected token
              Hydration failed because the server rendered HTML didn't
              match the client

            Comprobado quitándolo: sin este script los dos desaparecen.
            (F18 del backlog.) No rompía nada visible —React reconstruye el
            árbol— pero costaba un repintado completo en cada carga.

            `beforeInteractive` lo inyecta Next fuera del árbol que React
            hidrata, y sigue ejecutándose antes de pintar, que es lo único
            que este script necesita para evitar el destello de tema. */}
        <Script id="tema-antiflash" strategy="beforeInteractive">
          {themeInit}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        style={{
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
        <CarritoProvider>
          {/* BARRA SUPERIOR */}
          <div className="topbar">
            <div className="topbar-marquee">
              <div className="topbar-track">
                {/* Enlace `tel:`, no texto suelto: en un teléfono el número
                    de la clínica se toca para llamar. Era lo primero que
                    alguien intenta hacer desde el móvil y no funcionaba. */}
                <a className="topbar-item topbar-tel" href="tel:+573155445748">
                  <i className="fas fa-phone me-2"></i> 315 5445748
                </a>
                {/* La dirección se oculta en móvil (ver .topbar-direccion en
                    06-responsive.css): en 375px la marquesina la partía a
                    media palabra y la dirección completa ya está en el pie
                    y en "Nuestra ubicación", con mapa. */}
                <span className="topbar-item topbar-direccion">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {tTop("address")}
                </span>
                <span className="topbar-social">
                  <a
                    className="topbar-item"
                    href="https://www.facebook.com/profile.php?id=61556167276406"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    className="topbar-item"
                    href="https://www.instagram.com/dravanessamedinao28/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    className="topbar-item"
                    href="https://api.whatsapp.com/message/SEJTQDVCRWGSP1?autoload=1&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-whatsapp"></i>
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* NAVBAR */}
          <NavbarClient />

          {/* CONTENIDO */}
          <main>{children}</main>

          {/* FOOTER */}
          <Footer />

          {/* BANNER DE COOKIES (solo aparece si el usuario no ha decidido) */}
          <CookieBanner />

          {/* ACCESO RÁPIDO FLOTANTE — tema, idioma y contacto, solo escritorio */}
          <QuickAccessFab />
        </CarritoProvider>
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}