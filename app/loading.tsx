export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "2rem",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(62,46,34,0.15)",
          borderTopColor: "#3E2E22",
          animation: "spin-loading 0.9s linear infinite",
        }}
      />
      <div
        style={{
          color: "#6B5A4A",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.95rem",
          letterSpacing: "0.02em",
        }}
      >
        Cargando…
      </div>
      <style>{`@keyframes spin-loading { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
