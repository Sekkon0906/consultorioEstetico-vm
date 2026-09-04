"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ImageOff,
  MessageSquareOff,
  Sparkles,
} from "lucide-react";
import { getCitasApi } from "@/services/citasApi";
import { getTestimoniosApi } from "@/services/testimoniosApi";
import { getProcedimientosApi } from "@/services/procedimientosApi";
import { getGaleriaConfianzaApi } from "@/services/galeriaConfianzaApi";
import { aISOLocal } from "@/lib/fechas";
import { MUELLE_ENTRADA, MUELLE_TACTO } from "@/lib/movimiento";

/**
 * La portada del panel: qué necesita atención hoy.
 *
 * QUÉ HABÍA ANTES
 * "Bienvenido al Panel Administrativo. Usa la barra lateral para
 * administrar horarios, citas, procedimientos, testimonios o ingresos."
 * Un cartel que repite lo que ya dice el menú de al lado y no responde la
 * única pregunta con la que uno entra aquí: **¿hay algo que hacer?**
 *
 * Para saberlo había que entrar sección por sección. Con nueve secciones,
 * eso significa que en la práctica no se mira: se entra a "Citas" y el
 * resto se descubre tarde — un testimonio grabado hace un mes que nunca se
 * activó, un procedimiento sin foto que lleva semanas saliendo en gris.
 *
 * QUÉ HACE AHORA
 * Cuenta lo que está esperando y lleva directo ahí. Nada más: no es un
 * cuadro de mandos con gráficas, porque las gráficas van en Analítica y
 * mezclarlas convertiría una lista de tareas en un informe.
 *
 * EL ORDEN NO ES DECORATIVO
 * Primero lo que tiene a una persona esperando —una cita pendiente de
 * confirmar es alguien que no sabe si tiene hora—, después lo que se ve mal
 * en la web pública, y al final lo que solo falta por completar. Urgencia
 * hacia fuera, no dificultad hacia dentro.
 *
 * SI NO HAY NADA, SE DICE
 * El estado vacío no es un hueco: es la respuesta. "Todo al día" es
 * información, y es la que más veces va a ver la doctora.
 */

interface Aviso {
  clave: string;
  n: number;
  titulo: string;
  detalle: string;
  seccion: string;
  icono: typeof AlertCircle;
  /** `alta` pinta en rojo: hay una persona esperando al otro lado. */
  urgencia: "alta" | "media" | "baja";
}

export default function InicioPanel({ nombre }: { nombre?: string }) {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [citasHoy, setCitasHoy] = useState(0);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vivo = true;

    (async () => {
      // Se piden en paralelo y con allSettled: si una sección falla —o el
      // rol no alcanza para leerla— el resto del resumen se muestra igual.
      // Un panel que se queda en blanco entero porque un endpoint dio 500
      // es peor que uno que enseña tres de cuatro avisos.
      const [citas, testimonios, procedimientos, galeria] = await Promise.allSettled([
        getCitasApi(),
        getTestimoniosApi({ fresh: true }),
        getProcedimientosApi(),
        getGaleriaConfianzaApi(),
      ]);

      if (!vivo) return;

      if (citas.status === "rejected") setFallo(true);

      const listaCitas = citas.status === "fulfilled" ? citas.value : [];
      const listaTest = testimonios.status === "fulfilled" ? testimonios.value : [];
      const listaProcs = procedimientos.status === "fulfilled" ? procedimientos.value : [];
      const listaGal = galeria.status === "fulfilled" ? galeria.value : [];

      const hoy = aISOLocal(new Date());

      const pendientes = listaCitas.filter((c) => c.estado === "pendiente").length;
      // Las de hoy ya confirmadas no son un aviso, son la agenda del día.
      const deHoy = listaCitas.filter(
        (c) => c.fecha === hoy && c.estado !== "cancelada"
      ).length;
      setCitasHoy(deHoy);

      const testInactivos = listaTest.filter((t) => !t.activo).length;
      const sinFoto = listaProcs.filter((p) => !p.imagen).length;

      const nuevos: Aviso[] = [];

      if (pendientes > 0) {
        nuevos.push({
          clave: "citas",
          n: pendientes,
          titulo: pendientes === 1 ? "1 cita sin confirmar" : `${pendientes} citas sin confirmar`,
          detalle: "Hay pacientes esperando saber si tienen hora.",
          seccion: "citas",
          icono: CalendarClock,
          urgencia: "alta",
        });
      }

      if (testInactivos > 0) {
        nuevos.push({
          clave: "testimonios",
          n: testInactivos,
          titulo: testInactivos === 1 ? "1 testimonio sin publicar" : `${testInactivos} testimonios sin publicar`,
          detalle: "Están grabados pero no se ven en la web.",
          seccion: "testimonios",
          icono: MessageSquareOff,
          urgencia: "media",
        });
      }

      if (sinFoto > 0) {
        nuevos.push({
          clave: "fotos",
          n: sinFoto,
          titulo: sinFoto === 1 ? "1 procedimiento sin foto" : `${sinFoto} procedimientos sin foto`,
          detalle: "Salen con un recuadro vacío en el catálogo.",
          seccion: "procedimientos",
          icono: ImageOff,
          urgencia: "media",
        });
      }

      if (listaGal.length <= 1) {
        nuevos.push({
          clave: "galeria",
          n: listaGal.length,
          titulo: "La galería de confianza está casi vacía",
          detalle: "Es el bloque de bioseguridad y equipos de la portada.",
          seccion: "galeria",
          icono: Sparkles,
          urgencia: "baja",
        });
      }

      const peso = { alta: 0, media: 1, baja: 2 };
      nuevos.sort((a, b) => peso[a.urgencia] - peso[b.urgencia]);
      setAvisos(nuevos);
    })();

    return () => { vivo = false; };
  }, []);

  const saludo = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "1rem 0 3rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)", fontWeight: 700, color: "var(--text)", margin: 0 }}>
          {saludo}{nombre ? `, ${nombre}` : ""}
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", margin: "0.4rem 0 0" }}>
          {citasHoy > 0
            ? `Hoy tienes ${citasHoy} ${citasHoy === 1 ? "cita" : "citas"} en la agenda.`
            : "Hoy no tienes citas en la agenda."}
        </p>
      </header>

      {avisos === null ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Revisando…</p>
      ) : avisos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MUELLE_ENTRADA}
          style={{ display: "flex", gap: "0.9rem", alignItems: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.6rem" }}
        >
          <CheckCircle2 size={26} color="var(--estado-atendida)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>Todo al día</p>
            <p style={{ color: "var(--text-soft)", fontSize: "0.88rem", margin: "0.2rem 0 0" }}>
              No hay nada esperando: ni citas por confirmar, ni contenido a
              medias.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
            Necesita tu atención
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {avisos.map((a, i) => {
              const Icono = a.icono;
              const esUrgente = a.urgencia === "alta";
              return (
                <motion.div
                  key={a.clave}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MUELLE_ENTRADA, delay: i * 0.06 }}
                >
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={MUELLE_TACTO}>
                    <Link
                      href={`/administrar?section=${a.seccion}`}
                      scroll={false}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${esUrgente ? "color-mix(in srgb, var(--danger) 40%, transparent)" : "var(--border)"}`,
                        borderLeft: `3px solid ${esUrgente ? "var(--danger)" : "var(--brand)"}`,
                        borderRadius: 16,
                        padding: "1.05rem 1.2rem",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: esUrgente
                            ? "color-mix(in srgb, var(--danger) 14%, var(--surface))"
                            : "var(--surface-soft)",
                        }}
                      >
                        <Icono size={19} color={esUrgente ? "var(--danger)" : "var(--brand)"} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "var(--text)", fontWeight: 700, fontSize: "0.98rem", margin: 0 }}>
                          {a.titulo}
                        </p>
                        <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", margin: "0.15rem 0 0" }}>
                          {a.detalle}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {fallo && (
        <p style={{ marginTop: "1.4rem", display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-muted)", fontSize: "0.82rem" }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          No se pudo leer la agenda, así que puede faltar algún aviso. El
          resto del resumen sí es correcto.
        </p>
      )}
    </div>
  );
}
