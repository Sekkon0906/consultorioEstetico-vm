"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";

// Estilo de input compartido con el resto del panel
const IS: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #DCC7AC",
  background: "#FFFDFB",
  color: "#3A2A1A",
  fontSize: "0.88rem",
  outline: "none",
};

interface Campo {
  clave: string;
  valor: string;
  etiqueta: string;
  ayuda: string;
  tipo: string;
  orden: number;
}

type Grupos = Record<string, Campo[]>;

const TITULOS: Record<string, string> = {
  contacto:  "Contacto",
  ubicacion: "Ubicación del consultorio",
  horario:   "Horario de atención",
  legal:     "Identidad legal",
  marca:     "Marca y contenido",
};

const DESCRIPCIONES: Record<string, string> = {
  contacto:  "Se usan en el pie de página, en el botón de confirmar cita y en las páginas legales.",
  ubicacion: "Aparece en el pie de página, en las páginas legales y en el PDF de consentimiento.",
  horario:   "El texto se muestra al paciente; las horas limitan el calendario de agendamiento.",
  legal:     "Datos del responsable del tratamiento. Obligatorios en términos y condiciones.",
  marca:     "Cómo se presenta el consultorio en el sitio.",
};

export default function ConfiguracionForm() {
  const [grupos, setGrupos]   = useState<Grupos>({});
  const [editado, setEditado] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [exito, setExito]     = useState(false);

  useEffect(() => {
    let vivo = true;
    api
      .get<{ ok: boolean; data: Grupos }>("/configuracion/campos")
      .then((r) => { if (vivo) setGrupos(r.data || {}); })
      .catch((e) => { if (vivo) setError(e?.message || "No se pudo cargar la configuración"); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  // Valor mostrado: lo editado si existe, si no lo que vino del servidor
  const valorDe = (c: Campo) => (c.clave in editado ? editado[c.clave] : c.valor);

  const cambios = useMemo(() => {
    const out: Record<string, string> = {};
    for (const lista of Object.values(grupos)) {
      for (const c of lista) {
        if (c.clave in editado && editado[c.clave] !== c.valor) out[c.clave] = editado[c.clave];
      }
    }
    return out;
  }, [grupos, editado]);

  const nCambios = Object.keys(cambios).length;

  const guardar = async () => {
    if (!nCambios) return;
    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      await api.put<{ ok: boolean }>("/configuracion", cambios);
      // Los valores guardados pasan a ser los del servidor
      setGrupos((prev) => {
        const next: Grupos = {};
        for (const [g, lista] of Object.entries(prev)) {
          next[g] = lista.map((c) =>
            c.clave in cambios ? { ...c, valor: cambios[c.clave] } : c
          );
        }
        return next;
      });
      setEditado({});
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p style={{ color: "#6C584C", padding: "1rem" }}>Cargando configuración…</p>;
  }

  const nombresGrupo = Object.keys(grupos).sort((a, b) => {
    const orden = ["contacto", "ubicacion", "horario", "legal", "marca"];
    return orden.indexOf(a) - orden.indexOf(b);
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", paddingBottom: 100 }}>
      <header style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ color: "#5A4230", fontWeight: 700, fontSize: "1.5rem", margin: 0 }}>
          Información general
        </h2>
        <p style={{ color: "#8A7461", fontSize: "0.88rem", marginTop: 6, marginBottom: 0 }}>
          Los datos del consultorio que cambian con el tiempo. Se actualizan en todo
          el sitio a la vez, incluidas las páginas legales y el consentimiento informado.
        </p>
      </header>

      {error && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#F7E4E1", border: "1px solid #E0B4AC", color: "#A5352B", padding: "0.7rem 0.9rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.85rem" }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {nombresGrupo.map((g) => (
        <section key={g} style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#5A4230", fontWeight: 600, fontSize: "1.05rem", margin: "0 0 2px" }}>
            {TITULOS[g] || g}
          </h3>
          {DESCRIPCIONES[g] && (
            <p style={{ color: "#9C8C7D", fontSize: "0.78rem", margin: "0 0 0.9rem" }}>
              {DESCRIPCIONES[g]}
            </p>
          )}

          <div style={{ display: "grid", gap: "0.9rem" }}>
            {grupos[g].map((c) => (
              <div key={c.clave}>
                <label
                  htmlFor={c.clave}
                  style={{ display: "block", color: "#5A4230", fontWeight: 600, fontSize: "0.82rem", marginBottom: 4 }}
                >
                  {c.etiqueta}
                  {c.clave in cambios && (
                    <span style={{ color: "#B08968", fontWeight: 500, marginLeft: 6, fontSize: "0.72rem" }}>
                      sin guardar
                    </span>
                  )}
                </label>

                {c.tipo === "booleano" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "#3A2A1A" }}>
                    <input
                      id={c.clave}
                      type="checkbox"
                      checked={valorDe(c) === "true"}
                      onChange={(e) =>
                        setEditado({ ...editado, [c.clave]: e.target.checked ? "true" : "false" })
                      }
                    />
                    {valorDe(c) === "true" ? "Activado" : "Desactivado"}
                  </label>
                ) : c.tipo === "texto_largo" ? (
                  <textarea
                    id={c.clave}
                    style={{ ...IS, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                    value={valorDe(c)}
                    onChange={(e) => setEditado({ ...editado, [c.clave]: e.target.value })}
                  />
                ) : (
                  <input
                    id={c.clave}
                    type={c.tipo === "email" ? "email" : c.tipo === "url" ? "url" : "text"}
                    style={IS}
                    value={valorDe(c)}
                    onChange={(e) => setEditado({ ...editado, [c.clave]: e.target.value })}
                  />
                )}

                {c.ayuda && (
                  <p style={{ color: "#9C8C7D", fontSize: "0.74rem", margin: "4px 0 0" }}>
                    {c.ayuda}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Barra de guardado fija */}
      <div
        style={{
          position: "sticky", bottom: 0, background: "rgba(251,247,242,0.96)",
          backdropFilter: "blur(8px)", borderTop: "1px solid #DCC7AC",
          padding: "0.85rem 0", marginTop: "1rem",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}
      >
        <Button variant="primary" onClick={guardar} disabled={!nCambios || guardando}>
          <Save size={16} />
          {guardando ? "Guardando…" : nCambios ? `Guardar ${nCambios} cambio${nCambios > 1 ? "s" : ""}` : "Sin cambios"}
        </Button>

        {nCambios > 0 && !guardando && (
          <Button variant="ghost" size="sm" onClick={() => setEditado({})} style={{ border: "none" }}>
            <RotateCcw size={14} /> Descartar
          </Button>
        )}

        {exito && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#3E6B50", fontSize: "0.84rem", fontWeight: 600 }}>
            <Check size={16} /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
