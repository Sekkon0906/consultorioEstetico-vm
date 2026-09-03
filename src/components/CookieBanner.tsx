"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
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
 * Se puede reabrir disparando el evento `open-cookie-preferences`
 * (lo emite el botón "Preferencias de cookies" del Footer).
 */
export default function CookieBanner() {
  const t = useTranslations("cookies");
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

    // Listener para reabrir desde el footer.
    const handler = () => {
      const cur = getConsent();
      setAnalytics(cur.analytics);
      setMarketing(cur.marketing);
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-preferences", handler);
    return () => window.removeEventListener("open-cookie-preferences", handler);
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
          aria-label={t("title")}
          initial={{ y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "fixed",
            bottom: 18,
            left: 18,
            right: 18,
            maxWidth: 580,
            zIndex: 9000,
            background: "var(--surface)",
            border: "1px solid rgba(176,137,104,0.2)",
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(78,59,43,0.2)",
            overflow: "hidden",
          }}
          className="cookie-banner dark-aware-card"
        >
          <div style={{ height: 3, background: "linear-gradient(90deg, var(--brand), #C9AD8D)" }} />
          <div style={{ padding: "1.1rem 1.2rem 1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
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
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {t("title")}
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
              {t("message")}{" "}
              <Link
                href="/legal/cookies"
                style={{ color: "var(--brand)", textDecoration: "underline" }}
              >
                {t("moreInfo")}
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
                    className="dark-aware-panel"
                    style={{
                      background: "var(--surface-soft)",
                      borderRadius: 12,
                      padding: "0.8rem 0.9rem",
                      marginBottom: "0.9rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <Pref
                      label={t("essential")}
                      desc={t("essentialDesc")}
                      locked
                      checked
                    />
                    <Pref
                      label={t("analytics")}
                      desc={t("analyticsDesc")}
                      checked={analytics}
                      onChange={setAnalytics}
                    />
                    <Pref
                      label={t("marketing")}
                      desc={t("marketingDesc")}
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
                  {t("savePreferences")}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAcceptAll}
                  style={primaryBtn}
                >
                  {t("acceptAll")}
                </motion.button>
              )}
              <button onClick={handleRejectOptional} className="btn-ghost-app" style={ghostBtn}>
                {t("rejectOptional")}
              </button>
              {!expanded && (
                <button onClick={() => setExpanded(true)} className="btn-ghost-app" style={ghostBtn}>
                  {t("customize")}
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
  background: "linear-gradient(135deg, var(--brand-deep), #B08968)",
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
  color: "var(--text-soft)",
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
        style={{ marginTop: 3, accentColor: "var(--brand)" }}
      />
      <span>
        <strong style={{ color: "var(--text)", fontSize: "0.86rem" }}>{label}</strong>
        <span style={{ display: "block", color: "var(--text-soft)", fontSize: "0.78rem", lineHeight: 1.45 }}>
          {desc}
        </span>
      </span>
    </label>
  );
}
