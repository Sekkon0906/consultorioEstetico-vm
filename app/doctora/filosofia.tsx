"use client";

import { motion } from "framer-motion";

export default function Filosofia() {
  const valores = [
    {
      icon: "fa-heart",
      title: "Cuidado Personalizado",
      text: "Cada paciente es único. Ofrecemos planes adaptados a sus necesidades estéticas y emocionales.",
    },
    {
      icon: "fa-hand-holding-medical",
      title: "Seguridad ante todo",
      text: "Procedimientos con protocolos médicos certificados y materiales aprobados.",
    },
    {
      icon: "fa-leaf",
      title: "Naturalidad y Armonía",
      text: "Buscamos resaltar tu belleza natural sin perder autenticidad.",
    },
    {
      icon: "fa-user-md",
      title: "Ciencia y Arte",
      text: "La medicina estética combina precisión médica con sensibilidad artística.",
    },
  ];

  return (
    <section
      style={{
        background: "linear-gradient(180deg,#F8F5F0 0%,#FAF9F7 100%)",
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
          Filosofía y Valores de la Práctica
        </h3>

        <div className="row justify-content-center g-4">
          {valores.map((v, i) => (
            <div key={i} className="col-md-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-4 shadow-sm h-100"
                style={{ background: "#fff", border: "1px solid #E9DED2" }}
              >
                <div style={{ fontSize: "2rem", color: "#B08968" }}>
                  <i className={`fas ${v.icon}`} />
                </div>
                <h5
                  className="fw-bold mt-3 mb-2"
                  style={{ color: "#4E3B2B" }}
                >
                  {v.title}
                </h5>
                <p className="text-muted" style={{ fontSize: ".95rem" }}>
                  {v.text}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
