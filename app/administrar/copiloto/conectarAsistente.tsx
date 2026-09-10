"use client";

import { useState } from "react";
import { Plug, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Cómo enchufar Claude o ChatGPT al consultorio.
 *
 * POR QUÉ ESTO VA ARRIBA Y EL CHAT DE AQUÍ DENTRO VA DEBAJO
 * Durante un tiempo esta pantalla empezaba con una caja pidiendo una clave de
 * API. Leída de golpe, decía "para usar el asistente hay que contratar algo
 * aparte y pagar por uso", que no es la idea: la doctora ya paga Claude o
 * ChatGPT, y lo que queremos es que ESA suscripción maneje el consultorio.
 *
 * El conector hace justo eso. No hay clave que guardar, no hay consumo que
 * vigilar, y la conversación ocurre en la aplicación que ella ya tiene
 * abierta. El chat de esta pantalla queda como lo que es: la alternativa para
 * cuando no se quiere salir del panel.
 *
 * Por eso el orden de la pantalla es este y no el contrario. Lo primero que se
 * lee es lo que casi siempre conviene hacer.
 *
 * LA DIRECCIÓN SE MUESTRA, NO SE ADIVINA
 * Es el único dato que hay que llevarse de aquí, y escribirlo a mano en el
 * móvil es donde se rompe todo el proceso. Se enseña entera y con un botón
 * para copiarla.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ConectarAsistente() {
  const [copiado, setCopiado] = useState(false);
  const url = `${BASE}/mcp`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin permiso de portapapeles no hay nada que hacer desde aquí: la
         dirección está visible y se puede seleccionar a mano. Fallar en
         silencio es mejor que enseñar un error por algo que no bloquea. */
    }
  };

  return (
    <div className="conectar-bloque">
      <p className="conectar-bloque-eyebrow">
        <Plug size={14} /> La forma recomendada
      </p>

      <h3 className="conectar-bloque-titulo">
        Maneja el consultorio desde tu propio Claude o ChatGPT
      </h3>

      <p className="conectar-bloque-texto">
        En vez de escribir aquí dentro, conectas el consultorio a la aplicación
        que ya usas y le hablas desde ahí: «pon el bótox en promoción»,
        «¿cuántas citas hay el viernes?». Usa <strong>tu suscripción de
        siempre</strong>, así que no hay clave que guardar ni consumo que pagar
        aparte.
      </p>

      <ol className="conectar-bloque-pasos">
        <li>
          Abre tu aplicación de Claude o ChatGPT y busca los{" "}
          <strong>conectores</strong> en los ajustes.
        </li>
        <li>
          Añade uno nuevo y pega esta dirección:
          <span className="conectar-bloque-url">
            <code>{url}</code>
            <button type="button" onClick={() => void copiar()} className="conectar-bloque-copiar">
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              {copiado ? "Copiada" : "Copiar"}
            </button>
          </span>
        </li>
        <li>
          Te llevará a una pantalla de este sitio donde{" "}
          <strong>tú autorizas</strong>. Hay que estar dentro con tu cuenta de
          administradora: nadie puede conectar nada sin ti.
        </li>
      </ol>

      {/* Se dice aquí y no solo en la pantalla de permisos. Quien está
          decidiendo si conecta algo quiere saber, en ese momento, que puede
          deshacerlo — no descubrirlo después. */}
      <p className="conectar-bloque-nota">
        Puedes cortar el acceso cuando quieras desde{" "}
        <Link href="/administrar?section=conexiones" className="conectar-bloque-enlace">
          Programas conectados <ExternalLink size={12} />
        </Link>
        . El conector <strong>nunca ve el teléfono ni el correo</strong> de tus
        pacientes, ni sus historias clínicas.
      </p>
    </div>
  );
}
