"use client";

import { Suspense } from "react";
import PantallaAcceso from "@/components/PantallaAcceso";

/* Misma pantalla que /login, arrancando en crear cuenta. Ver PantallaAcceso.

   El Suspense sigue haciendo falta: el asistente lee `useSearchParams` para
   prellenarse cuando se llega desde el alta con Google. */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <PantallaAcceso modoInicial="registro" />
    </Suspense>
  );
}
