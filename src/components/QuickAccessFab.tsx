"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sliders, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Acceso rápido flotante — SOLO escritorio (ver .quick-fab en globals.css).
 *
 * El navbar de escritorio tenía tema, idioma, login y 6 enlaces compitiendo
 * por el mismo espacio ("se ve muy compactado"). Tema e idioma salen de ahí
 * y viven aquí, junto con el contacto que antes solo aparecía en la franja
 * superior — así queda "siempre a la mano" sin importar cuánto se haya
 * bajado en la página, en vez de perderse al hacer scroll.
 */
export default function QuickAccessFab() {
  const t = useTranslations("topbar");
  const tf = useTranslations("footer");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const socials = [
    { href: "https://www.facebook.com/profile.php?id=61556167276406", icon: "fab fa-facebook-f", label: "Facebook" },
    { href: "https://www.instagram.com/dravanessamedinao28/", icon: "fab fa-instagram", label: "Instagram" },
    { href: "https://api.whatsapp.com/message/SEJTQDVCRWGSP1?autoload=1&app_absent=0", icon: "fab fa-whatsapp", label: "WhatsApp" },
  ];

  // Mismas rutas y etiquetas que el footer — si alguien cierra el banner
  // de cookies al entrar, este es el único lugar persistente donde
  // volver a encontrar estos enlaces sin bajar hasta el pie de página.
  const legalLinks = [
    { href: "/legal/privacidad", label: tf("legalLinks.privacy") },
    { href: "/legal/terminos", label: tf("legalLinks.terms") },
    { href: "/legal/cookies", label: tf("legalLinks.cookies") },
    { href: "/legal/aviso", label: tf("legalLinks.notice") },
  ];

  return (
    <div ref={ref} className="quick-fab">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="quick-fab-panel"
            role="dialog"
            aria-label={t("quickAccess")}
          >
            <div className="quick-fab-row">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <div className="quick-fab-divider" />

            <p className="quick-fab-heading">{t("contactInfo")}</p>

            {/* El teléfono en texto salió: el botón de WhatsApp de abajo
                ya cubre el contacto directo, era redundante tenerlo dos
                veces. */}
            <div className="quick-fab-socials">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="quick-fab-social"
                >
                  <i className={s.icon} />
                </a>
              ))}
            </div>

            <div className="quick-fab-divider" />

            <div className="quick-fab-legal">
              {legalLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("quickAccess")}
        aria-expanded={open}
        className="quick-fab-trigger"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
            style={{ display: "flex" }}
          >
            {open ? <X size={20} /> : <Sliders size={20} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
