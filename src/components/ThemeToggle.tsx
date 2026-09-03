"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

type ThemeChoice = "light" | "dark";
const STORAGE_KEY = "THEME";

function applyTheme(choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", choice);
}

/**
 * Toggle de tema: claro / oscuro.
 * Persistido en localStorage.
 */
export default function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null)
      : null) || "light";
    const valid: ThemeChoice = stored === "dark" ? "dark" : "light";
    setChoice(valid);
    setMounted(true);
  }, []);

  const pick = (next: ThemeChoice) => {
    setChoice(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
    applyTheme(next);
  };

  if (!mounted) {
    return <div style={{ width: 64, height: 30 }} aria-hidden />;
  }

  const opt = (key: ThemeChoice, icon: React.ReactNode, label: string) => {
    const active = choice === key;
    return (
      <button
        key={key}
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={() => pick(key)}
        title={label}
        style={{
          width: 30,
          height: 26,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
          border: "none",
          background: active ? "linear-gradient(135deg, var(--brand), var(--brand-soft))" : "transparent",
          color: active ? "#fff" : "var(--text-soft)",
          cursor: "pointer",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={key + String(active)}
            initial={{ scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            style={{ display: "inline-flex" }}
          >
            {icon}
          </motion.span>
        </AnimatePresence>
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Tema"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        background: "var(--surface-soft)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        padding: 2,
      }}
    >
      {opt("light", <Sun size={14} />, "Claro")}
      {opt("dark", <Moon size={14} />, "Oscuro")}
    </div>
  );
}
