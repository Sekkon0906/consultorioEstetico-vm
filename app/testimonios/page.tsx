"use client";

import React, { useState, useEffect } from "react";
import ComentariosClientes from "../src/components/ComentariosClientes";
import type { Testimonio } from "../types/domain";
import { getTestimoniosApi } from "../services/testimoniosApi";

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("embed/")) return url;
  var match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (match) return "https://www.youtube.com/embed/" + match[1];
  return url;
}

function getYouTubeId(url: string): string {
  if (!url) return "";
  var match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function tieneVideoValido(video: string | null | undefined): boolean {
  if (!video || !video.trim()) return false;
  return getYouTubeId(video).length > 0;
}

export default function TestimoniosPage() {
  var [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  var [videoActivo, setVideoActivo] = useState<number | null>(null);

  useEffect(function() {
    getTestimoniosApi().then(setTestimonios).catch(console.error);
  }, []);

  var activos = testimonios.filter(function(t) { return t.activo; }).sort(function(a, b) { return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(); });

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #FAF7F2 0%, #F5EEE5 100%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#B08968", background: "rgba(176,137,104,0.07)", border: "1px solid rgba(176,137,104,0.18)", borderRadius: 100, padding: "0.4rem 1.3rem", marginBottom: "1rem" }}>Testimonios</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.8rem" }}>Testimonios de Nuestros Pacientes</h1>
          <div style={{ width: 50, height: 3, background: "linear-gradient(90deg, #C9AD8D, #B08968)", borderRadius: 2, margin: "0 auto 0.8rem" }} />
          <p style={{ fontSize: "1.05rem", color: "#7A6554", maxWidth: 600, margin: "0 auto" }}>Experiencias reales de pacientes que confiaron en la Dra. Vanessa Medina</p>
        </div>

        {activos.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9B8575" }}>No hay testimonios disponibles por el momento.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {activos.map(function(t, i) {
              var videoValido = tieneVideoValido(t.video);
              var ytId = getYouTubeId(t.video || "");
              return (
                <div key={t.id} style={{ background: "#FFFDF9", border: "1px solid #E9DED2", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 14px rgba(78,59,43,0.06)", transition: "transform 0.3s", animation: "fadeInUp 0.6s ease " + (i * 0.08) + "s both" }}
                  onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.transform = ""; }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "9/16", maxHeight: 450, overflow: "hidden", background: "#000" }}>
                    {videoActivo === t.id && videoValido ? (
                      <iframe src={toEmbedUrl(t.video!) + "?autoplay=1&modestbranding=1&rel=0"} title={t.nombre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, cursor: videoValido ? "pointer" : "default" }} onClick={function() { if (videoValido) setVideoActivo(t.id); }}>
                        {t.thumb ? (
                          <img src={t.thumb} alt={t.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88)" }} />
                        ) : ytId ? (
                          <img src={"https://img.youtube.com/vi/" + ytId + "/hqdefault.jpg"} alt={t.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85)" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #4E3B2B, #B08968)" }} />
                        )}
                        {videoValido && (
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.2)" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                          </div>
                        )}
                        {!videoValido && <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "white", fontSize: "0.72rem", padding: "0.3rem 0.8rem", borderRadius: 100 }}>Sin video</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "1rem 1.2rem", textAlign: "center" }}>
                    <h5 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#4E3B2B", fontSize: "1rem", marginBottom: "0.4rem" }}>{t.nombre}</h5>
                    <p style={{ color: "#6C584C", fontSize: "0.88rem", lineHeight: 1.5, fontStyle: "italic" }}>&quot;{t.texto}&quot;</p>
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