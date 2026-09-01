/**
 * Helper para gestionar el consentimiento de cookies.
 *
 * - Las cookies **esenciales** siempre están activas (la app no funciona sin
 *   sesión/auth).
 * - Analíticas y marketing son opcionales y dependen del consentimiento.
 *
 * Para gatear scripts (p. ej. Google Analytics) en el futuro:
 *
 *   import { getConsent } from "@/lib/cookieConsent";
 *   if (getConsent().analytics) { ...cargar GA... }
 */

export type CookieConsent = {
  essential: true; // siempre
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp cuando el usuario eligió */
  decidedAt: string | null;
  /** Versión del banner: incrementar si cambian las categorías. */
  version: 1;
};

export const COOKIE_CONSENT_KEY = "consultorio-cookie-consent-v1";
export const CONSENT_VERSION = 1 as const;

const DEFAULT: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: CONSENT_VERSION,
};

export function getConsent(): CookieConsent {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== CONSENT_VERSION) return DEFAULT;
    return {
      ...DEFAULT,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: parsed.decidedAt ?? null,
    };
  } catch {
    return DEFAULT;
  }
}

export function hasDecided(): boolean {
  return !!getConsent().decidedAt;
}

export function setConsent(opts: { analytics: boolean; marketing: boolean }): void {
  if (typeof window === "undefined") return;
  const next: CookieConsent = {
    essential: true,
    analytics: !!opts.analytics,
    marketing: !!opts.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: next }));
}

export function acceptAll(): void {
  setConsent({ analytics: true, marketing: true });
}

export function rejectOptional(): void {
  setConsent({ analytics: false, marketing: false });
}

/**
 * Borra la decisión guardada (vuelve a estado "no decidido") y
 * dispara un evento para que el banner se vuelva a mostrar.
 */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new CustomEvent("open-cookie-banner"));
}
