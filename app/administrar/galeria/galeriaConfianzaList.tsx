"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  getGaleriaConfianzaApi,
  addFotoConfianzaApi,
  updateFotoConfianzaApi,
  deleteFotoConfianzaApi,
  type FotoConfianza,
} from "@/services/galeriaConfianzaApi";
import { subirImagenApi } from "@/services/uploadsApi";

/**
 * Galería de la sección "Por qué confiarme" de la home.
 *
 * Reemplaza al vídeo de presentación: grabarlo se estaba complicando, así
 * que ese bloque pasa a ser fotos que la doctora administra — bioseguridad,
 * esterilización y los equipos con los que trabaja.
 *
 * El orden importa y es visible: la primera foto abre la sección en la
 * home, y por eso lleva su distintivo. Se reordena con flechas y no
 * arrastrando: en una lista corta, arrastrar es más difícil de acertar,
 * sobre todo con el dedo.
 */
export default function GaleriaConfianzaList() {
  const [fotos, setFotos] = useState<FotoConfianza[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmarId, setConfirmarId] = useState<number | null>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    try {
      setFotos(await getGaleriaConfianzaApi());
    } catch {
      setError("No se pudieron cargar las fotos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const onSubir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setError(null);
    try {
      const url = await subirImagenApi(file, "imagenesPublicas");
      await addFotoConfianzaApi({ url });
      await cargar();
    } catch {
      setError("No se pudo subir la foto. Revisa el formato y el tamaño.");
    } finally {
      setSubiendo(false);
      if (inputFile.current) inputFile.current.value = "";
    }
  };

  const guardarPie = async (
    f: FotoConfianza,
    campo: "titulo" | "descripcion",
    valor: string
  ) => {
    setFotos((prev) => prev.map((x) => (x.id === f.id ? { ...x, [campo]: valor } : x)));
    try {
      await updateFotoConfianzaApi(f.id, { [campo]: valor });
    } catch {
      setError("No se pudo guardar el texto.");
    }
  };

  /** Intercambia el orden con la vecina: dos UPDATE, no reescribir la lista. */
  const mover = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fotos.length) return;
    const a = fotos[i];
    const b = fotos[j];
    const copia = [...fotos];
    copia[i] = b;
    copia[j] = a;
    setFotos(copia);
    try {
      await Promise.all([
        updateFotoConfianzaApi(a.id, { orden: b.orden }),
        updateFotoConfianzaApi(b.id, { orden: a.orden }),
      ]);
      await cargar();
    } catch {
      setError("No se pudo cambiar el orden.");
      await cargar();
    }
  };

  const eliminar = async (id: number) => {
    setConfirmarId(null);
    try {
      await deleteFotoConfianzaApi(id);
      setFotos((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("No se pudo eliminar la foto.");
    }
  };

  if (cargando) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
        <div className="spinner-border" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  const btnIcono = (activo: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "var(--surface-soft)",
    border: "none",
    cursor: activo ? "pointer" : "default",
    opacity: activo ? 1 : 0.4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Galería de confianza
          </h2>
          <p style={{ color: "var(--text-soft)", fontSize: "0.88rem", margin: "0.25rem 0 0", maxWidth: "var(--ancho-texto)" }}>
            Las fotos que aparecen en &ldquo;Por qué confiarme&rdquo; de la página de
            inicio: bioseguridad, esterilización y los equipos del consultorio.{" "}
            <strong>La primera es la que abre la sección.</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn-accion"
          onClick={() => inputFile.current?.click()}
          disabled={subiendo}
          style={{
            padding: "var(--btn-pad-md)",
            borderRadius: "var(--btn-radio)",
            border: "none",
            background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
            color: "var(--brand-contrast)",
            fontWeight: 600,
            cursor: subiendo ? "wait" : "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {subiendo ? "Subiendo…" : "+ Añadir foto"}
        </button>
        <input ref={inputFile} type="file" accept="image/*" onChange={onSubir} style={{ display: "none" }} />
      </div>

      {error && (
        <div style={{ background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", color: "var(--danger)", padding: "0.6rem 1rem", borderRadius: 12, marginBottom: "1rem", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          {error}
          <button aria-label="Cerrar aviso" onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            &times;
          </button>
        </div>
      )}

      {fotos.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Todavía no hay fotos. Añade la primera.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {fotos.map((f, i) => (
            <div key={f.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "0.9rem" }}>
              <div style={{ position: "relative", width: 116, height: 82, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "var(--surface-soft)" }}>
                <Image src={f.url} alt="" fill sizes="116px" quality={55} style={{ objectFit: "cover" }} />
                {i === 0 && (
                  <span style={{ position: "absolute", top: 4, left: 4, fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.06em", background: "var(--brand)", color: "var(--brand-contrast)", padding: "0.12rem 0.4rem", borderRadius: 100 }}>
                    PRIMERA
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <input
                  defaultValue={f.titulo}
                  placeholder="Título (ej. Esterilización de instrumental)"
                  onBlur={(e) => guardarPie(f, "titulo", e.target.value)}
                  style={{ width: "100%", padding: "0.45rem 0.7rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600 }}
                />
                <input
                  defaultValue={f.descripcion}
                  placeholder="Descripción corta (qué se ve en la foto)"
                  onBlur={(e) => guardarPie(f, "descripcion", e.target.value)}
                  style={{ width: "100%", padding: "0.45rem 0.7rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "inherit", fontSize: "0.82rem" }}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  El texto se guarda al salir del campo.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button aria-label="Subir una posición" title="Subir una posición" onClick={() => mover(i, -1)} disabled={i === 0} style={btnIcono(i !== 0)}>
                  <ArrowUp size={15} color="var(--text)" />
                </button>
                <button aria-label="Bajar una posición" title="Bajar una posición" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} style={btnIcono(i !== fotos.length - 1)}>
                  <ArrowDown size={15} color="var(--text)" />
                </button>
                <button
                  aria-label="Eliminar foto"
                  title="Eliminar foto"
                  onClick={() => setConfirmarId(f.id)}
                  style={{ width: 34, height: 34, borderRadius: 9, background: "color-mix(in srgb, var(--danger) 12%, var(--surface))", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Trash2 size={15} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmarId !== null && (
        <div onClick={() => setConfirmarId(null)} style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: "1.6rem", maxWidth: 380, width: "100%", border: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: "0.4rem" }}>
              ¿Eliminar esta foto?
            </p>
            <p style={{ color: "var(--text-soft)", fontSize: "0.86rem", marginBottom: "1.2rem" }}>
              Dejará de verse en la página de inicio. El archivo no se borra del
              almacenamiento.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
              <button onClick={() => setConfirmarId(null)} style={{ padding: "var(--btn-pad-sm)", borderRadius: "var(--btn-radio)", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmarId)} style={{ padding: "var(--btn-pad-sm)", borderRadius: "var(--btn-radio)", border: "none", background: "var(--danger)", color: "var(--bg-elevated)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
