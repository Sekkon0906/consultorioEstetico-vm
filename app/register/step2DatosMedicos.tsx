"use client";

import React, { useState, useMemo } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PALETTE } from "./palette";
import type { RegisterFormData } from "./page";

// ---- Tipos auxiliares ----
type MedicalOption = { value: string; label: string };

interface Props {
  formData: RegisterFormData;
  setFormData: React.Dispatch<React.SetStateAction<RegisterFormData>>;
  prevStep: () => void;
  nextStep: () => void;
  setErr: (e: string | null) => void;
}

// ---- Listas de opciones ----
const ANTECEDENTES = [
  "Hipertensión arterial",
  "Diabetes mellitus",
  "Trastornos de coagulación (trombosis, hemofilia)",
  "Problemas cardiacos (arritmia, insuficiencia, marcapasos)",
  "Cirugías recientes (menos de 6 meses)",
  "Tratamiento oncológico (quimioterapia o radioterapia)",
  "Trastornos hormonales o tiroideos",
  "Enfermedades autoinmunes (lupus, artritis reumatoide)",
  "Trastornos de cicatrización o queloides",
  "Embarazo o lactancia",
  "Uso de medicamentos anticoagulantes o corticoides",
  "Otra condición médica",
  "No tengo antecedentes médicos",
];

const ALERGIAS = [
  "Lidocaína o anestésicos locales",
  "Penicilina o antibióticos similares",
  "Latex (guantes médicos)",
  "Alcohol o antisépticos",
  "Ácido hialurónico o rellenos dérmicos",
  "Botox (toxina botulínica)",
  "Adhesivos médicos o esparadrapo",
  "Metales (níquel, titanio, etc.)",
  "Colorantes o pigmentos cosméticos",
  "Productos tópicos (cremas, perfumes, etc.)",
  "Otra alergia importante",
  "No tengo alergias",
];

const MEDICAMENTOS = [
  "Anticoagulantes (warfarina, aspirina, etc.)",
  "Antiinflamatorios (ibuprofeno, naproxeno, diclofenaco)",
  "Corticoides (prednisona, dexametasona)",
  "Antibióticos recientes (amoxicilina, azitromicina)",
  "Anticonceptivos orales o hormonales",
  "Antidepresivos o ansiolíticos (fluoxetina, sertralina, alprazolam)",
  "Antihipertensivos (enalapril, losartán, amlodipino)",
  "Hipoglucemiantes (metformina, insulina)",
  "Tratamientos dermatológicos (isotretinoína, tretinoína)",
  "Suplementos o vitaminas (omega 3, colágeno, ginkgo, biotina)",
  "Analgésicos de uso frecuente (paracetamol, tramadol)",
  "Antihistamínicos (loratadina, cetirizina)",
  "Otro medicamento",
  "No tomo ninguno",
];

const toOptions = (arr: string[]): MedicalOption[] =>
  arr.map((a) => ({ value: a, label: a }));

// helper para calcular edad
const calcularEdad = (date: Date): number => {
  const hoy = new Date();
  let edad = hoy.getFullYear() - date.getFullYear();
  const mes = hoy.getMonth() - date.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < date.getDate())) {
    edad--;
  }
  return edad;
};

export default function Step2DatosMedicos({
  formData,
  setFormData,
  prevStep,
  nextStep,
  setErr,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [fechaError, setFechaError] = useState<string | null>(null);

  const antecedentsOptions = toOptions(ANTECEDENTES);
  const alergiasOptions = toOptions(ALERGIAS);
  const medicamentosOptions = toOptions(MEDICAMENTOS);

  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 16,
    today.getMonth(),
    today.getDate()
  );
  const minDate = new Date(
    today.getFullYear() - 80,
    today.getMonth(),
    today.getDate()
  );

  // Si el usuario marca "No tengo..." o "No tomo...", limpiamos las demás selecciones
  const normalizeSelection = (
    sel: MultiValue<MedicalOption>
  ): MedicalOption[] => {
    const values = sel.map((s) => s.value);
    const hasNoOption = values.some(
      (v) => v.includes("No tengo") || v.includes("No tomo")
    );

    if (hasNoOption) {
      const firstNo = values.find((v) => v.includes("No")) ?? "No tengo";
      return [{ value: firstNo, label: firstNo }];
    }

    return sel as MedicalOption[];
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    const edadCalculada = calcularEdad(date);

    if (edadCalculada < 16) {
      setFechaError("Debes tener al menos 16 años.");
      setFormData((prev) => ({
        ...prev,
        fechaNacimiento: null,
        edad: "",
      }));
    } else if (edadCalculada > 80) {
      setFechaError("La edad máxima permitida es 80 años.");
      setFormData((prev) => ({
        ...prev,
        fechaNacimiento: null,
        edad: "",
      }));
    } else {
      setFechaError(null);
      setFormData((prev) => ({
        ...prev,
        fechaNacimiento: date,
        edad: String(edadCalculada),
      }));
    }
  };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!formData.fechaNacimiento) e.fechaNacimiento = "Selecciona tu fecha";
    if (!formData.sexo) e.sexo = "Selecciona tu sexo";
    if (!formData.genero) e.genero = "Selecciona tu género";
    if (!formData.antecedentes?.length)
      e.antecedentes = "Campo obligatorio";
    if (!formData.alergias?.length) e.alergias = "Campo obligatorio";
    if (!formData.medicamentos?.length)
      e.medicamentos = "Campo obligatorio";
    return e;
  }, [formData]);

  const valid = Object.keys(errors).length === 0 && !fechaError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (valid) {
      setErr(null);
      nextStep();
    } else {
      setErr("Completa todos los campos requeridos correctamente.");
    }
  };

  // Estilos tipados para react-select
  const selectStyles: StylesConfig<MedicalOption, boolean> = {
    control: (provided) => ({
      ...provided,
      background: PALETTE.surface,
      borderColor: PALETTE.border,
      boxShadow: "none",
      minHeight: "44px",
      borderRadius: 12,
      color: PALETTE.text,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: PALETTE.text,
    }),
    input: (provided) => ({
      ...provided,
      color: PALETTE.text,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: PALETTE.text,
      opacity: 0.6,
    }),
    option: (provided, state) => ({
      ...provided,
      color: PALETTE.text,
      backgroundColor: state.isSelected
        ? "#e6d3c2"
        : state.isFocused
        ? "#f5ebe3"
        : "white",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    multiValue: (provided) => ({
      ...provided,
      background: "#E9DED2",
      borderRadius: 999,
      padding: "4px 8px",
      color: PALETTE.text,
    }),
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ overflow: "visible", color: PALETTE.text }}
    >
      {/* Fecha de nacimiento */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Fecha de nacimiento
        </label>
        <DatePicker
          selected={formData.fechaNacimiento}
          onChange={(date) => handleDateChange(date as Date | null)}
          maxDate={maxDate}
          minDate={minDate}
          placeholderText="Selecciona tu fecha"
          className={`form-control rounded-3 shadow-sm ${
            touched && (errors.fechaNacimiento || fechaError)
              ? "is-invalid"
              : ""
          }`}
          dateFormat="dd/MM/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          popperPlacement="bottom-start"
          calendarClassName="custom-calendar"
        />
        {(touched && errors.fechaNacimiento) || fechaError ? (
          <div className="invalid-feedback d-block">
            {errors.fechaNacimiento || fechaError}
          </div>
        ) : null}
      </div>

      {/* Sexo */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Sexo biológico
        </label>
        <select
          className={`form-select rounded-3 shadow-sm ${
            touched && errors.sexo ? "is-invalid" : ""
          }`}
          value={formData.sexo || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sexo: e.target.value }))
          }
          style={{
            borderColor: PALETTE.border,
            backgroundColor: PALETTE.surface,
            color: PALETTE.text,
          }}
        >
          <option value="">Selecciona</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Intersex">Intersex</option>
          <option value="Prefiero no decirlo">Prefiero no decirlo</option>
        </select>
        {touched && errors.sexo && (
          <div className="invalid-feedback d-block">{errors.sexo}</div>
        )}
      </div>

      {/* Género / identidad */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Género / identidad
        </label>
        <Select<MedicalOption, false>
          options={[
            { value: "Heterosexual", label: "Heterosexual" },
            { value: "Homosexual", label: "Homosexual" },
            { value: "Bisexual", label: "Bisexual" },
            { value: "Pansexual", label: "Pansexual" },
            { value: "Asexual", label: "Asexual" },
            { value: "Otro", label: "Otro / Prefiero no decirlo" },
          ]}
          placeholder="Selecciona o escribe tu género..."
          value={
            formData.genero
              ? { value: formData.genero, label: formData.genero }
              : null
          }
          onChange={(opt) =>
            setFormData((prev) => ({
              ...prev,
              genero: opt ? opt.value : "",
            }))
          }
          styles={selectStyles}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
        />
      </div>

      {/* Antecedentes */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Antecedentes médicos relevantes
        </label>
        <Select<MedicalOption, true>
          isMulti
          options={antecedentsOptions}
          value={formData.antecedentes.map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              antecedentes: normalizeSelection(v).map((x) => x.value),
            }))
          }
          styles={selectStyles}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          placeholder="Selecciona antecedentes..."
        />

        {formData.antecedentes.length > 0 &&
          !formData.antecedentes.some((a) => a.includes("No tengo")) && (
            <textarea
              className="form-control mt-2 rounded-3 shadow-sm"
              placeholder="Explica tu antecedente médico (Opcional)"
              value={formData.antecedentesDescripcion || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  antecedentesDescripcion: e.target.value,
                }))
              }
              style={{
                borderColor: PALETTE.border,
                backgroundColor: PALETTE.surface,
                color: PALETTE.text,
                minHeight: "90px",
              }}
            />
          )}
      </div>

      {/* Alergias */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Alergias
        </label>
        <Select<MedicalOption, true>
          isMulti
          options={alergiasOptions}
          value={formData.alergias.map((v) => ({ value: v, label: v }))}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              alergias: normalizeSelection(v).map((x) => x.value),
            }))
          }
          styles={selectStyles}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          placeholder="Selecciona alergias..."
        />

        {formData.alergias.length > 0 &&
          !formData.alergias.some((a) => a.includes("No tengo")) && (
            <textarea
              className="form-control mt-2 rounded-3 shadow-sm"
              placeholder="Explica tu alergia (Opcional)"
              value={formData.alergiasDescripcion || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  alergiasDescripcion: e.target.value,
                }))
              }
              style={{
                borderColor: PALETTE.border,
                backgroundColor: PALETTE.surface,
                color: PALETTE.text,
                minHeight: "90px",
              }}
            />
          )}
      </div>

      {/* Medicamentos */}
      <div className="mb-3 text-start">
        <label
          className="form-label fw-semibold"
          style={{ color: PALETTE.text }}
        >
          Medicamentos actuales
        </label>
        <Select<MedicalOption, true>
          isMulti
          options={medicamentosOptions}
          value={formData.medicamentos.map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(v) =>
            setFormData((prev) => ({
              ...prev,
              medicamentos: normalizeSelection(v).map((x) => x.value),
            }))
          }
          styles={selectStyles}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          placeholder="Selecciona medicamentos..."
        />

        {formData.medicamentos.length > 0 &&
          !formData.medicamentos.some((a) => a.includes("No tomo")) && (
            <textarea
              className="form-control mt-2 rounded-3 shadow-sm"
              placeholder="Explica tu medicamento actual (Opcional)"
              value={formData.medicamentosDescripcion || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  medicamentosDescripcion: e.target.value,
                }))
              }
              style={{
                borderColor: PALETTE.border,
                backgroundColor: PALETTE.surface,
                color: PALETTE.text,
                minHeight: "90px",
              }}
            />
          )}
      </div>

      {/* Botones */}
      <div className="d-grid gap-2 mt-4">
        <button
          type="submit"
          disabled={!valid}
          className="btn fw-semibold py-2"
          style={{
            backgroundColor: valid ? PALETTE.main : "#c9b7a8",
            border: "none",
            color: "white",
            borderRadius: "50px",
            cursor: valid ? "pointer" : "not-allowed",
            opacity: valid ? 1 : 0.7,
          }}
        >
          Continuar
        </button>
        <button
          type="button"
          className="btn fw-semibold py-2"
          style={{
            backgroundColor: "#D6C1B1",
            border: "none",
            color: PALETTE.text,
            borderRadius: "50px",
          }}
          onClick={prevStep}
        >
          Volver
        </button>
      </div>
    </form>
  );
}
