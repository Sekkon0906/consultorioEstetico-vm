"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getCurrentUser } from "@/lib/api";
import { cerrarSesion, recogerTokenDeUrl } from "@/lib/sesion";

export interface AppUser {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: "usuario" | "admin";
  photo?: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Pregunta a la API por el perfil en sesión. `getCurrentUser` adjunta el
  // token (y lo renueva con la cookie de refresh si hace falta), así que esto
  // funciona igual en el primer render que tras iniciar sesión.
  const cargar = useCallback(async () => {
    const r = await getCurrentUser();
    setUser(r.ok && r.user ? (r.user as unknown as AppUser) : null);
  }, []);

  const refreshUser = useCallback(async () => {
    await cargar();
  }, [cargar]);

  const logout = useCallback(async () => {
    await cerrarSesion();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      // Al volver de Google, el access token llega en el fragmento de la URL
      // (#access_token=…). Se recoge antes de pedir el perfil.
      recogerTokenDeUrl();
      await cargar();
      if (!cancelado) setLoading(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [cargar]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
