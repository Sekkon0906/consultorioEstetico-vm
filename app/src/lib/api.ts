import { supabase } from "./supabaseClient";

const ADMIN_EMAILS = ["medinapipe123@gmail.com", "admin@clinicavm.com"];

// ============================================================
// AUTH helpers
// ============================================================

export async function syncUserWithSupabase(): Promise<{
  ok: boolean;
  user: Record<string, unknown> | null;
}> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return { ok: false, user: null };

    const email = authUser.email ?? "";
    const fullName =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name as string) ||
      "";
    const photoURL = (authUser.user_metadata?.avatar_url as string) || null;
    const [nombres, ...rest] = fullName.trim().split(" ");
    const apellidos = rest.join(" ");
    const rol = ADMIN_EMAILS.includes(email) ? "admin" : "usuario";

    // Buscar usuario existente
    const { data: existing, error: selErr } = await supabase
      .from("usuarios")
      .select("id, nombres, apellidos, rol, photo, telefono")
      .eq("id", authUser.id)
      .single();

    if (existing && !selErr) {
      return { ok: true, user: { ...existing, email } };
    }

    // Crear usuario nuevo
    const { data: created, error: insErr } = await supabase
      .from("usuarios")
      .upsert(
        {
          id: authUser.id,
          nombres: nombres || "Paciente",
          apellidos: apellidos || "",
          rol,
          photo: photoURL,
        },
        { onConflict: "id" }
      )
      .select("id, nombres, apellidos, rol, photo, telefono")
      .single();

    if (insErr) {
      console.error("Error creando usuario:", insErr.message);
      return { ok: false, user: null };
    }

    return { ok: true, user: { ...created, email } };
  } catch (err) {
    console.error("Error en syncUserWithSupabase:", err);
    return { ok: false, user: null };
  }
}

export async function getCurrentUser(): Promise<{
  ok: boolean;
  user: Record<string, unknown> | null;
}> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return { ok: false, user: null };

    const { data, error } = await supabase
      .from("usuarios")
      .select(
        "id, nombres, apellidos, rol, photo, telefono, edad, genero, antecedentes, antecedentes_descripcion, alergias, alergias_descripcion, medicamentos, medicamentos_descripcion, creado_en"
      )
      .eq("id", authUser.id)
      .single();

    if (error || !data) return { ok: false, user: null };

    return {
      ok: true,
      user: {
        ...data,
        email: authUser.email,
        antecedentesDescripcion: data.antecedentes_descripcion,
        alergiasDescripcion: data.alergias_descripcion,
        medicamentosDescripcion: data.medicamentos_descripcion,
        creadoEn: data.creado_en,
      },
    };
  } catch (err) {
    console.error("Error en getCurrentUser:", err);
    return { ok: false, user: null };
  }
}

export async function updateCurrentUser(
  updates: Record<string, unknown>
): Promise<{ ok: boolean; user: Record<string, unknown> | null }> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return { ok: false, user: null };

    const campoMap: Record<string, string> = {
      nombres: "nombres",
      apellidos: "apellidos",
      telefono: "telefono",
      edad: "edad",
      genero: "genero",
      photo: "photo",
      antecedentes: "antecedentes",
      antecedentesDescripcion: "antecedentes_descripcion",
      alergias: "alergias",
      alergiasDescripcion: "alergias_descripcion",
      medicamentos: "medicamentos",
      medicamentosDescripcion: "medicamentos_descripcion",
    };

    const dbUpdates: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    };
    for (const [key, col] of Object.entries(campoMap)) {
      if (updates[key] !== undefined) {
        dbUpdates[col] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update(dbUpdates)
      .eq("id", authUser.id)
      .select(
        "id, nombres, apellidos, rol, photo, telefono, edad, genero, antecedentes, antecedentes_descripcion, alergias, alergias_descripcion, medicamentos, medicamentos_descripcion, creado_en"
      )
      .single();

    if (error || !data) return { ok: false, user: null };

    return {
      ok: true,
      user: {
        ...data,
        email: authUser.email,
        antecedentesDescripcion: data.antecedentes_descripcion,
        alergiasDescripcion: data.alergias_descripcion,
        medicamentosDescripcion: data.medicamentos_descripcion,
        creadoEn: data.creado_en,
      },
    };
  } catch (err) {
    console.error("Error en updateCurrentUser:", err);
    return { ok: false, user: null };
  }
}

// ============================================================
// LEGACY api object - NO USAR para nuevas funcionalidades
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};