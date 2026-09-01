"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { ButtonVariant, ButtonSize } from "./Button";

interface Props extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Enlace con aspecto de botón.
 *
 * Buena parte de las llamadas a la acción del sitio ("Agendar cita",
 * "Conoce los procedimientos", "Ver todos los procedimientos") navegan a otra
 * página, así que deben ser `<Link>` y no `<button>`: eso es lo que permite
 * abrirlas en pestaña nueva, copiar la dirección y que el buscador las siga.
 * Pero cada una traía sus propios estilos en línea, y por eso el mismo par de
 * botones se veía distinto en cada sección.
 *
 * Este componente comparte exactamente las clases de Button, así que el
 * aspecto sale del mismo sitio y no puede desincronizarse. La diferencia
 * está en la semántica del HTML, que es la que debe decidir: enlace si
 * navega, botón si ejecuta una acción en la misma página.
 */
export default function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: Props) {
  const clases = [
    "btn-app",
    `btn-app--${variant}`,
    `btn-app--${size}`,
    fullWidth ? "btn-app--full" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={clases} {...props}>
      {children}
    </Link>
  );
}
