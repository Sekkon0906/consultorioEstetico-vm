import type { ReactNode } from "react";

/**
 * Layout compartido para las páginas legales (/legal/*).
 * Tipografía amplia, navegación entre documentos, breadcrumb.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FAF9F7 0%, #F4EBE2 100%)",
        padding: "3rem 1.25rem 4rem",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          background: "#FFFDF9",
          borderRadius: 24,
          border: "1px solid rgba(176,137,104,0.12)",
          boxShadow: "0 12px 40px rgba(78,59,43,0.06)",
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
