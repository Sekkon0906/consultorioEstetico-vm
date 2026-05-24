"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, LOCALE_COOKIE, type Locale } from "../../i18n/request";

/**
 * Server action para cambiar el idioma. Guarda el locale en una cookie
 * (1 año) y revalida la página actual para que los mensajes se vuelvan a
 * cargar en el nuevo idioma.
 */
export async function setLocale(locale: Locale, pathname: string = "/") {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath(pathname);
}
