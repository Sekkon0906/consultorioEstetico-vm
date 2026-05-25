import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import NavbarClient from "@/components/NavbarClient";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { AuthProvider } from "@/context/AuthContext";
import { IMG } from "@/lib/imagenes";

export const metadata: Metadata = {
  title: {
    default: "Clínica Estética Dra. Julieth Medina",
    template: "%s · Dra. Julieth Medina",
  },
  description:
    "Especialista en Medicina Estética, Nutrición y Antiedad en Ibagué",
  icons: {
    icon: IMG.logo,
    shortcut: IMG.logo,
    apple: IMG.logo,
  },
  openGraph: {
    title: "Clínica Estética Dra. Julieth Medina",
    description: "Medicina estética y antienvejecimiento en Ibagué — Tolima.",
    images: [IMG.logo],
    type: "website",
    locale: "es_CO",
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        style={{
          backgroundColor: "#F6F4EF",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          {/* BARRA SUPERIOR */}
          <div className="topbar">
            <div className="topbar-marquee">
              <div className="topbar-track">
                <span className="topbar-item">
                  <i className="fas fa-phone me-2"></i> 315 5445748
                </span>
                <span className="topbar-item">
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
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}