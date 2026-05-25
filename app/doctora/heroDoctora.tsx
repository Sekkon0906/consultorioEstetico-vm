"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { IMG } from "@/lib/imagenes";

export default function HeroDoctora() {
  const t = useTranslations("doctora.hero");
  const imagenes = [
    IMG.drCarrusel[0],
    IMG.drCarrusel[1],
    IMG.drCarrusel[2],
    IMG.drCarrusel[3],
    IMG.drCarrusel[4],
  ];
  const [imagenActual, setImagenActual] = useState(0);

  useEffect(() => {
    const int = setInterval(
      () => setImagenActual((p) => (p + 1) % imagenes.length),
      5000
    );
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="doc-hero">
      <div className="doc-hero-left">
        <div className="doc-hero-content container">
          <h1 className="doc-hero-title">
            {t("title")}
          </h1>

          <p className="doc-hero-paragraph">{t("p1")}</p>
          <p className="doc-hero-paragraph">{t("p2")}</p>

          <p className="doc-hero-quote">
            {t("quote")}
            <b> {t("quoteAuthor")}</b>.
          </p>

          <div className="doc-hero-cta">
            <Link href="/agendar" className="btn-doctora">
              <i className="fas fa-calendar-check me-2" /> {t("cta")}
            </Link>

            <a
              href="https://www.instagram.com/dravanessamedinao28/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-doctora btn-doctora-secondary"
            >
              <i className="fab fa-instagram me-2" /> {t("ctaSecondary")}
            </a>
          </div>

        </div>
      </div>

      <div className="doc-hero-right">
        {imagenes.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${t("imageAlt")} ${i + 1}`}
            className={`doc-hero-slide ${i === imagenActual ? "is-active" : ""}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}
          />
        ))}
      </div>
    </section>
  );
}
