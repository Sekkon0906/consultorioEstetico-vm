"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProcedimientosApi } from "../../services/procedimientosApi"; //  API real
import type { Procedimiento } from "../../types/domain";

export default function Galeria3D() {
  const [tratamientos, setTratamientos] = useState<Procedimiento[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  //  Cargar procedimientos destacados desde el backend
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

  const radius = 360;
  const angle = tratamientos.length > 0 ? 360 / tratamientos.length : 0;

  // Rotación continua
  useEffect(() => {
    if (isPaused || selected !== null) return;
    let frame: number;
    const animate = () => {
      setRotation((prev) => prev + 0.06);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, selected]);

  // Parallax con el mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
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

  const particleCount = 16;
  const particles = useMemo(() => {
    const rng = mulberry32(98765);
    return Array.from({ length: particleCount }, (_, i) => {
      const theta = (i / particleCount) * 2 * Math.PI;
      const size = 10 + rng() * 25;
      const dur = 3 + rng() * 3;
      const color =
        i % 2 === 0 ? "rgba(176, 137, 104, 0.25)" : "rgba(150, 120, 90, 0.15)";
      return { theta, size, dur, color };
    });
  }, []);

  const getDepthStyles = (i: number) => {
    const relativeAngle = ((rotation / angle + i) % tratamientos.length) * angle;
    const normalized = Math.cos((relativeAngle * Math.PI) / 180);
    const scale = 1 + normalized * 0.25;
    const brightness = 0.7 + normalized * 0.3;
    const zIndex = Math.round(normalized * 100);
    return { scale, brightness, zIndex };
  };

  return (
    <div
      className="position-relative d-flex justify-content-center align-items-center"
      style={{
        perspective: "1600px",
        width: "100%",
        height: selected ? "700px" : "600px",
        overflow: "hidden",
        transition: "height 0.4s ease",
        background: "radial-gradient(circle at center, #fffaf6 15%, #f4ece4 90%)",
      }}
    >
      {/* Halo giratorio */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "550px",
          height: "550px",
          transform: `translate(-50%, -50%) rotateX(${mouseTilt.y * 0.3}deg) rotateY(${mouseTilt.x * 0.3}deg)`,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, rgba(255,200,150,0.25), rgba(255,150,200,0.15), rgba(255,240,200,0.25), rgba(255,200,150,0.25))",
          filter: "blur(40px)",
          animation: "haloSpin 25s linear infinite, hueShift 15s ease-in-out infinite",
          zIndex: 1,
        }}
      />

      {/* Partículas */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          zIndex: 0,
          transform: `rotate(${-(rotation * 0.5)}deg)`,
          transition: "transform 0.2s linear",
        }}
      >
        {particles.map((p, i) => {
          const x = 50 + 40 * Math.cos(p.theta);
          const y = 50 + 40 * Math.sin(p.theta);
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
                animation: `pulse ${p.dur}s ease-in-out infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Rueda 3D */}
      {selected === null && tratamientos.length > 0 && (
        <div
          style={{
            position: "relative",
            width: "280px",
            height: "230px",
            transformStyle: "preserve-3d",
            transform: `rotateX(${3 + mouseTilt.y * 0.2}deg) rotateY(${rotation + mouseTilt.x * 0.3}deg)`,
            transition: "transform 0.3s ease-out",
            zIndex: 2,
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {tratamientos.map((t, i) => {
            const { scale, brightness, zIndex } = getDepthStyles(i);
            return (
              <div
                key={t.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  transform: `rotateY(${i * (360 / tratamientos.length)}deg) translateZ(${radius}px) scale(${scale})`,
                  backfaceVisibility: "hidden",
                  zIndex,
                  filter: `brightness(${brightness})`,
                }}
              >
                <div
                  className="card3d"
                  onClick={() => setSelected(t.id)}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "85%",
                    borderRadius: "16px",
                    overflow: "hidden",
                    backgroundColor: "#FFFDF9",
                    boxShadow: "0 8px 25px rgba(176, 137, 104, 0.25)",
                    border: "1px solid #E9DED2",
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={t.imagen}
                    alt={t.nombre}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div className="badgeTitle">
                    <p className="badgeText">{t.nombre}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detalle del tratamiento seleccionado */}
      {selected !== null && (
        <div
          className="shadow-lg rounded-4 p-5 position-relative"
          style={{
            backgroundColor: "#FAF9F7",
            width: "80%",
            maxWidth: "1000px",
            display: "flex",
            flexDirection: "row",
            gap: "2rem",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #E9DED2",
            boxShadow: "0 10px 40px rgba(176, 137, 104, 0.3)",
            paddingTop: "4rem",
            zIndex: 3,
          }}
        >
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute",
              top: "20px",
              left: "30px",
              background: "none",
              border: "none",
              color: "#4E3B2B",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            ← Volver
          </button>

          <div
            style={{
              flex: "0 0 45%",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 5px 20px rgba(176, 137, 104, 0.25)",
            }}
          >
            <Image
              src={tratamientos.find((t) => t.id === selected)?.imagen || "/placeholder.png"}
              alt="Detalle"
              width={500}
              height={400}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          <div style={{ flex: "0 0 45%", color: "#4E3B2B" }}>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              {tratamientos.find((t) => t.id === selected)?.nombre}
            </h3>
            <p
              style={{
                color: "#6C584C",
                lineHeight: "1.6",
                fontSize: "1.05rem",
                marginBottom: "2rem",
              }}
            >
              {tratamientos.find((t) => t.id === selected)?.desc}
            </p>
            <Link
              href="/procedimientos"
              className="btn btn-lg fw-semibold"
              style={{
                backgroundColor: "#B08968",
                color: "#FFF",
                borderRadius: "30px",
                padding: "0.75rem 2rem",
                textDecoration: "none",
              }}
            >
              Investigar más
            </Link>
          </div>
        </div>
      )}

      {/* Estilos globales */}
      <style jsx global>{`
        @keyframes pulse {
          0%   { transform: scale(1);   opacity: 0.3; }
          50%  { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1);   opacity: 0.3; }
        }
        @keyframes haloSpin {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes hueShift {
          0%   { filter: hue-rotate(0deg); }
          50%  { filter: hue-rotate(45deg); }
          100% { filter: hue-rotate(0deg); }
        }
        .card3d .badgeTitle {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.82);
          border-top: 1px solid rgba(200, 180, 160, 0.4);
          backdrop-filter: blur(6px);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 240ms ease, transform 240ms ease;
          padding: 0.5rem 0.75rem;
        }
        .card3d:hover .badgeTitle {
          opacity: 1;
          transform: translateY(0);
        }
        .badgeText {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #4e3b2b;
          font-family: "Playfair Display", serif;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}