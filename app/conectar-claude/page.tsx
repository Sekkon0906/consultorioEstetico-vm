"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { apiAuth, ErrorApi } from "@/lib/apiCliente";

/**
 * La pantalla donde la doctora aprueba —o rechaza— un conector.
 *
 * ES LA ÚNICA DECISIÓN REAL DE TODO EL OAUTH
 * Lo demás es maquinaria: emitir códigos, canjearlos, renovarlos. La pregunta
 * de fondo, "¿le doy a este programa acceso a las herramientas del
 * consultorio?", se contesta aquí.
 *
 * NO SE APRUEBA SOLA, NUNCA
 * Aunque la sesión sea válida y el cliente esté registrado, hace falta pulsar.
 * Un consentimiento que se da solo por abrir una dirección no es
 * consentimiento: bastaría con que alguien le pasara un enlace a la doctora
 * estando ella con sesión abierta.
 *
 * SE DICE QUÉ PUEDE HACER, EN CASTELLANO
 * "Acceso a la API" no significa nada para quien decide. Lo que hay que poder
 * leer es que ese programa va a poder cambiar precios y promociones, porque
 * eso es lo que va a poder hacer.
 */

function Contenido() {
  const params = useSearchParams();
  const [estado, setEstado] = useState<"cargando" | "listo" | "enviando" | "error">("cargando");
  const [error, setError] = useState<string | null>(null);
  const [cliente, setCliente] = useState<{ nombre: string; uri: string | null } | null>(null);

  const clientId = params.get("client_id") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const codeChallenge = params.get("code_challenge") || "";
  const state = params.get("state") || "";
  const scope = params.get("scope") || "";
  const resource = params.get("resource") || "";

  useEffect(() => {
    if (!clientId || !redirectUri || !codeChallenge) {
      setError("La solicitud está incompleta. Vuelve a intentarlo desde Claude.");
      setEstado("error");
      return;
    }
    let vivo = true;
    apiAuth<{ nombre: string; uri: string | null }>(
      `/mcp/consentimiento?client_id=${encodeURIComponent(clientId)}`
    )
      .then((d) => { if (vivo) { setCliente(d); setEstado("listo"); } })
      .catch((e: unknown) => {
        if (!vivo) return;
        /* Se mira el CÓDIGO de la respuesta, no el texto del error.

           La primera versión buscaba "401" dentro del mensaje, y al probarla
           el servidor devolvió 401 —comprobado en la pestaña de red— pero la
           pantalla enseñó el mensaje genérico: el mensaje del error no lleva
           el número. Y ese es justo el caso más común, la doctora abriendo el
           enlace sin sesión, al que le estaríamos diciendo lo que no es. */
        const codigo = e instanceof ErrorApi ? e.status : 0;
        setError(
          codigo === 401 || codigo === 403
            ? "Inicia sesión con la cuenta de la doctora en otra pestaña y vuelve a abrir este enlace. Solo una administradora puede autorizar un conector."
            : codigo === 404
            ? "Ese programa no está registrado. Vuelve a intentar la conexión desde Claude."
            : "No se pudo comprobar quién está pidiendo acceso."
        );
        setEstado("error");
      });
    return () => { vivo = false; };
  }, [clientId, redirectUri, codeChallenge]);

  const aprobar = async () => {
    setEstado("enviando");
    try {
      const { redirigirA } = await apiAuth<{ redirigirA: string }>("/mcp/consentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        clave: "",
        body: JSON.stringify({ clientId, redirectUri, codeChallenge, state, scope, resource }),
      });
      window.location.href = redirigirA;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo autorizar.");
      setEstado("error");
    }
  };

  const rechazar = () => {
    /* Se vuelve al cliente con el error que el protocolo define, en vez de
       dejar la pestaña muerta. Así Claude puede decir "no se autorizó" en vez
       de quedarse esperando para siempre. */
    const destino = new URL(redirectUri);
    destino.searchParams.set("error", "access_denied");
    if (state) destino.searchParams.set("state", state);
    window.location.href = destino.toString();
  };

  return (
    <main className="conectar-envoltorio">
      <div className="conectar-tarjeta">
        {estado === "cargando" && (
          <p className="conectar-cargando">
            <Loader2 size={18} /> Comprobando la solicitud…
          </p>
        )}

        {estado === "error" && (
          <>
            <div className="conectar-icono es-aviso">
              <AlertTriangle size={26} />
            </div>
            <h1 className="conectar-titulo">No se puede autorizar</h1>
            <p className="conectar-texto">{error}</p>
          </>
        )}

        {(estado === "listo" || estado === "enviando") && cliente && (
          <>
            <div className="conectar-icono">
              <ShieldCheck size={26} />
            </div>

            <h1 className="conectar-titulo">
              <strong>{cliente.nombre}</strong> quiere conectarse a tu consultorio
            </h1>

            <p className="conectar-texto">
              Si autorizas, este programa podrá, en tu nombre:
            </p>

            <ul className="conectar-permisos">
              <li><strong>Ver y modificar</strong> tus procedimientos y sus precios.</li>
              <li><strong>Activar y desactivar</strong> promociones.</li>
              <li><strong>Cambiar</strong> la información del consultorio: dirección, teléfonos, horarios.</li>
              <li><strong>Consultar</strong> cuántas citas hay y las de un día concreto.</li>
            </ul>

            {/* Lo que NO puede hacer es tan importante como lo que sí. Sin esta
                línea, "acceso a las citas" se lee como acceso a las historias
                clínicas, y la decisión se toma con miedo o con demasiada
                confianza según a quién le toque imaginarlo. */}
            <p className="conectar-nota">
              No puede ver historias clínicas, consentimientos firmados ni datos
              de contacto de tus pacientes fuera de la agenda del día. Puedes
              retirar el acceso cuando quieras desde el panel.
            </p>

            <div className="conectar-botones">
              <button
                type="button"
                className="conectar-aprobar"
                onClick={() => void aprobar()}
                disabled={estado === "enviando"}
              >
                {estado === "enviando" ? "Autorizando…" : "Autorizar"}
              </button>
              <button type="button" className="conectar-rechazar" onClick={rechazar}>
                No autorizar
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ConectarClaude() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
