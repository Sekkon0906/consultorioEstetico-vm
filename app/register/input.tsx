"use client";

import React from "react";

interface Props {
  label: string;
  type?: string;
  value: string;
  setValue: (v: string) => void;
  error?: string | false;
  palette: {
    main: string;
    text: string;
    surface: string;
    border: string;
    muted?: string;
  };
}

export default function Input({
  label,
  type = "text",
  value,
  setValue,
  error,
  palette,
}: Props) {
  /* El id sale de la etiqueta, no de una prop.
   *
   * Antes el <label> llevaba el texto visible pero no estaba ASOCIADO al
   * campo: sin `htmlFor`/`id`, un lector de pantalla anuncia "cuadro de
   * texto" sin decir de que, y pulsar la etiqueta no lleva el foco al
   * campo.
   *
   * Se deriva del propio texto en vez de pedir una prop nueva, para no
   * tener que tocar las llamadas: este componente se usa en todo el
   * registro y el objetivo era arreglarlo entero de una vez. */
  const id = "campo-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <div className="mb-3 text-start">
      <label
        htmlFor={id}
        className="form-label fw-semibold"
        style={{ color: palette.text }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`form-control rounded-3 shadow-sm ${error ? "is-invalid" : ""}`}
        placeholder={type === "email" ? "tucorreo@gmail.com" : undefined}
        style={{
          borderColor: palette.border,
          backgroundColor: palette.surface,
        }}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
