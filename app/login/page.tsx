"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import { PALETTE } from "./palette2";
import PanelAcceso from "@/components/PanelAcceso";

/* El fondo 3D (FondoAnim) sale de aqui. Con la pantalla partida, la mitad
   derecha ya es una foto a sangre: dos fondos compitiendo se estorban, y el
   de Three.js costaba una descarga y una animacion continua para quedar
   tapado. El texto tampoco esta ya centrado sobre el, asi que su unico
   efecto era ruido detras del formulario. */

export default function LoginPage() {
  const [err, setErr] = useState<string | null>(null);

  return (
    <PanelAcceso modo="entrar">
      <div className={err ? "shake" : ""} style={{ transition: "all 0.4s ease" }}>
        <h1
          className="fw-bold mb-1"
          style={{ color: PALETTE.text, fontFamily: "'Playfair Display', serif", fontSize: "1.85rem" }}
        >
          Iniciar sesión
        </h1>
        <p className="mb-4" style={{ color: PALETTE.muted, fontSize: "0.95rem" }}>
          Ingresa tus credenciales para disfrutar de todo lo que ofrecemos.
        </p>
        {err && (
          <div
            className="alert alert-danger"
            style={{ backgroundColor: "#FCEAEA", color: "#8C2B2B", border: "1px solid #E3B4A0" }}
          >
            {err}
          </div>
        )}
        <LoginForm setErr={setErr} />
      </div>

      <style jsx>{`
        .shake { animation: shake 0.45s ease; }
        @keyframes shake {
          0%  { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100%{ transform: translateX(0); }
        }
      `}</style>
    </PanelAcceso>
  );
}