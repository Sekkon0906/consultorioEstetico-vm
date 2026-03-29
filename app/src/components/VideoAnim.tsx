"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function VideoAnim() {
  const [videoActivo, setVideoActivo] = useState(false);
  const [startCount, setStartCount] = useState(false);
  const countersRef = useRef<HTMLDivElement | null>(null);

  /** Detectar visibilidad de la sección */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStartCount(true);
          observer.disconnect(); // Solo una vez
        }
      },
      { threshold: 0.3 }
    );

    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  /** Componente contador animado */
  const Counter = ({
    value,
    label,
    suffix = "+",
    position = "left",
    duration = 1500, // duración de animación
  }: {
    value: number;
    label: string;
    suffix?: string;
    position?: "left" | "right";
    duration?: number;
  }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!startCount) return;
      let start: number | null = null;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        setCount(Math.floor(progress * value));
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }, [startCount, value, duration]);

    return (
      <div
        className="shared-float d-flex flex-column align-items-center justify-content-center text-center gap-1"
        style={{ minHeight: "110px", width: "100%" }}
      >
        <div
          className={`d-flex align-items-baseline justify-content-center ${
            position === "right" ? "flex-row-reverse" : ""
          }`}
          style={{
            gap: "0.5rem",
            padding: "0.9rem 1.4rem",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #FFF7F0, #F3E2D4)",
            boxShadow: "0 6px 16px rgba(176,137,104,0.18)",
            border: "1px solid rgba(176,137,104,0.35)",
          }}
        >
          <div
            className="fw-bold"
            style={{
              fontSize: "2.4rem",
              color: "#4E3B2B",
            }}
          >
            {value === 4.9 ? count.toFixed(1) : count}
            {suffix}
          </div>
        </div>
        <small
          style={{
            color: "#6C584C",
            fontWeight: 500,
            marginTop: "0.5rem",
          }}
        >
          {label}
        </small>
      </div>
    );
  };

  return (
    <section
      className="py-5"
      style={{
        background: "linear-gradient(180deg, #FAF9F7 0%, #FFFFFF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="halo-bg"></div>
      <div className="particles"></div>

      <div className="container-fluid text-center mb-5 fade-in">
        <h2
          className="fw-bold shimmer"
          style={{
            color: "#4E3B2B",
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.7rem",
          }}
        >
          ¿Por qué realizar consultas y procedimientos en este consultorio?
        </h2>
        <p
          style={{
            color: "#6C584C",
            fontSize: "1.15rem",
            marginTop: "0.5rem",
          }}
        >
          Calidad, experiencia y resultados que hablan por sí solos.
        </p>
      </div>

      <div className="container-fluid px-5">
        <div className="row align-items-stretch justify-content-between g-5">
          {/* IZQUIERDA */}
          <div className="col-lg-3 glass-col glass-col-left d-flex flex-column justify-content-center align-items-center text-center shared-float">
            <h3
              className="fw-bold mb-4 shimmer"
              style={{
                color: "#4E3B2B",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Cosas a tener en cuenta
            </h3>
            <ul
              className="list-unstyled d-flex flex-column justify-content-center align-items-center gap-3 w-100"
              style={{ fontSize: "1.05rem", color: "#4E3B2B" }}
            >
              {[
                "Uso de tecnología Hydrafacial",
                "Productos de última generación",
                "Procedimientos indoloros",
                "Atención cálida y personalizada",
              ].map((text, i) => (
                <li
                  key={i}
                  className="d-flex align-items-center justify-content-start shared-float"
                  style={{
                    minHeight: "60px",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.9rem 1.3rem",
                    borderRadius: "999px",
                    background:
                      "linear-gradient(90deg, #FFF8F2 0%, #F1E0D2 100%)",
                    boxShadow: "0 4px 10px rgba(176,137,104,0.08)",
                    border: "1px solid rgba(176,137,104,0.28)",
                    color: "#4E3B2B",
                    fontWeight: 500,
                  }}
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* VIDEO CENTRAL */}
          <div className="col-lg-6 text-center fade-up d-flex align-items-center justify-content-center">
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "48%",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 14px 35px rgba(176,137,104,0.3)",
                cursor: "pointer",
                border: "5px solid #E9DED2",
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(6px)",
              }}
              onClick={() => setVideoActivo(true)}
            >
              {videoActivo ? (
                <iframe
                  src="https://www.youtube.com/embed/pBkwUM0IpTE?autoplay=1&modestbranding=1&rel=0"
                  title="Por qué nosotros - Dra. Vanessa Medina"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    borderRadius: "18px",
                    animation: "fadeZoomIn 0.6s ease forwards",
                  }}
                />
              ) : (
                <>
                  <Image
                    src="/imagenes/preview_video.jpg"
                    alt="Video portada"
                    fill
                    style={{
                      objectFit: "cover",
                      filter: "brightness(0.85)",
                      borderRadius: "18px",
                    }}
                  />
                  <div className="play-button">
                    <i className="fas fa-play"></i>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DERECHA */}
          <div
            className="col-lg-3 glass-col glass-col-right d-flex flex-column justify-content-center align-items-center text-center shared-float"
            ref={countersRef}
          >
            <h3
              className="fw-bold mb-4 shimmer"
              style={{
                color: "#4E3B2B",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              La experiencia habla
            </h3>
            <div className="d-flex flex-column justify-content-center align-items-center gap-4 w-100">
              <Counter
                value={680}
                label="Pacientes satisfechos"
                suffix="+"
                position="right"
              />
              <Counter
                value={15}
                label="Tratamientos especializados"
                suffix="+"
                position="right"
              />
              <Counter
                value={4}
                label="Años de experiencia"
                suffix="+"
                position="right"
              />
              <Counter
                value={5}
                label="Calificación promedio"
                suffix="/5"
                position="right"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes sharedFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-4px);
          }
          50% {
            transform: translateY(-8px);
          }
          75% {
            transform: translateY(-4px);
          }
        }
        .shared-float {
          animation: sharedFloat 4.5s ease-in-out infinite;
        }

        .glass-col {
          border-radius: 18px;
          padding: 2.5rem;
          box-shadow: 0 6px 18px rgba(176, 137, 104, 0.18);
          min-height: 100%;
        }

        .glass-col-left {
          background: linear-gradient(
            145deg,
            rgba(255, 253, 252, 0.96),
            rgba(247, 236, 223, 0.98)
          );
          border: 1px solid rgba(176, 137, 104, 0.3);
        }

        .glass-col-right {
          background: linear-gradient(
            145deg,
            rgba(255, 253, 252, 0.96),
            rgba(244, 231, 218, 0.98)
          );
          border: 1px solid rgba(176, 137, 104, 0.35);
        }

        .halo-bg {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 80%;
          background: radial-gradient(
            circle,
            rgba(255, 230, 210, 0.35) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          filter: blur(80px);
        }

        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(
            rgba(255, 230, 200, 0.4) 1px,
            transparent 1px
          );
          background-size: 80px 80px;
          animation: moveParticles 20s linear infinite;
          opacity: 0.35;
        }
        @keyframes moveParticles {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 100px 200px;
          }
        }

        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 2rem;
          transition: all 0.3s ease;
        }
        .play-button:hover {
          background: rgba(0, 0, 0, 0.75);
          transform: translate(-50%, -50%) scale(1.08);
        }
      `}</style>
    </section>
  );
}
