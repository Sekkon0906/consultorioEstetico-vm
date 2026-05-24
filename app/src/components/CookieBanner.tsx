"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import {
  hasDecided,
  getConsent,
  acceptAll,
  rejectOptional,
  setConsent,
} from "@/lib/cookieConsent";

/**
 * Banner de cookies discreto (card flotante abajo a la izquierda) con 3
 * acciones: Aceptar todas · Rechazar opcionales · Personalizar.
 *
 * Solo aparece la primera vez (mientras no haya una decisión guardada).
 */
export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Evita mismatch de hidratación: solo decide en el cliente.
  useEffect(() => {
    setMounted(true);
    if (!hasDecided()) {
      setVisible(true);
    }
    const c = getConsent();
    setAnalytics(c.analytics);
    setMarketing(c.marketing);
  }, []);

  if (!mounted) return null;

  const close = () => {
    setVisible(false);
    setExpanded(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    close();
  };
  const handleRejectOptional = () => {
    rejectOptional();
    close();
  };
  const handleSave = () => {
    setConsent({ analytics, marketing });
    close();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Aviso de cookies"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "fixed",
            bottom: 18,
            left: 18,
            right: 18,
            maxWidth: 460,
            zIndex: 9000,
            background: "#FFFDF9",
            border: "1px solid rgba(176,137,104,0.2)",
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(78,59,43,0.2)",
            overflow: "hidden",
          }}
        >
          <div style={{ height: 3, background: "linear-gradient(90deg, #B08968, #C9AD8D)" }} />
          <div style={{ padding: "1.1rem 1.2rem 1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #B08968, #C9AD8D)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                <Cookie size={16} />
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#3A2A1A",
                  margin: 0,
                }}
              >
                Tu privacidad importa
              </h3>
            </div>

            <p
              style={{
                fontSize: "0.88rem",
                color: "#5A4A3A",
                lineHeight: 1.55,
                margin: "0 0 0.9rem",
              }}
            >
              Usamos cookies esenciales para que el sitio funcione. Con tu
              permiso también podemos usar cookies analíticas o de marketing
              para mejorar tu experiencia.{" "}
              <Link
                href="/legal/cookies"
                style={{ color: "#B08968", textDecoration: "underline" }}
              >
                Más información
              </Link>
              .
            </p>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      background: "#F5EEE6",
                      borderRadius: 12,
                      padding: "0.8rem 0.9rem",
                      marginBottom: "0.9rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <Pref
                      label="Esenciales"
                      desc="Necesarias para sesión y agendamiento. Siempre activas."
                      locked
                      checked
                    />
                    <Pref
                      label="Analíticas"
                      desc="Nos ayudan a entender cómo usas el sitio (anónimo)."
                      checked={analytics}
                      onChange={setAnalytics}
                    />
                    <Pref
                      label="Marketing"
                      desc="Permiten personalizar contenido y medir campañas."
                      checked={marketing}
                      onChange={setMarketing}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {expanded ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  style={primaryBtn}
                >
                  Guardar preferencias
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAcceptAll}
                  style={primaryBtn}
                >
                  Aceptar todas
                </motion.button>
              )}
              <button onClick={handleRejectOptional} style={ghostBtn}>
                Rechazar opcionales
              </button>
              {!expanded && (
                <button onClick={() => setExpanded(true)} style={ghostBtn}>
                  Personalizar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  minWidth: 140,
  padding: "0.6rem 1rem",
  borderRadius: 100,
  border: "none",
  background: "linear-gradient(135deg, #8B6A4B, #B08968)",
  color: "#FFF",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(176,137,104,0.3)",
};

const ghostBtn: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: 100,
  border: "1px solid rgba(176,137,104,0.3)",
  background: "transparent",
  color: "#6C584C",
  fontWeight: 600,
  fontSize: "0.82rem",
  cursor: "pointer",
};

function Pref({
  label,
  desc,
  checked,
  onChange,
  locked,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "0.4rem 0",
        borderBottom: "1px solid rgba(176,137,104,0.12)",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.85 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!!locked}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ marginTop: 3, accentColor: "#B08968" }}
      />
      <span>
        <strong style={{ color: "#3A2A1A", fontSize: "0.86rem" }}>{label}</strong>
        <span style={{ display: "block", color: "#6C584C", fontSize: "0.78rem", lineHeight: 1.45 }}>
          {desc}
        </span>
      </span>
    </label>
  );
}
