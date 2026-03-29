"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// ======== FONDO 3D: ONDAS + SILUETAS DIFUSAS + SCROLL ======== //
export default function FondoAnim() {
  const [scrollY, setScrollY] = useState(0);

  // Detecta el desplazamiento de la página para el efecto parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        {/* Fondo base y niebla */}
        <color attach="background" args={["#FAF9F7"]} />
        <fog attach="fog" args={["#f2ece4", 10, 25]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />

        {/* Ondas del fondo (ligeramente afectadas por scroll) */}
        <Ondas
          position={[0, -1 + scrollY * 0.002, -6]}
          color="#f0e4d7"
          speed={0.5}
        />
        <Ondas
          position={[0, 1 + scrollY * 0.0015, -8]}
          color="#efe1d0"
          speed={0.3}
        />

        {/* Siluetas difusas */}
        <Silueta position={[-2.5, 0, -3]} color="#f5cfc2" scale={[1.2, 3, 1]} />
        <Silueta position={[2.5, -1, -2]} color="#d2c7f7" scale={[1.1, 2.8, 1]} />
        <Silueta position={[0, 2, -4]} color="#f0dac3" scale={[1.4, 3.2, 1]} />
      </Canvas>
    </div>
  );
}

// ======== FORMAS DE ONDAS ======== //
type OndasProps = {
  position: [number, number, number];
  color: string;
  speed: number;
};

function Ondas({ position, color, speed }: OndasProps) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.x = Math.sin(t * 0.1 * speed) * 0.2;
    ref.current.rotation.y = Math.cos(t * 0.1 * speed) * 0.2;
  });

  return (
    <mesh ref={ref} position={position} scale={[10, 5, 1]}>
      <planeGeometry args={[5, 3, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        distort={0.2}
        speed={speed}
        transparent
        opacity={0.4}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// ======== SILUETAS DIFUSAS ======== //
type SiluetaProps = {
  position: [number, number, number];
  color: string;
  scale: [number, number, number];
};

function Silueta({ position, color, scale }: SiluetaProps) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y = Math.sin(t / 2 + position[0]) * 0.3 + position[1];
    ref.current.rotation.y = Math.sin(t / 3) * 0.5;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <cylinderGeometry args={[0.8, 1, 4, 32, 1, true]} />
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.35}
        distort={0.25}
        speed={1.5}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}
