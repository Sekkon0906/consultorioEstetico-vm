"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { Procedimiento, Cita } from "@/types/domain";
import { getProcedimientosApi } from "@/services/procedimientosApi";
import { useAuth } from "@/context/AuthContext";

import AgendarCalendar from "./agendarCalendar";
import AgendarForm, { AgendarFormData } from "./agendarForm";
import AgendarPago, { CitaSinPagos } from "./agendarPago";
import TarjetaCita from "./tarjetaCita";

import { PALETTE } from "./palette";
import { aISOLocal, aFechaLocal } from "@/lib/fechas";

function AgendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const procParam = searchParams.get("proc") ?? "";
  const t = useTranslations("agendar");
  const tc = useTranslations("agendar.confirmacion");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState<string>("");
  const [aviso, setAviso] = useState<string | null>(null);
  /** Aviso de "necesitas una cuenta" con las dos salidas, en vez de expulsar. */
  const [gateSesion, setGateSesion] = useState(false);
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

  // Al volver de iniciar sesión o de crear la cuenta, retoma el día y la
  // hora que ya se habían elegido. Se consume una sola vez.
  useEffect(() => {
    if (!usuario) return;
    try {
      const guardado = sessionStorage.getItem("agendar:seleccion");
      if (!guardado) return;
      sessionStorage.removeItem("agendar:seleccion");
      const { fecha: f, hora: h } = JSON.parse(guardado);
      const d = aFechaLocal(f);
      if (d) setFecha(d);
      if (h) setHora(h);
    } catch {
      // Un valor corrupto no debe impedir agendar: simplemente se ignora.
    }
  }, [usuario]);

  // Guarda el día y la hora elegidos antes de mandar a iniciar sesión, y
  // vuelve aquí. Sin esto, el paciente que no tiene cuenta pierde el trabajo
  // hecho justo en el paso en que ya había decidido venir.
  const irAAcceder = (destino: "login" | "register") => {
    try {
      if (fecha && hora) {
        sessionStorage.setItem(
          "agendar:seleccion",
          JSON.stringify({ fecha: aISOLocal(fecha), hora })
        );
      }
    } catch {
      // sessionStorage puede fallar en modo privado; no es motivo para
      // impedir que la persona inicie sesión.
    }
    router.push(`/${destino}?next=/agendar`);
  };

  // Paso 1 → 2
  const handleAvanzar = () => {
    if (!fecha || !hora) {
      setAviso(t("warningSelectDayHour"));
      return;
    }
    if (!usuario) {
      // Antes esto expulsaba a /login de inmediato: perdías el día y la hora
      // que acababas de elegir, y al volver empezabas de cero. Ahora se
      // ofrece la decisión —entrar o crear cuenta— y se conserva la
      // selección para retomarla al volver.
      setGateSesion(true);
      return;
    }
    setAviso(null);
    const fechaISO = aISOLocal(fecha);
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
      fecha:         aISOLocal(fecha),
      hora,
      pagado:        false,
      creadaPor:     "usuario",
    };

    setCitaDraft(nuevaCita);
    setStep(3);
  };

  return (
    <main
      className="dark-aware-section agendar-page min-h-screen w-full py-10 px-4 md:px-8 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PALETTE.bgGradFrom}, ${PALETTE.bgGradTo})`,
      }}
    >
      <div className="mx-auto w-full max-w-5xl grid gap-6 items-start">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="calendar"
              initial={{ y: 16 }}
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
              {gateSesion && (
                /* La alternativa era mandar a /login sin más. Pero quien
                   llega aquí ya eligió día y hora: está decidido. Sacarlo
                   de la página en ese momento, sin decirle por qué ni
                   guardarle la selección, es donde se pierde una cita. */
                <div
                  className="mx-auto mt-6 max-w-md rounded-2xl px-5 py-4 text-center"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: "0.35rem" }}>
                    {t("gate.title")}
                  </p>
                  <p style={{ color: "var(--text-soft)", fontSize: "0.88rem", marginBottom: "1rem" }}>
                    {t("gate.subtitle")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => irAAcceder("login")}
                      style={{
                        padding: "var(--btn-pad-md)", borderRadius: "var(--btn-radio)",
                        background: "var(--brand)", color: "var(--brand-contrast)",
                        border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {t("gate.login")}
                    </button>
                    <button
                      type="button"
                      onClick={() => irAAcceder("register")}
                      style={{
                        padding: "var(--btn-pad-md)", borderRadius: "var(--btn-radio)",
                        background: "transparent", color: "var(--brand-deep)",
                        border: "1px solid var(--brand)", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {t("gate.register")}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGateSesion(false)}
                    style={{
                      marginTop: "0.8rem", background: "none", border: "none",
                      color: "var(--text-muted)", fontSize: "0.8rem",
                      cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
                    }}
                  >
                    {t("gate.cancel")}
                  </button>
                </div>
              )}
              {aviso && (
                <div
                  className="mx-auto mt-6 max-w-md text-center rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3"
                  style={{
                    background: PALETTE.surface,
                    color: "var(--danger)",
                    border: "1px solid #e4bfbf",
                  }}
                >
                  <span className="flex-1">{aviso}</span>
                  <button
                    type="button"
                    onClick={() => setAviso(null)}
                    aria-label={t("closeWarning")}
                    style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: 700 }}
                  >
                    ×
                  </button>
                </div>
              )}
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
                  {t("ctaContinue")}
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
              initial={{ y: 16 }}
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
                  {tc("backHome")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/perfil/citas_agendadas")}
                  className="px-6 py-3 rounded-full font-semibold border border-[#B08968] text-[#7A5534] bg-white hover:bg-[#F6EFE7] transition"
                >
                  {tc("goToMyAppointments")}
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

function SuspenseFallback() {
  const t = useTranslations("agendar");
  return <div className="p-10 text-center">{t("loading")}</div>;
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <AgendarPageContent />
    </Suspense>
  );
}