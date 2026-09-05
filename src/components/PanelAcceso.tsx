"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { CalendarCheck, History, BellRing, CalendarClock } from "lucide-react";
import { IMG } from "@/lib/imagenes";

/**
 * La pantalla de acceso partida en dos: el formulario a un lado y el porqué
 * al otro.
 *
 * LOS LADOS SE INTERCAMBIAN
 * Entrar deja el formulario a la izquierda; crear cuenta lo manda a la
 * derecha. No es un capricho visual: es la señal más barata de que has
 * cambiado de sitio. Sin ella, dos formularios parecidos en la misma
 * posición se confunden, y la persona no sabe si ya se registró o sigue
 * intentando entrar.
 *
 * Y cambia también la foto, por lo mismo: si solo se moviera el formulario,
 * el fondo idéntico haría dudar de si la página cambió.
 *
 * LAS DOS IMÁGENES SE PRECARGAN
 * Las dos, siempre, en las dos pantallas. Si cada lado cargara la suya al
 * llegar, el primer cambio enseñaría un hueco justo en el momento en el que
 * se quiere que el movimiento se lea como una sola pieza. Pesan 87 y 88 KB;
 * precargar la que no se ve cuesta menos que el parpadeo.
 *
 * EN MÓVIL NO HAY DOS LADOS
 * Se apila, y el porqué va DEBAJO del formulario. Quien abre "iniciar
 * sesión" ya sabe por qué está ahí; ponerle argumentos antes del campo de
 * correo es un obstáculo, no una ayuda. Debajo sirve para quien dudaba.
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

export default function PanelAcceso({
  modo,
  children,
}: {
  modo: "entrar" | "registro";
  children: React.ReactNode;
}) {
  const esRegistro = modo === "registro";

  /* Precarga de la imagen del OTRO estado. Se hace con un `Image` del
     navegador y no con `<link rel="preload">` porque este componente vive en
     las dos rutas y un preload duplicado en el `head` avisa por consola. */
  useEffect(() => {
    const otra = esRegistro ? IMG.accesoEntrar : IMG.accesoRegistro;
    const img = new window.Image();
    img.src = otra;
  }, [esRegistro]);

  return (
    <section className="acceso-envoltorio">
      <div className={`acceso-rejilla ${esRegistro ? "es-registro" : ""}`}>
        {/* FORMULARIO */}
        <div className="acceso-columna acceso-columna-form">{children}</div>

        {/* PORQUÉ + FOTO */}
        <aside className="acceso-columna acceso-columna-info">
          <div className="acceso-foto">
            <Image
              src={esRegistro ? IMG.accesoRegistro : IMG.accesoEntrar}
              alt=""
              fill
              /* Decorativa: el texto de al lado ya dice todo lo que aporta.
                 Con `alt` descriptivo, un lector de pantalla leería una
                 descripción de una foto de estudio antes de llegar a lo que
                 importa, que son las ventajas. */
              aria-hidden="true"
              sizes="(max-width: 992px) 100vw, 45vw"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
              priority
            />
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

            <p className="acceso-pie">
              {esRegistro ? (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/login">Inicia sesión</Link>
                </>
              ) : (
                <>
                  ¿Primera vez por aquí?{" "}
                  <Link href="/register">Crea tu cuenta</Link>
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
