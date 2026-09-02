"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { solicitarRecuperacion } from "@/lib/sesion";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Ingresa un correo válido.");
      return;
    }
    setSending(true);
    try {
      // Responde igual exista o no la cuenta: no revela qué correos hay.
      await solicitarRecuperacion(email);
      setOk(true);
      setTimeout(() => router.push("/login"), 4000);
    } catch {
      setError(
        "No se pudo enviar el enlace. Verifica el correo e inténtalo de nuevo."
      );
    } finally {
      setSending(false);
    }
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
            style={{ backgroundColor: "var(--surface)" }}
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

              {ok ? (
                <div
                  className="p-3 mb-2 rounded-3"
                  style={{ background: "#EAF6EC", color: "#2E7D32", fontSize: "0.92rem" }}
                >
                  Si el correo está registrado, te enviamos un enlace para
                  restablecer tu contraseña. Revisa tu bandeja (y spam).
                  Te llevaremos al inicio de sesión…
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    className="form-control mb-2"
                    placeholder="tucorreo@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                    }}
                  />

                  {error && (
                    <p
                      className="mb-2"
                      style={{ color: "#b02e2e", fontSize: "0.85rem" }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn w-100 py-2 fw-semibold"
                    style={{
                      backgroundColor: "var(--brand)",
                      border: "none",
                      color: "#FFF",
                      borderRadius: "50px",
                    }}
                    disabled={sending}
                  >
                    {sending ? "Enviando enlace..." : "Enviar enlace"}
                  </button>
                </form>
              )}

              <p
                onClick={() => router.push("/login")}
                style={{
                  color: "var(--brand)",
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
