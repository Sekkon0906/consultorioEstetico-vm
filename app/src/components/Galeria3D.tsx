"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getProcedimientosApi } from "../../services/procedimientosApi";
import { IMG } from "../lib/imagenes";
import type { Procedimiento } from "../../types/domain";

export default function Galeria3D() {
  const t = useTranslations("home.gallery");
  const ta = useTranslations("home.gallery_a11y");
  const [tratamientos, setTratamientos] = useState<Procedimiento[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    async function load() {
      try {
        const all = await getProcedimientosApi();
        setTratamientos(all.filter((p) => p.destacado));
      } catch (err) {
        console.error("Error cargando procedimientos para galería:", err);
      }
    }
    load();
  }, []);

  const radius = 380;
  const angle = tratamientos.length > 0 ? 360 / tratamientos.length : 0;

  // Rotación continua suave hacia la derecha (sentido horario visto desde arriba)
  useEffect(() => {
    if (isPaused || selected !== null) return;
    let frame: number;
    const animate = () => {
      setRotation((prev) => prev + 0.04);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, selected]);

  // Parallax discreto con el mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      setMouseTilt({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // PRNG determinista para partículas
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const particleCount = 18;
  const particles = useMemo(() => {
    const rng = mulberry32(98765);
    return Array.from({ length: particleCount }, (_, i) => {
      const theta = (i / particleCount) * 2 * Math.PI;
      const distance = 28 + rng() * 22;
      const size = 5 + rng() * 14;
      const dur = 3.5 + rng() * 3;
      const opacity = 0.22 + rng() * 0.25;
      const color =
        i % 3 === 0
          ? `rgba(255, 240, 220, ${opacity})`
          : `rgba(218, 188, 152, ${opacity})`;
      return { theta, distance, size, dur, color };
    });
  }, []);

  const getDepthStyles = (i: number) => {
    const relativeAngle = ((rotation / angle + i) % tratamientos.length) * angle;
    const normalized = Math.cos((relativeAngle * Math.PI) / 180);
    const scale = 0.85 + (normalized + 1) * 0.18;
    const brightness = 0.65 + normalized * 0.35;
    const zIndex = Math.round((normalized + 1) * 100);
    const isFront = normalized > 0.85;
    return { scale, brightness, zIndex, isFront };
  };

  const frontIndex =
    tratamientos.length > 0
      ? ((Math.round(-rotation / angle) % tratamientos.length) +
          tratamientos.length) %
        tratamientos.length
      : -1;

  const goToCard = (i: number) => {
    const target = -i * angle;
    setRotation(target);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 1800);
  };

  return (
    <div
      className="g3d-stage position-relative"
      style={{
        perspective: "1700px",
        width: "100%",
        height: selected ? "780px" : "680px",
        overflow: "hidden",
        transition: "height 0.45s cubic-bezier(0.16,1,0.3,1)",
        backgroundImage: `url(${IMG.galeria3dBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay sutil para legibilidad del contenido a la derecha */}
      <div
        aria-hidden="true"
        className="g3d-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(58,42,26,0) 0%, rgba(58,42,26,0) 40%, rgba(58,42,26,0.25) 70%, rgba(58,42,26,0.45) 100%)",
          zIndex: 1,
        }}
      />

      {/* Título arriba-derecha (sobre la imagen) */}
      <div
        className="g3d-title-wrap"
        style={{
          position: "absolute",
          top: "5%",
          right: 0,
          width: "55%",
          textAlign: "center",
          zIndex: 4,
          padding: "0 2rem",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#FFFDF9",
            fontWeight: 700,
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            margin: 0,
            textShadow: "0 4px 18px rgba(0,0,0,0.55)",
            letterSpacing: "0.01em",
          }}
        >
          {t("title")}
        </h2>
        <p
          style={{
            color: "rgba(255, 253, 249, 0.85)",
            fontSize: "0.95rem",
            marginTop: "0.55rem",
            marginBottom: 0,
            textShadow: "0 2px 10px rgba(0,0,0,0.55)",
          }}
        >
          {t("subtitle")}
        </p>
        <div
          style={{
            width: 44,
            height: 3,
            background:
              "linear-gradient(90deg, transparent, #E5D2C4, transparent)",
            borderRadius: 2,
            margin: "0.9rem auto 0",
          }}
        />
      </div>

      {/* Contenedor principal: rueda 3D posicionada a la derecha */}
      <div
        className="g3d-wheel-anchor"
        style={{
          position: "absolute",
          top: "55%",
          right: "20%",
          transform: "translateY(-50%)",
          zIndex: 3,
        }}
      >
        {/* Halo sutil detrás de la rueda */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 520,
            height: 520,
            transform: `translate(-50%, -50%) rotateX(${mouseTilt.y * 0.2}deg) rotateY(${mouseTilt.x * 0.2}deg)`,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 230, 200, 0.18) 0%, rgba(176,137,104,0.10) 45%, transparent 70%)",
            filter: "blur(40px)",
            animation: "g3d-halo 40s linear infinite",
            zIndex: 0,
            opacity: selected ? 0.4 : 1,
            transition: "opacity 0.45s",
            pointerEvents: "none",
          }}
        />

        {/* Partículas */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 600,
            height: 600,
            transform: `translate(-50%, -50%) rotate(${-(rotation * 0.4)}deg)`,
            transition: "transform 0.25s linear",
            zIndex: 1,
            pointerEvents: "none",
            opacity: selected ? 0.3 : 1,
          }}
        >
          {particles.map((p, i) => {
            const x = 50 + p.distance * Math.cos(p.theta);
            const y = 50 + p.distance * Math.sin(p.theta);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${y}%`,
                  left: `${x}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  borderRadius: "50%",
                  filter: "blur(2px)",
                  animation: `g3d-pulse ${p.dur}s ease-in-out infinite`,
                }}
              />
            );
          })}
        </div>

        {/* Estado: cargando */}
        {selected === null && tratamientos.length === 0 && (
          <div
            style={{
              width: 260,
              height: 340,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <div className="spinner-border" style={{ color: "#E5D2C4" }} role="status" />
          </div>
        )}

        {/* Rueda 3D */}
        {selected === null && tratamientos.length > 0 && (
          <div
            style={{
              position: "relative",
              width: 260,
              height: 340,
              transformStyle: "preserve-3d",
              transform: `rotateX(${5 + mouseTilt.y * 0.18}deg) rotateY(${rotation + mouseTilt.x * 0.25}deg)`,
              transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
              zIndex: 3,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {tratamientos.map((tr, i) => {
              const { scale, brightness, zIndex, isFront } = getDepthStyles(i);
              return (
                <div
                  key={tr.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: `rotateY(${i * angle}deg) translateZ(${radius}px) scale(${scale})`,
                    backfaceVisibility: "hidden",
                    zIndex,
                    filter: `brightness(${brightness})`,
                    transition: "filter 0.45s ease",
                  }}
                >
                  <div
                    className={`g3d-card ${isFront ? "is-front" : ""}`}
                    onClick={() => setSelected(tr.id)}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: 20,
                      overflow: "hidden",
                      backgroundColor: "#FFFDF9",
                      border: "1.5px solid rgba(255, 235, 215, 0.55)",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={tr.imagen || undefined}
                      alt={tr.nombre}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "45%",
                        background:
                          "linear-gradient(180deg, transparent 0%, rgba(30,20,10,0.0) 30%, rgba(30,20,10,0.55) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      className="g3d-badge"
                      style={{
                        position: "absolute",
                        left: 12,
                        right: 12,
                        bottom: 12,
                        padding: "0.55rem 0.8rem",
                        background: "rgba(255, 253, 249, 0.94)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(201,173,141,0.4)",
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(58,42,26,0.22)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.92rem",
                          fontWeight: 600,
                          color: "#3A2A1A",
                          fontFamily: "'Playfair Display', serif",
                          textAlign: "center",
                          letterSpacing: "0.01em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tr.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dots indicadores abajo-derecha */}
      {selected === null && tratamientos.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 34,
            right: "20%",
            transform: "translateX(50%)",
            display: "flex",
            gap: 8,
            zIndex: 5,
            padding: "0.45rem 0.85rem",
            background: "rgba(255, 253, 249, 0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 235, 215, 0.5)",
            borderRadius: 100,
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          {tratamientos.map((_, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
              aria-label={ta("goToCard", { n: i + 1 })}
              style={{
                width: i === frontIndex ? 24 : 8,
                height: 8,
                borderRadius: 100,
                background:
                  i === frontIndex
                    ? "linear-gradient(90deg, #B08968, #C9AD8D)"
                    : "rgba(176,137,104,0.4)",
                border: "none",
                cursor: "pointer",
                transition:
                  "width 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Detalle del tratamiento seleccionado */}
      {selected !== null && (
        <div
          className="g3d-detail"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#FFFDF9",
            width: "85%",
            maxWidth: 1000,
            display: "flex",
            flexDirection: "row",
            gap: "2.5rem",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(201,173,141,0.4)",
            borderRadius: 24,
            boxShadow:
              "0 28px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(176,137,104,0.08)",
            padding: "3rem 2.5rem 2.5rem",
            zIndex: 6,
            animation: "g3d-detail-in 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: 4,
              background:
                "linear-gradient(90deg, transparent 0%, #B08968 30%, #C9AD8D 50%, #B08968 70%, transparent 100%)",
              borderRadius: "0 0 4px 4px",
            }}
          />

          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute",
              top: 18,
              left: 22,
              background: "rgba(176,137,104,0.08)",
              border: "1px solid rgba(176,137,104,0.18)",
              color: "#5A4635",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              padding: "0.4rem 0.9rem",
              borderRadius: 100,
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.16)";
              e.currentTarget.style.transform = "translateX(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.08)";
              e.currentTarget.style.transform = "";
            }}
          >
            {t("back")}
          </button>

          <button
            onClick={() => setSelected(null)}
            aria-label={ta("close")}
            style={{
              position: "absolute",
              top: 16,
              right: 18,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(176,137,104,0.08)",
              border: "1px solid rgba(176,137,104,0.18)",
              color: "#5A4635",
              fontWeight: 600,
              fontSize: "1.1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.16)";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(176,137,104,0.08)";
              e.currentTarget.style.transform = "";
            }}
          >
            ×
          </button>

          <div
            style={{
              flex: "0 0 45%",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow:
                "0 12px 36px rgba(176,137,104,0.28), 0 0 0 1px rgba(176,137,104,0.12)",
              aspectRatio: "3 / 4",
              background: "#F5EEE5",
            }}
          >
            <img
              src={
                tratamientos.find((tr) => tr.id === selected)?.imagen ||
                "/placeholder.png"
              }
              alt={tratamientos.find((tr) => tr.id === selected)?.nombre || ""}
              style={{
                objectFit: "cover",
                objectPosition: "center top",
                width: "100%",
                height: "100%",
              }}
            />
          </div>

          <div style={{ flex: "0 0 45%", color: "#3A2A1A" }}>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                marginBottom: "0.8rem",
                fontSize: "1.7rem",
                lineHeight: 1.2,
              }}
            >
              {tratamientos.find((tr) => tr.id === selected)?.nombre}
            </h3>
            <div
              style={{
                width: 40,
                height: 3,
                background: "linear-gradient(90deg, #B08968, #C9AD8D)",
                borderRadius: 2,
                marginBottom: "1.2rem",
              }}
            />
            <p
              style={{
                color: "#6C584C",
                lineHeight: "1.7",
                fontSize: "1rem",
                marginBottom: "2rem",
              }}
            >
              {tratamientos.find((tr) => tr.id === selected)?.desc}
            </p>
            <Link
              href={
                "/procedimientos/" +
                (tratamientos.find((tr) => tr.id === selected)?.id || "")
              }
              className="fw-semibold"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #B08968, #C9AD8D)",
                color: "#FFF",
                borderRadius: 100,
                padding: "0.8rem 2rem",
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(176,137,104,0.32)",
                transition: "transform 0.2s, box-shadow 0.2s",
                fontSize: "0.95rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 24px rgba(176,137,104,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 6px 18px rgba(176,137,104,0.32)";
              }}
            >
              {t("viewMore")}
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Estilos globales */}
      <style jsx global>{`
        @keyframes g3d-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%      { transform: scale(1.35); opacity: 0.85; }
        }
        @keyframes g3d-halo {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes g3d-detail-in {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .g3d-card {
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(176, 137, 104, 0.08);
          transition: box-shadow 0.4s ease, transform 0.3s ease;
        }
        .g3d-card.is-front {
          box-shadow:
            0 24px 50px rgba(0, 0, 0, 0.45),
            0 0 36px rgba(255, 220, 180, 0.55),
            0 0 0 1.5px rgba(255, 235, 215, 0.6);
        }
        .g3d-card:hover {
          transform: translateY(-3px);
        }

        /* Responsive: en pantallas medianas y pequeñas la imagen se ve menos
           y la rueda se centra para no chocar con la figura. */
        @media (max-width: 1100px) {
          .g3d-wheel-anchor { right: 8% !important; }
          .g3d-title-wrap   { width: 70% !important; }
        }
        @media (max-width: 820px) {
          .g3d-stage        { background-position: 25% center !important; }
          .g3d-overlay      {
            background:
              linear-gradient(180deg, rgba(58,42,26,0.55) 0%, rgba(58,42,26,0.35) 35%, rgba(58,42,26,0.55) 100%) !important;
          }
          .g3d-wheel-anchor {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            transform: none !important;
            margin: 9rem auto 0 !important;
            display: flex;
            justify-content: center;
          }
          .g3d-title-wrap   {
            position: relative !important;
            width: 100% !important;
            top: auto !important;
            padding-top: 2.5rem !important;
          }
        }
        @media (max-width: 768px) {
          .g3d-detail {
            flex-direction: column !important;
            gap: 1.5rem !important;
            padding: 3rem 1.5rem 2rem !important;
            width: 92% !important;
          }
          .g3d-detail > div {
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
