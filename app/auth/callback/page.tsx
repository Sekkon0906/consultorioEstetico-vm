"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// Fondo 3D (Three.js) diferido: esta pantalla es de tránsito (redirige sola
// en segundos), no debe competir por ancho de banda con el flujo de sesión.
const FondoAnim = dynamic(() => import("@/components/FondoAnim"), {
  ssr: false,
});

/**
 * Handler de OAuth (Google). Supabase procesa el access_token del hash
 * automáticamente (detectSessionInUrl). En cuanto hay sesión, redirige
 * al testimonios real (con video reproducible), no a una copia.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/perfil/editar_info");
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });

    // Respaldo: si algo falla, no dejar al usuario atascado aquí
    const fallback = setTimeout(go, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [router]);

  return (
    <main
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
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
        <div className="spinner-border" style={{ color: "#B08968" }} role="status" />
        <p className="mt-3" style={{ color: "#6C584C", fontWeight: 600 }}>
          Iniciando sesión…
        </p>
      </div>
    </main>
  );
}
