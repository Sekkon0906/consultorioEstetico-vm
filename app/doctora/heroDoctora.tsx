"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { IMG } from "@/lib/imagenes";

export default function HeroDoctora() {
  const t = useTranslations("doctora.hero");
  const imagenes = [
    IMG.drCarrusel[0],
    IMG.drCarrusel[1],
    IMG.drCarrusel[2],
    IMG.drCarrusel[3],
    IMG.drCarrusel[4],
  ];
  const [imagenActual, setImagenActual] = useState(0);

  useEffect(() => {
    const int = setInterval(
      () => setImagenActual((p) => (p + 1) % imagenes.length),
      5000
    );
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Variantes de entrada escalonada para el contenido de texto.
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="doc-hero">
      <div className="doc-hero-left">
        <motion.div
          className="doc-hero-content container"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.span variants={item} className="doc-hero-kicker">
            {t("imageAlt")}
          </motion.span>

          <motion.h1 variants={item} className="doc-hero-title">
            {t("title")}
          </motion.h1>

          <motion.p variants={item} className="doc-hero-paragraph">{t("p1")}</motion.p>
          <motion.p variants={item} className="doc-hero-paragraph">{t("p2")}</motion.p>

          <motion.p variants={item} className="doc-hero-quote">
            {t("quote")}
            <b> {t("quoteAuthor")}</b>.
          </motion.p>

          <motion.div variants={item} className="doc-hero-cta">
            <Link href="/agendar" className="btn-doctora">
              <i className="fas fa-calendar-check me-2" /> {t("cta")}
            </Link>

            <a
              href="https://www.instagram.com/dravanessamedinao28/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-doctora btn-doctora-secondary"
            >
              <i className="fab fa-instagram me-2" /> {t("ctaSecondary")}
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="doc-hero-right"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        {imagenes.map((img, i) => (
          <Image
            key={i}
            src={img}
            alt={`${t("imageAlt")} ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(max-width: 820px) 100vw, 50vw"
            quality={82}
            className={`doc-hero-slide ${i === imagenActual ? "is-active" : ""}`}
            style={{ objectFit: "cover", objectPosition: "center 18%" }}
          />
        ))}

        {/* Velo sutil para fundir la imagen con el lado del texto.
            Las fotos rotan solas (Ken Burns) — sin controles de navegación,
            ya que explorarlas no aporta al usuario; funcionan como ambiente. */}
        <div className="doc-hero-veil" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
