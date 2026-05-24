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
    <article style={{ color: "#3A2A1A", lineHeight: 1.7 }}>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{ fontSize: "0.82rem", color: "#8A7565", marginBottom: "0.6rem" }}
      >
        <Link href="/" style={{ color: "#8A7565", textDecoration: "none" }}>
          Inicio
        </Link>{" "}
        ·{" "}
        <span style={{ color: "#4E3B2B" }}>Legal</span>{" "}
        · <span style={{ color: "#B08968", fontWeight: 600 }}>{titulo}</span>
      </nav>

      {/* Título */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.7rem, 1.2rem + 1.6vw, 2.4rem)",
          fontWeight: 700,
          color: "#3A2A1A",
          margin: "0 0 0.4rem",
        }}
      >
        {titulo}
      </h1>
      <p style={{ color: "#8A7565", fontSize: "0.85rem", margin: "0 0 1.4rem" }}>
        Última actualización: <strong>{actualizado}</strong>
      </p>

      {/* Navegación entre documentos */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          padding: "0.8rem 1rem",
          background: "#F5EEE6",
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
                background: active ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#FFFDF9",
                color: active ? "#FFF" : "#6C584C",
                border: "1px solid " + (active ? "transparent" : "rgba(176,137,104,0.18)"),
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
          color: #3A2A1A;
          margin: 1.8rem 0 0.6rem;
        }
        .legal-body h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #4E3B2B;
          margin: 1.2rem 0 0.4rem;
        }
        .legal-body p { margin: 0 0 0.9rem; color: #4E3B2B; font-size: 0.98rem; }
        .legal-body ul, .legal-body ol { margin: 0 0 1rem 1.2rem; color: #4E3B2B; font-size: 0.98rem; }
        .legal-body li { margin-bottom: 0.4rem; }
        .legal-body strong { color: #3A2A1A; }
        .legal-body a { color: #B08968; text-decoration: underline; }
        .legal-body code,
        .legal-placeholder {
          background: #FFF3E6;
          color: #8A5A12;
          padding: 0.05rem 0.4rem;
          border-radius: 6px;
          font-family: ui-monospace, monospace;
          font-size: 0.88em;
        }
      `}</style>
    </article>
  );
}
