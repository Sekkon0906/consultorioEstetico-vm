// app/login/RecoverFom.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getUsers, updateUserData, type User } from "../utils/localDB";
import {
  getCurrentUser,
  setCurrentUser,
  type SessionUser,
} from "../utils/auth";
import { PALETTE } from "./palette2";

type RecoverUser = User | SessionUser | null;

export default function RecoverForm({
  setErr,
}: {
  setErr: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [recoverStep, setRecoverStep] = useState<"verify" | "reset">("verify");
  const [recoverUser, setRecoverUser] = useState<RecoverUser>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [touched, setTouched] = useState(false);
  const [verifyTouched, setVerifyTouched] = useState(false);

  // ========= VALIDACIONES =========
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (recoverStep === "verify") {
      if (!email.trim()) {
        e.email = "Ingresa tu correo electrónico";
      } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        e.email = "Correo no válido";
      }
    }

    if (recoverStep === "reset") {
      if (!password) e.password = "Ingresa una nueva contraseña";
      if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    }

    return e;
  }, [email, password, confirm, recoverStep]);

  const isValid = Object.keys(errors).length === 0;

  // ========= PASO 1: VERIFICAR CORREO =========
  const handleVerifyEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifyTouched(true);
    setErr(null);

    if (recoverStep !== "verify") return;

    if (errors.email) {
      setErr("Revisa el correo ingresado.");
      return;
    }

    const normalized = email.trim().toLowerCase();

    // 1) Intentar con usuarios de localDB
    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === normalized
    );

    if (!found) {
      setErr("No existe un usuario registrado con ese correo.");
      return;
    }

    // Guardamos usuario a recuperar (puede ser User o SessionUser)
    setRecoverUser(found);
    setRecoverStep("reset");

    // Si ya tienes sesión iniciada con backend, la sincronizamos:
    const current = getCurrentUser();
    if (current && current.email.toLowerCase() === normalized) {
      setRecoverUser(current);
    }
  };

  // ========= PASO 2: GUARDAR NUEVA CONTRASEÑA =========
  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    setErr(null);

    if (!isValid) {
      setErr("Revisa los campos marcados.");
      return;
    }

    if (!recoverUser) {
      setErr(
        "No se detectó un usuario válido para restablecer la contraseña."
      );
      return;
    }

    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === recoverUser.email.toLowerCase()
    );

    if (!found) {
      setErr("Usuario no encontrado.");
      return;
    }

    // Actualizar en la “DB” local
    updateUserData({ password }, found.email);
    const updatedUser: User = { ...found, password };
    setCurrentUser(updatedUser);

    // Mensaje de éxito y redirección
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      router.push("/login");
    }, 2000);
  };

  return (
    <div>
      {recoverStep === "verify" ? (
        <form onSubmit={handleVerifyEmail} noValidate>
          <p
            className="text-muted mb-3"
            style={{ color: PALETTE.muted, fontSize: "0.95rem" }}
          >
            Ingresa el correo asociado a tu cuenta para verificar tu identidad
            y poder restablecer tu contraseña.
          </p>

          <div className="mb-3 text-start">
            <label
              className="form-label fw-semibold"
              style={{ color: PALETTE.text }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              className={`form-control rounded-3 shadow-sm ${
                verifyTouched && errors.email ? "is-invalid" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              style={{
                borderColor: PALETTE.border,
                backgroundColor: PALETTE.surface,
              }}
            />
            {verifyTouched && errors.email && (
              <div className="invalid-feedback d-block">
                {errors.email}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 fw-semibold py-2 mb-3"
            style={{
              backgroundColor: PALETTE.main,
              border: "none",
              color: "white",
              borderRadius: "50px",
            }}
          >
            Verificar correo
          </button>

          <div className="mt-3 text-center">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill"
              onClick={() => router.push("/login")}
              style={{
                color: PALETTE.text,
                borderColor: PALETTE.border,
              }}
            >
              Volver al inicio
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} noValidate>
          <div className="mb-3 text-start">
            <label
              className="form-label fw-semibold"
              style={{ color: PALETTE.text }}
            >
              Nueva contraseña
            </label>
            <div className="input-group">
              <input
                type={showNew ? "text" : "password"}
                className={`form-control rounded-start-3 shadow-sm ${
                  touched && errors.password ? "is-invalid" : ""
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                style={{
                  borderColor: PALETTE.border,
                  backgroundColor: PALETTE.surface,
                }}
              />
              <button
                type="button"
                className="btn btn-light rounded-end-3 border"
                onClick={() => setShowNew((s) => !s)}
                style={{
                  borderColor: PALETTE.border,
                  backgroundColor: "#F8F5F0",
                  color: PALETTE.text,
                }}
              >
                <i
                  className={`fas ${showNew ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
            {touched && errors.password && (
              <div className="invalid-feedback d-block">
                {errors.password}
              </div>
            )}
          </div>

          <div className="mb-4 text-start">
            <label
              className="form-label fw-semibold"
              style={{ color: PALETTE.text }}
            >
              Confirmar contraseña
            </label>
            <div className="input-group">
              <input
                type={showConfirm ? "text" : "password"}
                className={`form-control rounded-start-3 shadow-sm ${
                  touched && errors.confirm ? "is-invalid" : ""
                }`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar contraseña"
                style={{
                  borderColor: PALETTE.border,
                  backgroundColor: PALETTE.surface,
                }}
              />
              <button
                type="button"
                className="btn btn-light rounded-end-3 border"
                onClick={() => setShowConfirm((s) => !s)}
                style={{
                  borderColor: PALETTE.border,
                  backgroundColor: "#F8F5F0",
                  color: PALETTE.text,
                }}
              >
                <i
                  className={`fas ${
                    showConfirm ? "fa-eye-slash" : "fa-eye"
                  }`}
                ></i>
              </button>
            </div>
            {touched && errors.confirm && (
              <div className="invalid-feedback d-block">
                {errors.confirm}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 fw-semibold py-2"
            style={{
              backgroundColor: PALETTE.main,
              border: "none",
              color: "white",
              borderRadius: "50px",
            }}
          >
            Guardar nueva contraseña
          </button>

          {successMsg && (
            <div
              className="mt-3 alert alert-success text-center"
              style={{
                backgroundColor: "#EAF9EA",
                color: "#2F6E2F",
                border: "1px solid #BCE2B8",
              }}
            >
              Contraseña actualizada correctamente
            </div>
          )}
        </form>
      )}
    </div>
  );
}
