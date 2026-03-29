"use client";

import PerfilCard from "./perfilCard";
import { PALETTE } from "./palette";

export default function EditarInfoPage() {
  return (
    <section
      className="py-5 d-flex justify-content-center align-items-start"
      style={{
        background: `linear-gradient(180deg,#FAF9F7 0%,#F1E9E0 100%)`,
        minHeight: "100vh",
      }}
    >
      <div className="container mt-4" style={{ maxWidth: 1000 }}>
        <PerfilCard />
      </div>
    </section>
  );
}
