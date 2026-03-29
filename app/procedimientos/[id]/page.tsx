"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FaCalendarCheck, FaArrowLeft, FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getProcedimientoByIdApi } from "../../services/procedimientosApi";
import { supabase } from "@/lib/supabaseClient";
import type { Procedimiento, MediaItem } from "../../types/domain";

function formatPrecioUniversal(precio: string | number): string {
  if (typeof precio === "number") return precio.toLocaleString("es-CO", { minimumFractionDigits: 0 });
  return precio.replace(/\d{1,3}(?:\d{3})*(?:\.\d+)?/g, (match) => {
    const num = parseFloat(match.replace(/\./g, "").replace(/,/g, "."));
    return isNaN(num) ? match : num.toLocaleString("es-CO", { minimumFractionDigits: 0 });
  });
}

export default function ProcedimientoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // UUID string, NOT number

  const [procedimiento, setProcedimiento] = useState<Procedimiento | null>(null);
  const [galeria, setGaleria] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProcedimientoByIdApi(id),
      supabase.from("procedimiento_galeria").select("id, tipo, url, titulo, descripcion, orden").eq("procedimiento_id", id).order("orden", { ascending: true }),
    ]).then(([proc, galRes]) => {
      setProcedimiento(proc);
      if (!galRes.error && galRes.data) {
        setGaleria(galRes.data.map((g: any) => ({ id: String(g.id), tipo: g.tipo || "imagen", url: g.url, titulo: g.titulo || "", descripcion: g.descripcion || "" })));
      }
    }).catch((err) => { console.error("Error:", err); setProcedimiento(null); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]"><div className="spinner-border" style={{ color: "#B08968" }} role="status" /></div>;

  if (!procedimiento) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F7] text-[#4E3B2B]">
      <p className="text-2xl font-semibold mb-4">Procedimiento no encontrado</p>
      <button onClick={() => router.push("/procedimientos")} className="px-6 py-3 bg-[#B08968] text-white rounded-full hover:bg-[#9A7458] transition-all">Volver</button>
    </div>
  );

  const handlePrev = () => { if (modalIndex !== null) setModalIndex(modalIndex > 0 ? modalIndex - 1 : galeria.length - 1); };
  const handleNext = () => { if (modalIndex !== null) setModalIndex(modalIndex < galeria.length - 1 ? modalIndex + 1 : 0); };

  return (
    <main className="min-h-screen bg-[#FAF9F7] py-10 px-6 sm:px-10 text-[#4E3B2B]">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="rounded-3xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md border border-[#E9DED2]">

          <div className="relative w-full h-[500px] overflow-hidden">
            {procedimiento.imagen ? (
              <img src={procedimiento.imagen} alt={procedimiento.nombre} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#E9DED2] text-[#6C584C]">Sin imagen principal</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#00000055] to-transparent" />
            <h1 className="absolute bottom-6 left-6 text-3xl md:text-4xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{procedimiento.nombre}</h1>
          </div>

          <div className="p-8">
            <p className="text-[#6C584C] leading-relaxed mb-6 text-[1.05rem]">{procedimiento.desc}</p>
            <div className="mb-8">
              <p className="text-lg font-semibold text-[#B08968]">Precio estandar: {formatPrecioUniversal(procedimiento.precio)}</p>
              <small className="text-[#6C584C]/70">*El valor puede variar segun valoracion medica.*</small>
            </div>

            {galeria.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Galeria multimedia</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {galeria.map((media, i) => (
                    <motion.div key={media.id || i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }} className="relative rounded-2xl overflow-hidden shadow-md cursor-pointer group" onClick={() => setModalIndex(i)}>
                      {media.tipo === "imagen" ? (
                        <img src={media.url} alt={media.titulo || ""} className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="aspect-video relative bg-black rounded-2xl">
                          <img src={`https://img.youtube.com/vi/${(media.url.split("/embed/")[1] || "").split("?")[0]}/hqdefault.jpg`} alt={media.titulo || "Video"} className="w-full h-full object-cover rounded-2xl opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition"><FaPlay className="text-white text-4xl opacity-90" /></div>
                        </div>
                      )}
                      {media.titulo && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3"><p className="text-white text-sm font-semibold">{media.titulo}</p></div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-8">
              <Link href={`/agendar?proc=${encodeURIComponent(procedimiento.nombre)}`} className="flex items-center gap-2 bg-[#B08968] text-white px-6 py-3 rounded-full font-medium hover:bg-[#9A7458] transition-all shadow-sm no-underline"><FaCalendarCheck /> Agendar cita</Link>
              <Link href="/procedimientos" className="flex items-center gap-2 border border-[#B08968] text-[#4E3B2B] px-6 py-3 rounded-full font-medium bg-[#FAF9F7] hover:bg-[#B08968] hover:text-white transition-all shadow-sm no-underline"><FaArrowLeft /> Volver</Link>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalIndex !== null && galeria[modalIndex] && (
          <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-[90%] p-6 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <button onClick={() => setModalIndex(null)} className="absolute top-3 right-4 text-[#4E3B2B] hover:text-red-600 text-2xl">x</button>
              <h3 className="text-xl font-semibold mb-2 text-[#4E3B2B]">{galeria[modalIndex].titulo}</h3>
              <p className="text-[#6C584C] mb-4">{galeria[modalIndex].descripcion}</p>
              <div className="relative flex items-center justify-center">
                {galeria[modalIndex].tipo === "imagen" ? (
                  <img src={galeria[modalIndex].url} alt={galeria[modalIndex].titulo || ""} className="rounded-lg max-h-[60vh] mx-auto" />
                ) : (
                  <iframe src={galeria[modalIndex].url} title={galeria[modalIndex].titulo || ""} allowFullScreen className="w-full rounded-lg" style={{ height: "50vh" }} />
                )}
                <button onClick={handlePrev} className="absolute left-2 text-white bg-[#00000055] hover:bg-[#00000088] rounded-full p-3"><FaChevronLeft /></button>
                <button onClick={handleNext} className="absolute right-2 text-white bg-[#00000055] hover:bg-[#00000088] rounded-full p-3"><FaChevronRight /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}