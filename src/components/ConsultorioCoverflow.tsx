"use client";

import Image from "next/image";
import { useRef } from "react";

/**
 * Las fotos del consultorio, en profundidad.
 *
 * POR QUÉ NO SE REUTILIZÓ `Galeria3D`
 * Era lo primero que se miró. No sirve: son 1.329 líneas, no recibe ninguna
 * propiedad y lee los procedimientos por su cuenta —incluida su ficha, su
 * precio y su enlace a agendar—. Adaptarla habría sido un refactor grande de
 * un componente que hoy funciona en portada, para acabar con dos usos que
 * necesitan cosas distintas. Esto son cinco fotos y un pie: cabe en un
 * componente propio y pequeño.
 *
 * CÓMO ESTÁ HECHO, Y POR QUÉ ASÍ
 * Transformaciones CSS en 3D, sin ninguna librería. Cada foto se coloca en el
 * mismo punto y se separa con `translateX` + `translateZ` + `rotateY` según a
 * cuántos pasos esté de la del centro. El navegador lo compone en la tarjeta
 * gráfica: se mueven cinco fotos a la vez sin que el hilo principal se entere.
 *
 * SOLO SE PINTAN LAS DOS DE CADA LADO
 * Las que quedan más lejos salen del cálculo. Con cinco fotos daría igual,
 * pero si mañana la doctora sube veinte, sin este corte serían veinte
 * imágenes apiladas, todas cargadas y todas animándose para no verse.
 *
 * EL FONDO NO SE PUEDE PULSAR SIN QUERER
 * Las de los lados sí se pulsan —traen su foto al centro—, pero las que ya no
 * se ven llevan `pointer-events: none`. Sin eso, una foto invisible al fondo
 * se come clics destinados a la del centro, y el fallo resultante es de los
 * que no se explican mirando el código.
 */

export interface FotoConsultorio {
  src: string;
  label: string;
  desc: string;
}

interface Props {
  fotos: FotoConsultorio[];
  activo: number;
  onSeleccionar: (i: number) => void;
  onAbrir: (i: number) => void;
}

/* Cuántas se ven a cada lado del centro. Tres ya se pisan entre ellas y la
   del centro deja de destacar, que es lo único que esta vista tiene que
   conseguir. */
const VISIBLES = 2;

export default function ConsultorioCoverflow({ fotos, activo, onSeleccionar, onAbrir }: Props) {
  /* El punto donde empezó el gesto. En un `ref` y no en un estado: cambia en
     cada `pointermove` y no debe repintar nada. */
  const inicio = useRef<number | null>(null);

  const mover = (d: number) => {
    onSeleccionar((activo + d + fotos.length) % fotos.length);
  };

  const soltar = (x: number) => {
    if (inicio.current === null) return;
    const dx = x - inicio.current;
    inicio.current = null;
    /* 40px de umbral: por debajo, un dedo que tiembla al pulsar contaría como
       arrastre y la foto se cambiaría sola en vez de abrirse. */
    if (Math.abs(dx) < 40) return;
    mover(dx < 0 ? 1 : -1);
  };

  return (
    <div className="cons3d">
      <div
        className="cons3d-escena"
        onPointerDown={(e) => { inicio.current = e.clientX; }}
        onPointerUp={(e) => soltar(e.clientX)}
        onPointerLeave={() => { inicio.current = null; }}
        /* Teclado: es una lista de fotos que se recorre, así que las flechas
           tienen que servir. Sin esto la vista entera queda fuera del alcance
           de quien no usa ratón. */
        tabIndex={0}
        role="group"
        aria-label="Fotos del consultorio"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); mover(-1); }
          if (e.key === "ArrowRight") { e.preventDefault(); mover(1); }
          if (e.key === "Enter") { e.preventDefault(); onAbrir(activo); }
        }}
      >
        {fotos.map((f, i) => {
          /* La distancia se mide por el camino más corto: con cinco fotos, de
             la última a la primera hay un paso, no cuatro. Sin esto el salto
             de la vuelta completa recorre la baraja entera al revés. */
          let d = i - activo;
          if (d > fotos.length / 2) d -= fotos.length;
          if (d < -fotos.length / 2) d += fotos.length;

          const fuera = Math.abs(d) > VISIBLES;
          const centro = d === 0;

          return (
            <button
              key={f.src}
              type="button"
              className={"cons3d-tarjeta" + (centro ? " es-centro" : "")}
              aria-hidden={fuera}
              tabIndex={-1}
              aria-label={centro ? `Ampliar: ${f.label}` : `Ver: ${f.label}`}
              onClick={() => (centro ? onAbrir(i) : onSeleccionar(i))}
              style={{
                transform: `translateX(${d * 46}%) translateZ(${-Math.abs(d) * 170}px) rotateY(${d * -26}deg) scale(${centro ? 1 : 0.92})`,
                /* 0.88 y no 0.55. Con 0.55 las de los lados desaparecian: son
                   fotos de paredes y techos claros, y atenuadas sobre un fondo
                   crema se blanqueaban hasta quedar en rectangulos vacios. Se
                   vio en una captura; midiendo, las imagenes estaban cargadas y
                   con tamaño, asi que por ahi no habia nada que encontrar.

                   La profundidad no la daba la opacidad de todos modos: la dan
                   el tamaño, la posicion y la sombra. */
                opacity: fuera ? 0 : centro ? 1 : 0.88,
                zIndex: fotos.length - Math.abs(d),
                pointerEvents: fuera ? "none" : "auto",
              }}
            >
              {/* La foto va en su PROPIA capa, no directamente en el botón.

                  El botón es quien lleva la transformación 3D. Tener en el
                  mismo elemento un `transform` en 3D y un `overflow: hidden`
                  hace que el navegador tenga que recortar un plano girado, y
                  en Chromium eso acaba con la imagen sin pintarse: la tarjeta
                  salía como un rectángulo del color de fondo. Nada lo
                  delataba midiendo —la imagen estaba cargada, con tamaño y con
                  opacidad 1—, solo se veía en una captura.

                  Separado en dos capas, cada elemento hace una cosa: el botón
                  gira, la capa de dentro recorta. */}
              <span className="cons3d-foto">
                <Image
                  src={f.src}
                  alt={centro ? f.label : ""}
                  fill
                  sizes="(max-width: 768px) 80vw, 480px"
                  quality={centro ? 78 : 45}
                  /* Solo la del centro corre prisa: es la que se está mirando.
                     Marcar las cinco como prioritarias es no priorizar nada. */
                  priority={centro}
                  style={{ objectFit: "cover" }}
                />
              </span>
              {centro && <span className="cons3d-pie">{f.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Los puntos son también el indicador de cuántas fotos hay. En una vista
          donde solo se ven tres a la vez, sin esto no hay forma de saber si
          quedan dos más o quince. */}
      <div className="cons3d-puntos">
        {fotos.map((f, i) => (
          <button
            key={f.src}
            type="button"
            className={"cons3d-punto" + (i === activo ? " es-activo" : "")}
            aria-label={f.label}
            aria-current={i === activo}
            onClick={() => onSeleccionar(i)}
          />
        ))}
      </div>
    </div>
  );
}
