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
import { cerrarSesion, recogerTokenDeUrl, obtenerToken, usuarioEnMemoria } from "@/lib/sesion";

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

  /**
   * Resuelve quién está en sesión.
   *
   * Antes esto eran DOS viajes de red en serie en cada carga de página:
   * primero `POST /auth2/refresh` —el access token vive solo en memoria, así
   * que al recargar hay que pedir uno nuevo con la cookie— y después
   * `GET /usuarios/me` para saber el perfil. Hasta que terminaban los dos, el
   * navbar no sabía si mostrar "Iniciar sesión" o el avatar, y esa espera es
   * la que se notaba: la página ya estaba pintada y la barra seguía dudando.
   *
   * El segundo viaje sobraba. `/auth2/refresh` YA devuelve el usuario
   * completo, con el rol resuelto contra `admin_users`, y `sesion.ts` ya lo
   * guardaba en memoria — solo que nadie lo leía. Ahora se usa ese, y
   * `/usuarios/me` queda como respaldo para el caso en que no venga.
   */
  const cargar = useCallback(async () => {
    // Dispara el refresh si hace falta y espera solo a ese.
    const token = await obtenerToken();

    // Sin token no hay sesión: no tiene sentido preguntar por el perfil.
    // Este es el caso de CUALQUIER visitante que no ha entrado nunca, o sea
    // la mayoría, y antes gastaba un segundo viaje de red para que la API
    // respondiera 401. Cortarlo aquí es lo que hace que la barra decida
    // enseguida en la página pública.
    if (!token) {
      setUser(null);
      return;
    }

    // El refresh ya trajo el usuario completo, con el rol resuelto contra
    // `admin_users`. `/usuarios/me` queda solo de respaldo.
    const enMemoria = usuarioEnMemoria();
    if (enMemoria) {
      setUser(enMemoria as unknown as AppUser);
      return;
    }
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
