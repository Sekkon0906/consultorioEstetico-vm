"use client";

import { useState, useEffect } from "react";
import InicioPanel from "./InicioPanel";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

// === SECCIONES ===
// Cada una se carga solo cuando la doctora la abre, en vez de venir todas
// juntas en un solo bloque cada vez que entra a /administrar (era el 138 kB
// más pesado del sitio, con Ingresos/recharts y el copiloto incluidos aunque
// solo mirara "Citas").
const CARGANDO = <p style={{ color: "var(--text-soft)", padding: "2rem 0" }}>Cargando…</p>;

const AdministrarHorarios = dynamic(() => import("./horario/horariosHabilitados"), { loading: () => CARGANDO });
const CitasAgendadas      = dynamic(() => import("./citas/citasAgendadas"), { loading: () => CARGANDO });
const ProcedimientosList  = dynamic(() => import("./procedimientos/procedimientosList"), { loading: () => CARGANDO });
const TestimoniosList     = dynamic(() => import("./testimonios/testimoniosList"), { loading: () => CARGANDO });
const CharlasList         = dynamic(() => import("./charlas/charlasList"), { loading: () => CARGANDO });
const GaleriaConfianza    = dynamic(() => import("./galeria/galeriaConfianzaList"), { loading: () => CARGANDO });
const Ingresos            = dynamic(() => import("./analitica/ingresos"), { loading: () => CARGANDO });
const ConfiguracionForm   = dynamic(() => import("./configuracion/configuracionForm"), { loading: () => CARGANDO });
const CopilotoChat        = dynamic(() => import("./copiloto/copilotoChat"), { loading: () => CARGANDO });

export default function AdministrarPageInner() {
  const params = useSearchParams();
  const section = params.get("section") || "inicio";
  const { user } = useAuth();
  const [selected, setSelected] = useState(section);

  useEffect(() => {
    setSelected(section);
  }, [section]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selected}
        initial={{ y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        {/* === SECCIÓN INICIAL === */}
        {/* El "Bienvenido al Panel Administrativo" de antes repetía lo que
            ya dice el menú de al lado y no respondía la única pregunta con
            la que uno entra aquí: si hay algo que hacer. */}
        {selected === "inicio" && <InicioPanel nombre={user?.nombres} />}

        {/* === SECCIONES INTERNAS === */}
        {selected === "horarios" && <AdministrarHorarios />}
        {selected === "citas" && <CitasAgendadas />}
        {selected === "procedimientos" && <ProcedimientosList />}
        {selected === "testimonios" && <TestimoniosList />}
        {selected === "charlas" && <CharlasList />}
        {selected === "galeria" && <GaleriaConfianza />}
        {selected === "ingresos" && <Ingresos />}
        {selected === "configuracion" && <ConfiguracionForm />}
        {selected === "copiloto" && <CopilotoChat />}
      </motion.div>
    </AnimatePresence>
  );
}
