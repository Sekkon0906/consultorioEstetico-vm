"use client";

import { useState, useEffect, useMemo, useDeferredValue, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Search, X, ArrowRight, Sparkles, Calendar, ChevronLeft, ChevronRight, Star, ChevronDown, Check, ArrowUpDown } from "lucide-react";

import type { Procedimiento } from "../types/domain";
import { getProcedimientosApi } from "../services/procedimientosApi";
import { IMG } from "../src/lib/imagenes";

type Categoria = "todos" | "Facial" | "Corporal" | "Capilar";
type SortMode = "name" | "priceAsc" | "priceDesc" | "featured" | "discount";

/** Extrae el primer número significativo de un string de precio
 *  para poder ordenarlo numéricamente. "180.000" → 180000. */
function precioNum(precio: string | number | undefined): number {
  if (precio == null) return Number.POSITIVE_INFINITY;
  if (typeof precio === "number") return precio;
  const m = String(precio).replace(/[.\s]/g, "").match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.POSITIVE_INFINITY;
}

/**
 * Formatea valores de precio (número o string) usando el locale activo.
 * Aplica separadores de miles a cualquier número detectado en el string.
 */
function formatPrecio(precio: string | number, intlLocale: string): string {
  if (typeof precio === "number") {
    return precio.toLocaleString(intlLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return precio.replace(/\d{1,3}(?:\d{3})*(?:\.\d+)?/g, (match) => {
    const num = parseFloat(match.replace(/\./g, "").replace(/,/g, "."));
    if (isNaN(num)) return match;
    return num.toLocaleString(intlLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  });
}

export default function ProcedimientosPage() {
  const t = useTranslations("procedimientos");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";

  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<Categoria>("todos");
  const [subcategoria, setSubcategoria] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  // Reset subcategoría al cambiar de categoría — evita estados inválidos.
  useEffect(() => {
    setSubcategoria(null);
  }, [categoria]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getProcedimientosApi();
        if (mounted) setProcedimientos(data);
      } catch (err) {
        console.error("Error cargando procedimientos:", err);
        if (mounted) setError(t("errorLoad"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Procedimientos visibles en /procedimientos: la doctora decide desde
     el admin con `mostrarGaleriaProcedimientos`. Default true para no
     romper procedimientos existentes sin la flag tocada. */
  const visibles = useMemo(
    () => procedimientos.filter((p) => p.mostrarGaleriaProcedimientos !== false),
    [procedimientos]
  );

  /* Subcategorías únicas detectadas dentro de la categoría seleccionada.
     Las extraemos de los procedimientos existentes (no de una tabla
     aparte), así la doctora solo debe asignarlas en el admin. */
  const subcategorias = useMemo(() => {
    if (categoria === "todos") return [];
    const set = new Set<string>();
    visibles
      .filter((p) => p.categoria === categoria)
      .forEach((p) => {
        const s = p.subcategoria?.trim();
        if (s) set.add(s);
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibles, categoria]);

  /* Destacados y promociones: combina `destacado` + `enPromocion` para
     que ambos casos alimenten el carrusel. Solo entre los visibles. */
  const destacados = useMemo(
    () => visibles.filter((p) => p.destacado || p.enPromocion),
    [visibles]
  );

  /* Filtrado por categoría + subcategoría + búsqueda + sort dinámico. */
  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const list = visibles
      .filter((p) => categoria === "todos" || p.categoria === categoria)
      .filter((p) => !subcategoria || p.subcategoria === subcategoria)
      .filter((p) => {
        if (!query) return true;
        const haystack = `${p.nombre} ${p.desc ?? ""} ${p.categoria ?? ""} ${p.subcategoria ?? ""}`.toLowerCase();
        return haystack.includes(query);
      });

    const sorted = [...list];
    switch (sortMode) {
      case "priceAsc":
        sorted.sort((a, b) => precioNum(a.precio) - precioNum(b.precio));
        break;
      case "priceDesc":
        sorted.sort((a, b) => precioNum(b.precio) - precioNum(a.precio));
        break;
      case "featured":
        sorted.sort((a, b) => {
          if (a.destacado === b.destacado) return a.nombre.localeCompare(b.nombre);
          return a.destacado ? -1 : 1;
        });
        break;
      case "discount":
        sorted.sort((a, b) => {
          /* Promo prioriza primero (en_promocion=true).
             Fallback al nombre si ambos están iguales. */
          const aP = (a as any).enPromocion ? 1 : 0;
          const bP = (b as any).enPromocion ? 1 : 0;
          if (aP !== bP) return bP - aP;
          return a.nombre.localeCompare(b.nombre);
        });
        break;
      case "name":
      default:
        sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }
    return sorted;
  }, [visibles, deferredSearch, categoria, subcategoria, sortMode]);

  const chips: { key: Categoria; label: string }[] = [
    { key: "todos", label: t("filters.all") },
    { key: "Facial", label: t("filters.facial") },
    { key: "Corporal", label: t("filters.corporal") },
    { key: "Capilar", label: t("filters.capilar") },
  ];

  return (
    <main className="proc-page">
      {/* JM watermark gigante centrado */}
      <div
        aria-hidden="true"
        className="proc-jm-watermark"
        style={{
          backgroundImage: `url(${IMG.logo})`,
        }}
      />

      {/* === Encabezado === */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "4rem 1.5rem 2rem",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          style={{
            color: "var(--text-soft)",
            fontSize: "clamp(0.95rem, 1.1vw, 1.1rem)",
            lineHeight: 1.6,
            maxWidth: 720,
            margin: "1rem auto 0",
          }}
        >
          {t("subtitle")}
        </motion.p>
      </section>

      {/* === Carrusel de destacados y promociones === */}
      {!loading && destacados.length > 0 && (
        <FeaturedCarousel
          items={destacados}
          intlLocale={intlLocale}
          t={t}
        />
      )}

      {/* === Buscador sticky + chips === */}
      <div className="proc-toolbar-sticky">
        <div className="proc-toolbar-inner">
          {/* Buscador */}
          <div className="proc-search-wrap">
            <Search size={18} className="proc-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="proc-search-input"
              aria-label={t("filters.searchPlaceholder")}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("filters.clearSearch")}
                className="proc-search-clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Chips de categoría */}
          <div className="proc-chips" role="tablist">
            {chips.map((c) => {
              const active = categoria === c.key;
              return (
                <button
                  key={c.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategoria(c.key)}
                  className={`proc-chip ${active ? "is-active" : ""}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra dinámica de subcategorías + sort — se desliza desde arriba
            cuando se selecciona una categoría específica (no "todos"). */}
        <AnimatePresence initial={false}>
          {categoria !== "todos" && (
            <motion.div
              key={categoria}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="proc-subbar">
                {/* Subcategorías como chips secundarios */}
                {subcategorias.length > 0 && (
                  <div className="proc-subchips" role="tablist">
                    <button
                      role="tab"
                      aria-selected={subcategoria === null}
                      onClick={() => setSubcategoria(null)}
                      className={`proc-subchip ${subcategoria === null ? "is-active" : ""}`}
                    >
                      {t("filters.allSubcats")}
                    </button>
                    {subcategorias.map((s) => (
                      <button
                        key={s}
                        role="tab"
                        aria-selected={subcategoria === s}
                        onClick={() => setSubcategoria(s)}
                        className={`proc-subchip ${subcategoria === s ? "is-active" : ""}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sort dropdown custom — estilo de la página */}
                <SortDropdown sortMode={sortMode} setSortMode={setSortMode} t={t} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === Resultados === */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "1rem 1.5rem 5rem",
        }}
      >
        {loading && (
          <p style={{ textAlign: "center", color: "#8B7060", padding: "3rem 0" }}>
            {t("loading")}
          </p>
        )}

        {error && !loading && (
          <p
            style={{
              textAlign: "center",
              color: "#7E1F1F",
              padding: "1rem",
              background: "#FCE4EC",
              borderRadius: 12,
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Contador */}
            <div
              style={{
                fontSize: "0.85rem",
                color: "#8B7060",
                marginBottom: "1.4rem",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {t("filters.resultsCount", { count: filtered.length })}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <EmptyState
                onClear={() => {
                  setSearch("");
                  setCategoria("todos");
                }}
                t={t}
              />
            ) : (
              <motion.div
                className="proc-grid"
                layout
                transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((p, i) => (
                    <ProcCard
                      key={p.id}
                      procedimiento={p}
                      index={i}
                      intlLocale={intlLocale}
                      t={t}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            <p
              style={{
                textAlign: "center",
                fontSize: "0.78rem",
                color: "#A0907B",
                fontStyle: "italic",
                marginTop: "3rem",
                maxWidth: 600,
                marginInline: "auto",
              }}
            >
              {t("priceDisclaimer")}
            </p>
          </>
        )}
      </section>

      {/* === Estilos === */}
      <style jsx global>{`
        .proc-page {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(180deg, #FBF9F5 0%, #F4ECDF 100%);
          overflow-x: hidden;
        }
        /* Marca de agua JM — gigante, centrada, muy diluida */
        .proc-jm-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(80vw, 900px);
          height: min(80vw, 900px);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.05;
          pointer-events: none;
          z-index: 0;
          filter: saturate(0.6);
        }

        /* Toolbar sticky con buscador + chips */
        .proc-toolbar-sticky {
          position: sticky;
          /* El navbar es sticky en top:0; la toolbar debe pegarse JUSTO debajo
             para no quedar oculta tras él (antes ambos en top:0 = colisión). */
          top: 72px;
          z-index: 20;
          background: rgba(251, 249, 245, 0.85);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border-bottom: 1px solid rgba(176, 137, 104, 0.12);
          padding: 0.9rem 1.5rem;
        }
        @media (max-width: 767px) {
          .proc-toolbar-sticky { top: 58px; }
        }
        .proc-toolbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .proc-search-wrap {
          position: relative;
          flex: 1 1 280px;
          min-width: 240px;
          max-width: 460px;
        }
        .proc-search-icon {
          position: absolute;
          top: 50%;
          left: 14px;
          transform: translateY(-50%);
          color: #8B7060;
          pointer-events: none;
        }
        .proc-search-input {
          width: 100%;
          padding: 0.65rem 2.4rem 0.65rem 2.6rem;
          border-radius: 100px;
          border: 1px solid rgba(176, 137, 104, 0.25);
          background: #FFFDF9;
          color: #3A2A1A;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          font-family: inherit;
        }
        .proc-search-input::placeholder {
          color: #A0907B;
        }
        .proc-search-input:focus {
          border-color: #B08968;
          box-shadow: 0 0 0 4px rgba(176, 137, 104, 0.12);
        }
        .proc-search-clear {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(176, 137, 104, 0.12);
          color: #5A4635;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .proc-search-clear:hover {
          background: rgba(176, 137, 104, 0.25);
        }

        .proc-chips {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .proc-chip {
          padding: 0.5rem 1.05rem;
          border-radius: 100px;
          border: 1px solid rgba(176, 137, 104, 0.25);
          background: transparent;
          color: #5A4635;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
          letter-spacing: 0.01em;
        }
        .proc-chip:hover {
          border-color: #B08968;
          color: #3A2A1A;
        }
        .proc-chip.is-active {
          background: linear-gradient(135deg, var(--brand), var(--brand-soft));
          color: #FFFDF9;
          border-color: transparent;
          box-shadow: 0 6px 16px rgba(176, 137, 104, 0.28);
        }

        /* Barra secundaria de subcategorías + sort — aparece animada
           cuando hay categoría seleccionada. */
        .proc-subbar {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0.75rem 0 0;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          border-top: 1px solid rgba(176, 137, 104, 0.1);
          margin-top: 0.75rem;
        }
        .proc-subchips {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          flex: 1;
        }
        .proc-subchip {
          padding: 0.38rem 0.85rem;
          border-radius: 100px;
          border: 1px solid rgba(176, 137, 104, 0.18);
          background: rgba(255, 253, 249, 0.55);
          color: #5A4635;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.25s ease, color 0.25s ease,
            border-color 0.25s ease, transform 0.2s ease;
        }
        .proc-subchip:hover {
          background: rgba(255, 253, 249, 0.9);
          border-color: rgba(176, 137, 104, 0.4);
          color: #3A2A1A;
        }
        .proc-subchip.is-active {
          background: #3A2A1A;
          color: #FFFDF9;
          border-color: transparent;
          font-weight: 600;
        }
        /* Dropdown custom de orden — reemplaza el <select> nativo
           para que respete la estética de la página. */
        .proc-sort {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-shrink: 0;
        }
        .proc-sort-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #6C584C;
          white-space: nowrap;
        }
        .proc-sort-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 0.85rem 0.45rem 1rem;
          border-radius: 100px;
          border: 1px solid rgba(176, 137, 104, 0.28);
          background: #FFFDF9;
          color: #3A2A1A;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease,
            background 0.25s ease;
          font-family: inherit;
        }
        .proc-sort-trigger:hover {
          border-color: #B08968;
          background: #FFF9F1;
        }
        .proc-sort-trigger.is-open,
        .proc-sort-trigger:focus-visible {
          border-color: #B08968;
          box-shadow: 0 0 0 4px rgba(176, 137, 104, 0.14);
        }
        .proc-sort-caret {
          color: #8B7060;
          transition: transform 0.25s ease;
          flex-shrink: 0;
        }
        .proc-sort-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 240px;
          padding: 0.35rem;
          background: #FFFDF9;
          border: 1px solid rgba(176, 137, 104, 0.2);
          border-radius: 14px;
          box-shadow:
            0 14px 36px rgba(58, 42, 26, 0.18),
            0 0 0 1px rgba(176, 137, 104, 0.05);
          list-style: none;
          margin: 0;
          z-index: 30;
          backdrop-filter: blur(12px);
        }
        .proc-sort-option {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 0.85rem;
          border: none;
          background: transparent;
          color: #3A2A1A;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: left;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          font-family: inherit;
        }
        .proc-sort-option:hover {
          background: rgba(176, 137, 104, 0.1);
          color: #3A2A1A;
        }
        .proc-sort-option.is-selected {
          background: linear-gradient(135deg, var(--brand), var(--brand-soft));
          color: #FFFDF9;
          font-weight: 600;
        }
        .proc-sort-option.is-selected:hover {
          background: linear-gradient(135deg, #A0724E, #B89A7C);
        }
        @media (max-width: 640px) {
          .proc-subbar { padding-top: 0.6rem; }
          .proc-subchips { width: 100%; overflow-x: auto; flex-wrap: nowrap; }
          .proc-subchip { flex-shrink: 0; }
          .proc-sort { width: 100%; justify-content: space-between; }
        }

        /* Grid de cards */
        .proc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Card */
        .proc-card {
          position: relative;
          background: #FFFDF9;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(176, 137, 104, 0.12);
          box-shadow: 0 4px 16px rgba(58, 42, 26, 0.06);
          transition: box-shadow 0.4s ease, transform 0.4s ease, border-color 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          isolation: isolate;
        }
        .proc-card:hover {
          box-shadow: 0 16px 36px rgba(58, 42, 26, 0.15);
          border-color: rgba(176, 137, 104, 0.3);
          transform: translateY(-4px);
        }
        /* Card destacada/promoción — glow dorado, borde resaltado y
           pulse muy sutil para llamar la atención sin marear. */
        .proc-card.is-featured {
          border-color: rgba(255, 200, 100, 0.55);
          box-shadow:
            0 10px 28px rgba(58, 42, 26, 0.1),
            0 0 0 1px rgba(255, 200, 100, 0.3),
            0 0 30px rgba(255, 200, 100, 0.22);
          animation: proc-card-glow 3.6s ease-in-out infinite;
        }
        .proc-card.is-featured:hover {
          box-shadow:
            0 20px 42px rgba(58, 42, 26, 0.18),
            0 0 0 1.5px rgba(255, 200, 100, 0.7),
            0 0 48px rgba(255, 200, 100, 0.35);
          border-color: rgba(255, 200, 100, 0.85);
        }
        @keyframes proc-card-glow {
          0%, 100% {
            box-shadow:
              0 10px 28px rgba(58, 42, 26, 0.1),
              0 0 0 1px rgba(255, 200, 100, 0.3),
              0 0 24px rgba(255, 200, 100, 0.18);
          }
          50% {
            box-shadow:
              0 10px 28px rgba(58, 42, 26, 0.1),
              0 0 0 1px rgba(255, 200, 100, 0.45),
              0 0 38px rgba(255, 200, 100, 0.32);
          }
        }
        /* Badge "Destacado" / "Promoción" en la card */
        .proc-card-promo-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.3rem 0.75rem;
          background: linear-gradient(135deg, #F7D680, #FFE6B3);
          color: #6B4419;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 100px;
          box-shadow: 0 4px 12px rgba(255, 200, 100, 0.4);
          z-index: 2;
        }
        .proc-card-img-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: linear-gradient(135deg, #F5EEE5, #E9DED2);
        }
        .proc-card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .proc-card:hover .proc-card-img-wrap img {
          transform: scale(1.06);
        }
        .proc-card-cat-chip {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 0.3rem 0.7rem;
          background: rgba(255, 253, 249, 0.92);
          backdrop-filter: blur(8px);
          color: #5A4635;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 100px;
          border: 1px solid rgba(176, 137, 104, 0.2);
        }
        .proc-card-body {
          padding: 1.1rem 1.2rem 1.3rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          flex: 1;
        }
        .proc-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #3A2A1A;
          margin: 0;
          line-height: 1.25;
        }
        .proc-card-desc {
          font-size: 0.88rem;
          color: #6C584C;
          line-height: 1.55;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .proc-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 0.7rem;
          border-top: 1px solid rgba(176, 137, 104, 0.1);
        }
        .proc-card-price {
          font-size: 0.85rem;
          font-weight: 700;
          color: #B08968;
        }
        .proc-card-price-unit {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8B7060;
          letter-spacing: 0.04em;
        }
        /* Promo: precio normal tachado + nuevo destacado */
        .proc-card-price-old {
          font-size: 0.78rem;
          font-weight: 500;
          color: #A0907B;
          text-decoration: line-through;
          text-decoration-color: rgba(160, 144, 123, 0.7);
          margin-right: 0.25rem;
        }
        .proc-card-price-new {
          font-size: 0.95rem;
          font-weight: 800;
          color: #C25B1E;
        }
        /* Badge variante promoción (rojizo / cálido) */
        .proc-card-promo-badge.proc-card-promo-discount {
          background: linear-gradient(135deg, #E08A4A, #F4A671);
          color: #FFFDF9;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 12px rgba(224, 138, 74, 0.4);
          animation: promo-pulse 2.2s ease-in-out infinite;
        }
        @keyframes promo-pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(224, 138, 74, 0.4); }
          50% { box-shadow: 0 6px 18px rgba(224, 138, 74, 0.65); }
        }
        .proc-card-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand), var(--brand-soft));
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .proc-card:hover .proc-card-arrow {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(176, 137, 104, 0.35);
        }

        @media (max-width: 640px) {
          .proc-toolbar-inner { gap: 0.75rem; }
          .proc-chips { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 0.2rem; }
          .proc-chip { flex-shrink: 0; }
        }
      `}</style>
    </main>
  );
}

/* ──────────────────────────────────────────────
   Carrusel de destacados y promociones del mes
   - Acepta N items
   - Navegación con flechas + dots
   - Auto-rotate cada 7s pausable al hover
   - Animaciones suaves entre slides
────────────────────────────────────────────── */
function FeaturedCarousel({
  items,
  intlLocale,
  t,
}: {
  items: Procedimiento[];
  intlLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  const goTo = (newIndex: number) => {
    const next = ((newIndex % total) + total) % total;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Auto-rotate
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % total);
    }, 7000);
    return () => clearTimeout(id);
  }, [index, paused, total]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  const item = items[index];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1180,
        margin: "0 auto 3rem",
        padding: "0 1.5rem",
      }}
      aria-roledescription="carousel"
      aria-label={t("featured.kicker")}
    >
      <div
        className="featured-grid featured-card"
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 0,
          alignItems: "stretch",
          background: "linear-gradient(135deg, #FFFDF9 0%, #F7EFE3 100%)",
          borderRadius: 28,
          border: "1px solid rgba(255, 215, 138, 0.55)",
          boxShadow:
            "0 18px 50px rgba(58, 42, 26, 0.12), 0 0 0 1px rgba(255, 215, 138, 0.25), 0 0 60px rgba(255, 215, 138, 0.18)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            initial={{ opacity: 0, x: direction === 0 ? 0 : direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: -120, right: 120 }}
            dragElastic={0.35}
            onDragEnd={(_e, info) => {
              // Deslizar con el dedo: no eran solo las flechas.
              if (info.offset.x < -60) next();
              else if (info.offset.x > 60) prev();
            }}
            className="featured-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 1fr",
              alignItems: "stretch",
              gridColumn: "1 / -1",
              gridRow: 1,
            }}
            aria-roledescription="slide"
            aria-label={t("featured.slideAria", { n: index + 1, total })}
          >
            {/* Imagen — compacta para que se vea la toolbar al scroll */}
            <div
              style={{
                position: "relative",
                minHeight: 260,
                aspectRatio: "5 / 4",
                background: "#F5EEE5",
                overflow: "hidden",
              }}
            >
              {item.imagen && (
                <motion.div
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image
                    src={item.imagen}
                    alt={item.nombre}
                    fill
                    sizes="(max-width: 820px) 100vw, 600px"
                    quality={80}
                    priority={index === 0}
                    style={{ objectFit: "cover" }}
                  />
                </motion.div>
              )}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 60%, rgba(58, 42, 26, 0.3) 100%)",
                }}
              />
            </div>

            {/* Texto — padding más compacto */}
            <div
              style={{
                padding: "1.6rem 1.8rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "0.65rem",
              }}
            >
              <span
                className="featured-kicker-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#8B5A12",
                  background: "linear-gradient(135deg, rgba(255, 215, 138, 0.35), rgba(255, 230, 179, 0.25))",
                  border: "1px solid rgba(255, 200, 100, 0.55)",
                  padding: "0.4rem 0.9rem",
                  borderRadius: 100,
                  width: "fit-content",
                  boxShadow: "0 2px 10px rgba(255, 200, 100, 0.18)",
                }}
              >
                <Sparkles size={12} /> {t("featured.kicker")}
              </span>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.35rem, 2vw, 1.8rem)",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {item.nombre}
              </h2>
              {item.desc && (
                <p
                  style={{
                    color: "var(--text-soft)",
                    fontSize: "0.92rem",
                    lineHeight: 1.55,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.desc}
                </p>
              )}
              {item.precio && (
                <p
                  style={{
                    color: "var(--brand)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    margin: "0.2rem 0 0",
                  }}
                >
                  {t("standardPrice")} {formatPrecio(item.precio, intlLocale)} {t("currency")}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                  marginTop: "0.4rem",
                }}
              >
                <Link
                  href={`/agendar?proc=${encodeURIComponent(item.nombre)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.6rem 1.2rem",
                    borderRadius: 100,
                    background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
                    color: "#FFF",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 6px 18px rgba(176, 137, 104, 0.28)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    fontSize: "0.86rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 22px rgba(176, 137, 104, 0.38)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(176, 137, 104, 0.28)";
                  }}
                >
                  <Calendar size={14} />
                  {t("featured.ctaBook")}
                </Link>
                <Link
                  href={`/procedimientos/${item.id}`}
                  className="btn-ghost-app"
                  style={{ padding: "0.6rem 1.2rem", fontSize: "0.86rem" }}
                >
                  {t("featured.ctaInfo")}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controles: flechas y dots solo si hay 2+ destacados */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={t("featured.prevSlide")}
              className="featured-arrow featured-arrow-left"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("featured.nextSlide")}
              className="featured-arrow featured-arrow-right"
            >
              <ChevronRight size={22} />
            </button>

            {/* Dots */}
            <div className="featured-dots" role="tablist">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={t("featured.slideAria", { n: i + 1, total })}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`featured-dot ${i === index ? "is-active" : ""}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .featured-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 253, 249, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(176, 137, 104, 0.3);
          color: #5A4635;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(58, 42, 26, 0.18);
          transition: background 0.25s ease, transform 0.25s ease,
            box-shadow 0.25s ease;
          z-index: 3;
        }
        .featured-arrow:hover {
          background: linear-gradient(135deg, var(--brand), var(--brand-soft));
          color: #FFF;
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 10px 24px rgba(176, 137, 104, 0.35);
        }
        .featured-arrow-left {
          left: 14px;
        }
        .featured-arrow-right {
          right: 14px;
        }
        .featured-dots {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          padding: 0.4rem 0.7rem;
          background: rgba(255, 253, 249, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(176, 137, 104, 0.18);
          border-radius: 100px;
          box-shadow: 0 4px 14px rgba(58, 42, 26, 0.12);
          z-index: 3;
        }
        .featured-dot {
          width: 8px;
          height: 8px;
          border-radius: 100px;
          background: rgba(176, 137, 104, 0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.25s ease;
        }
        .featured-dot.is-active {
          width: 26px;
          background: linear-gradient(90deg, #B08968, #C9AD8D);
        }
        @media (max-width: 820px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
          .featured-arrow {
            width: 36px;
            height: 36px;
          }
          /* En 1 columna las flechas se centran sobre la IMAGEN (parte de
             arriba), no a media tarjeta donde queda el texto. */
          .featured-arrow { top: 28% !important; }
          .featured-arrow-left { left: 8px; }
          .featured-arrow-right { right: 8px; }
          /* Los dots pasan ARRIBA, sobre la imagen (estilo stories), para no
             solaparse con los botones "Agendar"/"Conocer más". */
          .featured-dots {
            bottom: auto !important;
            top: 14px !important;
          }
        }
      `}</style>
    </motion.section>
  );
}

/* ──────────────────────────────────────────────
   Card individual con layout animation
────────────────────────────────────────────── */
function ProcCard({
  procedimiento,
  index,
  intlLocale,
  t,
}: {
  procedimiento: Procedimiento;
  index: number;
  intlLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.04, 0.4),
      }}
      className={`proc-card ${procedimiento.destacado ? "is-featured" : ""}`}
    >
      <Link
        href={`/procedimientos/${procedimiento.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}
      >
        <div className="proc-card-img-wrap">
          {procedimiento.imagen && (
            <Image
              src={procedimiento.imagen}
              alt={procedimiento.nombre}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
              quality={75}
              loading={index < 4 ? "eager" : "lazy"}
              style={{ objectFit: "cover" }}
            />
          )}
          {procedimiento.categoria && (
            <span className="proc-card-cat-chip">{procedimiento.categoria}</span>
          )}
          {procedimiento.enPromocion && (
            <span className="proc-card-promo-badge proc-card-promo-discount" aria-label="Promoción">
              🏷️ PROMO
            </span>
          )}
          {!procedimiento.enPromocion && procedimiento.destacado && (
            <span className="proc-card-promo-badge" aria-label={t("featured.promoBadge")}>
              <Star size={11} fill="currentColor" />
              {t("featured.promoBadge")}
            </span>
          )}
        </div>
        <div className="proc-card-body">
          <h3 className="proc-card-title">{procedimiento.nombre}</h3>
          {procedimiento.desc && (
            <p className="proc-card-desc">{procedimiento.desc}</p>
          )}
          <div className="proc-card-footer">
            {procedimiento.precio ? (
              procedimiento.enPromocion && procedimiento.precioPromocional ? (
                <span className="proc-card-price">
                  <span className="proc-card-price-old">
                    {formatPrecio(procedimiento.precio, intlLocale)}
                  </span>{" "}
                  <span className="proc-card-price-new">
                    {formatPrecio(procedimiento.precioPromocional, intlLocale)}{" "}
                    <span className="proc-card-price-unit">{t("currency")}</span>
                  </span>
                </span>
              ) : (
                <span className="proc-card-price">
                  {formatPrecio(procedimiento.precio, intlLocale)}{" "}
                  <span className="proc-card-price-unit">{t("currency")}</span>
                </span>
              )
            ) : (
              <span />
            )}
            <span className="proc-card-arrow" aria-label={t("viewMore")}>
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Empty state cuando no hay resultados
────────────────────────────────────────────── */
function EmptyState({
  onClear,
  t,
}: {
  onClear: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        textAlign: "center",
        padding: "4rem 1.5rem",
        background: "rgba(255, 253, 249, 0.6)",
        backdropFilter: "blur(8px)",
        borderRadius: 24,
        border: "1px dashed rgba(176, 137, 104, 0.3)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(176, 137, 104, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1rem",
          color: "var(--brand)",
        }}
      >
        <Search size={26} />
      </div>
      <p
        style={{
          color: "var(--text-soft)",
          fontSize: "1rem",
          marginBottom: "1.4rem",
        }}
      >
        {t("filters.noResults")}
      </p>
      <button type="button" onClick={onClear} className="btn-ghost-app">
        {t("filters.clearSearch")}
      </button>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Dropdown custom de ordenamiento — reemplaza el
   <select> nativo (que tomaba el estilo del SO)
   por uno con la estética de la página.
────────────────────────────────────────────── */
function SortDropdown({
  sortMode,
  setSortMode,
  t,
}: {
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cierra al click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cierra con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const options: { value: SortMode; label: string }[] = [
    { value: "name", label: t("filters.sortName") },
    { value: "priceAsc", label: t("filters.sortPriceAsc") },
    { value: "priceDesc", label: t("filters.sortPriceDesc") },
    { value: "featured", label: t("filters.sortFeatured") },
    { value: "discount", label: t("filters.sortDiscount") },
  ];
  const current = options.find((o) => o.value === sortMode) ?? options[0];

  return (
    <div className="proc-sort" ref={wrapRef}>
      <button
        type="button"
        className={`proc-sort-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("filters.sortName")}
      >
        <span>{current.label}</span>
        <ChevronDown
          size={14}
          className="proc-sort-caret"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="proc-sort-menu"
          >
            {options.map((o) => {
              const selected = o.value === sortMode;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setSortMode(o.value);
                      setOpen(false);
                    }}
                    className={`proc-sort-option ${selected ? "is-selected" : ""}`}
                  >
                    <span>{o.label}</span>
                    {selected && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
