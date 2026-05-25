"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Search, X, ArrowRight, Sparkles, Calendar } from "lucide-react";

import type { Procedimiento } from "../types/domain";
import { getProcedimientosApi } from "../services/procedimientosApi";
import { IMG } from "../src/lib/imagenes";

type Categoria = "todos" | "Facial" | "Corporal" | "Capilar";

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
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

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

  /* Procedimiento destacado: el primero marcado como `destacado` en BD;
     si no hay ninguno destacado, el primero de la lista. */
  const featured = useMemo(() => {
    if (procedimientos.length === 0) return null;
    return procedimientos.find((p) => p.destacado) ?? procedimientos[0];
  }, [procedimientos]);

  /* Filtrado por categoría + búsqueda (debounced via useDeferredValue). */
  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return procedimientos
      .filter((p) => (featured ? p.id !== featured.id : true))
      .filter((p) => categoria === "todos" || p.categoria === categoria)
      .filter((p) => {
        if (!query) return true;
        const haystack = `${p.nombre} ${p.desc ?? ""} ${p.categoria ?? ""}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [procedimientos, deferredSearch, categoria, featured]);

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
            color: "#3A2A1A",
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
            color: "#6C584C",
            fontSize: "clamp(0.95rem, 1.1vw, 1.1rem)",
            lineHeight: 1.6,
            maxWidth: 720,
            margin: "1rem auto 0",
          }}
        >
          {t("subtitle")}
        </motion.p>
      </section>

      {/* === Hero featured === */}
      {!loading && featured && (
        <FeaturedHero
          procedimiento={featured}
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
          top: 0;
          z-index: 20;
          background: rgba(251, 249, 245, 0.85);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border-bottom: 1px solid rgba(176, 137, 104, 0.12);
          padding: 0.9rem 1.5rem;
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
          background: linear-gradient(135deg, #B08968, #C9AD8D);
          color: #FFFDF9;
          border-color: transparent;
          box-shadow: 0 6px 16px rgba(176, 137, 104, 0.28);
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
        .proc-card-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #B08968, #C9AD8D);
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
   Hero featured — destacado del mes
────────────────────────────────────────────── */
function FeaturedHero({
  procedimiento,
  intlLocale,
  t,
}: {
  procedimiento: Procedimiento;
  intlLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1180,
        margin: "0 auto 3rem",
        padding: "0 1.5rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: "2rem",
          alignItems: "stretch",
          background: "linear-gradient(135deg, #FFFDF9 0%, #F7EFE3 100%)",
          borderRadius: 28,
          border: "1px solid rgba(176, 137, 104, 0.15)",
          boxShadow: "0 18px 50px rgba(58, 42, 26, 0.1)",
          overflow: "hidden",
        }}
        className="featured-grid"
      >
        {/* Imagen */}
        <div
          style={{
            position: "relative",
            minHeight: 360,
            aspectRatio: "4 / 5",
            background: "#F5EEE5",
            overflow: "hidden",
          }}
        >
          {procedimiento.imagen && (
            <motion.img
              src={procedimiento.imagen}
              alt={procedimiento.nombre}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, transparent 60%, rgba(58, 42, 26, 0.3) 100%)",
            }}
          />
        </div>

        {/* Texto */}
        <div
          style={{
            padding: "2.5rem 2.4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#B08968",
              background: "rgba(176, 137, 104, 0.1)",
              border: "1px solid rgba(176, 137, 104, 0.25)",
              padding: "0.4rem 0.9rem",
              borderRadius: 100,
              width: "fit-content",
            }}
          >
            <Sparkles size={12} /> {t("featured.kicker")}
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)",
              fontWeight: 700,
              color: "#3A2A1A",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {procedimiento.nombre}
          </h2>
          {procedimiento.desc && (
            <p
              style={{
                color: "#6C584C",
                fontSize: "1rem",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {procedimiento.desc}
            </p>
          )}
          {procedimiento.precio && (
            <p
              style={{
                color: "#B08968",
                fontWeight: 700,
                fontSize: "1.05rem",
                margin: "0.3rem 0 0",
              }}
            >
              {t("standardPrice")} {formatPrecio(procedimiento.precio, intlLocale)}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.8rem",
              flexWrap: "wrap",
              marginTop: "0.6rem",
            }}
          >
            <Link
              href={`/agendar?proc=${encodeURIComponent(procedimiento.nombre)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0.8rem 1.6rem",
                borderRadius: 100,
                background: "linear-gradient(135deg, #B08968, #C9AD8D)",
                color: "#FFF",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 22px rgba(176, 137, 104, 0.3)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                fontSize: "0.94rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(176, 137, 104, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(176, 137, 104, 0.3)";
              }}
            >
              <Calendar size={16} />
              {t("featured.ctaBook")}
            </Link>
            <Link href={`/procedimientos/${procedimiento.id}`} className="btn-ghost-app">
              {t("featured.ctaInfo")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 820px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
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
      className="proc-card"
    >
      <Link
        href={`/procedimientos/${procedimiento.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}
      >
        <div className="proc-card-img-wrap">
          {procedimiento.imagen && (
            <img src={procedimiento.imagen} alt={procedimiento.nombre} />
          )}
          {procedimiento.categoria && (
            <span className="proc-card-cat-chip">{procedimiento.categoria}</span>
          )}
        </div>
        <div className="proc-card-body">
          <h3 className="proc-card-title">{procedimiento.nombre}</h3>
          {procedimiento.desc && (
            <p className="proc-card-desc">{procedimiento.desc}</p>
          )}
          <div className="proc-card-footer">
            {procedimiento.precio ? (
              <span className="proc-card-price">
                {formatPrecio(procedimiento.precio, intlLocale)}
              </span>
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
          color: "#B08968",
        }}
      >
        <Search size={26} />
      </div>
      <p
        style={{
          color: "#6C584C",
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
