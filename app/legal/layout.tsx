import type { ReactNode } from "react";

/**
 * Layout compartido para las páginas legales (/legal/*).
 * Tipografía amplia, navegación entre documentos, breadcrumb.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "var(--alto-pantalla, 100vh)",
        background: "var(--bg)",
        padding: "3rem 1.25rem 4rem",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          background: "var(--surface)",
          borderRadius: 24,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #B08968, #C9AD8D)" }} />
        <div style={{ padding: "2.5rem clamp(1.25rem, 4vw, 3rem) 3rem" }}>
          {children}
        </div>
      </div>
    </main>
  );
}
