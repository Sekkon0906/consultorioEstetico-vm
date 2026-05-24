"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "../../actions/locale";

/**
 * Toggle ES / EN. Llama a un server action que actualiza la cookie LOCALE
 * y revalida la ruta actual. El switch es accesible vía teclado.
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const [pending, startTransition] = useTransition();

  const switchTo = (next: "es" | "en") => {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next, pathname);
    });
  };

  const item = (code: "es" | "en", label: string) => {
    const active = locale === code;
    return (
      <button
        key={code}
        type="button"
        aria-pressed={active}
        onClick={() => switchTo(code)}
        disabled={pending}
        style={{
          padding: "0.25rem 0.55rem",
          borderRadius: 100,
          border: "none",
          background: active ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "transparent",
          color: active ? "#fff" : "#6B4E3D",
          fontWeight: 700,
          fontSize: "0.74rem",
          letterSpacing: "0.04em",
          cursor: pending ? "wait" : "pointer",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Language switcher"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        background: "#FAF6F0",
        border: "1px solid rgba(176,137,104,0.25)",
        borderRadius: 100,
        padding: 2,
      }}
    >
      {item("es", "ES")}
      {item("en", "EN")}
    </div>
  );
}
