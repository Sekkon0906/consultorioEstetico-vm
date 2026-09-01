"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const PAGES = [
  { href: "/legal/privacidad", label: "Política de Privacidad" },
  { href: "/legal/terminos", label: "Términos y Condiciones" },
  { href: "/legal/cookies", label: "Política de Cookies" },
  { href: "/legal/aviso", label: "Aviso de Privacidad" },
];

interface Props {
  titulo: string;
  actualizado: string; // "DD de mes de YYYY" o "[FECHA_ACTUALIZACION]"
  current: string; // href actual
  children: ReactNode;
}

/**
 * Cabecera + navegación + footer comunes a cada documento legal.
 */
export default function LegalDoc({ titulo, actualizado, current, children }: Props) {
  return (
    <article style={{ color: "var(--text)", lineHeight: 1.7 }}>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}
      >
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Inicio
        </Link>{" "}
        ·{" "}
        <span style={{ color: "var(--text-soft)" }}>Legal</span>{" "}
        · <span style={{ color: "var(--brand)", fontWeight: 600 }}>{titulo}</span>
      </nav>

      {/* Título */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.7rem, 1.2rem + 1.6vw, 2.4rem)",
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 0.4rem",
        }}
      >
        {titulo}
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 1.4rem" }}>
        Última actualización: <strong>{actualizado}</strong>
      </p>

      {/* Navegación entre documentos */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          padding: "0.8rem 1rem",
          background: "var(--surface-soft)",
          borderRadius: 14,
          marginBottom: "1.8rem",
        }}
      >
        {PAGES.map((p) => {
          const active = p.href === current;
          return (
            <Link
              key={p.href}
              href={p.href}
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                padding: "0.35rem 0.9rem",
                borderRadius: 100,
                background: active ? "linear-gradient(135deg, var(--brand), var(--brand-soft))" : "var(--bg-elevated)",
                color: active ? "#FFF" : "var(--text-soft)",
                border: "1px solid " + (active ? "transparent" : "var(--border)"),
                boxShadow: active ? "0 2px 10px rgba(176,137,104,0.25)" : "none",
              }}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {/* Contenido del documento */}
      <div className="legal-body">{children}</div>

      {/* Estilos comunes para el body legal */}
      <style>{`
        .legal-body h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text);
          margin: 1.8rem 0 0.6rem;
        }
        .legal-body h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-soft);
          margin: 1.2rem 0 0.4rem;
        }
        .legal-body p { margin: 0 0 0.9rem; color: var(--text-soft); font-size: 0.98rem; }
        .legal-body ul, .legal-body ol { margin: 0 0 1rem 1.2rem; color: var(--text-soft); font-size: 0.98rem; }
        .legal-body li { margin-bottom: 0.4rem; }
        .legal-body strong { color: var(--text); }
        .legal-body a { color: var(--brand); text-decoration: underline; }
        .legal-body code,
        .legal-placeholder {
          background: var(--surface-soft);
          color: var(--brand-deep);
          padding: 0.05rem 0.4rem;
          border-radius: 6px;
          font-family: ui-monospace, monospace;
          font-size: 0.88em;
        }
      `}</style>
    </article>
  );
}
