"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PALETTE } from "./palette";
import { registrar } from "@/lib/sesion";

interface Props {
  formData: any;
}

export default function Step3Exito({ formData }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const listar = (xs: any[]) =>
      Array.isArray(xs) ? xs.map((a: any) => a.value).join(", ") : "";

    async function crearCuenta() {
      try {
        // Crea la cuenta y guarda la ficha médica en la misma operación. No
        // inicia sesión: primero hay que confirmar el correo.
        await registrar({
          email: formData.email.trim(),
          password: formData.password,
          nombres: formData.nombres?.trim() || "",
          apellidos: formData.apellidos?.trim() || "",
          telefono: formData.telefono?.trim() || "",
          edad: Number(formData.edad) || undefined,
          genero: formData.genero || "Otro",
          antecedentes: listar(formData.antecedentes),
          antecedentesDescripcion: formData.antecedentesDescripcion || "",
          alergias: listar(formData.alergias),
          alergiasDescripcion: formData.alergiasDescripcion || "",
          medicamentos: listar(formData.medicamentos),
          medicamentosDescripcion: formData.medicamentosDescripcion || "",
        });

        setStatus("ok");
      } catch (err: any) {
        console.error("Error creando cuenta:", err);
        setErrorMsg(err.message || "Error desconocido al crear la cuenta.");
        setStatus("error");
      }
    }

    crearCuenta();
  }, []); // Solo al montar

  if (status === "loading") {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: PALETTE.main }} role="status" />
        <p className="mt-3" style={{ color: PALETTE.muted }}>
          Creando tu cuenta…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-5">
        <p style={{ color: "var(--danger)" }}>
           {errorMsg || "No se pudo crear la cuenta. Intenta de nuevo."}
        </p>
        <button
          onClick={() => router.push("/register")}
          className="btn mt-3"
          style={{ backgroundColor: PALETTE.main, color: "#fff", borderRadius: "50px" }}
        >
          Volver al registro
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div
        className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-4"
        style={{ width: 100, height: 100, backgroundColor: "#E1D4C6", color: PALETTE.text }}
      >
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke={PALETTE.main}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />
        </svg>
      </div>

      <h2
        className="fw-bold mb-2"
        style={{ color: PALETTE.text, fontFamily: "'Playfair Display', serif" }}
      >
        Cuenta creada con éxito
      </h2>

      <p style={{ color: PALETTE.muted, maxWidth: 400, margin: "0 auto" }}>
        Revisa tu correo para confirmar tu cuenta (si recibiste un email).
        Luego podrás iniciar sesión para agendar tus citas.
      </p>

      <div className="mt-4">
        <button
          onClick={() => router.push("/login")}
          className="btn w-100 fw-semibold py-2"
          style={{ backgroundColor: PALETTE.main, border: "none", color: "white", borderRadius: "50px" }}
        >
          Ir al inicio de sesión
        </button>
      </div>
    </motion.div>
  );
}