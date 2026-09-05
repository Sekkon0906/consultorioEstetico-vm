"use client";

import { useState } from "react";
/* Ruta relativa y no `@/`: el alias apunta a `src/` (baseUrl), asi que no
   alcanza `app/`. */
import LoginForm from "../../app/login/LoginForm";
import { PALETTE } from "../../app/login/palette2";

/**
 * El bloque de iniciar sesión, sacado de la página a su propio componente.
 *
 * Solo se movió código: encabezado, aviso de error y el formulario, que ya
 * vivía aparte en `LoginForm`. Existe para que `PantallaAcceso` pueda tenerlo
 * vivo en el mismo árbol que el asistente de registro, que es lo que permite
 * animar el cruce entre los dos en vez de navegar.
 */
export default function FormularioEntrar({ onCrearCuenta }: { onCrearCuenta?: () => void }) {
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className={err ? "shake" : ""}>
      <h1
        className="fw-bold mb-1"
        style={{
          color: PALETTE.text,
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.85rem",
        }}
      >
        Iniciar sesión
      </h1>
      <p className="mb-4" style={{ color: PALETTE.muted, fontSize: "0.95rem" }}>
        Ingresa tus credenciales para disfrutar de todo lo que ofrecemos.
      </p>

      {err && (
        <div
          className="alert alert-danger"
          style={{
              /* Derivado de `--danger` con `color-mix` en vez de tres codigos
                 fijos. Los que habia —#FCEAEA, #8C2B2B, #E3B4A0— estaban
                 pensados solo para el tema claro: sobre el fondo oscuro el
                 aviso salia como un rectangulo casi blanco. Al derivarlo del
                 token, el fondo se mezcla con la superficie del tema que este
                 puesto y funciona en los dos. */
              backgroundColor: "color-mix(in srgb, var(--danger) 12%, var(--surface))",
              color: "var(--danger)",
              border: "1px solid color-mix(in srgb, var(--danger) 35%, var(--surface))",
            }}
        >
          {err}
        </div>
      )}

      <LoginForm setErr={setErr} onCrearCuenta={onCrearCuenta} />

      <style jsx>{`
        .shake { animation: shake 0.45s ease; }
        @keyframes shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .shake { animation: none; }
        }
      `}</style>
    </div>
  );
}
