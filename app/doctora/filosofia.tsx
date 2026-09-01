"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function Filosofia() {
  const t = useTranslations("doctora.filosofia");
  const icons = ["fa-heart", "fa-hand-holding-medical", "fa-leaf", "fa-user-md"];
  const values = t.raw("values") as Array<{ title: string; text: string }>;

  return (
    <section
      className="dark-aware-section filo-section"
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
          {t("title")}
        </h3>

        <div className="row justify-content-center g-4">
          {values.map((v, i) => (
            <div key={i} className="col-md-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="dark-aware-card p-4 rounded-4 shadow-sm h-100"
                style={{ background: "#fff", border: "1px solid #E9DED2" }}
              >
                <div style={{ fontSize: "2rem", color: "#B08968" }}>
                  <i className={`fas ${icons[i]}`} />
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
