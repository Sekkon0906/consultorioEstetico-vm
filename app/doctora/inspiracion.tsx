"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

export default function Inspiracion() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg,#FAF9F7 0%,#F1E9E0 100%)",
        padding: "5rem 2rem",
      }}
    >
      <div className="container text-center">
        <h3
          className="fw-bold mb-5"
          style={{
            color: "#4E3B2B",
            fontFamily: "'Playfair Display',serif",
          }}
        >
          Inspiraciones y Creencias
        </h3>

        <div className="row justify-content-center align-items-center g-5">
          <div className="col-md-5">
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <Image
                src="/imagenes/inspiracion_dr.jpg"
                alt="Inspiración"
                width={500}
                height={500}
                className="rounded-4 shadow-lg"
              />
            </motion.div>
          </div>

          <div className="col-md-6 text-start">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h4
                className="fw-semibold mb-4"
                style={{
                  color: "#8C6D4F",
                  fontFamily: "'Poppins',sans-serif",
                }}
              >
                <TypeAnimation
                  sequence={[
                    "La medicina estética no solo transforma rostros, sino también la forma en que las personas se ven a sí mismas.",
                    4000,
                    "Cada tratamiento es una oportunidad para resaltar la esencia de quien somos.",
                    4000,
                    "Mi mayor inspiración es ver a mis pacientes sonreír con confianza y bienestar.",
                    4000,
                  ]}
                  wrapper="span"
                  speed={55}
                  repeat={Infinity}
                />
              </h4>

              <p
                className="lead"
                style={{
                  color: "#4E3B2B",
                  fontSize: "1.05rem",
                  lineHeight: "1.7",
                }}
              >
                Mi inspiración surge del equilibrio entre ciencia y arte. Creo
                que cada paciente tiene una historia y un propósito, y mi trabajo
                consiste en resaltar su esencia sin perder su autenticidad.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
