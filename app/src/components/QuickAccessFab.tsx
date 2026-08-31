"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sliders, Phone, X } from "lucide-react";
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

  return (
    <div ref={ref} className="quick-fab">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
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

            <a href="tel:+573155445748" className="quick-fab-contact">
              <Phone size={15} /> 315 5445748
            </a>

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
            initial={{ opacity: 0, rotate: -45 }}
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
