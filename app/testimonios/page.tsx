"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import FondoAnim from "../src/components/FondoAnim";
import ComentariosClientes from "../src/components/ComentariosClientes";
import type { Testimonio } from "../types/domain";
import { getTestimoniosApi } from "../services/testimoniosApi";

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

function tieneVideoValido(video: string | null | undefined): boolean {
  if (!video || !video.trim()) return false;
  const embedUrl = toEmbedUrl(video);
  return embedUrl.includes("youtube.com/embed/") || embedUrl.includes("youtu.be");
}

export default function TestimoniosPage() {
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [videoActivo, setVideoActivo] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getTestimoniosApi()
      .then((data) => {
        if (isMounted) setTestimonios(data);
      })
      .catch(console.error);
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        padding: "5rem 2rem",
        backgroundColor: "#FAF7F2",
      }}
    >
      <div className="absolute inset-0 z-0">
        <FondoAnim />
      </div>

      <div className="relative z-10 container position-relative">
        {/* Encabezado */}
        <div
          className="mx-auto mb-5 p-4 text-center rounded-3 shadow-sm backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            maxWidth: "800px",
            border: "1px solid #E9DED2",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            className="fw-bold mb-3"
            style={{
              color: "#4E3B2B",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Testimonios de Nuestros Pacientes
          </h2>
          <p
            className="lead mb-0"
            style={{ color: "#6C584C", lineHeight: "1.6" }}
          >
            Experiencias reales de pacientes que confiaron en la Dra. Vanessa
            Medina para transformar su bienestar y su confianza.
          </p>
        </div>

        {/* Tarjetas */}
        {testimonios.length === 0 ? (
          <p className="text-center text-muted">
            No hay testimonios disponibles por el momento.
          </p>
        ) : (
          <div className="row g-4 justify-content-center">
            {testimonios
              .filter((t) => t.activo)
              .sort(
                (a, b) =>
                  new Date(b.creadoEn).getTime() -
                  new Date(a.creadoEn).getTime()
              )
              .map((t, index) => {
                const videoValido = tieneVideoValido(t.video);

                return (
                  <div
                    key={t.id}
                    className="col-md-6 col-lg-4"
                    style={{
                      animation: `fadeInUp 0.8s ease ${index * 0.1}s both`,
                    }}
                  >
                    <div
                      className="rounded-4 shadow-sm overflow-hidden"
                      style={{
                        backgroundColor: "#FFFDF9",
                        border: "1px solid #E9DED2",
                        transition: "all 0.3s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "translateY(-6px)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "translateY(0)")
                      }
                    >
                      {/* Video / Thumbnail */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "177%",
                          overflow: "hidden",
                          backgroundColor: "#000",
                          borderRadius: "12px 12px 0 0",
                        }}
                      >
                        {videoActivo === t.id && videoValido ? (
                          <iframe
                            src={`${toEmbedUrl(t.video)}?autoplay=1&modestbranding=1&rel=0`}
                            title={`Testimonio de ${t.nombre}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: "none",
                              borderRadius: "12px 12px 0 0",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              cursor: videoValido ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (videoValido) {
                                setVideoActivo(t.id);
                              }
                            }}
                          >
                            {t.thumb ? (
                              <Image
                                src={t.thumb}
                                alt={t.nombre}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                style={{
                                  objectFit: "cover",
                                  borderRadius: "12px 12px 0 0",
                                  filter: "brightness(0.9)",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  background:
                                    "linear-gradient(135deg,#4E3B2B,#B08968)",
                                }}
                              />
                            )}
                            {videoValido && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  borderRadius: "50%",
                                  width: 70,
                                  height: 70,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <i
                                  className="fas fa-play"
                                  style={{
                                    color: "#FFF",
                                    fontSize: "1.5rem",
                                  }}
                                ></i>
                              </div>
                            )}
                            {!videoValido && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 12,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  padding: "4px 12px",
                                  borderRadius: 20,
                                }}
                              >
                                Sin video disponible
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-3 text-center">
                        <h5
                          className="fw-bold mb-2"
                          style={{
                            color: "#4E3B2B",
                            fontFamily: "'Playfair Display', serif",
                          }}
                        >
                          {t.nombre}
                        </h5>
                        <p
                          className="text-muted mb-0"
                          style={{
                            color: "#6C584C",
                            fontSize: "0.95rem",
                            lineHeight: "1.5",
                          }}
                        >
                          &quot;{t.texto}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mt-5">
          <ComentariosClientes />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
