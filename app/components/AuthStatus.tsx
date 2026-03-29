"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCurrentUser, clearCurrentUser, type SessionUser } from "../utils/auth";
import { FaUserCircle } from "react-icons/fa";
import type { User } from "../utils/localDB";

type AuthUser = User | SessionUser | null; //  acepta ambos tipos

export default function AuthStatus() {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    // Cargar usuario inicial
    setUser(getCurrentUser());

    // Actualizar en tiempo real si cambia el almacenamiento
    const updateUser = () => setUser(getCurrentUser());
    window.addEventListener("storage", updateUser);
    window.addEventListener("authChange", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("authChange", updateUser);
    };
  }, []);

  // Si no hay sesión → mostrar botón de login
  if (!user) {
    return (
      <Link
        href="/login"
        className="btn btn-light fw-semibold shadow-sm"
        style={{
          color: "#B08968",
          border: "1px solid #B08968",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#B08968";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
          e.currentTarget.style.color = "#B08968";
        }}
      >
        <i className="fas fa-sign-in-alt me-2"></i>Iniciar sesión
      </Link>
    );
  }

  // Si hay sesión → mostrar avatar o ícono
  return (
    <div className="d-flex align-items-center">
      {user.photo ? (
        <Image
          src={user.photo}
          alt="Foto de perfil"
          width={36}
          height={36}
          style={{
            borderRadius: "50%",
            border: "2px solid #B08968",
            objectFit: "cover",
          }}
        />
      ) : (
        <FaUserCircle size={32} color="#B08968" />
      )}
    </div>
  );
}
