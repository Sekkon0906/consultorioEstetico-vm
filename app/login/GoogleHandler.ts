// app/login/GoogleHandler.ts
"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { signInWithGooglePopup } from "../utils/firebaseClient";
import { setCurrentUser, saveRememberedUser } from "../utils/auth";
import type { SessionUser } from "../types/domain";

interface GoogleHandlerOptions {
  router: AppRouterInstance;
  setErr: (msg: string | null) => void;
}

export async function handleGoogleLogin({
  router,
  setErr,
}: GoogleHandlerOptions): Promise<void> {
  try {
    setErr(null);

    // 1) Login en Firebase con popup
    const firebaseUser = await signInWithGooglePopup();

    // 2) Obtener ID token de Firebase
    const idToken = await firebaseUser.getIdToken();

    // 3) Enviar al backend para crear / obtener usuario en MySQL
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      console.error("Respuesta /auth/google:", data);
      setErr(data.error || "No se pudo iniciar sesión con Google.");
      return;
    }

    const user: SessionUser = data.user;

    // 4) Guardar usuario en tu sistema local
    setCurrentUser(user);

    // 5) Recordar 30 días (opcional)
    saveRememberedUser(user);

    router.push("/");
  } catch (err: unknown) {
    console.error("Error en handleGoogleLogin:", err);
    setErr("Error al autenticar con Google. Intenta nuevamente.");
  }
}
