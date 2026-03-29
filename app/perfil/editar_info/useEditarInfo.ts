"use client";

import { useEffect, useState } from "react";
import { MultiValue } from "react-select";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser, updateCurrentUser } from "@/lib/api";

export function useEditarInfo() {
  const { user, refreshUser } = useAuth();

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Campos del formulario
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [edad, setEdad] = useState<number>(0);
  const [genero, setGenero] = useState<"Masculino" | "Femenino" | "Otro">("Otro");
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const [antecedentes, setAntecedentes] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [alergias, setAlergias] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [medicamentos, setMedicamentos] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [antecedentesDescripcion, setAntecedentesDescripcion] = useState("");
  const [alergiasDescripcion, setAlergiasDescripcion] = useState("");
  const [medicamentosDescripcion, setMedicamentosDescripcion] = useState("");

  /*  Cargar datos desde el backend  */
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCurrentUser();
        if (!data.ok || !data.user) return;
        const u = data.user as Record<string, any>;

        setNombres(u.nombres || "");
        setApellidos(u.apellidos || "");
        setTelefono(u.telefono || "");
        setEdad(u.edad || 0);
        setGenero(u.genero || "Otro");
        setPhoto(u.photo || undefined);

        const toMulti = (s: string) =>
          !s
            ? []
            : s === "No tengo"
            ? [{ value: "No tengo", label: "No tengo" }]
            : s.split(",").map((p) => ({ value: p.trim(), label: p.trim() }));

        setAntecedentes(toMulti(u.antecedentes || ""));
        setAlergias(toMulti(u.alergias || ""));
        setMedicamentos(toMulti(u.medicamentos || ""));
        setAntecedentesDescripcion(u.antecedentesDescripcion || "");
        setAlergiasDescripcion(u.alergiasDescripcion || "");
        setMedicamentosDescripcion(u.medicamentosDescripcion || "");
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    }

    if (user) loadProfile();
  }, [user]);

  /*  Guardar datos personales  */
  async function handleSavePersonal() {
    setSaving(true);
    setMessage("");
    try {
      await updateCurrentUser({ nombres, apellidos, telefono, edad, genero, photo });
      await refreshUser();
      setMessage(" Datos personales actualizados.");
    } catch (err: any) {
      setMessage(" " + (err.message || "Error al guardar."));
    } finally {
      setSaving(false);
    }
  }

  /*  Guardar datos médicos  */
  async function handleSaveMedical() {
    setSaving(true);
    setMessage("");
    try {
      await updateCurrentUser({
        antecedentes: antecedentes.map((a) => a.value).join(", "),
        antecedentesDescripcion,
        alergias: alergias.map((a) => a.value).join(", "),
        alergiasDescripcion,
        medicamentos: medicamentos.map((a) => a.value).join(", "),
        medicamentosDescripcion,
      });
      await refreshUser();
      setMessage(" Información médica actualizada.");
    } catch (err: any) {
      setMessage(" " + (err.message || "Error al guardar."));
    } finally {
      setSaving(false);
    }
  }

  return {
    user,
    saving,
    message,
    setMessage,
    nombres, setNombres,
    apellidos, setApellidos,
    telefono, setTelefono,
    edad, setEdad,
    genero, setGenero,
    photo, setPhoto,
    antecedentes, setAntecedentes,
    alergias, setAlergias,
    medicamentos, setMedicamentos,
    antecedentesDescripcion, setAntecedentesDescripcion,
    alergiasDescripcion, setAlergiasDescripcion,
    medicamentosDescripcion, setMedicamentosDescripcion,
    handleSavePersonal,
    handleSaveMedical,
    canEdit: true,
    daysRemaining: 0,
  };
}