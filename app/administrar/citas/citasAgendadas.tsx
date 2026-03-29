"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE } from "../../agendar/page";
import {
  Cita,
  getCitasByDayAPI,
  confirmarCitaAPI,
  cancelarCitaAPI,
} from "./helpers";
import CitasAgendadasCard from "./citasAgendadasCard";
import CitasAgendadasModal from "./citasAgendadasModal";
import { ChevronUp, ChevronDown, CalendarDays } from "lucide-react";

export default function CitasAgendadas() {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [mes, setMes] = useState<number>(0);
  const [anio, setAnio] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Cita | null>(null);
  const [ascendente, setAscendente] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [recargar, setRecargar] = useState<boolean>(false);

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState<boolean>(false);

  useEffect(() => {
    const hoy = new Date();
    setMes(hoy.getMonth());
    setAnio(hoy.getFullYear());
    setIsClient(true);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      if (!selectedDate) {
        setCitas([]);
        return;
      }
      try {
        setLoadingCitas(true);
        let data = await getCitasByDayAPI(selectedDate, filtroEstado);
        data = data.sort((a, b) =>
          ascendente
            ? a.hora.localeCompare(b.hora)
            : b.hora.localeCompare(a.hora)
        );
        setCitas(data);
      } catch (error) {
        console.error("Error cargando citas:", error);
      } finally {
        setLoadingCitas(false);
      }
    };
    void cargar();
  }, [selectedDate, filtroEstado, ascendente, recargar]);

  const resumen = useMemo(() => {
    const base = { pendiente: 0, confirmada: 0, atendida: 0, cancelada: 0 };
    citas.forEach((cita) => {
      if (cita.estado === "pendiente") base.pendiente += 1;
      if (cita.estado === "confirmada") base.confirmada += 1;
      if (cita.estado === "atendida") base.atendida += 1;
      if (cita.estado === "cancelada") base.cancelada += 1;
    });
    return base;
  }, [citas]);

  const diasEnMes = useMemo(
    () => new Date(anio, mes + 1, 0).getDate(),
    [anio, mes]
  );

  const primerDiaSemana = useMemo(
    () => new Date(anio, mes, 1).getDay(),
    [anio, mes]
  );

  const nombresMes = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const generarDias = useMemo(() => {
    const dias: (number | null)[] = [];
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    for (let i = 0; i < offset; i += 1) dias.push(null);
    for (let i = 1; i <= diasEnMes; i += 1) dias.push(i);
    return dias;
  }, [diasEnMes, primerDiaSemana]);

  const handleDateClick = (dia: number | null): void => {
    if (!dia) return;
    const fecha = new Date(anio, mes, dia).toISOString().slice(0, 10);
    setSelectedDate(fecha);
  };

  const handleConfirmar = async (cita: Cita): Promise<void> => {
    try {
      await confirmarCitaAPI(cita.id);
      setRecargar((v) => !v);
    } catch (error) {
      console.error("Error confirmando cita:", error);
    }
  };

  const handleCancelar = async (cita: Cita): Promise<void> => {
    const motivo = window.prompt("Motivo de la cancelacion:");
    if (!motivo) return;
    try {
      await cancelarCitaAPI(cita.id, motivo);
      setRecargar((v) => !v);
    } catch (error) {
      console.error("Error cancelando cita:", error);
    }
  };

  const handleReagendar = (cita: Cita): void => {
    setDetalle(cita);
  };

  if (!isClient)
    return (
      <div className="text-center py-20 text-[#6E5A49]">
        Cargando citas...
      </div>
    );

  return (
    <div className="p-6 space-y-6 relative">
      <h2
        className="text-2xl font-semibold text-center flex items-center justify-center gap-2"
        style={{ color: PALETTE.main }}
      >
        <CalendarDays size={22} /> Citas Agendadas
      </h2>

      <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
        {/* CALENDARIO */}
        <div
          className="bg-[#FBF7F2] p-6 rounded-xl shadow-md w-full md:w-[45%] flex flex-col items-center"
          style={{ border: `1px solid ${PALETTE.border}` }}
        >
          <div className="flex justify-between items-center mb-4 w-full">
            <button
              type="button"
              onClick={() => setMes((m) => (m === 0 ? 11 : m - 1))}
              className="text-[#8B6A4B] hover:text-[#C7A27A] text-lg font-semibold"
            >
              {"<"}
            </button>
            <span className="text-[#8B6A4B] font-bold capitalize tracking-wide text-lg">
              {nombresMes[mes]} {anio}
            </span>
            <button
              type="button"
              onClick={() => setMes((m) => (m === 11 ? 0 : m + 1))}
              className="text-[#8B6A4B] hover:text-[#C7A27A] text-lg font-semibold"
            >
              {">"}
            </button>
          </div>

          <div className="grid grid-cols-7 w-full mb-2">
            {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map(
              (d) => (
                <div
                  key={d}
                  className="text-center font-semibold text-[#6E5A49] text-sm border-b border-[#E5D8C8] pb-1"
                >
                  {d}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 w-full mb-4">
            {generarDias.map((d, i) => {
              const fechaISO =
                d != null
                  ? new Date(anio, mes, d).toISOString().slice(0, 10)
                  : "";
              const isSelected = selectedDate === fechaISO;
              const tieneCitas = isSelected && citas.length > 0;

              return (
                <motion.button
                  key={i}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDateClick(d)}
                  disabled={d == null}
                  className={`h-10 w-full rounded-md text-sm font-medium transition-all relative ${
                    d == null
                      ? "bg-transparent cursor-default"
                      : isSelected
                      ? "bg-[#B08968] text-white shadow-inner"
                      : "bg-white hover:bg-[#F1E6DA] text-[#32261C]"
                  }`}
                >
                  {d ?? ""}
                  {tieneCitas && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#B08968] rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* LISTA DE CITAS */}
        <div className="flex-1 bg-[#FBF7F2] p-6 rounded-xl shadow-md border border-[#E5D8C8] min-h-[400px]">
          {!selectedDate ? (
            <p className="text-[#6E5A49] text-center mt-16 italic">
              Selecciona un dia para ver las citas agendadas.
            </p>
          ) : (
            <>
              {/* FILTROS */}
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <h3 className="text-lg font-semibold text-[#8B6A4B]">
                  Citas del {selectedDate}
                </h3>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="border border-[#E5D8C8] rounded-lg px-3 py-2 text-sm text-[#4E3B2B] bg-white hover:border-[#B08968] focus:outline-none"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="confirmada">Confirmadas</option>
                    <option value="atendida">Atendidas</option>
                    <option value="cancelada">Canceladas</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setAscendente((prev) => !prev)}
                    className="flex items-center gap-1 text-sm text-[#6E5A49] hover:text-[#8B6A4B]"
                  >
                    {ascendente ? (
                      <>
                        <ChevronUp size={16} /> Ascendente
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} /> Descendente
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RESUMEN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-sm font-medium">
                <div className="bg-[#FFF8E1] rounded-lg py-2 text-center border border-[#F1D58A] text-[#A07800]">
                  Pendientes: {resumen.pendiente}
                </div>
                <div className="bg-[#E3F2FD] rounded-lg py-2 text-center border border-[#90CAF9] text-[#1976D2]">
                  Confirmadas: {resumen.confirmada}
                </div>
                <div className="bg-[#E8F5E9] rounded-lg py-2 text-center border border-[#A5D6A7] text-[#2E7D32]">
                  Atendidas: {resumen.atendida}
                </div>
                <div className="bg-[#FCE4EC] rounded-lg py-2 text-center border border-[#F48FB1] text-[#C2185B]">
                  Canceladas: {resumen.cancelada}
                </div>
              </div>

              {/* TARJETAS O MENSAJE */}
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
                {loadingCitas ? (
                  <p className="text-[#6E5A49] text-center mt-20 italic">
                    Cargando citas...
                  </p>
                ) : citas.length > 0 ? (
                  citas.map((cita) => (
                    <CitasAgendadasCard
                      key={cita.id}
                      cita={cita}
                      onVerDetalles={setDetalle}
                      onConfirmar={handleConfirmar}
                      onCancelar={handleCancelar}
                      onReagendar={handleReagendar}
                    />
                  ))
                ) : (
                  <p className="text-[#6E5A49] text-center mt-20 italic">
                    No hay citas
                    {filtroEstado !== "todos" && (
                      <> con el estado &ldquo;{filtroEstado}&rdquo; </>
                    )}
                    para el {selectedDate}.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {detalle && (
          <CitasAgendadasModal
            cita={detalle}
            onClose={() => setDetalle(null)}
            onUpdated={() => {
              setDetalle(null);
              setRecargar((v) => !v);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
