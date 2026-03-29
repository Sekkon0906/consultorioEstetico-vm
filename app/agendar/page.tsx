"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import type { Procedimiento, Cita } from "../types/domain";
import { getProcedimientosApi } from "../services/procedimientosApi";
import { useAuth } from "@/context/AuthContext";

import AgendarCalendar from "./agendarCalendar";
import AgendarForm, { AgendarFormData } from "./agendarForm";
import AgendarPago, { CitaSinPagos } from "./agendarPago";
import TarjetaCita from "./tarjetaCita";

export const PALETTE = {
  bgGradFrom: "#E9E0D1",
  bgGradTo: "#C9AD8D",
  surface: "#FBF7F2",
  border: "#E5D8C8",
  main: "#7A5534",
  mainHover: "#604028",
  accent: "#B98E63",
  text: "#2A1C12",
  textSoft: "#4B3726",
};

function AgendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const procParam = searchParams.get("proc") ?? "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState<string>("");
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [citaDraft, setCitaDraft] = useState<CitaSinPagos | null>(null);
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);
  const [metodoPago, setMetodoPago] = useState<"Consultorio" | "Online" | null>(null);
  const [tipoPagoConsultorio, setTipoPagoConsultorio] = useState<"Efectivo" | "Tarjeta" | undefined>(undefined);
  const [tipoPagoOnline, setTipoPagoOnline] = useState<"PayU" | "PSE" | undefined>(undefined);

  const [formData, setFormData] = useState<AgendarFormData>({
    nombre: "",
    telefono: "",
    correo: "",
    procedimiento: procParam || "",
    nota: "",
    fecha: undefined,
    hora: undefined,
  });

  //  Usuario real desde Supabase — ya no localStorage
  const { user: usuario } = useAuth();

  // Pre-rellenar formulario cuando carga el usuario autenticado
  useEffect(() => {
    if (!usuario) return;
    setFormData((prev) => ({
      ...prev,
      nombre:   prev.nombre   || usuario.nombres  || "",
      telefono: prev.telefono || usuario.telefono || "",
      correo:   prev.correo   || usuario.email    || "",
    }));
  }, [usuario]);

  // Cargar procedimientos desde el backend
  useEffect(() => {
    const cargarProcedimientos = async () => {
      try {
        const lista = await getProcedimientosApi();
        setProcedimientos(lista);
      } catch (err) {
        console.error("Error cargando procedimientos:", err);
      }
    };
    void cargarProcedimientos();
  }, []);

  // Paso 1 → 2
  const handleAvanzar = () => {
    if (!fecha || !hora) {
      alert("Selecciona un día y una hora antes de continuar.");
      return;
    }
    if (!usuario) {
      alert("Debes iniciar sesión para agendar una cita.");
      router.push("/login");
      return;
    }
    const fechaISO = fecha.toISOString().slice(0, 10);
    setFormData((prev) => ({ ...prev, fecha: fechaISO, hora }));
    setStep(2);
  };

  // Paso 2 → 3
  const handleConfirmarDatos = (): void => {
    if (!fecha || !usuario) return;

    const nuevaCita: CitaSinPagos = {
      userId:        usuario.id,
      nombres:       formData.nombre,
      apellidos:     usuario.apellidos,
      telefono:      formData.telefono,
      correo:        formData.correo,
      procedimiento: formData.procedimiento,
      nota:          formData.nota,
      tipoCita:      "valoracion",
      fecha:         fecha.toISOString().slice(0, 10),
      hora,
      pagado:        false,
      creadaPor:     "usuario",
    };

    setCitaDraft(nuevaCita);
    setStep(3);
  };

  return (
    <main
      className="min-h-screen w-full py-10 px-4 md:px-8 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PALETTE.bgGradFrom}, ${PALETTE.bgGradTo})`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl grid gap-6 items-start">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
            >
              <AgendarCalendar
                fecha={fecha}
                hora={hora}
                onFechaSelect={setFecha}
                onHoraSelect={setHora}
                usuario={usuario}
              />
              <div className="text-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAvanzar}
                  className="px-6 py-3 rounded-full text-white font-semibold shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.main}, ${PALETTE.accent})`,
                  }}
                >
                  Continuar
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <AgendarForm
              formData={formData}
              setFormData={setFormData}
              procedimientos={procedimientos}
              handleConfirmar={handleConfirmarDatos}
              goBack={() => setStep(1)}
              usuario={usuario}
              esPrimeraCita={false}
            />
          )}

          {step === 3 && citaDraft && (
            <AgendarPago
              metodoPago={metodoPago}
              setMetodoPago={setMetodoPago}
              tipoPagoConsultorio={tipoPagoConsultorio}
              setTipoPagoConsultorio={setTipoPagoConsultorio}
              tipoPagoOnline={tipoPagoOnline}
              setTipoPagoOnline={setTipoPagoOnline}
              citaData={citaDraft}
              onConfirmar={(nuevaCita: Cita) => {
                setCitaCreada(nuevaCita);
                setStep(4);
              }}
              goBack={() => setStep(2)}
            />
          )}

          {step === 4 && citaCreada && (
            <motion.div
              key="confirmacion"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="text-center flex flex-col items-center"
            >
              <TarjetaCita
                cita={citaCreada}
                modo="confirmacion"
                mostrarQR={true}
              />
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-full font-semibold text-white shadow-md"
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.main}, ${PALETTE.accent})`,
                  }}
                >
                  Volver al inicio
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/perfil/citas_agendadas")}
                  className="px-6 py-3 rounded-full font-semibold border border-[#B08968] text-[#7A5534] bg-white hover:bg-[#F6EFE7] transition"
                >
                  Ir a mis citas agendadas
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando agenda...</div>}>
      <AgendarPageContent />
    </Suspense>
  );
}