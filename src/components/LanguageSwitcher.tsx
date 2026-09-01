"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/../app/actions/locale";

/**
 * Toggle ES / EN. Llama a un server action que actualiza la cookie LOCALE
 * y luego fuerza un refresh real para que TODOS los client components
 * vuelvan a montarse con los nuevos mensajes (revalidatePath solo no basta
 * para que algunos useTranslations() vean el cambio sin recargar).
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: "es" | "en") => {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next, pathname);
      router.refresh();
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
          background: active ? "linear-gradient(135deg, var(--brand), var(--brand-soft))" : "transparent",
          color: active ? "#fff" : "var(--text-soft)",
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
        background: "var(--surface-soft)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        padding: 2,
      }}
    >
      {item("es", "ES")}
      {item("en", "EN")}
    </div>
  );
}
