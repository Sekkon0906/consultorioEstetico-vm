"use client";

import { motion } from "framer-motion";

export default function VisionMision() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg,#FAF9F7 0%,#F5EDE3 100%)",
        padding: "5rem 2rem",
      }}
    >
      <div className="container text-center">
        <motion.h3
          className="fw-bold mb-5"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            color: "#4E3B2B",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Misión y Visión
        </motion.h3>

        <div className="row justify-content-center g-4">
          <div className="col-12 col-md-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-4 rounded-4 shadow-sm h-100"
              style={{
                backgroundColor: "#FFFDF9",
                border: "1px solid #E9DED2",
              }}
            >
              <h4
                className="fw-bold mb-3"
                style={{
                  color: "#8C6D4F",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Nuestra Misión
              </h4>
              <p
                style={{
                  color: "#4E3B2B",
                  fontSize: "1.05rem",
                  lineHeight: "1.7",
                }}
              >
                Brindar atención médica estética integral centrada en el bienestar
                y la armonía del paciente, utilizando tecnología avanzada y un
                enfoque humano para resultados naturales y duraderos.
              </p>
            </motion.div>
          </div>

          <div className="col-12 col-md-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-4 rounded-4 shadow-sm h-100"
              style={{
                backgroundColor: "#FFFDF9",
                border: "1px solid #E9DED2",
              }}
            >
              <h4
                className="fw-bold mb-3"
                style={{
                  color: "#8C6D4F",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Nuestra Visión
              </h4>
              <p
                style={{
                  color: "#4E3B2B",
                  fontSize: "1.05rem",
                  lineHeight: "1.7",
                }}
              >
                Ser un referente nacional e internacional en medicina estética
                ética, innovadora y responsable, inspirando a más profesionales y
                pacientes a adoptar una visión saludable y consciente de la
                belleza.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
