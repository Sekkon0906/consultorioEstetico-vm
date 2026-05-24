"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Galeria3D from "./src/components/Galeria3D";
import dynamic from "next/dynamic";

const VideoAnim = dynamic(() => import("./src/components/VideoAnim"), {
  ssr: false,
});

import { IMG } from "./src/lib/imagenes";

/**
 * Cinemagraph / video del hero.
 *
 * Para activarlo:
 *   1. Coloca el archivo de video en /public/imagenes/hero/  (ej. doctora-loop.mp4)
 *   2. Coloca un poster (foto estática del primer frame) en la misma carpeta
 *      para que aparezca al instante mientras carga el video.
 *   3. Reemplaza los `null` de abajo por las rutas:
 *        const HERO_VIDEO  = "/imagenes/hero/doctora-loop.mp4";
 *        const HERO_POSTER = "/imagenes/hero/doctora-poster.jpg";
 *   4. (Recomendado) El video: mute, sin audio, en loop, MP4 H.264 o WebM,
 *      vertical/cuadrado, peso < 3 MB. Idealmente 5–8s, sutil (un mechón de
 *      pelo, un giro suave del brazo, una sonrisa breve).
 *
 * Si HERO_VIDEO es null se usa el carrusel de imágenes actual (sin cambios).
 */
const HERO_VIDEO: string | null = null;
const HERO_POSTER: string | null = null;

/**
 * Imagen de fondo del hero (cubre toda la pantalla inicial).
 * Sube la foto a Supabase Storage en:
 *    ConsultorioImagenes/imagenesPublicas/doctora-hero.jpg
 * y se carga automáticamente desde IMG.heroDoctora.
 * Si por algún motivo no existe, hace fallback al primer carrusel.
 */
const HERO_IMAGE: string | null = IMG.heroDoctora;

export default function HomePage() {
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

  // Activa la animación de entrada del contenido del hero (antes quedaba en opacity:0)
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const memoizedVideo = useMemo(() => <VideoAnim />, []);

  return (
    <>
      {/* ===== HERO FULL-SCREEN ===== */}
      <section className="hero-fs">
        {/* Capa de fondo: video (si HERO_VIDEO) o imagen (HERO_IMAGE / fallback) */}
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
            <img
              src={HERO_IMAGE || imagenes[imagenActual]}
              alt="Dra. Vanessa Medina"
            />
          )}
          <div className="hero-fs-overlay" aria-hidden="true" />
        </div>

        {/* Contenido a la derecha con animación */}
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
              Medicina estética · Ibagué
            </motion.span>

            <motion.h1
              className="hero-fs-title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 18 }}
              transition={{ duration: 0.7, delay: 0.18 }}
            >
              Tu mejor versión <br /> empieza con
              <br />
              <span className="hero-fs-rotator">
                <TypeAnimation
                  sequence={[
                    "armonía.",
                    1800,
                    "autenticidad.",
                    1800,
                    "belleza natural.",
                    1800,
                    "confianza.",
                    1800,
                  ]}
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
              Tratamientos personalizados con tecnología de última generación.
              Resultados naturales que resaltan tu esencia, en manos de la
              Dra. Vanessa Medina.
            </motion.p>

            <motion.div
              className="hero-fs-cta"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: heroVisible ? 1 : 0, y: heroVisible ? 0 : 14 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            >
              <Link href="/agendar" className="hero-fs-btn hero-fs-btn-primary">
                <i className="fas fa-calendar-check me-2"></i> Agendar cita
              </Link>
              <Link href="/procedimientos" className="hero-fs-btn hero-fs-btn-ghost">
                Conoce los procedimientos
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* VIDEO CENTRAL */}
      {memoizedVideo}

      {/* GALERÍA 3D */}
      <section
        className="py-5"
        style={{
          backgroundColor: "#FAF9F7",
          borderTop: "1px solid #E8E1D4",
          borderBottom: "1px solid #E8E1D4",
        }}
      >
        <div className="text-center mb-5">
          <h2
            className="fw-bold"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#4E3B2B",
            }}
          >
            Tratamientos más demandados
          </h2>
          <p className="lead" style={{ color: "#6C584C" }}>
            Explora de forma interactiva algunos de nuestros procedimientos más
            aclamados
          </p>
        </div>
        <Galeria3D />
      </section>

      {/* UBICACIÓN */}
      <section
        className="py-5 text-center"
        style={{
          backgroundColor: "#E9DED2",
          color: "#4E3B2B",
        }}
      >
        <h2
          className="fw-bold mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Nuestra ubicación
        </h2>
        <p className="mb-4" style={{ color: "#6C584C" }}>
          Encuéntranos en el corazón de Ibagué, dentro de la Torre Empresarial.
        </p>

        <div
          style={{
            width: "90%",
            maxWidth: "900px",
            height: "450px",
            margin: "0 auto",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d994.454304702495!2d-75.24131428635316!3d4.445089870529062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c4845c124d1d%3A0x4c5542efc906b982!2sEdificio%20Torre%20Empresarial!5e0!3m2!1ses-419!2sco!4v1763922944777!5m2!1ses-419!2sco"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>

        <a
          href="https://www.google.com/maps?q=Carrera+5ta+%2311-24,+Torre+Empresarial,+Consultorio+502,+Ibagué,+Tolima"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-lg fw-semibold mt-4"
          style={{
            backgroundColor: "#B08968",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "0.8rem 2rem",
            boxShadow: "0 4px 12px rgba(176, 137, 104, 0.25)",
            transition: "all 0.3s ease",
          }}
        >
          <i className="fas fa-map-marker-alt me-2"></i> Ver en Google Maps
        </a>
      </section>
    </>
  );
}