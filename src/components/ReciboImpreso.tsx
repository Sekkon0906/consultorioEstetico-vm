"use client";

import { useMemo } from "react";
import type { Cita } from "@/types/domain";
import { formatearFecha } from "@/lib/fechas";

/**
 * El comprobante de la cita, saliendo de una impresora de recibos.
 *
 * POR QUÉ SE IMPRIME DESPUÉS DE CONFIRMAR Y NO A LA VEZ QUE EL WHATSAPP
 * El botón de WhatsApp vive DENTRO del recibo, no antes. Dos razones, y la
 * segunda es la que de verdad importa:
 *
 *  1. Si la impresión ocurriera mientras se abre WhatsApp, la persona se va a
 *     otra aplicación en mitad de la animación y no la ve. El detalle se
 *     pierde justo en el momento para el que se hizo.
 *
 *  2. `window.open` llamado DESPUÉS de esperar la respuesta del servidor lo
 *     bloquea Safari en iPhone, porque el gesto del usuario ya se consumió.
 *     Con el botón aquí, el pulsar es un gesto directo sin espera por delante
 *     y el navegador lo deja pasar.
 *
 * El WhatsApp deja además de ser obligatorio: la cita ya está guardada cuando
 * este recibo aparece, así que quien no lo envíe conserva su comprobante y la
 * doctora recibe igual su aviso por correo.
 *
 * SE REGENERA, NO ES UNA FOTO DEL MOMENTO
 * El recibo se dibuja a partir de la cita cada vez. Si la doctora cambia la
 * fecha, el comprobante enseña la fecha nueva. La alternativa —guardar el
 * recibo tal cual se emitió— produce el peor resultado posible: un documento
 * con pinta de oficial que contradice la cita real, y al que la persona va a
 * hacer más caso que a la pantalla.
 *
 * El número de recibo es el de la cita. No hay dos numeraciones que puedan
 * desincronizarse.
 *
 * LA ANIMACIÓN NO DECIDE DÓNDE ACABA EL PAPEL
 * El papel descansa en su sitio y la animación solo lo trae desde arriba. Si
 * las animaciones están desactivadas —o sencillamente no corren— el recibo se
 * ve, completo y quieto. Lo contrario, animar hacia la posición buena, deja el
 * comprobante fuera de la vista cuando algo falla.
 *
 * Y se anima `transform`, nunca el alto: animar el alto reflowea la página en
 * cada fotograma y en un teléfono de gama media se ve a tirones.
 */

function moneda(n: number) {
  return n.toLocaleString("es-CO");
}

export default function ReciboImpreso({
  cita,
  locale,
  precio,
  onEnviarWhatsApp,
}: {
  cita: Cita;
  locale: string;
  /** Opcional: si la cita no lo trae, el recibo no inventa un importe. */
  precio?: number | null;
  onEnviarWhatsApp?: () => void;
}) {
  const fechaLarga = useMemo(
    () =>
      formatearFecha(cita.fecha, locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [cita.fecha, locale]
  );

  /* Los primeros ocho caracteres del uuid. Un uuid entero no se puede dictar
     por teléfono, y ocho bastan para encontrar la cita entre las de un
     consultorio. */
  const numero = cita.id.slice(0, 8).toUpperCase();

  const filas: Array<[string, string]> = [
    ["Paciente", `${cita.nombres} ${cita.apellidos || ""}`.trim()],
    ["Procedimiento", cita.procedimiento],
    ["Fecha", fechaLarga],
    ["Hora", cita.hora],
    ["Teléfono", cita.telefono || "—"],
  ];
  if (cita.tipoPagoConsultorio) filas.push(["Pago en consultorio", cita.tipoPagoConsultorio]);
  if (cita.nota) filas.push(["Nota", cita.nota]);

  return (
    <div className="recibo-marco">
      {/* La boca de la impresora. Es la que recorta el papel mientras baja:
          el papel se mueve dentro de este contenedor con overflow oculto, así
          que parece salir de la ranura en vez de aparecer de la nada. */}
      <div className="recibo-cabezal" aria-hidden="true">
        <span className="recibo-ranura" />
      </div>

      <div className="recibo-ventana">
        <article className="recibo-papel" aria-label={`Comprobante de la cita ${numero}`}>
          <header className="recibo-cabecera">
            <p className="recibo-marca">Dra. Vanessa Medina</p>
            <p className="recibo-sub">Medicina estética · Ibagué, Tolima</p>
          </header>

          <div className="recibo-corte" aria-hidden="true" />

          <p className="recibo-titulo">Comprobante de cita</p>

          <dl className="recibo-filas">
            {filas.map(([k, v]) => (
              <div key={k} className="recibo-fila">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {typeof precio === "number" && (
            <>
              <div className="recibo-corte" aria-hidden="true" />
              <div className="recibo-total">
                <span>Valor orientativo</span>
                <strong>${moneda(precio)} COP</strong>
              </div>
              {/* Se dice en el propio comprobante, no en una nota al pie que
                  nadie lee: el precio final lo fija la valoración. Un
                  comprobante que da una cifra cerrada crea una expectativa
                  que la consulta puede no cumplir. */}
              <p className="recibo-aviso">
                El valor final puede variar según tu valoración médica.
              </p>
            </>
          )}

          <div className="recibo-corte" aria-hidden="true" />

          <p className="recibo-estado">
            Estado: <strong>{cita.estado === "confirmada" ? "Confirmada" : "Pendiente de confirmación"}</strong>
          </p>
          <p className="recibo-numero">N.º {numero}</p>

          {/* Código de barras decorativo. No codifica nada y por eso lleva
              `aria-hidden`: fingir un código legible en un comprobante médico
              invitaría a escanearlo y a no encontrar nada. */}
          <div className="recibo-barras" aria-hidden="true">
            {Array.from({ length: 42 }).map((_, i) => (
              <span key={i} style={{ width: (i * 7) % 3 === 0 ? 3 : 1 }} />
            ))}
          </div>

          {onEnviarWhatsApp && (
            <button type="button" className="recibo-wa" onClick={onEnviarWhatsApp}>
              Enviar por WhatsApp a la doctora
            </button>
          )}

          <p className="recibo-pie">
            Guarda este comprobante. Puedes volver a verlo en <strong>Mis citas</strong>.
          </p>
        </article>
      </div>
    </div>
  );
}
