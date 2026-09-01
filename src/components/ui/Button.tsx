"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/**
 * Botón único del sitio. Antes cada pantalla definía su propio botón con
 * estilos en línea ligeramente distintos — mismo gradiente escrito de 9
 * formas diferentes, 15 valores de border-radius para lo que siempre era
 * "el botón principal". Este componente es el único lugar donde eso se
 * decide, apoyado en los tokens de globals.css (--brand, --brand-soft...),
 * así que hereda modo claro/oscuro sin código adicional.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, disabled, className, children, ...props },
  ref
) {
  const classes = [
    "btn-app",
    `btn-app--${variant}`,
    `btn-app--${size}`,
    fullWidth ? "btn-app--full" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={ref}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default Button;
