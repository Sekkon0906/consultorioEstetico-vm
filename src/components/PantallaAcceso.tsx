"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
/* Sin framer-motion en esta pantalla, a proposito. Ver EL CRUCE. */
import { CalendarCheck, History, BellRing, CalendarClock } from "lucide-react";
import { IMG } from "@/lib/imagenes";
/* Ruta relativa: el alias `@/` apunta a `src/` y no alcanza `app/`. */
import RegistroWizard from "../../app/register/RegistroWizard";
import FormularioEntrar from "./FormularioEntrar";

/**
 * Entrar y crear cuenta en una sola pantalla, intercambiando de lado.
 *
 * POR QUÉ UN SOLO COMPONENTE Y NO DOS RUTAS
 * Antes eran dos páginas. Los lados se intercambiaban, pero pasar de una a
 * otra era una NAVEGACIÓN: React desmonta el árbol entero y monta el otro, y
 * en un desmontaje no hay nada que animar. El cruce solo puede verse si los
 * dos formularios están vivos a la vez en el mismo árbol, y eso obliga a que
 * el cambio sea un cambio de estado, no de ruta.
 *
 * LAS DOS URLS SIGUEN EXISTIENDO
 * `/login` y `/register` renderizan las dos este componente, cada una con su
 * estado inicial. Al cambiar de estado se reescribe la barra de direcciones
 * con `replaceState`, que NO navega: no hay remontaje, no se pierde lo
 * escrito, y aun así compartir o recargar la página lleva al sitio correcto.
 *
 * Se usa `replaceState` y no `pushState` a propósito. Con `push`, alternar
 * entre entrar y registrarse tres veces deja seis entradas en el historial, y
 * el botón atrás del navegador —que la gente usa para salir de una pantalla,
 * no para deshacer— dejaría a la persona atrapada rebotando entre los dos
 * formularios.
 *
 * EL CRUCE ES CSS, NO FLIP
 * El primer intento usaba `layout` de framer-motion. Funciona midiendo: mueve
 * el elemento a su sitio nuevo, le aplica al instante una transformación que
 * lo devuelve visualmente al viejo, y anima esa transformación hasta cero.
 *
 * El problema es lo que queda si esa animación no llega a correr: el elemento
 * se queda en la posición INVERTIDA, o sea con los lados sin intercambiar,
 * aunque el estado sí cambió. Lo vi medido —un `translateX` residual de
 * exactamente la distancia del cruce— y es un fallo peor que no animar.
 *
 * Con dos columnas iguales, un `translateX(±100%)` en CSS hace el mismo
 * intercambio y su estado FINAL es el correcto. Si la transición no corre,
 * salta; nunca se queda a medias. La posición no depende de ninguna medida,
 * así que tampoco de que el navegador llegue a hacerla.
 *
 * `prefers-reduced-motion` quita la transición y deja el salto. Un bloque
 * grande cruzando la pantalla es justo lo que esa preferencia evita.
 */

const VENTAJAS = [
  {
    icono: CalendarCheck,
    titulo: "Agenda sin repetir tus datos",
    texto: "Tu nombre, teléfono y ficha médica quedan guardados. Pedir la siguiente cita son dos toques.",
  },
  {
    icono: History,
    titulo: "Tu historial de procedimientos",
    texto: "Qué te has hecho, cuántas veces y hace cuánto fue la última. Sin buscar en el chat.",
  },
  {
    icono: BellRing,
    titulo: "Te avisamos antes",
    texto: "Un correo el día anterior con la fecha y la hora, para que no se te pase.",
  },
  {
    icono: CalendarClock,
    titulo: "Cambia la fecha sin llamar",
    texto: "Si no puedes venir, pides otro día desde tu perfil y la doctora responde.",
  },
];

export type ModoAcceso = "entrar" | "registro";

export default function PantallaAcceso({ modoInicial }: { modoInicial: ModoAcceso }) {
  const [modo, setModo] = useState<ModoAcceso>(modoInicial);
  const esRegistro = modo === "registro";

  /* La URL sigue al estado, sin navegar. */
  useEffect(() => {
    const ruta = esRegistro ? "/register" : "/login";
    if (window.location.pathname !== ruta) {
      window.history.replaceState(null, "", ruta);
    }
  }, [esRegistro]);

  /* Precarga de la imagen que no se ve. Sin esto, el primer cruce enseña un
     hueco blanco justo donde se quiere que el movimiento se lea como una
     sola pieza. Pesan 87 y 88 KB: sale más barato que el parpadeo. */
  useEffect(() => {
    [IMG.accesoEntrar, IMG.accesoRegistro].forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  return (
    <section className="acceso-envoltorio">
      <div className={`acceso-rejilla ${esRegistro ? "es-registro" : ""}`}>
        {/* FORMULARIO — siempre primero en el DOM, en los dos estados, para
            que con teclado y lector de pantalla se llegue antes al campo de
            correo que a los argumentos. El lado lo decide `order` en CSS. */}
        <div className="acceso-columna acceso-columna-form">
          {/* Se monta uno u otro directamente, sin cruce de salida y entrada.
              Los dos ocupan alturas muy distintas —el registro son tres
              pasos— y solaparlos haría saltar el alto de la tarjeta a media
              animación. El movimiento del cruce ya cuenta el cambio. */}
          {esRegistro ? (
            <RegistroWizard />
          ) : (
            /* El "Crear cuenta" de dentro del formulario tiene que hacer lo
               mismo que el de la columna de al lado: cambiar de estado, no
               navegar. Dos caminos al mismo sitio comportandose distinto es
               peor que no tener el segundo. */
            <FormularioEntrar onCrearCuenta={() => setModo("registro")} />
          )}
        </div>

        {/* PORQUÉ + FOTO */}
        <aside className="acceso-columna acceso-columna-info">
          <div className="acceso-foto">
            {/* Las dos montadas a la vez, cruzando opacidad. Cambiar el `src`
                de una sola imagen deja un parpadeo mientras decodifica la
                nueva, y aquí ese parpadeo caería justo encima del cruce. */}
            {([["entrar", IMG.accesoEntrar], ["registro", IMG.accesoRegistro]] as const).map(
              ([clave, src]) => (
                <Image
                  key={clave}
                  src={src}
                  alt=""
                  /* Decorativa: el texto de al lado ya dice lo que aporta. Con
                     `alt` descriptivo, un lector de pantalla leería una foto
                     de estudio antes de llegar a las ventajas. */
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 1100px) 100vw, 45vw"
                  priority={clave === modoInicial}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center 20%",
                    opacity: (clave === "registro") === esRegistro ? 1 : 0,
                    /* La transición va en CSS (.acceso-foto img) para poder
                       apagarla con prefers-reduced-motion desde la hoja. */
                  }}
                />
              )
            )}
            <div className="acceso-velo" aria-hidden="true" />
          </div>

          <div className="acceso-info-texto">
            <h2 className="acceso-info-titulo">
              {esRegistro ? "Lo que ganas al tener cuenta" : "Por qué te conviene entrar"}
            </h2>

            <ul className="acceso-ventajas">
              {VENTAJAS.map(({ icono: Icono, titulo, texto }) => (
                <li key={titulo}>
                  <span className="acceso-ventaja-icono" aria-hidden="true">
                    <Icono size={17} />
                  </span>
                  <span>
                    <strong>{titulo}</strong>
                    <span>{texto}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Un <button> y no un <Link>: no lleva a otra página, cambia el
                estado de esta. Un enlace prometería una navegación que no
                ocurre, y además el navegador ofrecería "abrir en pestaña
                nueva" para una URL que llega al mismo sitio. */}
            <p className="acceso-pie">
              {esRegistro ? "¿Ya tienes cuenta? " : "¿Primera vez por aquí? "}
              <button
                type="button"
                className="acceso-cambiar"
                onClick={() => setModo(esRegistro ? "entrar" : "registro")}
              >
                {esRegistro ? "Inicia sesión" : "Crea tu cuenta"}
              </button>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
