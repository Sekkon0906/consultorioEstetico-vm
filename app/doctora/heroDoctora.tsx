"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroDoctora() {
  const imagenes = [
    "/imagenes/carrucel/carrucel_dr/carrucel_dr1.jpg",
    "/imagenes/carrucel/carrucel_dr/carrucel_dr2.jpg",
    "/imagenes/carrucel/carrucel_dr/carrucel_dr3.jpg",
    "/imagenes/carrucel/carrucel_dr/carrucel_dr4.jpg",
    "/imagenes/carrucel/carrucel_dr/carrucel_dr5.jpg",
  ];
  const [imagenActual, setImagenActual] = useState(0);

  useEffect(() => {
    const int = setInterval(
      () => setImagenActual((p) => (p + 1) % imagenes.length),
      5000
    );
    return () => clearInterval(int);
  }, []);

  return (
    <section className="doc-hero">
      <div className="doc-hero-left">
        <div className="doc-hero-content container">
          <h1 className="doc-hero-title">
            ¿Quién es la doctora Julieth Vanessa Medina?
          </h1>

          <p className="doc-hero-paragraph">
            Julieth Vanessa Medina es una médica colombiana apasionada por el
            bienestar y la belleza natural. Desde mis primeros años trabajando
            en hospitales, descubrí que mi verdadera vocación estaba en la
            medicina estética, donde podía unir ciencia, arte y empatía para
            resaltar la mejor versión de cada persona.
          </p>

          <p className="doc-hero-paragraph">
            Con el tiempo, decidí abrir mi propio consultorio, un espacio
            diseñado para ofrecer confianza, resultados naturales y tratamientos
            con tecnología de última generación.
          </p>

          <p className="doc-hero-quote">
            “La autenticidad, sofisticación y elegancia son la nueva era de la
            Medicina estética. Invertir en ti debe tratarse de resaltar lo que
            te hace único/a generando una belleza real y sin excesos.” —
            <b> Julieth Medina</b>.
          </p>

<div className="doc-hero-cta">
  <Link href="/agendar" className="btn-doctora">
    <i className="fas fa-calendar-check me-2" /> Agendar Cita
  </Link>

  <a
    href="https://www.instagram.com/dravanessamedinao28/"
    target="_blank"
    rel="noopener noreferrer"
    className="btn-doctora btn-doctora-secondary"
  >
    <i className="fab fa-instagram me-2" /> Conocer más sobre la doctora
  </a>
</div>

        </div>
      </div>

      <div className="doc-hero-right">
        {imagenes.map((img, i) => (
          <Image
            key={i}
            src={img}
            alt={`Doctora ${i + 1}`}
            fill
            priority={i === 0}
            className={`doc-hero-slide ${i === imagenActual ? "is-active" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}
