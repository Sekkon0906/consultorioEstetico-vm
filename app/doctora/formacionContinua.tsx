"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Charla {
  id: number;
  titulo: string;
  descripcion: string;
  detalle?: string;
  imagen: string;
  galeria?: string[];
  fecha?: string;
}

export default function FormacionContinua() {
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [charlaSeleccionada, setCharlaSeleccionada] = useState<number | null>(null);
  const [galeriaIndex, setGaleriaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const seccionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchCharlas() {
      try {
        const { data, error } = await supabase
          .from("charlas")
          .select("id, titulo, descripcion, detalle, imagen, fecha")
          .order("fecha", { ascending: false, nullsFirst: false })
          .order("creado_en", { ascending: false });
        if (error) throw new Error(error.message);
        const lista = data ?? [];
        const charlasConGaleria = await Promise.all(
          lista.map(async (c) => {
            const { data: galeriaData } = await supabase.from("charla_galeria").select("url").eq("charla_id", c.id).order("orden", { ascending: true });
            return { ...c, galeria: (galeriaData ?? []).map((g: { url: string }) => g.url) } as Charla;
          })
        );
        setCharlas(charlasConGaleria);
      } catch (err) { console.error("Error cargando charlas:", err); }
    }
    fetchCharlas();
  }, []);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      if (cooldown || showModal || charlas.length === 0) return;
      const section = seccionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const visible = rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5;
      if (visible) {
        e.preventDefault();
        setCooldown(true);
        setActiveIndex((prev) => e.deltaY > 0 ? (prev + 1) % charlas.length : prev === 0 ? charlas.length - 1 : prev - 1);
        setTimeout(() => setCooldown(false), 900);
      }
    };
    window.addEventListener("wheel", handleScroll, { passive: false });
    return () => window.removeEventListener("wheel", handleScroll);
  }, [cooldown, showModal, charlas]);

  useEffect(() => {
    if (!showModal || charlaSeleccionada === null) return;
    setProgress(0);
    const duracion = 5000; const step = 50; const inc = (step / duracion) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p + inc >= 100) { setGaleriaIndex((prev) => (prev + 1) % (charlas[charlaSeleccionada]?.galeria?.length || 1)); return 0; }
        return p + inc;
      });
    }, step);
    return () => clearInterval(timer);
  }, [showModal, charlaSeleccionada, charlas]);

  const siguiente = () => charlaSeleccionada !== null && setGaleriaIndex((p) => (p + 1) % (charlas[charlaSeleccionada]?.galeria?.length || 1));
  const anterior = () => charlaSeleccionada !== null && setGaleriaIndex((p) => p === 0 ? (charlas[charlaSeleccionada]?.galeria?.length || 1) - 1 : p - 1);

  if (charlas.length === 0) return (
    <section className="flex items-center justify-center min-h-screen bg-[#FBF8F4]">
      <p className="text-[#4E3B2B] text-lg">Cargando formacion continua...</p>
    </section>
  );

  const charla = charlas[activeIndex];
  const bordeLateral = activeIndex % 2 === 0 ? "linear-gradient(180deg,#c7a27a 0%,#b08968 100%)" : "linear-gradient(180deg,#b08968 0%,#c7a27a 100%)";

  return (
    <>
      <section ref={seccionRef} className="relative min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "linear-gradient(180deg,#F7EFE7 0%,#FBF8F4 100%)" }}>
        <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: "#4E3B2B", fontFamily: "'Playfair Display', serif" }}>Formacion Continua</h3>
        <motion.div key={activeIndex} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl rounded-3xl shadow-xl p-6 md:p-8 gap-8 relative overflow-hidden"
          style={{ background: activeIndex % 2 === 0 ? "linear-gradient(180deg,#FDF9F4 0%,#F1E9E0 100%)" : "linear-gradient(180deg,#F8F5F0 0%,#F3E9DF 100%)" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: activeIndex % 2 === 0 ? 0 : "auto", right: activeIndex % 2 === 0 ? "auto" : 0, width: "10px", background: bordeLateral, borderTopLeftRadius: activeIndex % 2 === 0 ? "1.5rem" : "0", borderBottomLeftRadius: activeIndex % 2 === 0 ? "1.5rem" : "0", borderTopRightRadius: activeIndex % 2 === 0 ? "0" : "1.5rem", borderBottomRightRadius: activeIndex % 2 === 0 ? "0" : "1.5rem" }} />
          <div className="flex-shrink-0 rounded-3xl overflow-hidden shadow-md z-10">
            {charla.imagen ? (
              <img src={charla.imagen} alt={charla.titulo} className="object-cover" style={{ width: 350, height: 280 }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ width: 350, height: 280, backgroundColor: "#E9DED2", color: "#6C584C" }}>Sin imagen</div>
            )}
          </div>
          <div className="text-center md:text-left z-10">
            <h4 className="text-2xl font-semibold mb-2" style={{ color: "#7C5B3E" }}>{charla.titulo}</h4>
            <p className="text-[#9B7D5F] mb-4 leading-relaxed" style={{ fontSize: "1rem" }}>{charla.descripcion}</p>
            {charla.fecha && <p className="text-sm text-[#B08968] mb-3">{new Date(charla.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>}
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setShowModal(true); setCharlaSeleccionada(activeIndex); setGaleriaIndex(0); }}
              className="px-6 py-2 font-semibold text-white rounded-full shadow-md transition-all" style={{ backgroundColor: "#B08968" }}>Saber mas</motion.button>
          </div>
        </motion.div>
        <p className="mt-8 text-sm text-[#6E5A49] italic text-center" style={{ maxWidth: "600px" }}>Desplazate con la rueda del raton para conocer las experiencias formativas.</p>
        <div className="flex justify-center mt-4">
          {charlas.map((_, i) => (
            <motion.div key={i} animate={{ scale: activeIndex === i ? 1.3 : 1, opacity: activeIndex === i ? 1 : 0.4, backgroundColor: activeIndex === i ? "#B08968" : "#D9C3B0" }}
              transition={{ duration: 0.4 }} style={{ width: "14px", height: "14px", borderRadius: "50%", margin: "0 6px", cursor: "pointer" }} onClick={() => setActiveIndex(i)} />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {showModal && charlaSeleccionada !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md bg-black/50 flex justify-center items-center z-[999]" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.4 }}
              className="bg-[#FFFDF9] rounded-3xl shadow-2xl p-8 relative w-[90%] max-w-[820px]" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold mb-2" style={{ color: "#8C6D4F", fontFamily: "'Playfair Display'" }}>{charlas[charlaSeleccionada].titulo}</h4>
                <p className="text-[#6C584C] text-base leading-relaxed max-w-[700px] mx-auto">{charlas[charlaSeleccionada].detalle || charlas[charlaSeleccionada].descripcion}</p>
              </div>
              <div className="relative flex justify-center mb-5">
                <AnimatePresence mode="wait">
                  <motion.div key={galeriaIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="w-full flex justify-center">
                    {(() => {
                      const media = charlas[charlaSeleccionada].galeria?.[galeriaIndex] || charlas[charlaSeleccionada].imagen;
                      if (!media) return <div style={{ width: "90%", height: 300, backgroundColor: "#E9DED2", borderRadius: 16 }} className="d-flex align-items-center justify-content-center"><p style={{ color: "#6C584C" }}>Sin contenido multimedia</p></div>;
                      if (typeof media === "string" && media.includes("youtube")) {
                        const embed = media.replace("watch?v=", "embed/");
                        return <iframe src={embed} title="Video charla" className="w-[90%] rounded-3xl shadow-md aspect-video" allowFullScreen />;
                      } else if (typeof media === "string" && media.endsWith(".mp4")) {
                        return <video src={media} controls className="w-[90%] max-h-[380px] object-cover rounded-3xl border border-[#E8DAC7]" />;
                      } else {
                        return <img src={typeof media === "string" ? media : ""} alt="Imagen charla" className="rounded-3xl shadow-lg object-cover border border-[#E9DED2]" style={{ maxHeight: "380px", width: "90%" }} />;
                      }
                    })()}
                  </motion.div>
                </AnimatePresence>
                <div className="absolute top-3 right-5 bg-[#B08968]/90 text-white px-3 py-1 rounded-full text-sm shadow">{galeriaIndex + 1} / {charlas[charlaSeleccionada]?.galeria?.length || 1}</div>
                <motion.div animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.05 }} className="absolute bottom-[-12px] left-[5%] h-[5px] rounded-full bg-[#B08968]" style={{ width: `${progress}%`, maxWidth: "90%" }} />
              </div>
              <div className="flex justify-between mt-3 mb-6 px-10">
                <button onClick={anterior} className="bg-[#EDE2D7] text-[#4E3B2B] rounded-full w-10 h-10 shadow-sm hover:bg-[#D8C4AA]">&lsaquo;</button>
                <button onClick={siguiente} className="bg-[#EDE2D7] text-[#4E3B2B] rounded-full w-10 h-10 shadow-sm hover:bg-[#D8C4AA]">&rsaquo;</button>
              </div>
              <div className="text-center">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 text-white rounded-full font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#B08968" }}>Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}