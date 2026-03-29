"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./FondoAnimado.module.css";

export default function FondoAnimado({ tipo }: { tipo: string | null }) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((prev) => prev + 1);
  }, [tipo]);

  const bgClass =
    tipo === "Explora los procedimientos faciales"
      ? styles.facial
      : tipo === "Explora los procedimientos corporales"
      ? styles.corporal
      : tipo === "Explora los procedimientos capilares"
      ? styles.capilar
      : "";

  // Si no hay tipo activo, fondo neutro
  const fallbackBackground = "linear-gradient(180deg, #FAF9F7 0%, #FFFFFF 100%)";

  return (
    <motion.div
      key={animKey}
      className={`${styles.fondoBase} ${bgClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{
        background: tipo ? undefined : fallbackBackground,
      }}
    >
      {/* Capa opcional de atmósfera */}
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: tipo ? 0.4 : 0 }}
        transition={{ duration: 1.2 }}
      />
    </motion.div>
  );
}
