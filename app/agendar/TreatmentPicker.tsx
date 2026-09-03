"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Procedimiento } from "@/types/domain";

interface Props {
  value: string;
  onChange: (val: string) => void;
  procedimientos: Procedimiento[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Selector de tratamiento custom: opener tipo botón + modal con
 * búsqueda y categorías agrupadas. Funciona con touch (scroll suave
 * con overscroll-contain) y teclado (Esc cierra).
 */
export default function TreatmentPicker({
  value,
  onChange,
  procedimientos,
  placeholder,
  disabled,
}: Props) {
  const t = useTranslations("agendar.form");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus al abrir + cleanup body scroll
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t1);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Reset query al cerrar
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? procedimientos.filter((p) => {
          const hay = `${p.nombre} ${p.categoria} ${p.subcategoria ?? ""} ${p.desc ?? ""}`.toLowerCase();
          return hay.includes(q);
        })
      : procedimientos;

    const groups: Record<string, Procedimiento[]> = {
      Facial: [],
      Corporal: [],
      Capilar: [],
    };
    for (const p of filtered) {
      if (groups[p.categoria]) groups[p.categoria].push(p);
    }
    // Ordenar alfabéticamente dentro de cada categoría
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return groups;
  }, [procedimientos, query]);

  const totalFiltered = Object.values(grouped).reduce((a, g) => a + g.length, 0);
  const valid = procedimientos.find((p) => p.nombre === value);
  const label = valid?.nombre || "";

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="treatment-picker-overlay"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("procedure")}
        >
          <motion.div
            className="treatment-picker-modal"
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="treatment-picker-header">
              <h3 className="treatment-picker-title">
                {t("procedure")}
                <button
                  type="button"
                  className="treatment-picker-close"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </h3>
              <div className="treatment-picker-search">
                <Search size={16} />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("procedurePlaceholder")}
                />
              </div>
            </div>

            <div className="treatment-picker-body">
              {totalFiltered === 0 ? (
                <p className="treatment-picker-empty">{t("procedurePlaceholder")}</p>
              ) : (
                (["Facial", "Corporal", "Capilar"] as const).map((cat) => {
                  const list = grouped[cat];
                  if (!list || list.length === 0) return null;
                  const groupLabel =
                    cat === "Facial"
                      ? t("groupFacial")
                      : cat === "Corporal"
                      ? t("groupCorporal")
                      : t("groupCapilar");
                  return (
                    <div key={cat} className="treatment-picker-group">
                      <div className="treatment-picker-group-label">{groupLabel}</div>
                      {list.map((p) => {
                        const selected = p.nombre === value;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            className={
                              "treatment-picker-item" + (selected ? " is-selected" : "")
                            }
                            onClick={() => {
                              onChange(p.nombre);
                              setOpen(false);
                            }}
                          >
                            <span className="treatment-picker-item-text">
                              <span className="treatment-picker-item-name">{p.nombre}</span>
                              {p.subcategoria && (
                                <span className="treatment-picker-item-cat">
                                  {p.subcategoria}
                                </span>
                              )}
                            </span>
                            {selected && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        className={"treatment-picker-btn" + (!label ? " is-empty" : "")}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{label || placeholder || t("procedurePlaceholder")}</span>
        <ChevronDown size={16} className="treatment-picker-chevron" />
      </button>
      {typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
