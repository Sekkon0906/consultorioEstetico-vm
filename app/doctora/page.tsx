"use client";

import dynamic from "next/dynamic";
import HeroDoctora from "./heroDoctora";

// Bloques debajo del fold: defer y sin SSR para ahorrar bundle inicial.
// FormacionContinua trae timeline + modal con galería pesada.
const VisionMision = dynamic(() => import("./visionMision"));
const Filosofia = dynamic(() => import("./filosofia"));
const FormacionContinua = dynamic(() => import("./formacionContinua"), {
  ssr: false,
  loading: () => (
    <section style={{ minHeight: "30vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF8F4" }}>
      <div style={{ color: "#8B7060", fontSize: "0.85rem" }}>Cargando formación…</div>
    </section>
  ),
});

export default function DoctoraPage() {
  return (
    <main>
      <HeroDoctora />
      <VisionMision />
      <Filosofia />
      <FormacionContinua />
    </main>
  );
}
