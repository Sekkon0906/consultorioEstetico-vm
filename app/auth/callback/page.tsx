"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { recogerTokenDeUrl } from "@/lib/sesion";

// Fondo 3D (Three.js) diferido: esta pantalla es de tránsito (redirige sola
// en segundos), no debe competir por ancho de banda con el flujo de sesión.
const FondoAnim = dynamic(() => import("@/components/FondoAnim"), {
  ssr: false,
});

/**
 * Retorno de OAuth (Google). Hoy el backend redirige directo a la ruta final
 * con el token en el fragmento, así que normalmente nadie pasa por aquí. Se
 * mantiene como red de seguridad para enlaces antiguos: recoge el token del
 * hash, refresca el perfil y sale.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/perfil/editar_info");
    };

    recogerTokenDeUrl();
    refreshUser().finally(go);

    // Respaldo: si algo falla, no dejar al usuario atascado aquí.
    const fallback = setTimeout(go, 4000);
    return () => clearTimeout(fallback);
  }, [router, refreshUser]);

  return (
    <main
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "var(--alto-pantalla, 100vh)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF7F2",
      }}
    >
      <div className="absolute inset-0 z-0">
        <FondoAnim />
      </div>
      <div className="text-center position-relative" style={{ zIndex: 1 }}>
        <div className="spinner-border" style={{ color: "var(--brand)" }} role="status" />
        <p className="mt-3" style={{ color: "var(--text-soft)", fontWeight: 600 }}>
          Iniciando sesión…
        </p>
      </div>
    </main>
  );
}
