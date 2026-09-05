"use client";

import PantallaAcceso from "@/components/PantallaAcceso";

/* Entrar y crear cuenta comparten componente y se intercambian de lado con un
   cambio de ESTADO, no de ruta: solo así el cruce puede animarse, porque una
   navegación desmonta el árbol y en un desmontaje no hay nada que animar.

   Esta ruta sigue existiendo —enlaces, marcadores y SEO no se rompen— y solo
   decide con cuál de los dos estados arranca. */
export default function LoginPage() {
  return <PantallaAcceso modoInicial="entrar" />;
}
