"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { darDeBajaApi } from "@/services/marketingApi";

/**
 * Darse de baja de los correos comerciales, sin iniciar sesión.
 *
 * SE EJECUTA AL ABRIR, SIN PEDIR CONFIRMACIÓN
 * Lo normal en una acción destructiva es pedir confirmación. Aquí no, y es
 * deliberado: la acción destructiva sería la contraria. Quien llega a esta
 * página ya pulsó "dejar de recibir promociones" en el correo; ponerle un
 * segundo botón es fricción justo donde alguien ya mostró fastidio, y encima
 * deja la puerta abierta a que cierre la pestaña creyendo que ya está y siga
 * recibiendo correos.
 *
 * Además es reversible desde el perfil y no toca nada más, así que el coste
 * de equivocarse es cero.
 *
 * NO DEJA DE ENVIAR LOS CORREOS DE LAS CITAS
 * Y se dice con todas las letras en pantalla. Si alguien creyera que acaba de
 * apagar también su recordatorio de cita, o volvería a activarlo todo por
 * miedo, o —peor— se quedaría esperando un aviso que sí va a llegar y no lo
 * miraría.
 */
function Contenido() {
  const params = useSearchParams();
  const u = params.get("u") || "";
  const f = params.get("f") || "";
  const [estado, setEstado] = useState<"trabajando" | "listo" | "error">("trabajando");

  useEffect(() => {
    let vivo = true;
    darDeBajaApi(u, f)
      .then(() => { if (vivo) setEstado("listo"); })
      .catch(() => { if (vivo) setEstado("error"); });
    return () => { vivo = false; };
  }, [u, f]);

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "2rem 1.25rem" }}>
      <div
        style={{
          maxWidth: 520, width: "100%", textAlign: "center",
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 20, padding: "2.5rem 1.75rem",
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 1.25rem",
            display: "grid", placeItems: "center",
            background: "var(--surface-soft)",
          }}
        >
          {estado === "listo"
            ? <Check size={26} color="var(--estado-atendida)" strokeWidth={3} />
            : <Mail size={24} color="var(--brand)" />}
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--text)", margin: "0 0 0.75rem" }}>
          {estado === "trabajando" && "Un momento…"}
          {estado === "listo" && "Listo, no te escribimos más"}
          {estado === "error" && "No pudimos completarlo"}
        </h1>

        {estado === "listo" && (
          <>
            <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", margin: "0 0 1rem", lineHeight: 1.65 }}>
              No volverás a recibir promociones ni novedades del consultorio.
            </p>
            {/* Esto es lo más importante de la página. Sin decirlo, alguien
                puede quedarse esperando un recordatorio que sí va a llegar,
                sin mirarlo. */}
            <p style={{ color: "var(--text-soft)", fontSize: "0.88rem", margin: "0 0 1.5rem", lineHeight: 1.65 }}>
              <strong style={{ color: "var(--text)" }}>Tus citas no cambian.</strong>{" "}
              Los correos de cita confirmada, recordatorio y cambios de fecha
              te siguen llegando: son parte del servicio, no publicidad.
            </p>
          </>
        )}

        {estado === "error" && (
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", margin: "0 0 1.5rem", lineHeight: 1.65 }}>
            Puedes desactivarlas desde tu perfil, o escribirnos y lo hacemos
            nosotros.
          </p>
        )}

        {estado !== "trabajando" && (
          <Link
            href="/"
            className="btn-accion"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: 44, padding: "0.7rem 1.6rem", borderRadius: 100,
              background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
              color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.9rem",
            }}
          >
            Volver al inicio
          </Link>
        )}
      </div>
    </main>
  );
}

/* `useSearchParams` obliga a un Suspense en el App Router: sin él, la página
   entera se vuelve dinámica y Next avisa en la compilación. */
export default function BajaCorreos() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
