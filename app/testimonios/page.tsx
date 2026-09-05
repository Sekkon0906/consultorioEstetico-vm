"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// Lazy: solo se monta cuando el usuario llega abajo del fold
const ComentariosClientes = dynamic(
  () => import("@/components/ComentariosClientes"),
  { ssr: false }
);
import type { Testimonio } from "@/types/domain";
import { getTestimoniosApi } from "@/services/testimoniosApi";

function getYouTubeId(url: string): string {
  if (!url) return "";
  var match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function esArchivoVideo(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url.trim());
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  var id = getYouTubeId(url);
  if (id) return "https://www.youtube.com/embed/" + id;
  return url;
}

function tieneVideoValido(video: string | null | undefined): boolean {
  if (!video || !video.trim()) return false;
  return getYouTubeId(video).length > 0 || esArchivoVideo(video);
}

export default function TestimoniosPage() {
  const t = useTranslations("testimonios");
  var [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  var [videoActivo, setVideoActivo] = useState<string | null>(null);

  useEffect(function() {
    getTestimoniosApi().then(setTestimonios).catch(console.error);
  }, []);

  var activos = testimonios.filter(function(t) { return t.activo; }).sort(function(a, b) { return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(); });

  return (
    <main className="dark-aware-section testimonios-page" style={{ minHeight: "var(--alto-pantalla, 100vh)", background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--surface) 100%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", background: "rgba(176,137,104,0.07)", border: "1px solid rgba(176,137,104,0.18)", borderRadius: 100, padding: "0.4rem 1.3rem", marginBottom: "1rem" }}>{t("badge")}</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, color: "var(--text)", marginBottom: "0.8rem" }}>{t("title")}</h1>
          <div style={{ width: 50, height: 3, background: "linear-gradient(90deg, var(--brand-soft), var(--brand))", borderRadius: 2, margin: "0 auto 0.8rem" }} />
          <p style={{ fontSize: "1.05rem", color: "var(--text-soft)", maxWidth: 600, margin: "0 auto" }}>{t("subtitle")}</p>
        </div>

        {activos.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>{t("empty")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem", maxWidth: 1240, margin: "0 auto" }}>
            {activos.map(function(testimonio, i) {
              var videoValido = tieneVideoValido(testimonio.video);
              var ytId = getYouTubeId(testimonio.video || "");
              return (
                <div key={testimonio.id} className="dark-aware-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 14px rgba(78,59,43,0.06)", transition: "transform 0.3s", animation: "fadeInUp 0.6s ease " + (i * 0.08) + "s both" }}
                  onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.transform = ""; }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "9/16", maxHeight: 420, overflow: "hidden", background: "#000" }}>
                    {videoActivo === testimonio.id && videoValido ? (
                      esArchivoVideo(testimonio.video) ? (
                        <video src={testimonio.video!} controls autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
                      ) : (
                        <iframe src={toEmbedUrl(testimonio.video!) + "?autoplay=1&modestbranding=1&rel=0"} title={testimonio.nombre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                      )
                    ) : (
                      <div style={{ position: "absolute", inset: 0, cursor: videoValido ? "pointer" : "default" }} onClick={function() { if (videoValido) setVideoActivo(testimonio.id); }}>
                        {testimonio.thumb ? (
                          <Image src={testimonio.thumb} alt={testimonio.nombre} fill sizes="(max-width: 640px) 92vw, 380px" quality={75} style={{ objectFit: "cover", filter: "brightness(0.88)" }} />
                        ) : ytId ? (
                          <Image src={"https://img.youtube.com/vi/" + ytId + "/hqdefault.jpg"} alt={testimonio.nombre} fill sizes="(max-width: 640px) 92vw, 380px" quality={70} unoptimized style={{ objectFit: "cover", filter: "brightness(0.85)" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--text), var(--brand))" }} />
                        )}
                        {videoValido && (
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.2)" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                          </div>
                        )}
                        {!videoValido && <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "white", fontSize: "0.72rem", padding: "0.3rem 0.8rem", borderRadius: 100 }}>{t("noVideo")}</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "1rem 1.1rem", textAlign: "center" }}>
                    <h5 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--text)", fontSize: "1.05rem", marginBottom: "0.4rem" }}>{testimonio.nombre}</h5>
                    <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", lineHeight: 1.55, fontStyle: "italic" }}>&quot;{testimonio.texto}&quot;</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ marginTop: "2rem" }}><ComentariosClientes /></div>
      <style>{"@keyframes fadeInUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }"}</style>
    </main>
  );
}
