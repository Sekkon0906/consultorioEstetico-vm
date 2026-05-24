import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "LOCALE";

/**
 * Config de next-intl SIN route prefix.
 * El locale se lee de una cookie (LOCALE). Si no existe, español.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value as Locale | undefined;
  const locale: Locale =
    cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
