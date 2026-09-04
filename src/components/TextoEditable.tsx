"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

/**
 * Un texto que se edita pulsándolo y se guarda al salir.
 *
 * PARA QUÉ
 * En el panel, corregir una tilde de un título obligaba a abrir un
 * formulario de seis campos, cambiar una letra y darle a guardar. Esa
 * fricción es la razón por la que las erratas se quedan puestas meses.
 *
 * CÓMO SE COMPORTA
 * · Pulsar entra en edición y selecciona todo: casi siempre se reescribe.
 * · Salir del campo guarda. Enter también; Escape deshace.
 * · Guardar vacío no borra: se entiende como "me arrepentí" y se revierte.
 *   Vaciar un título de verdad es una operación destructiva y no debe
 *   poder hacerse por descuido al pulsar fuera.
 * · Mientras viaja gira; al llegar aparece una marca que se va sola.
 * · Si falla, se queda en rojo con el texto original y el error al lado.
 *
 * El estado se dibuja DENTRO de la línea, no debajo: debajo, aparecer y
 * desaparecer empujaría la lista entera en cada guardado.
 */
export default function TextoEditable({
  valor,
  onGuardar,
  etiqueta,
  multilinea = false,
  placeholder,
  estilo,
}: {
  valor: string;
  onGuardar: (nuevo: string) => Promise<void>;
  /** Para lectores de pantalla: qué se está editando. */
  etiqueta: string;
  multilinea?: boolean;
  placeholder?: string;
  estilo?: React.CSSProperties;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Si el valor cambia por fuera (se recargó la lista), el borrador local
  // queda obsoleto. Se resincroniza mientras no se esté editando, para no
  // pisar lo que la doctora está escribiendo en ese momento.
  useEffect(() => { if (!editando) setTexto(valor); }, [valor, editando]);

  useEffect(() => {
    if (editando && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editando]);

  const confirmar = async () => {
    setEditando(false);
    const limpio = texto.trim();
    if (!limpio || limpio === valor) { setTexto(valor); return; }
    setEstado("guardando");
    try {
      await onGuardar(limpio);
      setEstado("ok");
      setTimeout(() => setEstado("idle"), 1800);
    } catch {
      setEstado("error");
      setTexto(valor);
    }
  };

  const comun = {
    value: texto,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTexto(e.target.value),
    onBlur: () => void confirmar(),
    "aria-label": etiqueta,
    placeholder,
    style: {
      width: "100%",
      padding: "0.3rem 0.5rem",
      borderRadius: 8,
      border: "1px solid var(--brand)",
      background: "var(--bg-elevated)",
      color: "var(--text)",
      font: "inherit",
      outline: "none",
      ...estilo,
    } as React.CSSProperties,
  };

  if (editando) {
    return multilinea ? (
      <textarea
        {...comun}
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        // En un textarea Enter es un salto de línea legítimo, así que aquí
        // solo Escape deshace; se guarda al salir del campo.
        onKeyDown={(e) => { if (e.key === "Escape") { setTexto(valor); setEditando(false); } }}
        style={{ ...comun.style, resize: "vertical", fontFamily: "inherit" }}
      />
    ) : (
      <input
        {...comun}
        ref={ref as React.RefObject<HTMLInputElement>}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setTexto(valor); setEditando(false); }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      title={`Pulsa para cambiar: ${etiqueta.toLowerCase()}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textAlign: "left",
        background: "none",
        border: "1px dashed transparent",
        borderRadius: 8,
        padding: "0.2rem 0.4rem",
        margin: "-0.2rem -0.4rem",
        cursor: "text",
        font: "inherit",
        color: estado === "error" ? "var(--danger)" : "inherit",
        maxWidth: "100%",
        ...estilo,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: multilinea ? "normal" : "nowrap" }}>
        {valor || <em style={{ color: "var(--text-muted)" }}>{placeholder || "Sin definir"}</em>}
      </span>
      {estado === "guardando" && (
        <Loader2 size={13} style={{ flexShrink: 0, animation: "txt-gira 900ms linear infinite" }} />
      )}
      {estado === "ok" && <Check size={13} strokeWidth={3} color="var(--estado-atendida)" style={{ flexShrink: 0 }} />}
      {estado === "error" && (
        <span style={{ fontSize: "0.68rem", fontWeight: 600, flexShrink: 0 }}>no se guardó</span>
      )}
      <style>{`@keyframes txt-gira { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
