"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import Galeria3D from "./src/components/Galeria3D";
import dynamic from "next/dynamic";
import { IMG } from "@/lib/imagenes";

const VideoAnim = dynamic(() => import("./src/components/VideoAnim"), {
  ssr: false,
});

export default function HomePage() {
  const imagenes = IMG.homeCarrusel;
  const [imagenActual, setImagenActual] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalo = setInterval(
      () => setImagenActual((prev) => (prev + 1) % imagenes.length),
      5000
    );
    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  const memoizedVideo = useMemo(() => <VideoAnim />, []);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero hero-home" ref={heroRef}>
        <div className="hero-left">
          {imagenes.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Procedimiento ${index + 1}`}
              className={`hero-slide ${index === imagenActual ? "is-active" : ""}`}
            />
          ))}
        </div>

        <div className="hero-right">
          <div className={`hero-content container ${heroVisible ? "hero-content-visible" : ""}`}>
            <h1 className="hero-title">
              La innovadora y exclusiva tecnologia de Hydrafacial esta en el
              consultorio de la Dra. Vanessa Medina
            </h1>

            <div className="hero-separator" />

            <p className="hero-desc-long">
              <strong>Que es HydraFacial?</strong> Es una tecnologia estetica
              de ultima generacion que combina limpieza profunda, exfoliacion,
              extraccion de impurezas e hidratacion avanzada en un solo
              procedimiento. Su sistema patentado utiliza un aplicador con
              succion controlada y sueros enriquecidos que renuevan la piel
              desde la primera sesion, sin necesidad de tiempo de recuperacion.
            </p>

            <p className="hero-desc-long">
              <strong>Para que sirve?</strong> Revitaliza la piel, trata poros
              dilatados, lineas de expresion, manchas y deshidratacion,
              devolviendo su luminosidad natural.
            </p>

            <p className="hero-desc-long">
              <strong>Un tratamiento exclusivo en el Tolima.</strong> El
              consultorio de la Dra. Vanessa Medina es el unico en la region con
              tecnologia original HydraFacial, certificada internacionalmente.
            </p>

            <p className="hero-desc-short">
              <strong>HydraFacial:</strong> tecnologia que limpia, exfolia e
              hidrata profundamente la piel con resultados visibles desde la
              primera sesion.
            </p>

            <div className="hero-cta">
              <Link
                href="/agendar"
                className="hero-btn hero-btn-primary d-inline-flex align-items-center"
              >
                <i className="fas fa-calendar-check me-2"></i>
                Agendar Cita
              </Link>

              <a
                href="https://www.instagram.com/hydrafacialcolombia/"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn hero-btn-secondary d-inline-flex align-items-center"
              >
                <i className="fab fa-instagram me-2"></i>
                Conocer mas de HydraFacial
              </a>
            </div>
          </div>
        </div>
      </section>

      {memoizedVideo}

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
            style={{ fontFamily: "'Playfair Display', serif", color: "#4E3B2B" }}
          >
            Tratamientos mas demandados
          </h2>
          <p className="lead" style={{ color: "#6C584C" }}>
            Explora de forma interactiva algunos de nuestros procedimientos mas aclamados
          </p>
        </div>
        <Galeria3D />
      </section>

      <section
        className="py-5 text-center"
        style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}
      >
        <h2 className="fw-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Nuestra ubicacion
        </h2>
        <p className="mb-4" style={{ color: "#6C584C" }}>
          Encuentranos en el corazon de Ibague, dentro de la Torre Empresarial.
        </p>
        <div
          style={{
            width: "90%", maxWidth: "900px", height: "450px",
            margin: "0 auto", borderRadius: "20px", overflow: "hidden",
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
          href="https://www.google.com/maps?q=Carrera+5ta+%2311-24,+Torre+Empresarial,+Consultorio+502,+Ibague,+Tolima"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-lg fw-semibold mt-4"
          style={{
            backgroundColor: "#B08968", color: "white", border: "none",
            borderRadius: "50px", padding: "0.8rem 2rem",
            boxShadow: "0 4px 12px rgba(176, 137, 104, 0.25)",
          }}
        >
          <i className="fas fa-map-marker-alt me-2"></i> Ver en Google Maps
        </a>
      </section>
    </>
  );
}