"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Clock, User, Phone, Mail, FileText } from "lucide-react";
import { getMisCitasApi } from "../../services/citasApi";
import type { Cita } from "../../types/domain";

const coloresEstado: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#FFF8E1", text: "#7D6608" },
  confirmada: { bg: "#E3F2FD", text: "#0B3C78" },
  atendida: { bg: "#E8F5E9", text: "#145A32" },
  cancelada: { bg: "#FCE4EC", text: "#7E1F1F" },
};

export default function CitasAgendadas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [ascendente, setAscendente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMisCitasApi()
      .then((data) => setCitas(data))
      .catch((err) => {
        console.error("Error cargando citas:", err);
        setError("No se pudieron cargar las citas. Intenta de nuevo.");
      })
      .finally(() => setLoading(false));
  }, []);

  const citasFiltradas = useMemo(() => {
    let lista = [...citas];
    if (filtroEstado !== "todos") {
      lista = lista.filter((c) => c.estado === filtroEstado);
    }
    return lista.sort((a, b) => {
      const fechaComp = ascendente
        ? a.fecha.localeCompare(b.fecha)
        : b.fecha.localeCompare(a.fecha);
      if (fechaComp !== 0) return fechaComp;
      return ascendente
        ? a.hora.localeCompare(b.hora)
        : b.hora.localeCompare(a.hora);
    });
  }, [citas, ascendente, filtroEstado]);

  const resumen = useMemo(
    () => ({
      pendiente: citas.filter((c) => c.estado === "pendiente").length,
      confirmada: citas.filter((c) => c.estado === "confirmada").length,
      atendida: citas.filter((c) => c.estado === "atendida").length,
      cancelada: citas.filter((c) => c.estado === "cancelada").length,
    }),
    [citas]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div
          className="spinner-border"
          style={{ color: "#B08968" }}
          role="status"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "#7E1F1F" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-full text-white"
          style={{ backgroundColor: "#B08968" }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      <h2
        className="text-2xl font-bold"
        style={{ color: "#4E3B2B" }}
      >
        Mis Citas Agendadas
      </h2>

      {/* Resumen */}
      <div className="d-flex gap-3 flex-wrap">
        {Object.entries(resumen).map(([estado, count]) => {
          const color = coloresEstado[estado] || { bg: "#F5EEE6", text: "#4E3B2B" };
          return (
            <span
              key={estado}
              className="badge rounded-pill px-3 py-2 text-capitalize fw-semibold"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {estado}: {count}
            </span>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        {["todos", "pendiente", "confirmada", "atendida", "cancelada"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className="btn btn-sm rounded-pill text-capitalize"
              style={{
                backgroundColor: filtroEstado === f ? "#8B6A4B" : "#F5EEE6",
                color: filtroEstado === f ? "#fff" : "#4E3B2B",
                border: "none",
              }}
            >
              {f}
            </button>
          )
        )}
        <button
          onClick={() => setAscendente((a) => !a)}
          className="btn btn-sm rounded-pill"
          style={{
            backgroundColor: "#F5EEE6",
            color: "#4E3B2B",
            border: "none",
          }}
        >
          {ascendente ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}{" "}
          Fecha
        </button>
      </div>

      {/* Lista de citas */}
      {citasFiltradas.length === 0 ? (
        <p
          className="text-center py-8"
          style={{ color: "#8B7060" }}
        >
          No hay citas
          {filtroEstado !== "todos"
            ? ` con estado "${filtroEstado}"`
            : ""}{" "}
          registradas.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          <AnimatePresence>
            {citasFiltradas.map((cita) => {
              const color = coloresEstado[cita.estado] || {
                bg: "#F5EEE6",
                text: "#4E3B2B",
              };
              return (
                <motion.div
                  key={cita.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border shadow-sm p-5"
                  style={{
                    borderColor: "#E9DED2",
                    backgroundColor: "#FFFCF8",
                  }}
                >
                  {/* Cabecera */}
                  <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                    <div>
                      <h5
                        className="fw-bold mb-1"
                        style={{ color: "#4E3B2B" }}
                      >
                        {cita.procedimiento}
                      </h5>
                      <p
                        className="small mb-0"
                        style={{ color: "#6C584C" }}
                      >
                        {cita.tipoCita === "valoracion"
                          ? "Valoracion"
                          : "Implementacion"}
                      </p>
                    </div>
                    <span
                      className="badge rounded-pill px-3 py-2 text-capitalize fw-semibold"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="d-flex flex-column gap-1">
                    <p
                      className="small mb-0 d-flex align-items-center gap-2"
                      style={{ color: "#4E3B2B" }}
                    >
                      <Clock size={14} />
                      {String(cita.fecha).slice(0, 10)} - {cita.hora}
                    </p>
                    <p
                      className="small mb-0 d-flex align-items-center gap-2"
                      style={{ color: "#4E3B2B" }}
                    >
                      <User size={14} />
                      {cita.nombres} {cita.apellidos}
                    </p>
                    {cita.telefono && (
                      <p
                        className="small mb-0 d-flex align-items-center gap-2"
                        style={{ color: "#6C584C" }}
                      >
                        <Phone size={14} />
                        {cita.telefono}
                      </p>
                    )}
                    {cita.correo && (
                      <p
                        className="small mb-0 d-flex align-items-center gap-2"
                        style={{ color: "#6C584C" }}
                      >
                        <Mail size={14} />
                        {cita.correo}
                      </p>
                    )}
                    {cita.nota && (
                      <p
                        className="small mb-0 d-flex align-items-center gap-2"
                        style={{ color: "#6C584C" }}
                      >
                        <FileText size={14} />
                        {cita.nota}
                      </p>
                    )}
                  </div>

                  {/* Pago */}
                  {cita.monto != null && cita.monto > 0 && (
                    <div
                      className="mt-3 rounded-2 p-2"
                      style={{ backgroundColor: "#F5EEE6" }}
                    >
                      <p
                        className="small mb-0 fw-semibold"
                        style={{ color: "#8B6A4B" }}
                      >
                        Monto: ${cita.monto.toLocaleString("es-CO")} COP
                        {cita.montoPagado != null && (
                          <span>
                            {" "}
                            | Pagado: $
                            {cita.montoPagado.toLocaleString("es-CO")}
                          </span>
                        )}
                        {cita.montoRestante != null &&
                          cita.montoRestante > 0 && (
                            <span>
                              {" "}
                              | Restante: $
                              {cita.montoRestante.toLocaleString("es-CO")}
                            </span>
                          )}
                      </p>
                    </div>
                  )}

                  {/* Cancelacion */}
                  {cita.estado === "cancelada" && cita.motivoCancelacion && (
                    <div
                      className="mt-3 rounded-2 p-2"
                      style={{ backgroundColor: "#FCE4EC" }}
                    >
                      <p
                        className="small mb-0"
                        style={{ color: "#7E1F1F" }}
                      >
                        Motivo: {cita.motivoCancelacion}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
