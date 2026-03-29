"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { syncUserWithSupabase, getCurrentUser } from "@/lib/api";

export interface AppUser {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: "usuario" | "admin" | "developer" | "ayudante";
  photo?: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  session: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function syncUser(authUser: User | null): Promise<AppUser | null> {
    if (!authUser) return null;
    try {
      const result = await syncUserWithSupabase();
      if (!result.ok || !result.user) return null;

      const appUser = result.user as unknown as AppUser;

      // Si no tiene foto en la BD, usar la de Supabase Auth (Google avatar)
      if (!appUser.photo && authUser.user_metadata?.avatar_url) {
        appUser.photo = authUser.user_metadata.avatar_url as string;
      }

      return appUser;
    } catch (err) {
      console.error("Error sincronizando usuario:", err);
      return null;
    }
  }

  async function refreshUser() {
    try {
      const result = await getCurrentUser();
      if (result.ok && result.user) {
        const appUser = result.user as unknown as AppUser;
        // Fallback a avatar de Supabase Auth
        if (!appUser.photo && supabaseUser?.user_metadata?.avatar_url) {
          appUser.photo = supabaseUser.user_metadata.avatar_url as string;
        }
        setUser(appUser);
      }
    } catch (err) {
      console.error("Error recargando usuario:", err);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        const appUser = await syncUser(session.user);
        setUser(appUser);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        const appUser = await syncUser(session.user);
        setUser(appUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, supabaseUser, session, loading, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}