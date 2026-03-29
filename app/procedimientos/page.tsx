"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Collapse } from "react-collapse";
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import {
  FaChevronDown,
  FaChevronUp,
  FaCalendarCheck,
  FaEye,
} from "react-icons/fa";

import FondoAnimado from "./FondoAnimado";
import SiluetasAnimadas from "./SiluetasAnimadas";

//  Tipos de dominio (ya no usamos localDB)
import type { Procedimiento } from "../types/domain";
//  Servicio que habla con el backend
import { getProcedimientosApi } from "../services/procedimientosApi";

// =======================================================
// Formateador universal de precios
// Aplica puntos de miles a cualquier número en el texto
// =======================================================
function formatPrecioUniversal(precio: string | number): string {
  if (typeof precio === "number") {
    return precio.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Buscar todos los números y aplicar formato
  return precio.replace(/\d{1,3}(?:\d{3})*(?:\.\d+)?/g, (match) => {
    const num = parseFloat(match.replace(/\./g, "").replace(/,/g, "."));
    if (isNaN(num)) return match;
    return num.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  });
}

export default function ProcedimientosPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSection(openSection === key ? null : key);
  };

  //  Cargar procedimientos desde el backend al montar
  useEffect(() => {
    let mounted = true;

    const fetchProcedimientos = async () => {
      try {
        setLoading(true);
        const data = await getProcedimientosApi();
        if (mounted) {
          setProcedimientos(data);
        }
      } catch (err) {
        console.error("Error cargando procedimientos:", err);
        if (mounted) {
          setError("No se pudieron cargar los procedimientos. Intenta de nuevo más tarde.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProcedimientos();
    return () => {
      mounted = false;
    };
  }, []);

  // Agrupamos por categoría (si vienen vacíos, simplemente no muestra tarjetas)
  const procedimientosPorCategoria: Record<string, Procedimiento[]> = {
    "Explora los procedimientos faciales": procedimientos.filter(
      (p) => p.categoria === "Facial"
    ),
    "Explora los procedimientos corporales": procedimientos.filter(
      (p) => p.categoria === "Corporal"
    ),
    "Explora los procedimientos capilares": procedimientos.filter(
      (p) => p.categoria === "Capilar"
    ),
  };

  const fadeCard = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <main className="relative min-h-screen py-10 px-4 sm:px-8 overflow-hidden transition-colors duration-700">
      {/* === Fondos animados === */}
      <div className="absolute inset-0 -z-20">
        <FondoAnimado tipo={openSection} />
      </div>

      <div className="absolute inset-0 -z-10 opacity-80">
        <SiluetasAnimadas tipo={openSection} />
      </div>

      {/* === Contenido principal === */}
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: "#4E3B2B", fontFamily: "'Playfair Display', serif" }}
          >
            Procedimientos Médicos y Estéticos
          </h1>
          <p
            className="text-[#6C584C] max-w-3xl mx-auto text-lg"
            style={{ lineHeight: 1.6 }}
          >
            Descubre tratamientos faciales, corporales y capilares realizados
            con técnicas seguras y personalizadas.
          </p>

          {/* Mensajes de estado */}
          {loading && (
            <p className="mt-4 text-sm text-[#6C584C]">
              Cargando procedimientos...
            </p>
          )}
          {error && !loading && (
            <p className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Acordeón principal */}
        {!loading &&
          Object.entries(procedimientosPorCategoria).map(([titulo, items]) => (
            <motion.div
              key={titulo}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8 rounded-3xl shadow-md overflow-hidden border border-[#E9DED2] bg-white/80 backdrop-blur-md"
            >
              {/* Cabecera */}
              <button
                onClick={() => toggleSection(titulo)}
                className="w-full flex justify-between items-center px-6 py-5 bg-[#B08968] text-white text-lg font-semibold hover:bg-[#9A7458] transition-colors"
              >
                <span>{titulo}</span>
                {openSection === titulo ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {/* Contenido desplegable */}
              <Collapse isOpened={openSection === titulo}>
                <Fade cascade damping={0.1} triggerOnce>
                  <div className="p-6 bg-[#FAF9F7]/70 backdrop-blur-md transition-all duration-700">
                    {items.length === 0 ? (
                      <p className="text-center text-[#6C584C] py-4">
                        No hay procedimientos registrados en esta categoría por el momento.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map((p, i) => (
                          <motion.div
                            key={p.id}
                            variants={fadeCard}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i}
                            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-md border border-[#E9DED2] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                          >
                            {/* Imagen */}
                            <div className="relative overflow-hidden rounded-t-3xl">
                              <Image
                                src={p.imagen}
                                alt={p.nombre}
                                width={900}
                                height={900}
                                className="w-full h-[60%] min-h-[20rem] object-cover transition-transform duration-700 hover:scale-110"
                                style={{ objectPosition: "center" }}
                              />
                            </div>

                            {/* Contenido */}
                            <div className="p-6 flex flex-col justify-between h-[40%]">
                              <div>
                                <h3
                                  className="text-xl font-semibold mb-2"
                                  style={{
                                    color: "#4E3B2B",
                                    fontFamily: "'Playfair Display', serif",
                                  }}
                                >
                                  {p.nombre}
                                </h3>
                                <p className="text-[#6C584C] mb-3 leading-relaxed text-[0.95rem]">
                                  {p.desc}
                                </p>
                                <p className="text-[#B08968] font-semibold">
                                  Precio estándar: {formatPrecioUniversal(p.precio)}
                                </p>
                                <small className="text-[#6C584C]/70 block mb-4">
                                  *Los precios están en pesos colombianos, y el costo puede
                                  cambiar según la valoración médica.*
                                </small>
                              </div>

                              {/* Botones */}
                              <div className="flex justify-center gap-4 mt-auto pt-4 border-t border-[#E9DED2] pb-6">
                                {/* Agendar cita */}
                                <Link
                                  href={`/agendar?proc=${encodeURIComponent(p.nombre)}`}
                                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium shadow-sm transition-all duration-300"
                                  style={{
                                    backgroundColor: "#B08968",
                                    color: "#FAF9F7",
                                    fontSize: "0.95rem",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#9A7458";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#B08968";
                                  }}
                                >
                                  <FaCalendarCheck className="text-base" />
                                  Agendar cita
                                </Link>

                                {/* Ver más */}
                                <Link
                                  href={`/procedimientos/${p.id}`}
                                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border font-medium shadow-sm transition-all duration-300"
                                  style={{
                                    borderColor: "#B08968",
                                    color: "#6C584C",
                                    fontSize: "0.95rem",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#B08968";
                                    e.currentTarget.style.color = "#FAF9F7";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#6C584C";
                                  }}
                                >
                                  <FaEye className="text-base" />
                                  Ver resultados
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </Fade>
              </Collapse>
            </motion.div>
          ))}
      </div>
    </main>
  );
}
