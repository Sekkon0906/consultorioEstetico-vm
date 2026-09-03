"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#F6F4EF",
          color: "#3E2E22",
          minHeight: "var(--alto-pantalla, 100vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
            Error crítico
          </h1>
          <p style={{ color: "#6B5A4A", marginBottom: "1.5rem" }}>
            La aplicación no pudo iniciar correctamente.
            {error?.digest ? ` Código: ${error.digest}` : ""}
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#3E2E22",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "0.7rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar la app
          </button>
        </div>
      </body>
    </html>
  );
}
