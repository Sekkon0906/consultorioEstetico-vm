"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, X, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// Etiquetas legibles: la doctora no debería ver nombres de funciones.
const ACCIONES: Record<string, string> = {
  crear_procedimiento:      "Crear un procedimiento nuevo",
  actualizar_procedimiento: "Modificar un procedimiento",
  configurar_promocion:     "Cambiar una promoción",
  actualizar_configuracion: "Cambiar la información general",
};

const CAMPOS: Record<string, string> = {
  nombre: "Nombre", descripcion: "Descripción", precio: "Precio",
  categoria: "Categoría", duracion_min: "Duración (minutos)", destacado: "Destacado",
  en_promocion: "En promoción", precio_promocional: "Precio promocional",
  promocion_hasta: "Promoción hasta", id: "Identificador", cambios: "Cambios",
};

interface Propuesta {
  explicacion: string;
  herramienta: string;
  argumentos: Record<string, unknown>;
}

interface Burbuja {
  de: "doctora" | "copiloto";
  texto: string;
}

type RespuestaApi = {
  ok: boolean;
  conversacionId: string;
  data:
    | { tipo: "texto"; texto: string }
    | { tipo: "propuesta"; explicacion: string; herramienta: string; argumentos: Record<string, unknown> };
  historial?: unknown[];
};

function valorLegible(v: unknown): string {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) {
    return v
      .map((x) =>
        x && typeof x === "object" && "clave" in x
          ? `${(x as { clave: string }).clave} → ${(x as { valor: string }).valor}`
          : JSON.stringify(x)
      )
      .join("\n");
  }
  if (v === null || v === undefined) return "—";
  return String(v);
}

export default function CopilotoChat() {
  const [burbujas, setBurbujas]   = useState<Burbuja[]>([]);
  const [entrada, setEntrada]     = useState("");
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [historial, setHistorial] = useState<unknown[]>([]);
  const [convId, setConvId]       = useState<string | null>(null);
  const [pensando, setPensando]   = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [burbujas, propuesta]);

  const enviar = async () => {
    const texto = entrada.trim();
    if (!texto || pensando) return;

    setBurbujas((b) => [...b, { de: "doctora", texto }]);
    setEntrada("");
    setPropuesta(null);
    setError(null);
    setPensando(true);

    try {
      const r = await api.post<RespuestaApi>("/copiloto/mensaje", {
        mensaje: texto,
        historial,
        conversacionId: convId,
      });
      setConvId(r.conversacionId);
      if (r.historial) setHistorial(r.historial);

      // Se extrae a una constante local: dentro de los closures de setState
      // TypeScript ya no puede estrechar r.data por su discriminante.
      const data = r.data;
      if (data.tipo === "propuesta") {
        setPropuesta({
          explicacion: data.explicacion,
          herramienta: data.herramienta,
          argumentos: data.argumentos,
        });
        if (data.explicacion) {
          setBurbujas((b) => [...b, { de: "copiloto", texto: data.explicacion }]);
        }
      } else {
        setBurbujas((b) => [...b, { de: "copiloto", texto: data.texto }]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "El copiloto no pudo responder");
    } finally {
      setPensando(false);
    }
  };

  const confirmar = async () => {
    if (!propuesta) return;
    setAplicando(true);
    setError(null);
    try {
      await api.post("/copiloto/confirmar", {
        herramienta: propuesta.herramienta,
        argumentos: propuesta.argumentos,
        conversacionId: convId,
      });
      setBurbujas((b) => [...b, { de: "copiloto", texto: "✓ Listo, el cambio quedó aplicado." }]);
      setPropuesta(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo aplicar el cambio");
    } finally {
      setAplicando(false);
    }
  };

  const rechazar = async () => {
    if (!propuesta) return;
    try {
      await api.post("/copiloto/rechazar", {
        herramienta: propuesta.herramienta,
        argumentos: propuesta.argumentos,
        conversacionId: convId,
      });
    } catch {
      // Descartar en la interfaz es lo que importa; el registro es secundario.
    }
    setPropuesta(null);
    setBurbujas((b) => [...b, { de: "copiloto", texto: "Descartado. ¿Qué ajustamos?" }]);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ color: "#5A4230", fontWeight: 700, fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={22} style={{ color: "#B08968" }} /> Asistente
        </h2>
        <p style={{ color: "#8A7461", fontSize: "0.88rem", marginTop: 6, marginBottom: 0 }}>
          Pídele que cree o cambie procedimientos, promociones e información del consultorio.
          Siempre te muestra qué va a hacer antes de hacerlo.
        </p>
      </header>

      {/* Conversación */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 12 }}>
        {burbujas.length === 0 && !pensando && (
          <div style={{ background: "#FBF7F2", border: "1px dashed #DCC7AC", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ color: "#5A4230", fontWeight: 600, fontSize: "0.88rem", margin: "0 0 8px" }}>
              Por ejemplo:
            </p>
            <ul style={{ color: "#8A7461", fontSize: "0.85rem", margin: 0, paddingLeft: "1.1rem", lineHeight: 1.9 }}>
              <li>Agrega rinomodelación con ácido hialurónico, facial, 45 minutos, 850.000</li>
              <li>Pon el botox en promoción a 600.000 hasta el 30 de septiembre</li>
              <li>Cambia el WhatsApp del consultorio a 3105551234</li>
              <li>¿Cuántas citas hubo en julio?</li>
            </ul>
          </div>
        )}

        {burbujas.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ alignSelf: b.de === "doctora" ? "flex-end" : "flex-start", maxWidth: "82%" }}
          >
            <div
              style={{
                padding: "0.7rem 1rem", borderRadius: 14, fontSize: "0.89rem", lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                background: b.de === "doctora" ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#FBF7F2",
                color: b.de === "doctora" ? "white" : "#3A2A1A",
                border: b.de === "doctora" ? "none" : "1px solid #E8DCCB",
              }}
            >
              {b.texto}
            </div>
          </motion.div>
        ))}

        {pensando && (
          <div style={{ alignSelf: "flex-start", color: "#8A7461", fontSize: "0.85rem", fontStyle: "italic" }}>
            Pensando…
          </div>
        )}

        {/* Propuesta pendiente de confirmación */}
        <AnimatePresence>
          {propuesta && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ background: "#FFFDFB", border: "2px solid #B08968", borderRadius: 14, padding: "1.1rem", alignSelf: "stretch" }}
            >
              <p style={{ color: "#8A6440", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                {ACCIONES[propuesta.herramienta] || propuesta.herramienta}
              </p>

              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", margin: "0 0 14px", fontSize: "0.86rem" }}>
                {Object.entries(propuesta.argumentos).map(([k, v]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <dt style={{ color: "#8A7461", fontWeight: 600 }}>{CAMPOS[k] || k}</dt>
                    <dd style={{ margin: 0, color: "#3A2A1A", whiteSpace: "pre-wrap" }}>{valorLegible(v)}</dd>
                  </div>
                ))}
              </dl>

              <p style={{ color: "#8A7461", fontSize: "0.78rem", margin: "0 0 12px" }}>
                Revisa los datos. Nada se ha guardado todavía.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={confirmar}
                  disabled={aplicando}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.2rem", borderRadius: 100, border: "none", background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", fontWeight: 600, fontSize: "0.84rem", cursor: aplicando ? "default" : "pointer" }}
                >
                  <Check size={15} /> {aplicando ? "Aplicando…" : "Confirmar"}
                </button>
                <button
                  onClick={rechazar}
                  disabled={aplicando}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.1rem", borderRadius: 100, border: "1px solid #DCC7AC", background: "transparent", color: "#8A7461", fontWeight: 600, fontSize: "0.84rem", cursor: aplicando ? "default" : "pointer" }}
                >
                  <X size={15} /> Descartar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#F7E4E1", border: "1px solid #E0B4AC", color: "#A5352B", padding: "0.7rem 0.9rem", borderRadius: 10, fontSize: "0.85rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <div ref={finRef} />
      </div>

      {/* Entrada */}
      <div style={{ display: "flex", gap: 10, paddingTop: "1rem", borderTop: "1px solid #E8DCCB", marginTop: "0.75rem" }}>
        <input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribe lo que necesitas…"
          disabled={pensando}
          style={{ flex: 1, padding: "0.65rem 1rem", borderRadius: 100, border: "1px solid #DCC7AC", background: "#FFFDFB", color: "#3A2A1A", fontSize: "0.89rem", outline: "none" }}
        />
        <button
          onClick={enviar}
          disabled={pensando || !entrada.trim()}
          aria-label="Enviar"
          style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: entrada.trim() && !pensando ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#DCC7AC", color: "white", display: "grid", placeItems: "center", cursor: entrada.trim() && !pensando ? "pointer" : "default", flexShrink: 0 }}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
