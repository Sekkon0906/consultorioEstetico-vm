"use client";

import React, {
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
  FormEvent,
} from "react";
import Input from "./input";
import InputPassword from "./inputPassword";
import { PALETTE } from "./palette";
import type { RegisterFormData } from "./page";

interface Props {
  formData: RegisterFormData;
  setFormData: Dispatch<SetStateAction<RegisterFormData>>;
  nextStep: () => void;
  setErr: (err: string | null) => void;
}

export default function Step1DatosPersonales({
  formData,
  setFormData,
  nextStep,
  setErr,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- Validaciones ---
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!formData.nombres || formData.nombres.trim().length < 2) {
      e.nombres = "Ingresa un nombre válido (mínimo 2 caracteres).";
    }

    if (!formData.apellidos || formData.apellidos.trim().length < 2) {
      e.apellidos = "Ingresa un apellido válido (mínimo 2 caracteres).";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || "")) {
      e.email = "El correo electrónico no tiene un formato válido.";
    }

    // Teléfono colombiano o formato internacional (+57 3XXXXXXXXX)
    if (!/^(\+?\d{1,3})?\s?3\d{9}$/.test(formData.telefono || "")) {
      e.telefono = "El número de teléfono debe tener 10 dígitos válidos.";
    }

    if (!formData.password || formData.password.length < 8) {
      e.password = "La contraseña debe tener mínimo 8 caracteres.";
    }

    if (formData.password !== formData.confirm) {
      e.confirm = "Las contraseñas no coinciden.";
    }

    return e;
  }, [formData]);

  const valid = Object.keys(errors).length === 0;

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) {
      setErr(null);
      nextStep();
    } else {
      setErr("Corrige los errores antes de continuar.");
    }
  };

  return (
    <form onSubmit={handleNext}>
      {/* Nombres */}
      <div className="mb-3 text-start">
        <Input
          label="Nombres"
          value={formData.nombres || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, nombres: v }))}
          error={touched && errors.nombres}
          palette={PALETTE}
        />
        {touched && errors.nombres && (
          <small className="text-danger">{errors.nombres}</small>
        )}
      </div>

      {/* Apellidos */}
      <div className="mb-3 text-start">
        <Input
          label="Apellidos"
          value={formData.apellidos || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, apellidos: v }))}
          error={touched && errors.apellidos}
          palette={PALETTE}
        />
        {touched && errors.apellidos && (
          <small className="text-danger">{errors.apellidos}</small>
        )}
      </div>

      {/* Correo */}
      <div className="mb-3 text-start">
        <Input
          label="Correo electrónico"
          type="email"
          value={formData.email || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, email: v }))}
          error={touched && errors.email}
          palette={PALETTE}
        />
        {touched && errors.email && (
          <small className="text-danger">{errors.email}</small>
        )}
      </div>

      {/* Teléfono */}
      <div className="mb-3 text-start">
        <Input
          label="Teléfono"
          value={formData.telefono || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, telefono: v }))}
          error={touched && errors.telefono}
          palette={PALETTE}
        />
        {touched && errors.telefono && (
          <small className="text-danger">{errors.telefono}</small>
        )}
      </div>

      {/* Contraseña */}
      <div className="mb-3 text-start">
        <InputPassword
          label="Contraseña"
          value={formData.password || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, password: v }))}
          show={showPass}
          setShow={setShowPass}
          error={touched && errors.password}
          palette={PALETTE}
        />
        {touched && errors.password && (
          <small className="text-danger">{errors.password}</small>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div className="mb-3 text-start">
        <InputPassword
          label="Confirmar contraseña"
          value={formData.confirm || ""}
          setValue={(v) => setFormData((prev) => ({ ...prev, confirm: v }))}
          show={showConfirm}
          setShow={setShowConfirm}
          error={touched && errors.confirm}
          palette={PALETTE}
        />
        {touched && errors.confirm && (
          <small className="text-danger">{errors.confirm}</small>
        )}
      </div>

      {/* Botón */}
      <button
        type="submit"
        className="btn w-100 fw-semibold py-2 mt-2"
        style={{
          backgroundColor: valid ? PALETTE.main : "#c9b7a8",
          border: "none",
          color: "white",
          borderRadius: "50px",
          cursor: valid ? "pointer" : "not-allowed",
          opacity: valid ? 1 : 0.8,
        }}
      >
        Siguiente
      </button>
    </form>
  );
}
