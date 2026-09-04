"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { MUELLE_ENTRADA } from "@/lib/movimiento";

// Estilo de input compartido con el resto del panel
const IS: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
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

/**
 * Estado de guardado de UN campo. La pantalla entera ya no tiene un estado
 * global de "guardando": cada dato viaja solo.
 */
type EstadoCampo = "guardando" | "guardado" | "error";

/**
 * Lo que le pasa a un campo, dicho al lado del campo.
 *
 * Va dentro de la etiqueta y no debajo del input: si fuera debajo,
 * aparecer y desaparecer empujaría el resto del formulario hacia abajo cada
 * vez que guardas algo, y con treinta campos eso es la pantalla entera
 * saltando. Aquí ocupa un hueco que ya estaba vacío.
 */
function EstadoDelCampo({
  estado,
  pendiente,
  onReintentar,
  onDescartar,
}: {
  estado?: EstadoCampo;
  pendiente: boolean;
  onReintentar: () => void;
  onDescartar: () => void;
}) {
  const base: React.CSSProperties = {
    marginLeft: 8,
    fontSize: "0.72rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    verticalAlign: "middle",
  };

  if (estado === "guardando") {
    return (
      <span style={{ ...base, color: "var(--text-muted)" }}>
        <Loader2 size={12} style={{ animation: "cfg-gira 900ms linear infinite" }} />
        guardando
        <style>{`@keyframes cfg-gira { to { transform: rotate(360deg); } }`}</style>
      </span>
    );
  }

  if (estado === "guardado") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={MUELLE_ENTRADA}
        style={{ ...base, color: "var(--estado-atendida)" }}
      >
        <Check size={13} strokeWidth={3} /> guardado
      </motion.span>
    );
  }

  if (estado === "error") {
    return (
      <span style={{ ...base, color: "var(--danger)" }}>
        no se guardó
        <button
          type="button"
          onClick={onReintentar}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", textDecoration: "underline", font: "inherit" }}
        >
          reintentar
        </button>
        <button
          type="button"
          onClick={onDescartar}
          aria-label="Descartar el cambio"
          title="Descartar el cambio"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}
        >
          <RotateCcw size={12} />
        </button>
      </span>
    );
  }

  // Editado pero todavía dentro del campo: aún no ha salido, así que aún no
  // se ha intentado guardar.
  if (pendiente) {
    return <span style={{ ...base, color: "var(--brand)", fontWeight: 500 }}>sin guardar</span>;
  }

  return null;
}

export default function ConfiguracionForm() {
  const [grupos, setGrupos]   = useState<Grupos>({});
  const [editado, setEditado] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  /** Fallo al CARGAR: no hay nada que editar, así que ocupa la pantalla. */
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  /** Fallo al GUARDAR un campo: el dato sigue en pantalla, el aviso es al pie. */
  const [error, setError]     = useState<string | null>(null);
  /** clave -> en qué punto está su guardado. Solo lo que se está moviendo. */
  const [estados, setEstados] = useState<Record<string, EstadoCampo>>({});

  useEffect(() => {
    let vivo = true;
    api
      .get<{ ok: boolean; data: Grupos }>("/configuracion/campos")
      .then((r) => { if (vivo) setGrupos(r.data || {}); })
      .catch((e) => { if (vivo) setErrorCarga(e?.message || "No se pudo cargar la configuración"); })
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

  /**
   * Guarda UN campo, al salir de él.
   *
   * POR QUÉ NO HAY BOTÓN DE GUARDAR
   * Esto no es un formulario: son treinta datos sueltos que se tocan de uno
   * en uno, meses aparte. "Cambiar el WhatsApp" no tiene nada que ver con
   * "cambiar el horario del sábado", y un botón único al fondo obliga a
   * bajar hasta él para confirmar algo que ya escribiste — y, peor, deja
   * abierta la posibilidad de perderlo todo si te vas de la página.
   *
   * Al salir del campo se guarda solo, y el propio campo dice qué le pasó:
   * girando mientras viaja, con una marca cuando llegó, en rojo con un
   * "reintentar" si falló. El error se queda AL LADO del dato que falló y
   * no en una banda arriba, porque con treinta campos una banda no dice
   * cuál de ellos hay que arreglar.
   *
   * No se guarda mientras escribes (con retardo) sino al salir: escribiendo
   * un teléfono se pasa por seis estados intermedios que no son válidos, y
   * mandarlos al servidor solo genera ruido.
   */
  const guardarCampo = async (clave: string, valor: string) => {
    const original = Object.values(grupos).flat().find((c) => c.clave === clave)?.valor;
    if (original === undefined || valor === original) return;

    setEstados((p) => ({ ...p, [clave]: "guardando" }));
    setError(null);
    try {
      await api.put<{ ok: boolean }>("/configuracion", { [clave]: valor });
      // Lo guardado pasa a ser el valor del servidor, y se deja de
      // considerar "editado": si no, el campo seguiría marcado como
      // pendiente para siempre.
      setGrupos((prev) => {
        const next: Grupos = {};
        for (const [g, lista] of Object.entries(prev)) {
          next[g] = lista.map((c) => (c.clave === clave ? { ...c, valor } : c));
        }
        return next;
      });
      setEditado((p) => {
        const { [clave]: _, ...resto } = p;
        return resto;
      });
      setEstados((p) => ({ ...p, [clave]: "guardado" }));
      // La marca de guardado se va sola: es un acuse de recibo, no un
      // estado permanente que haya que ir limpiando a mano.
      setTimeout(() => {
        setEstados((p) => {
          if (p[clave] !== "guardado") return p;
          const { [clave]: _, ...resto } = p;
          return resto;
        });
      }, 2200);
    } catch (e: unknown) {
      setEstados((p) => ({ ...p, [clave]: "error" }));
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  /** Devuelve el campo a lo que hay en el servidor. */
  const descartarCampo = (clave: string) => {
    setEditado((p) => {
      const { [clave]: _, ...resto } = p;
      return resto;
    });
    setEstados((p) => {
      const { [clave]: _, ...resto } = p;
      return resto;
    });
  };

  if (cargando) {
    return <p style={{ color: "var(--text-soft)", padding: "1rem" }}>Cargando configuración…</p>;
  }

  if (errorCarga) {
    // La sesión caducada es el fallo más común aquí y no es un error del
    // sistema: es que pasó el tiempo. Merece su propio texto y una salida,
    // en vez de escupir "Token inválido o expirado", que no le dice a nadie
    // qué hacer.
    const esSesion = /token|sesi[oó]n|401|autoriz/i.test(errorCarga);
    return (
      <div style={{ maxWidth: 520, margin: "3rem auto", textAlign: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 18, padding: "2.2rem 1.6rem" }}>
        <AlertCircle size={30} color="var(--danger)" style={{ marginBottom: "0.9rem" }} />
        <p style={{ color: "var(--text)", fontWeight: 700, marginBottom: "0.4rem" }}>
          {esSesion ? "Tu sesión caducó" : "No se pudo cargar la información"}
        </p>
        <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {esSesion
            ? "Por seguridad la sesión del panel se cierra sola tras un rato sin uso. Vuelve a entrar y sigues donde estabas."
            : errorCarga}
        </p>
        <a
          href={esSesion ? "/login" : "/administrar?section=configuracion"}
          className="btn-accion"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.8rem 1.7rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, textDecoration: "none" }}
        >
          {esSesion ? "Volver a entrar" : "Reintentar"}
        </a>
      </div>
    );
  }

  const nombresGrupo = Object.keys(grupos).sort((a, b) => {
    const orden = ["contacto", "ubicacion", "horario", "legal", "marca"];
    return orden.indexOf(a) - orden.indexOf(b);
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", paddingBottom: 100 }}>
      <header style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.5rem", margin: 0 }}>
          Información general
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 6, marginBottom: 0 }}>
          Los datos del consultorio que cambian con el tiempo. Se actualizan en todo
          el sitio a la vez, incluidas las páginas legales y el consentimiento informado.
        </p>
      </header>

      {nombresGrupo.map((g) => (
        <section key={g} style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "var(--text)", fontWeight: 600, fontSize: "1.05rem", margin: "0 0 2px" }}>
            {TITULOS[g] || g}
          </h3>
          {DESCRIPCIONES[g] && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0 0 0.9rem" }}>
              {DESCRIPCIONES[g]}
            </p>
          )}

          <div style={{ display: "grid", gap: "0.9rem" }}>
            {grupos[g].map((c) => (
              <div key={c.clave}>
                <label
                  htmlFor={c.clave}
                  style={{ display: "block", color: "var(--text)", fontWeight: 600, fontSize: "0.82rem", marginBottom: 4 }}
                >
                  {c.etiqueta}
                  <EstadoDelCampo
                    estado={estados[c.clave]}
                    pendiente={c.clave in cambios}
                    onReintentar={() => guardarCampo(c.clave, valorDe(c))}
                    onDescartar={() => descartarCampo(c.clave)}
                  />
                </label>

                {c.tipo === "booleano" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "var(--text)" }}>
                    <input
                      id={c.clave}
                      type="checkbox"
                      checked={valorDe(c) === "true"}
                      onChange={(e) => {
                        const v = e.target.checked ? "true" : "false";
                        setEditado({ ...editado, [c.clave]: v });
                        // Un interruptor no tiene "salir del campo": el
                        // clic ES la decisión, así que se guarda ya.
                        void guardarCampo(c.clave, v);
                      }}
                    />
                    {valorDe(c) === "true" ? "Activado" : "Desactivado"}
                  </label>
                ) : c.tipo === "texto_largo" ? (
                  <textarea
                    id={c.clave}
                    style={{ ...IS, minHeight: 80, resize: "vertical", fontFamily: "inherit", borderColor: estados[c.clave] === "error" ? "var(--danger)" : undefined }}
                    value={valorDe(c)}
                    onChange={(e) => setEditado({ ...editado, [c.clave]: e.target.value })}
                    onBlur={(e) => void guardarCampo(c.clave, e.target.value)}
                  />
                ) : (
                  <input
                    id={c.clave}
                    type={c.tipo === "email" ? "email" : c.tipo === "url" ? "url" : "text"}
                    style={{ ...IS, borderColor: estados[c.clave] === "error" ? "var(--danger)" : undefined }}
                    value={valorDe(c)}
                    onChange={(e) => setEditado({ ...editado, [c.clave]: e.target.value })}
                    onBlur={(e) => void guardarCampo(c.clave, e.target.value)}
                    onKeyDown={(e) => {
                      // Enter confirma sin tener que salir con el ratón, y
                      // Escape deshace: los dos atajos que uno intenta por
                      // instinto en un campo que se guarda solo.
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") { descartarCampo(c.clave); e.currentTarget.blur(); }
                    }}
                  />
                )}

                {c.ayuda && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.74rem", margin: "4px 0 0" }}>
                    {c.ayuda}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* La barra de guardar ya no existe: cada campo se guarda solo. Lo
          que queda es un aviso, y solo cuando hay algo que el usuario
          tendria que saber — nunca un "todo bien" permanente, que es ruido
          que se aprende a ignorar. */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={MUELLE_ENTRADA}
            style={{
              position: "sticky", bottom: 16, display: "flex", gap: 8,
              alignItems: "flex-start", background: "color-mix(in srgb, var(--danger) 14%, var(--surface))",
              border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
              color: "var(--danger)", padding: "0.7rem 0.9rem", borderRadius: 10,
              fontSize: "0.85rem", boxShadow: "var(--shadow-md)",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error} — el campo en rojo tiene el boton de reintentar.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
