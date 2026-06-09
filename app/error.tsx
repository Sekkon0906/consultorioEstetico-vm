"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reporta a Sentry (si está configurado) y deja log local para debug
    Sentry.captureException(error);
    console.error("[App error]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          textAlign: "center",
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 20,
          padding: "2.25rem 2rem",
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>⚠️</div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.6rem",
            margin: 0,
            marginBottom: "0.6rem",
            color: "#3E2E22",
          }}
        >
          Algo no salió como esperábamos
        </h2>
        <p style={{ color: "#6B5A4A", marginBottom: "1.5rem" }}>
          Tuvimos un problema cargando esta sección. Puedes intentar de nuevo o
          volver al inicio.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              background: "#3E2E22",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "0.65rem 1.4rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <Link
            href="/"
            style={{
              background: "transparent",
              color: "#3E2E22",
              border: "1px solid #3E2E22",
              borderRadius: 999,
              padding: "0.65rem 1.4rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
