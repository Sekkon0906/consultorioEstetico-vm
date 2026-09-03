"use client";

import { IMG } from "@/lib/imagenes";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function ConsultorioPage() {
  const t = useTranslations("consultorio");
  const imageLabels = t.raw("gallery.images") as string[];

  const galleryImages = [
    { src: IMG.consultorioRelleno[0], label: imageLabels[0] },
    { src: IMG.consultorioRelleno[1], label: imageLabels[1] },
    { src: IMG.consultorioRelleno[2], label: imageLabels[2] },
    { src: IMG.consultorioRelleno[3], label: imageLabels[3] },
    { src: IMG.consultorioRelleno[4], label: imageLabels[4] },
  ];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Imagen activa del showcase (galería grande + miniaturas).
  const [activeIndex, setActiveIndex] = useState(0);

  const showcasePrev = () =>
    setActiveIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);
  const showcaseNext = () =>
    setActiveIndex((p) => (p + 1) % galleryImages.length);

  const closeModal = () => setSelectedIndex(null);

  const showPrev = () => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + galleryImages.length) % galleryImages.length;
    });
  };

  const showNext = () => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % galleryImages.length;
    });
  };

  const currentImage =
    selectedIndex !== null ? galleryImages[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#2B2B2B] overflow-hidden">
      {/* HERO */}
      <section className="relative w-full h-[85vh] md:h-[90vh]">
        <Image
          src={IMG.consultorioPrincipal}
          alt={t("hero.imageAlt")}
          fill
          priority
          sizes="100vw"
          quality={85}
          style={{ objectFit: "cover", filter: "brightness(0.9)" }}
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-sm md:text-base tracking-[0.3em] uppercase mb-4"
          >
            {t("hero.kicker")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-semibold mb-4 drop-shadow-xl"
          >
            {t("hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-lg md:text-xl max-w-3xl"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-6 flex justify-center w-full"
          >
            <div className="inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full">
              <span className="h-3 w-3 rounded-full bg-emerald-300 animate-pulse" />
              <p className="relative top-[8px] text-sm md:text-base leading-none text-center">
                {t("hero.highlight")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DESCRIPCIÓN */}
      <section className="consultorio-desc-section max-w-6xl mx-auto py-16 md:py-20 px-6 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-semibold text-[var(--brand)] mb-8"
        >
          {t("description.title")}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="consultorio-desc-text text-lg leading-relaxed text-[#2B2B2B]/80 max-w-3xl mx-auto"
        >
          {t("description.text")}
        </motion.p>
      </section>

      {/* GALERÍA — showcase interactivo: imagen grande + miniaturas */}
      <section className="consultorio-gallery-section px-4 pb-16 pt-4">
        <div className="max-w-5xl mx-auto mb-8 text-center">
          <h2 className="consultorio-gallery-title text-2xl md:text-3xl font-semibold text-[var(--brand)]">
            {t("gallery.title")}
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="consultorio-showcase max-w-5xl mx-auto"
        >
          {/* Imagen principal */}
          <div className="consultorio-showcase-main">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="consultorio-showcase-imgwrap"
                onClick={() => setSelectedIndex(activeIndex)}
              >
                <Image
                  src={galleryImages[activeIndex].src}
                  alt={galleryImages[activeIndex].label}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  quality={85}
                  style={{ objectFit: "cover" }}
                />
                <div className="consultorio-showcase-overlay" />
                <span className="consultorio-showcase-label">
                  {galleryImages[activeIndex].label}
                </span>
                <span className="consultorio-showcase-zoom" aria-hidden="true">
                  <i className="fas fa-expand" />
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Flechas */}
            <button
              type="button"
              onClick={showcasePrev}
              aria-label={t("gallery.close")}
              className="consultorio-showcase-arrow left"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showcaseNext}
              aria-label={t("gallery.viewSpace")}
              className="consultorio-showcase-arrow right"
            >
              ›
            </button>

            {/* Contador */}
            <span className="consultorio-showcase-counter">
              {activeIndex + 1} / {galleryImages.length}
            </span>
          </div>

          {/* Tira de miniaturas */}
          <div className="consultorio-thumbs">
            {galleryImages.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={img.label}
                className={`consultorio-thumb ${i === activeIndex ? "is-active" : ""}`}
              >
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  sizes="120px"
                  quality={55}
                  style={{ objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* MODAL CON NAVEGACIÓN */}
      <AnimatePresence>
        {currentImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative max-w-4xl w-full flex items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={showPrev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 ml-2 rounded-full bg-white/80 text-black w-9 h-9 items-center justify-center shadow-md hover:bg-white"
              >
                ‹
              </button>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxHeight: "80vh",
                  aspectRatio: "16 / 10",
                  borderRadius: 16,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src={currentImage.src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="100vw"
                  quality={40}
                  style={{
                    objectFit: "cover",
                    filter: "blur(28px) brightness(0.55)",
                    transform: "scale(1.15)",
                  }}
                />
                <Image
                  src={currentImage.src}
                  alt={currentImage.label}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  quality={90}
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>

              <button
                onClick={showNext}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 mr-2 rounded-full bg-white/80 text-black w-9 h-9 items-center justify-center shadow-md hover:bg-white"
              >
                ›
              </button>

              <button
                className="absolute top-4 right-4 bg-white text-black rounded-full px-3 py-1 text-sm font-semibold shadow-md hover:bg-neutral-200"
                onClick={closeModal}
              >
                {t("gallery.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GOOGLE MAPS */}
      <section className="px-4 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="consultorio-map-card max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-lg bg-white"
        >
          <div className="p-6 md:p-8 text-center">
            <h3 className="consultorio-map-title text-2xl font-semibold text-[#B08968] mb-2">
              {t("map.title")}
            </h3>
            <p className="consultorio-map-addr text-sm md:text-base text-[#2B2B2B]/80">
              {t("map.address")}
            </p>
          </div>

          <div className="w-full h-[320px] md:h-[380px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d994.454304702495!2d-75.24131428635316!3d4.445089870529062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c4845c124d1d%3A0x4c5542efc906b982!2sEdificio%20Torre%20Empresarial!5e0!3m2!1ses-419!2sco!4v1763922944777!5m2!1ses-419!2sco"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
