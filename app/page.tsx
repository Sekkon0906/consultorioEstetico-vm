"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// Galería 3D y Video se cargan solo en cliente y bajo demanda — su bundle
// (framer-motion + three.js indirecto + assets) no debe bloquear el LCP del hero.
const Galeria3D = dynamic(() => import("./src/components/Galeria3D"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F4EF" }}>
      <div style={{ color: "#8B7060", fontSize: "0.9rem" }}>Cargando galería…</div>
    </div>
  ),
});

const VideoAnim = dynamic(() => import("./src/components/VideoAnim"), {
  ssr: false,
});

import { IMG } from "./src/lib/imagenes";

const HERO_VIDEO: string | null = null;
const HERO_POSTER: string | null = null;
const HERO_IMAGE: string | null = IMG.heroDoctora;

export default function HomePage() {
  const t = useTranslations("hero");
  const th = useTranslations("home");
  const locale = useLocale();
  const imagenes = IMG.homeCarrusel;

  const [imagenActual, setImagenActual] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(
      () => setImagenActual((prev) => (prev + 1) % imagenes.length),
      5000
    );
    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const memoizedVideo = useMemo(() => <VideoAnim />, []);

  const rotator = t.raw("rotator") as string[];
  const rotatorSequence = rotator.flatMap((w) => [w, 1800]);

  return (
    <>
      {/* ===== HERO FULL-SCREEN ===== */}
      <section className="hero-fs">
        <div className="hero-fs-bg">
          {HERO_VIDEO ? (
            <video
              src={HERO_VIDEO}
              poster={HERO_POSTER || imagenes[0]}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          ) : (
            <Image
              src={HERO_IMAGE || imagenes[imagenActual]}
              alt={t("imageAlt")}
              fill
              priority
              sizes="100vw"
              quality={85}
              style={{ objectFit: "cover" }}
            />
          )}
          <div className="hero-fs-overlay" aria-hidden="true" />
        </div>

        <div className="hero-fs-content">
          <motion.div
            className="hero-fs-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: heroVisible ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="hero-fs-kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 12 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              {t("kicker")}
            </motion.span>

            <motion.h1
              className="hero-fs-title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 18 }}
              transition={{ duration: 0.7, delay: 0.18 }}
            >
              {t("title1")} <br /> {t("title2")}
              <br />
              <span className="hero-fs-rotator">
                {/* key={locale} fuerza remount cuando cambia el idioma:
                    sin esto, TypeAnimation conserva la secuencia interna
                    inicial y nunca refleja la traducción nueva. */}
                <TypeAnimation
                  key={locale}
                  sequence={rotatorSequence}
                  wrapper="span"
                  speed={55}
                  deletionSpeed={70}
                  repeat={Infinity}
                  cursor={true}
                />
              </span>
            </motion.h1>

            <motion.p
              className="hero-fs-sub"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 14 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              className="hero-fs-cta"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 14 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            >
              <Link href="/agendar" className="hero-fs-btn hero-fs-btn-primary">
                <i className="fas fa-calendar-check me-2"></i> {t("ctaPrimary")}
              </Link>
              <Link href="/procedimientos" className="hero-fs-btn hero-fs-btn-ghost">
                {t("ctaSecondary")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* VIDEO CENTRAL */}
      {memoizedVideo}

      {/* GALERÍA 3D — el componente trae su propia imagen de fondo y título */}
      <section
        style={{
          borderTop: "1px solid #E8E1D4",
          borderBottom: "1px solid #E8E1D4",
        }}
      >
        <Galeria3D />
      </section>

      {/* UBICACIÓN — mapa + foto del consultorio + 2 CTAs */}
      <section
        className="py-5 text-center home-location-section"
        style={{
          backgroundColor: "#E9DED2",
          color: "#4E3B2B",
        }}
      >
        <h2
          className="fw-bold mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {th("location.title")}
        </h2>
        <p className="mb-5" style={{ color: "#6C584C" }}>
          {th("location.subtitle")}
        </p>

        {/* Grid mapa + foto */}
        <div
          className="home-loc-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            width: "92%",
            maxWidth: 1180,
            margin: "0 auto",
          }}
        >
          {/* Mapa */}
          <div
            className="home-loc-card"
            style={{
              height: 420,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(78, 59, 43, 0.15)",
              border: "1px solid rgba(176, 137, 104, 0.18)",
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d994.454304702495!2d-75.24131428635316!3d4.445089870529062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c4845c124d1d%3A0x4c5542efc906b982!2sEdificio%20Torre%20Empresarial!5e0!3m2!1ses-419!2sco!4v1763922944777!5m2!1ses-419!2sco"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
              allowFullScreen
              title="Google Maps"
            />
          </div>

          {/* Foto del consultorio — sin caption sobre la imagen */}
          <div
            className="home-loc-card"
            style={{
              position: "relative",
              height: 420,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(78, 59, 43, 0.15)",
              border: "1px solid rgba(176, 137, 104, 0.18)",
            }}
          >
            <Image
              src={IMG.consultorioPrincipal}
              alt={th("location.photoAlt")}
              fill
              sizes="(max-width: 820px) 92vw, 590px"
              quality={80}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        {/* CTAs en grid 2 col, alineados desde el centro hacia afuera:
            - Izq (bajo el mapa): "Ver en Google Maps", justify flex-end
              → la píldora queda junto al gap central.
            - Der (bajo la foto): "Conocer más sobre el consultorio",
              justify flex-start → también junto al gap central.
            Mismo gap horizontal que las imágenes para que se respete
            el ritmo visual. */}
        {/* Un solo botón: el mapa embebido ya trae su propio "Abrir en
            Maps", así que el segundo botón (que apuntaba al mismo lugar)
            era redundante. Queda solo el que lleva a contenido real. */}
        <div
          className="home-loc-grid home-loc-ctas"
          style={{
            display: "flex",
            justifyContent: "center",
            width: "92%",
            maxWidth: 1180,
            margin: "1.5rem auto 0",
          }}
        >
          <Link href="/consultorio" className="btn-ghost-app">
            <i className="fas fa-clinic-medical" /> {th("location.viewClinic")}
          </Link>
        </div>

        <style>{`
          @media (max-width: 1024px) {
            .home-loc-card { height: 360px !important; }
          }
          @media (max-width: 820px) {
            .home-loc-grid {
              grid-template-columns: 1fr !important;
              width: 94% !important;
              gap: 1.1rem !important;
            }
            .home-loc-card { height: 300px !important; }
            /* En móvil los CTAs vuelven a centrarse cada uno en su fila */
            .home-loc-ctas > div {
              justify-content: center !important;
            }
          }
          @media (max-width: 480px) {
            .home-loc-card { height: 240px !important; border-radius: 16px !important; }
          }
        `}</style>
      </section>
    </>
  );
}
