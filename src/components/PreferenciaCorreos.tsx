"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { fijarMarketingApi } from "@/services/marketingApi";
import { getCurrentUser } from "@/lib/api";

/**
 * El interruptor de promociones, en el perfil.
 *
 * GUARDA SOLO, SIN BOTÓN DE GUARDAR
 * El resto de la tarjeta de perfil se guarda con un botón único al final. Este
 * no. Son dos cosas distintas: los datos son un formulario que se rellena, y
 * esto es una decisión de una sola pulsación.
 *
 * Meterlo en el guardado general tendría un efecto feo: alguien que entra a
 * corregir su teléfono, desactiva las promociones y se va sin pulsar guardar,
 * cree que se dio de baja y sigue recibiendo correos. En un permiso comercial
 * eso no es un despiste de interfaz, es seguir escribiendo a quien pidió que
 * no.
 *
 * SE PINTA EL CAMBIO ANTES DE QUE EL SERVIDOR CONTESTE
 * Un interruptor que tarda medio segundo en moverse se pulsa dos veces. Se
 * mueve al instante y, si el servidor falla, vuelve a su sitio y lo dice. El
 * error importa: dar por hecho una baja que no se guardó es peor que no
 * ofrecerla.
 *
 * NO GOBIERNA LOS CORREOS DE LAS CITAS
 * Y se dice debajo, porque sin eso alguien puede dejarlo activado por miedo a
 * quedarse sin su recordatorio —y un permiso dado por miedo no es
 * consentimiento libre— o apagarlo creyendo que silencia su cita.
 */
export default function PreferenciaCorreos() {
  const [acepta, setAcepta] = useState<boolean | null>(null);
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");

  useEffect(() => {
    let vivo = true;
    getCurrentUser()
      .then(({ ok, user }) => {
        if (!vivo) return;
        /* Solo se pinta si la lectura fue buena. `getCurrentUser` devuelve
           `{ok:false, user:null}` tambien cuando falla la red, y ahi un
           interruptor apagado seria una mentira: le diria a la persona que
           esta dada de baja sin saberlo. */
        setAcepta(ok && user ? user.aceptaMarketing === true : null);
      })
      /* Si no se puede leer, no se pinta nada. Un interruptor que arranca en
         "no" por un fallo de red le diría a la persona que está dada de baja
         cuando quizá no lo está. */
      .catch(() => { if (vivo) setAcepta(null); });
    return () => { vivo = false; };
  }, []);

  if (acepta === null) return null;

  const cambiar = async () => {
    const nuevo = !acepta;
    setAcepta(nuevo);
    setEstado("guardando");
    try {
      await fijarMarketingApi(nuevo);
      setEstado("ok");
      setTimeout(() => setEstado("idle"), 1800);
    } catch {
      setAcepta(!nuevo);
      setEstado("error");
    }
  };

  return (
    <div
      style={{
        background: "var(--surface-soft)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "1.25rem 1.5rem",
        marginTop: "1.5rem",
      }}
    >
      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={acepta}
          onChange={() => void cambiar()}
          style={{ width: 18, height: 18, marginTop: 3, accentColor: "var(--brand)", flexShrink: 0 }}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "flex", alignItems: "center", gap: 8,
              fontWeight: 700, color: "var(--text)", fontSize: "0.95rem",
            }}
          >
            <Mail size={16} color="var(--brand-texto)" />
            Quiero recibir promociones y novedades

            {estado === "guardando" && (
              <Loader2 size={14} style={{ animation: "pref-gira 900ms linear infinite" }} />
            )}
            {estado === "ok" && <Check size={14} strokeWidth={3} color="var(--estado-atendida)" />}
          </span>

          <span
            style={{
              display: "block", marginTop: 6,
              color: "var(--text-soft)", fontSize: "0.85rem", lineHeight: 1.6,
            }}
          >
            Descuentos y tratamientos nuevos, de vez en cuando. Puedes cambiarlo
            aquí cuando quieras.{" "}
            <strong style={{ color: "var(--text)" }}>
              Los correos de tus citas te llegan igual:
            </strong>{" "}
            confirmación, recordatorio y cambios de fecha son parte del
            servicio, no publicidad.
          </span>

          {estado === "error" && (
            <span
              style={{
                display: "block", marginTop: 8,
                color: "var(--danger)", fontSize: "0.83rem", fontWeight: 600,
              }}
            >
              No se pudo guardar. Se dejó como estaba; inténtalo otra vez.
            </span>
          )}
        </span>
      </label>

      <style>{`@keyframes pref-gira { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
