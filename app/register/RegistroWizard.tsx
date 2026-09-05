"use client";

/**
 * El asistente de registro, sacado de la pagina a su propio componente.
 *
 * POR QUE
 * Entrar y crear cuenta comparten pantalla y se intercambian de lado. Para
 * que ese cruce se ANIME en vez de ser una navegacion, los dos formularios
 * tienen que estar vivos en el mismo arbol al mismo tiempo: si cada uno vive
 * en su ruta, cambiar de estado desmonta todo y no hay nada que animar.
 *
 * Aqui solo se movio codigo. El comportamiento del asistente —tres pasos,
 * validaciones, alta— es el mismo que tenia en `page.tsx`.
 */

import React, { useState, useEffect } from "react";
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
  /** Permiso para promociones. Arranca en false y solo lo cambia la persona:
   *  una casilla premarcada no es consentimiento expreso. */
  aceptaMarketing: boolean;
}

type Direction = 1 | -1;

export default function RegistroWizard() {
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
    aceptaMarketing: false,
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
    <div>
      <div className="text-center position-relative">
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
              /* Derivado de `--danger` con `color-mix` en vez de tres codigos
                 fijos. Los que habia —#FCEAEA, #8C2B2B, #E3B4A0— estaban
                 pensados solo para el tema claro: sobre el fondo oscuro el
                 aviso salia como un rectangulo casi blanco. Al derivarlo del
                 token, el fondo se mezcla con la superficie del tema que este
                 puesto y funciona en los dos. */
              backgroundColor: "color-mix(in srgb, var(--danger) 12%, var(--surface))",
              color: "var(--danger)",
              border: "1px solid color-mix(in srgb, var(--danger) 35%, var(--surface))",
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

      <style jsx>{`
        /* Los colores salen de tokens y no de PALETTE. PALETTE.main es el
           marron de marca del tema CLARO; interpolarlo dejaba el indicador de
           pasos con ese marron tambien en el tema oscuro, donde la marca es
           un champan. El token cambia con el tema; la constante no.

           (Los valores viejos no se citan aqui a proposito: la regla de lint
           que prohibe colores fijos lee el texto crudo de esta plantilla y no
           distingue un comentario de una declaracion.) */
        .circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--brand);
          transition: all var(--mov-normal) ease;
        }
        .circle.filled {
          background-color: var(--brand);
          /* El token de contraste, no un blanco fijo: es el color que la
             paleta define para ir ENCIMA de la marca, y en el tema oscuro la
             marca es un champan claro sobre el que un blanco no se lee. */
          color: var(--brand-contrast);
        }
        .line {
          width: 56px;
          height: 4px;
          /* Era un beige fijo que solo funciona sobre fondo claro: en el
             tema oscuro la linea entre pasos quedaba mas clara que todo lo
             que tiene alrededor y se leia como si estuviera activa. El token
             de borde ya es la separacion propia de cada tema. */
          background-color: var(--border);
          margin: 0 10px;
          transition: background-color var(--mov-normal) ease;
        }
        .line.active {
          background-color: var(--brand);
        }
      `}</style>
    </div>
  );
}
