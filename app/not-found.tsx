import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          textAlign: "center",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "4.5rem",
            lineHeight: 1,
            color: "var(--brand)",
            marginBottom: "0.5rem",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.8rem",
            margin: 0,
            marginBottom: "0.6rem",
            color: "var(--text)",
          }}
        >
          Página no encontrada
        </h1>
        <p style={{ color: "var(--text-soft)", marginBottom: "1.5rem" }}>
          La página que buscas no existe o fue movida. Te invitamos a explorar
          los procedimientos o volver al inicio.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* `btn-accion` no es solo la animacion: es lo unico que exime a
              este enlace del reset global `a { color: inherit !important }`.
              Sin la clase, el color en linea de abajo pierde contra ese
              !important, el enlace hereda el crema del texto de la pagina y
              queda crema sobre crema — un boton vacio. Ya paso una vez con
              "Agendar este procedimiento". */}
          <Link
            href="/"
            className="btn-accion"
            style={{
              background: "var(--brand-deep)",
              color: "var(--brand-contrast)",
              borderRadius: 999,
              padding: "0.7rem 1.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </Link>
          <Link
            href="/procedimientos"
            style={{
              background: "transparent",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
              borderRadius: 999,
              padding: "0.7rem 1.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ver procedimientos
          </Link>
        </div>
      </div>
    </div>
  );
}
