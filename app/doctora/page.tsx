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
    /* Tokens y no valores fijos: este esqueleto se ve mientras carga el
       bloque de abajo, y en tema oscuro un fondo crema con letra marrón
       aparecía como un recuadro claro clavado en mitad de la página. */
    <section style={{ minHeight: "30vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
      <div style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>Cargando formación…</div>
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
