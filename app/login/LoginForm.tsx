"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { PALETTE } from "./palette2";

interface Props {
  setErr: (msg: string | null) => void;
}

export default function LoginForm({ setErr }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Correo no válido";
    if (!password) e.password = "Ingresa tu contraseña";
    return e;
  }, [email, password]);

  const isValid = Object.keys(errors).length === 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) { setErr("Revisa los campos marcados."); return; }
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : error.message);
      return;
    }
    router.push("/");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr("Error al autenticar con Google: " + error.message);
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="mb-3 text-start">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Correo electrónico
        </label>
        <input
          type="email"
          className={`form-control rounded-3 shadow-sm ${touched && errors.email ? "is-invalid" : ""}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@dominio.com"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.surface }}
        />
        {touched && errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      <div className="mb-3 text-start">
        <label className="form-label fw-semibold" style={{ color: PALETTE.text }}>
          Contraseña
        </label>
        <div className="input-group">
          <input
            type={show ? "text" : "password"}
            className={`form-control rounded-start-3 shadow-sm ${touched && errors.password ? "is-invalid" : ""}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.surface }}
          />
          <button
            className="btn btn-light rounded-end-3 border"
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{ borderColor: PALETTE.border, backgroundColor: "#F8F5F0", color: PALETTE.text }}
          >
            <i className={`fas ${show ? "fa-eye-slash" : "fa-eye"}`}></i>
          </button>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        className="btn w-100 fw-semibold py-2 mb-3"
        style={{ backgroundColor: PALETTE.main, border: "none", color: "white", borderRadius: "50px" }}
        whileHover={{ scale: loading ? 1 : 1.03, y: loading ? 0 : -2 }}
        whileTap={{ scale: 0.97 }}
      >
        {loading ? "Entrando…" : "Entrar"}
      </motion.button>

      <div className="mt-3 d-flex flex-column align-items-center gap-2">
        <p style={{ color: PALETTE.text, fontSize: "0.9rem" }}>O entra con:</p>
        <motion.button
          type="button"
          onClick={handleGoogle}
          className="btn w-100 fw-semibold py-2"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #dadce0",
            borderRadius: "50px",
            color: "#3c4043",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* SVG inline — sin dependencia de Firebase CDN */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </motion.button>
      </div>

      <div className="mt-4 d-flex justify-content-between">
        <motion.button
          type="button"
          onClick={() => router.push("/recuperar")}
          className="btn btn-link text-decoration-none fw-semibold p-0"
          style={{ color: PALETTE.main }}
          whileHover={{ scale: 1.08 }}
        >
          Olvidé mi contraseña
        </motion.button>
        <motion.button
          type="button"
          onClick={() => router.push("/register")}
          className="btn btn-link text-decoration-none fw-semibold p-0"
          style={{ color: PALETTE.main }}
          whileHover={{ scale: 1.08 }}
        >
          Crear cuenta
        </motion.button>
      </div>
    </motion.form>
  );
}