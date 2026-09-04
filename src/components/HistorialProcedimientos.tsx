"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { History, RotateCw } from "lucide-react";
import { getMisCitasApi } from "@/services/citasApi";
import type { Cita } from "@/types/domain";
import { formatearFecha, aISOLocal } from "@/lib/fechas";
import { MUELLE_ENTRADA, MUELLE_TACTO } from "@/lib/movimiento";

/**
 * Qué te has hecho, cuántas veces y cuándo fue la última.
 *
 * QUÉ PREGUNTA CONTESTA
 * "¿Cuándo toca el retoque?" es lo que más se pregunta por WhatsApp, y hoy
 * la web no lo sabe responder aunque tenga el dato. "Mis citas" ordena por
 * fecha, así que para saber cuándo fue tu último ácido hialurónico hay que
 * ir bajando por la lista leyendo nombres.
 *
 * Aquí se le da la vuelta: la unidad no es la cita, es el PROCEDIMIENTO.
 * Cada fila dice cuántas veces te lo has hecho y hace cuánto fue la última.
 *
 * SOLO CUENTA LO ATENDIDO
 * Una cita cancelada no es un procedimiento que te hiciste, y una futura
 * tampoco. Contarlas inflaría el historial con cosas que no pasaron —y en
 * un sitio donde la respuesta guía una decisión médica, un número inflado
 * es peor que ningún número.
 *
 * NO DICE CUÁNDO TOCA EL SIGUIENTE
 * Podría calcularse "hace 4 meses, normalmente se repite a los 6". No se
 * hace: la duración depende del producto, la zona y la persona, y ponerlo
 * en la web sería dar un criterio clínico que solo la doctora puede dar.
 * Se da el dato —hace cuánto— y la decisión se queda donde tiene que estar.
 */

interface Linea {
  procedimiento: string;
  veces: number;
  ultimaFecha: string;
  /** Días transcurridos desde la última vez. */
  dias: number;
}

/** "hace 4 meses", "hace 3 semanas", "ayer". Redondeo generoso a propósito:
 *  nadie necesita saber que fueron 127 días, necesita saber que fue hace
 *  unos cuatro meses. */
function haceCuanto(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.round(dias / 7)} semanas`;
  if (dias < 365) return `hace ${Math.round(dias / 30)} meses`;
  const anios = Math.floor(dias / 365);
  return anios === 1 ? "hace más de un año" : `hace ${anios} años`;
}

export default function HistorialProcedimientos({ locale }: { locale: string }) {
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    getMisCitasApi()
      .then((c) => { if (vivo) setCitas(c); })
      .catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; };
  }, []);

  const lineas = useMemo<Linea[]>(() => {
    if (!citas) return [];
    const hoy = aISOLocal(new Date());
    const porNombre = new Map<string, { veces: number; ultima: string }>();

    for (const c of citas) {
      // Solo lo que de verdad ocurrió: atendidas y ya pasadas.
      if (c.estado !== "atendida" || c.fecha > hoy) continue;
      const prev = porNombre.get(c.procedimiento);
      if (!prev) porNombre.set(c.procedimiento, { veces: 1, ultima: c.fecha });
      else {
        prev.veces += 1;
        if (c.fecha > prev.ultima) prev.ultima = c.fecha;
      }
    }

    // La diferencia se calcula sobre las cadenas ISO convertidas a mediodía,
    // no con `new Date(fecha)` a secas: eso las interpreta en UTC y en
    // Colombia devuelve el día anterior (ver `lib/fechas.ts`).
    const aMedioDia = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
    const hoyMs = aMedioDia(hoy);

    return [...porNombre.entries()]
      .map(([procedimiento, v]) => ({
        procedimiento,
        veces: v.veces,
        ultimaFecha: v.ultima,
        dias: Math.round((hoyMs - aMedioDia(v.ultima)) / 86400000),
      }))
      // Lo más reciente primero: es lo que se está mirando ahora mismo.
      .sort((a, b) => a.dias - b.dias);
  }, [citas]);

  if (error) return null;          // "Mis citas", justo arriba, ya avisa del fallo
  if (citas === null) return null; // sin parpadeo: aparece cuando hay datos
  if (lineas.length === 0) return null;

  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.3rem" }}>
        <History size={18} color="var(--brand)" /> Lo que te has hecho
      </h2>
      <p style={{ color: "var(--text-soft)", fontSize: "0.86rem", margin: "0 0 1rem", maxWidth: "var(--ancho-texto)" }}>
        Solo cuenta las citas que ya se atendieron. Si tienes dudas sobre
        cuándo repetir un tratamiento, coméntalo en la consulta: depende del
        producto y de tu piel.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {lineas.map((l, i) => (
          <motion.div
            key={l.procedimiento}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MUELLE_ENTRADA, delay: i * 0.05 }}
            style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 14, padding: "0.9rem 1.1rem" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "var(--text)", fontWeight: 700, fontSize: "0.96rem", margin: 0 }}>
                {l.procedimiento}
              </p>
              <p style={{ color: "var(--text-soft)", fontSize: "0.82rem", margin: "0.15rem 0 0" }}>
                {l.veces === 1 ? "1 vez" : `${l.veces} veces`}
                {" · última "}
                <strong style={{ color: "var(--text)" }}>{haceCuanto(l.dias)}</strong>
                {" ("}{formatearFecha(l.ultimaFecha, locale)}{")"}
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={MUELLE_TACTO}>
              <Link
                href={`/agendar?proc=${encodeURIComponent(l.procedimiento)}`}
                className="btn-accion"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "0.55rem 1.1rem", borderRadius: 100, background: "linear-gradient(135deg, var(--brand), var(--brand-soft))", color: "var(--brand-contrast)", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                <RotateCw size={14} /> Repetir
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
