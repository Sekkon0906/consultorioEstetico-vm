"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      router.push("/login");
    }, 2500);
  };

  return (
    <section
      style={{
        background: "linear-gradient(180deg, #FAF9F7 0%, #F1E9E0 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container text-center">
        <div className="col-md-6 mx-auto">
          <div
            className="card shadow-lg border-0 rounded-4 animate-fadein"
            style={{ backgroundColor: "#FFFDF9" }}
          >
            <div className="card-body p-5">
              <h2
                className="fw-bold mb-3"
                style={{
                  color: "#4E3B2B",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Recuperar contraseña
              </h2>
              <p className="text-muted mb-4">
                Ingresa tu correo para recibir un enlace de recuperación.
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="tucorreo@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    borderColor: "#E9DED2",
                    backgroundColor: "#FFFDF9",
                  }}
                />

                <button
                  type="submit"
                  className="btn w-100 py-2 fw-semibold"
                  style={{
                    backgroundColor: "#B08968",
                    border: "none",
                    color: "#FFF",
                    borderRadius: "50px",
                  }}
                  disabled={sent}
                >
                  {sent ? "Enviando enlace..." : "Enviar enlace"}
                </button>
              </form>

              <p
                onClick={() => router.push("/login")}
                style={{
                  color: "#B08968",
                  textDecoration: "underline",
                  marginTop: "1rem",
                  cursor: "pointer",
                }}
              >
                Volver al inicio de sesión
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadein {
          animation: fadein 0.6s ease forwards;
        }
      `}</style>
    </section>
  );
}
