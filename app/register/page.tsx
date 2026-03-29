"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PALETTE } from "./palette";
import Step1DatosPersonales from "./step1DatosPersonales";
import Step2DatosMedicos from "./step2DatosMedicos";
import Step3Exito from "./step3exito";

// ===== Tipo central de TODO el formulario de registro =====
export interface RegisterFormData {
  // Paso 1
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  password: string;
  confirm: string;

  // Información derivada de fecha
  edad: string; // luego la convertimos a number

  // Paso 2
  fechaNacimiento: Date | null;
  sexo: string;
  genero: string;
  antecedentes: string[];
  alergias: string[];
  medicamentos: string[];
  antecedentesDescripcion: string;
  alergiasDescripcion: string;
  medicamentosDescripcion: string;
}

type Direction = 1 | -1;

function RegisterPageContent() {
  const searchParams = useSearchParams();

  // Datos prellenados desde login con Google
  const pre_email = searchParams.get("email") ?? "";
  const pre_nombres = searchParams.get("nombres") ?? "";
  const pre_apellidos = searchParams.get("apellidos") ?? "";
  const pre_telefono = searchParams.get("telefono") ?? "";

  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>(1);

  // ===== Estado tipado con RegisterFormData =====
  const [formData, setFormData] = useState<RegisterFormData>({
    // Paso 1
    nombres: pre_nombres || "",
    apellidos: pre_apellidos || "",
    email: pre_email || "",
    telefono: pre_telefono || "",
    password: "",
    confirm: "",

    // Derivado de fecha
    edad: "",

    // Paso 2
    fechaNacimiento: null,
    sexo: "",
    genero: "",
    antecedentes: [],
    alergias: [],
    medicamentos: [],
    antecedentesDescripcion: "",
    alergiasDescripcion: "",
    medicamentosDescripcion: "",
  });

  // Si los query params llegan después, solo rellenamos si está vacío
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nombres: prev.nombres || pre_nombres || "",
      apellidos: prev.apellidos || pre_apellidos || "",
      email: prev.email || pre_email || "",
      telefono: prev.telefono || pre_telefono || "",
    }));
  }, [pre_email, pre_nombres, pre_apellidos, pre_telefono]);

  const nextStep = () => {
    setDirection(1);
    setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const slide = {
    enter: (dir: Direction) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: Direction) => ({
      x: dir < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  return (
    <section
      className="py-5"
      style={{
        background: `linear-gradient(180deg,#FAF9F7 0%,#F1E9E0 100%)`,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div
              className="card border-0 shadow-lg rounded-4"
              style={{ backgroundColor: PALETTE.surface, overflow: "hidden" }}
            >
              <div className="card-body p-4 p-md-5 text-center position-relative">
                {/* Botón volver */}
                {step > 1 && step < 3 && (
                  <p
                    onClick={prevStep}
                    style={{
                      position: "absolute",
                      left: "1.2rem",
                      top: "1.4rem",
                      color: PALETTE.text,
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    ← Volver atrás
                  </p>
                )}

                {/* Paso / indicador */}
                {step < 3 && (
                  <div className="d-flex align-items-center justify-content-center mb-3 mt-1">
                    <div className="d-flex align-items-center">
                      <div className={`circle ${step >= 1 ? "filled" : ""}`}>1</div>
                      <div className={`line ${step === 2 ? "active" : ""}`}></div>
                      <div className={`circle ${step >= 2 ? "filled" : ""}`}>2</div>
                      <div className="line"></div>
                      <div className="circle"></div>
                    </div>
                  </div>
                )}

                <h1
                  className="fw-bold mb-2"
                  style={{
                    color: PALETTE.text,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {step === 1
                    ? "Crear cuenta"
                    : step === 2
                    ? "Información médica"
                    : "Registro exitoso"}
                </h1>

                <p
                  className="text-muted mb-4"
                  style={{ color: PALETTE.muted, fontSize: "0.95rem" }}
                >
                  {step === 1
                    ? "Regístrate para agendar tus citas de forma más rápida."
                    : step === 2
                    ? "Completa tu información médica básica."
                    : "Cuenta creada correctamente."}
                </p>

                {err && (
                  <div
                    className="alert alert-danger text-center"
                    style={{
                      backgroundColor: "#FCEAEA",
                      color: "#8C2B2B",
                      border: "1px solid #E3B4A0",
                    }}
                  >
                    {err}
                  </div>
                )}

                <div style={{ position: "relative", minHeight: 500 }}>
                  <AnimatePresence initial={false} mode="wait" custom={direction}>
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        custom={direction}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.45 }}
                      >
                        <Step1DatosPersonales
                          formData={formData}
                          setFormData={setFormData}
                          nextStep={nextStep}
                          setErr={setErr}
                        />
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        custom={direction}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.45 }}
                      >
                        <Step2DatosMedicos
                          formData={formData}
                          setFormData={setFormData}
                          nextStep={nextStep}
                          prevStep={prevStep}
                          setErr={setErr}
                        />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        custom={direction}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.45 }}
                      >
                        <Step3Exito formData={formData} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid ${PALETTE.main};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: ${PALETTE.main};
          transition: all 0.28s ease;
        }
        .circle.filled {
          background-color: ${PALETTE.main};
          color: white;
        }
        .line {
          width: 56px;
          height: 4px;
          background-color: #e6d9cf;
          margin: 0 10px;
          transition: background-color 0.28s ease;
        }
        .line.active {
          background-color: ${PALETTE.main};
        }
      `}</style>
    </section>
  );
}

// Wrapper con Suspense para calmar el warning de useSearchParams
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="py-5 text-center">
          <p>Cargando registro…</p>
        </section>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
