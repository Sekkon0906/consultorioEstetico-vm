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
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
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
            color: "#E8C9A0",
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
            color: "#3E2E22",
          }}
        >
          Página no encontrada
        </h1>
        <p style={{ color: "#6B5A4A", marginBottom: "1.5rem" }}>
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
          <Link
            href="/"
            style={{
              background: "#3E2E22",
              color: "#FFFFFF",
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
              color: "#3E2E22",
              border: "1px solid #3E2E22",
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
