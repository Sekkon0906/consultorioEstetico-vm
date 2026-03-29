import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import NavbarClient from "@/components/NavbarClient";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Clínica Estética Dra. Julieth Medina",
  description:
    "Especialista en Medicina Estética, Nutrición y Antiedad en Ibagué",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          backgroundColor: "#F6F4EF",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
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
                  Carrera 5ta #11-24. Edificio Torre Empresarial. Consultorio 502. Ibagué – Tolima.
                </span>
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
              </div>
            </div>
          </div>

          {/* NAVBAR */}
          <NavbarClient />

          {/* CONTENIDO */}
          <main>{children}</main>

          {/* FOOTER */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}