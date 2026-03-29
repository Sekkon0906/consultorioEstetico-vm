"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { interpolate } from "flubber";


interface Props {
  tipo?: string | null; 
}

export default function SiluetasAnimadas({ tipo }: Props) {
  // === PATHS BASE ===
  // Movimiento inicial serpenteante desde los lados
  const pathInicialJ =
    "M-250,400 C100,300 300,500 600,400 C700,350 800,450 950,400";
  const pathInicialM =
    "M1850,400 C1500,300 1300,500 1000,400 C900,350 800,450 650,400";

  // === FORMAS FINALES ===
  // J serifada (izquierda)
  const pathFinalJ =
    "M520,160 L520,640 Q520,780 680,780 Q760,780 780,760 Q720,770 660,750 Q600,730 600,670 L600,160 Z";
  // M serifada (derecha)
  const pathFinalM =
    "M880,780 L880,160 L960,560 L1040,160 L1120,780 L1080,780 L1010,240 L940,780 L880,780 Z";

  // Estado inicial
  const [pathJ, setPathJ] = useState(pathInicialJ);
  const [pathM, setPathM] = useState(pathInicialM);

  useEffect(() => {
    // Movimiento serpenteante continuo de entrada
    const dur = 4;
    const serpenteo = animate(0, 1, {
      duration: dur,
      ease: "easeInOut",
      onUpdate: (t) => {
        const offset = Math.sin(t * Math.PI * 2) * 80;
        const j = `M${-250 + offset},400 C${100 + offset},300 ${
          300 + offset
        },500 ${600 + offset},400 C${700 + offset},350 ${800 + offset},450 ${
          950 + offset
        },400`;
        const m = `M${1850 - offset},400 C${1500 - offset},300 ${
          1300 - offset
        },500 ${1000 - offset},400 C${900 - offset},350 ${800 - offset},450 ${
          650 - offset
        },400`;
        setPathJ(j);
        setPathM(m);
      },
      onComplete: () => {
        // Interpolación suave hacia las formas finales correctas (JM)
        const flubberJ = interpolate(pathJ, pathFinalJ, { maxSegmentLength: 5 });
        const flubberM = interpolate(pathM, pathFinalM, { maxSegmentLength: 5 });

        const anim1 = animate(0, 1, {
          duration: 3.2,
          ease: "easeInOut",
          onUpdate: (v) => setPathJ(flubberJ(v)),
        });
        const anim2 = animate(0, 1, {
          duration: 3.2,
          delay: 0.3,
          ease: "easeInOut",
          onUpdate: (v) => setPathM(flubberM(v)),
        });

        return () => {
          anim1.stop();
          anim2.stop();
        };
      },
    });

    return () => serpenteo.stop();
  }, []);

  return (
    <svg
      viewBox="0 0 1600 900"
      className="absolute inset-0 w-full h-full overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="8"
            floodColor="#8B6A4B"
            floodOpacity="0.35"
          />
        </filter>
        <radialGradient id="grad">
          <stop offset="0%" stopColor="#E9DED2" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Halo de fondo */}
      <motion.circle
        cx="800"
        cy="450"
        r="400"
        fill="url(#grad)"
        animate={{
          opacity: [0.05, 0.2, 0.05],
          scale: [1, 1.07, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* === J === */}
      <motion.path
        d={pathJ}
        fill="none"
        stroke="#B08968"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#shadow)"
      />

      {/* === M === */}
      <motion.path
        d={pathM}
        fill="none"
        stroke="#6C584C"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#shadow)"
      />
    </svg>
  );
}
