"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { getCharlasApi } from "@/services/charlasApi";
import { X, ChevronLeft, ChevronRight, Calendar, ImageIcon, Stethoscope } from "lucide-react";

interface Charla {
  id: string;
  titulo: string;
  descripcion: string;
  detalle?: string;
  imagen: string;
  galeria?: string[];
  fecha?: string;
}

/* ──────────────────────────────────────────────
   CARD
────────────────────────────────────────────── */
function CardItem({
  charla, inView, fromLeft, onClick, fechaFmt,
}: {
  charla: Charla;
  inView: boolean;
  fromLeft: boolean;
  onClick: () => void;
  fechaFmt: string | null;
}) {
  const t = useTranslations("doctora.formacion");
  return (
    <motion.div
      initial={{ opacity: 0, x: fromLeft ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
      whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(78,59,43,0.14)" }}
      onClick={onClick}
      className="formacion-card"
      style={{
        width: "100%",
        background: "var(--surface)",
        borderRadius: 18,
        border: "1px solid #EDE4D8",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 3px 16px rgba(78,59,43,0.07)",
        transition: "box-shadow 0.3s",
      }}
    >
      {/* Imagen */}
      <div style={{ position: "relative", height: 145, overflow: "hidden" }}>
        {charla.imagen && (
          <Image
            src={charla.imagen}
            alt={charla.titulo}
            fill
            sizes="(max-width: 820px) 92vw, 380px"
            quality={75}
            style={{ objectFit: "cover" }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(0deg, rgba(40,26,14,0.52) 0%, transparent 58%)",
        }} />
        {fechaFmt && (
          <div style={{
            position: "absolute", bottom: 9, left: 10,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(139,106,75,0.88)",
            borderRadius: 20, padding: "3px 9px",
            fontSize: "0.64rem", color: "white", fontWeight: 600,
          }}>
            <Calendar size={10} /> {fechaFmt}
          </div>
        )}
        {charla.galeria && charla.galeria.length > 0 && (
          <div style={{
            position: "absolute", top: 9, right: 9,
            display: "flex", alignItems: "center", gap: 3,
            background: "rgba(255,253,249,0.92)",
            borderRadius: 20, padding: "3px 8px",
            fontSize: "0.62rem", color: "var(--brand-deep)", fontWeight: 700,
          }}>
            <ImageIcon size={9} /> {charla.galeria.length} {t("modal.photos")}
          </div>
        )}
      </div>

      {/* Texto */}
      <div style={{ padding: "0.85rem 1.1rem 0.95rem" }}>
        <h4 style={{
          fontSize: "0.9rem", fontWeight: 700, color: "var(--text)",
          marginBottom: "0.25rem", fontFamily: "'Playfair Display', serif",
          lineHeight: 1.35,
        }}>
          {charla.titulo}
        </h4>
        <p style={{
          fontSize: "0.73rem", color: "#7C5B3E", lineHeight: 1.55, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {charla.descripcion}
        </p>
        <div style={{
          marginTop: "0.6rem", fontSize: "0.68rem",
          color: "var(--brand)", fontWeight: 600,
        }}>
          {t("viewGallery")}
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   NODO DEL TIMELINE
────────────────────────────────────────────── */
function TimelineNode({
  charla, index, onClick,
}: {
  charla: Charla;
  index: number;
  onClick: () => void;
}) {
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const isLeft = index % 2 === 0;

  const fechaFmt = charla.fecha
    ? new Date(charla.fecha + "T12:00:00").toLocaleDateString(intlLocale, {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const anio = charla.fecha
    ? new Date(charla.fecha + "T12:00:00").getFullYear()
    : null;

  return (
    <div
      ref={ref}
      className="timeline-node"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 60px 1fr",
        alignItems: "center",
        marginBottom: "3rem",
      }}
    >
      {/* Izquierda */}
      <div className="timeline-side timeline-side-left" style={{ paddingRight: 24, display: "flex", justifyContent: "flex-end" }}>
        {isLeft ? (
          <CardItem charla={charla} inView={inView} fromLeft onClick={onClick} fechaFmt={fechaFmt} />
        ) : (
          anio && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: "0.65rem", color: "var(--brand-soft)", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}
            >
              {anio}
            </motion.span>
          )
        )}
      </div>

      {/* Centro: dot */}
      <div className="timeline-dot-col" style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 22 }}
          whileHover={{ scale: 1.4 }}
          onClick={onClick}
          aria-label={charla.titulo}
          style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--brand), #8B6A4B)",
            border: "3px solid #FBF8F4",
            boxShadow: "0 0 0 4px #DDD0C2",
            cursor: "pointer", outline: "none",
          }}
        />
      </div>

      {/* Derecha */}
      <div className="timeline-side timeline-side-right" style={{ paddingLeft: 24, display: "flex", justifyContent: "flex-start" }}>
        {!isLeft ? (
          <CardItem charla={charla} inView={inView} fromLeft={false} onClick={onClick} fechaFmt={fechaFmt} />
        ) : (
          anio && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: "0.65rem", color: "var(--brand-soft)", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}
            >
              {anio}
            </motion.span>
          )
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MODAL
────────────────────────────────────────────── */
function CharlaModal({ charla, onClose }: { charla: Charla; onClose: () => void }) {
  const t = useTranslations("doctora.formacion");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-CO";
  const [idx, setIdx] = useState(0);
  const media = charla.galeria && charla.galeria.length > 0 ? charla.galeria : [charla.imagen];
  const total = media.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const prev = () => setIdx(i => (i === 0 ? total - 1 : i - 1));
  const next = () => setIdx(i => (i + 1) % total);

  const fechaFmt = charla.fecha
    ? new Date(charla.fecha + "T12:00:00").toLocaleDateString(intlLocale, {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const current = media[idx];
  const isYoutube = typeof current === "string" && current.includes("youtube");
  const isVideo   = typeof current === "string" && current.endsWith(".mp4");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(12,6,2,0.8)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 22, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 22, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 26,
          width: "100%", maxWidth: 780,
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
        }}
      >
        {/* Franja dorada */}
        <div style={{
          height: 5, borderRadius: "26px 26px 0 0",
          background: "linear-gradient(90deg, var(--brand-deep), #C9AD8D, #8B6A4B)",
        }} />

        <div style={{ padding: "1.6rem 2rem 2rem" }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: "1.2rem",
          }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--surface-soft)", borderRadius: 20, padding: "3px 11px",
                fontSize: "0.65rem", color: "var(--brand-deep)", fontWeight: 700,
                marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <Stethoscope size={10} /> {t("modal.badge")}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.4rem", fontWeight: 700,
                color: "var(--text)", margin: 0, lineHeight: 1.3,
              }}>
                {charla.titulo}
              </h3>
              {fechaFmt && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  marginTop: "0.4rem", fontSize: "0.73rem", color: "#8B7060",
                }}>
                  <Calendar size={12} color="var(--brand)" /> {fechaFmt}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--surface-soft)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginLeft: "1rem",
            }}>
              <X size={16} color="var(--text-soft)" />
            </button>
          </div>

          {/* Descripción con acento */}
          <p style={{
            fontSize: "0.86rem", color: "var(--text-soft)", lineHeight: 1.75,
            marginBottom: "1.4rem",
            borderLeft: "3px solid var(--brand-soft)",
            paddingLeft: "0.9rem",
          }}>
            {charla.detalle || charla.descripcion}
          </p>

          {/* Visor principal */}
          <div style={{
            position: "relative", borderRadius: 14, overflow: "hidden",
            background: "#1a0f08", aspectRatio: "16/9",
            marginBottom: "0.75rem",
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", height: "100%" }}
              >
                {isYoutube ? (
                  <iframe
                    src={current.replace("watch?v=", "embed/")}
                    title={t("modal.videoTitle")}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    allowFullScreen
                  />
                ) : isVideo ? (
                  <video src={current} controls
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (current || charla.imagen) ? (
                  <Image
                    src={current || charla.imagen}
                    alt={`Foto ${idx + 1}`}
                    fill
                    sizes="(max-width: 820px) 92vw, 780px"
                    quality={85}
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>

            {total > 1 && (
              <>
                <button onClick={prev} style={{
                  position: "absolute", left: 10, top: "50%",
                  transform: "translateY(-50%)",
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,253,249,0.9)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}>
                  <ChevronLeft size={18} color="#4E3B2B" />
                </button>
                <button onClick={next} style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,253,249,0.9)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}>
                  <ChevronRight size={18} color="#4E3B2B" />
                </button>
                <div style={{
                  position: "absolute", bottom: 10, right: 12,
                  background: "rgba(139,106,75,0.9)", borderRadius: 20,
                  padding: "3px 10px", fontSize: "0.68rem",
                  color: "white", fontWeight: 700,
                }}>
                  {idx + 1} / {total}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {total > 1 && (
            <div style={{
              display: "flex", gap: "0.4rem",
              overflowX: "auto", paddingBottom: "0.2rem",
            }}>
              {media.map((src, i) => (
                <motion.div
                  key={i}
                  onClick={() => setIdx(i)}
                  whileHover={{ scale: 1.08 }}
                  style={{
                    width: 56, height: 42, borderRadius: 8,
                    overflow: "hidden", cursor: "pointer", flexShrink: 0,
                    border: i === idx ? "2px solid var(--brand)" : "2px solid transparent",
                    opacity: i === idx ? 1 : 0.5,
                    transition: "opacity 0.2s, border-color 0.2s",
                  }}
                >
                  {typeof src === "string" && (src.includes("youtube") || src.endsWith(".mp4")) ? (
                    <div style={{
                      width: "100%", height: "100%", background: "#2a1a0e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", color: "white",
                    }}>▶</div>
                  ) : src ? (
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="56px"
                        quality={60}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   COMPONENTE PRINCIPAL
────────────────────────────────────────────── */
export default function FormacionContinua() {
  const t = useTranslations("doctora.formacion");
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Charla | null>(null);

  useEffect(() => {
    async function fetchCharlas() {
      try {
        // GET /charlas ya trae la galería agregada y ordenada por el backend.
        const data = await getCharlasApi();
        const charlasConGaleria: Charla[] = data.map((c) => ({
          id: String(c.id),
          titulo: c.titulo,
          descripcion: c.descripcion,
          detalle: c.detalle ?? undefined,
          imagen: c.imagen ?? "",
          fecha: c.fecha ?? undefined,
          galeria: (c.galeria ?? []).map((g) => g.url),
        }));
        setCharlas(charlasConGaleria);
      } catch (err) {
        console.error("Error cargando charlas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCharlas();
  }, []);

  if (loading) {
    return (
      <section style={{
        minHeight: "50vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#FBF8F4",
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--border)", borderTopColor: "var(--brand)",
          }}
        />
      </section>
    );
  }

  if (charlas.length === 0) {
    return (
      <section style={{
        minHeight: "40vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#FBF8F4",
      }}>
        <p style={{ color: "#8B7060", fontStyle: "italic", fontSize: "0.88rem" }}>
          {t("emptyState")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="dark-aware-section formacion-section" style={{
        background: "linear-gradient(180deg, #F7EFE7 0%, #FBF8F4 100%)",
        padding: "5rem 1.5rem 6rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decoración fondo */}
        <div style={{
          position: "absolute", top: "8%", left: "50%",
          transform: "translateX(-50%)",
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(176,137,104,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "4.5rem" }}
        >
          <p style={{
            fontSize: "0.67rem", letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--brand)",
            fontWeight: 700, marginBottom: "0.45rem",
          }}>
            {t("kicker")}
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
            fontWeight: 700, color: "var(--text)", margin: 0,
          }}>
            {t("title")}
          </h2>
          <p style={{
            fontSize: "0.82rem", color: "#8B7060",
            maxWidth: 430, margin: "0.7rem auto 0", lineHeight: 1.65,
          }}>
            {t("subtitle")}
          </p>
          <div style={{
            width: 42, height: 3,
            background: "linear-gradient(90deg, var(--brand), #C9AD8D)",
            borderRadius: 2, margin: "1rem auto 0",
          }} />
        </motion.div>

        {/* Timeline */}
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto" }}>
          {/* Línea vertical */}
          <motion.div
            className="formacion-timeline-line"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            style={{
              position: "absolute",
              left: "calc(50% - 1px)",
              top: 0, bottom: 0, width: 2,
              background: "linear-gradient(180deg, var(--brand-soft) 0%, #EDE4D8 100%)",
              transformOrigin: "top",
              zIndex: 0,
            }}
          />

          {charlas.map((charla, i) => (
            <TimelineNode
              key={charla.id}
              charla={charla}
              index={i}
              onClick={() => setSelected(charla)}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: "center", marginTop: "1.5rem",
            fontSize: "0.7rem", color: "var(--brand-soft)", fontStyle: "italic",
          }}
        >
          {t("clickHint")}
        </motion.p>
      </section>

      <AnimatePresence>
        {selected && (
          <CharlaModal charla={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}