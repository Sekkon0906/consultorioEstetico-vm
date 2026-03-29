"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const galleryImages = [
  {
    src: "/imagenes/consultorio/consultorioRelle1.png",
    label: "Sala de procedimiento",
  },
  {
    src: "/imagenes/consultorio/consultorioRelle2.png",
    label: "Divisiones y privacidad",
  },
  {
    src: "/imagenes/consultorio/consultorioRelle3.png",
    label: "Zona de trabajo",
  },
  {
    src: "/imagenes/consultorio/consultorioRelle4.png",
    label: "Acceso y luz natural",
  },
  {
    src: "/imagenes/consultorio/consultorioRelle5.png",
    label: "Detalle de ambiente",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function ConsultorioPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
          src="/imagenes/consultorio/consultorioPrinci.png"
          alt="Consultorio principal"
          fill
          className="object-cover brightness-90"
          priority
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-sm md:text-base tracking-[0.3em] uppercase mb-4"
          >
            ESPACIO MÉDICO ESTÉTICO
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-6xl font-semibold mb-4 drop-shadow-xl"
          >
            Nuestro Consultorio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-lg md:text-xl max-w-3xl"
          >
            Un ambiente diseñado para tu bienestar, donde la estética,
            la tecnología y la calma se integran en cada detalle.
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
      Atmósfera tranquila  Equipos modernos  Atención personalizada
    </p>
  </div>
</motion.div>
        </div>
      </section>

      {/* DESCRIPCIÓN */}
      <section className="max-w-6xl mx-auto py-16 md:py-20 px-6 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-semibold text-[#B08968] mb-8"
        >
          Elegancia, confort y tecnología
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-lg leading-relaxed text-[#2B2B2B]/80 max-w-3xl mx-auto"
        >
          Cada área del consultorio ha sido pensada para proporcionar comodidad,
          privacidad y una experiencia estética profesional y cálida.
        </motion.p>
      </section>

      {/* GALERÍA */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#B08968]">
            Galería del consultorio
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.15 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {galleryImages.map((img, index) => (
            <motion.div
              key={img.src}
              variants={cardVariant}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 140, damping: 12 }}
              className="relative rounded-2xl shadow-lg bg-black/5 group overflow-hidden"
            >
              {/* todas del mismo tamaño */}
              <div className="relative w-full h-[260px] md:h-[280px]">
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Botón */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
                <button
                  onClick={() => setSelectedIndex(index)}
                  className="px-6 py-2 text-xs font-semibold bg-white/85 text-[#333] rounded-full hover:bg-white transition shadow-sm"
                >
                  VER ESPACIO
                </button>
              </div>
            </motion.div>
          ))}
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
              onClick={(e) => e.stopPropagation()} // no cerrar si clic dentro
            >
              {/* Flecha izquierda */}
              <button
                onClick={showPrev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 ml-2 rounded-full bg-white/80 text-black w-9 h-9 items-center justify-center shadow-md hover:bg-white"
              >
                ‹
              </button>

              {/* Imagen */}
              <Image
                src={currentImage.src}
                alt={currentImage.label}
                width={1600}
                height={1000}
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl bg-black"
              />

              {/* Flecha derecha */}
              <button
                onClick={showNext}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 mr-2 rounded-full bg-white/80 text-black w-9 h-9 items-center justify-center shadow-md hover:bg-white"
              >
                ›
              </button>

              {/* Cerrar */}
              <button
                className="absolute top-4 right-4 bg-white text-black rounded-full px-3 py-1 text-sm font-semibold shadow-md hover:bg-neutral-200"
                onClick={closeModal}
              >
                Cerrar 
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
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-lg bg-white"
        >
          <div className="p-6 md:p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#B08968] mb-2">
              ¿Dónde estamos ubicados?
            </h3>
            <p className="text-sm md:text-base text-[#2B2B2B]/80">
              Carrera 5ta #11-24. Edificio Torre Empresarial. Consultorio 502. Ibagué – Tolima.
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
