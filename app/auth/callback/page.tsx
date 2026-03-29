"use client";

import { useState, useEffect } from "react";
import FondoAnim from "@/components/FondoAnim";
import { getTestimoniosApi } from "../../services/testimoniosApi";
import type { Testimonio } from "../../types/domain";

export default function TestimoniosPage() {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [videoActivo, setVideoActivo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTestimoniosApi()
      .then((data) => setTestimonios(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const ytMatch = url.match(/(?:v=|youtu\.be\/)([^&?]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return url;
  };

  return (
    <main
      style={{
        position: "relative", overflow: "hidden",
        minHeight: "100vh", padding: "5rem 2rem", backgroundColor: "#FAF7F2",
      }}
    >
      <div className="absolute inset-0 z-0">
        <FondoAnim />
      </div>

      <div className="container position-relative" style={{ zIndex: 1, maxWidth: 1100 }}>
        <h1
          className="text-center fw-bold mb-2"
          style={{ color: "#4E3B2B", fontFamily: "'Playfair Display', serif", fontSize: "2.6rem" }}
        >
          Testimonios
        </h1>
        <p className="text-center mb-5" style={{ color: "#8B6A4B" }}>
          Lo que dicen nuestras pacientes sobre sus resultados.
        </p>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "#B08968" }} role="status" />
          </div>
        ) : testimonios.length === 0 ? (
          <p className="text-center" style={{ color: "#8B6A4B" }}>
            Aún no hay testimonios publicados.
          </p>
        ) : (
          <div className="row g-4">
            {testimonios.map((t) => (
              <div key={t.id} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 rounded-4 shadow-sm h-100"
                  style={{ backgroundColor: "#FFFDF9" }}
                >
                  {/* Thumbnail / video */}
                  <div
                    className="position-relative rounded-top-4 overflow-hidden"
                    style={{ height: 200, backgroundColor: "#E9DED2", cursor: t.video ? "pointer" : "default" }}
                    onClick={() => t.video && setVideoActivo(t.id)}
                  >
                    {videoActivo === t.id ? (
                      <iframe
                        src={getEmbedUrl(t.video)}
                        title={t.nombre}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", border: "none" }}
                      />
                    ) : (
                      <>
                        {t.thumb ? (
                          <img
                            src={t.thumb}
                            alt={t.nombre}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <span style={{ fontSize: "3rem" }}></span>
                          </div>
                        )}
                        {t.video && (
                          <div
                            className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 52, height: 52, backgroundColor: "rgba(0,0,0,0.55)" }}
                          >
                            <span style={{ color: "#fff", fontSize: "1.4rem" }}></span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="card-body p-4">
                    {t.destacado && (
                      <span
                        className="badge rounded-pill mb-2 px-3"
                        style={{ backgroundColor: "#FFF3E6", color: "#B08968" }}
                      >
                         Destacado
                      </span>
                    )}
                    <h5 className="fw-bold mb-2" style={{ color: "#4E3B2B" }}>
                      {t.nombre}
                    </h5>
                    <p style={{ color: "#6C584C", fontSize: "0.9rem", lineHeight: 1.6 }}>
                      "{t.texto}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}