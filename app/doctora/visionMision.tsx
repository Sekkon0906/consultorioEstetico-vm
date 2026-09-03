"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function VisionMision() {
  const t = useTranslations("doctora.vision");
  return (
    <section
      className="dark-aware-section vm-section"
      style={{
        background: "linear-gradient(180deg,var(--bg) 0%,#F5EDE3 100%)",
        padding: "5rem 2rem",
      }}
    >
      <div className="container text-center">
        <motion.h3
          className="fw-bold mb-5"
          initial={{ y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            color: "var(--topbar-text)",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {t("title")}
        </motion.h3>

        <div className="row justify-content-center g-4">
          <div className="col-12 col-md-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: true }}
              className="dark-aware-card p-4 rounded-4 shadow-sm h-100"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <h4
                className="fw-bold mb-3"
                style={{
                  color: "#8C6D4F",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {t("missionTitle")}
              </h4>
              <p
                style={{
                  color: "var(--topbar-text)",
                  fontSize: "1.05rem",
                  lineHeight: "1.7",
                }}
              >
                {t("missionText")}
              </p>
            </motion.div>
          </div>

          <div className="col-12 col-md-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              initial={{ x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              viewport={{ once: true }}
              className="dark-aware-card p-4 rounded-4 shadow-sm h-100"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <h4
                className="fw-bold mb-3"
                style={{
                  color: "#8C6D4F",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {t("visionTitle")}
              </h4>
              <p
                style={{
                  color: "var(--topbar-text)",
                  fontSize: "1.05rem",
                  lineHeight: "1.7",
                }}
              >
                {t("visionText")}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
