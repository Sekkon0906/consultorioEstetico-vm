"use client";

import React, { useState } from "react";
//  Tipo de dominio
import type { Testimonio } from "../../types/domain";
//  Servicios que hablan con el backend
import {
  createTestimonioApi,
  updateTestimonioApi,
} from "../../services/testimoniosApi";

interface Props {
  testimonio?: Testimonio;
  onGuardar?: () => void;
}

export default function TestimoniosForm({ testimonio, onGuardar }: Props) {
  const [nombre, setNombre] = useState<string>(testimonio?.nombre ?? "");
  const [texto, setTexto] = useState<string>(testimonio?.texto ?? "");
  const [video, setVideo] = useState<string>(testimonio?.video ?? "");
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = async () => {
    if (!nombre.trim() || !texto.trim()) {
      alert("Por favor, completa el nombre y el texto del testimonio.");
      return;
    }

    // Payload común para crear / editar
    const payload: Omit<Testimonio, "id" | "creadoEn"> = {
      nombre,
      texto,
      video,
      thumb: testimonio?.thumb ?? "",
      activo: testimonio?.activo ?? true,
      destacado: testimonio?.destacado ?? false,
    };

    try {
      setSaving(true);

      if (testimonio) {
        //  Editar existente en la BD
        await updateTestimonioApi(testimonio.id, payload);
        alert("Testimonio actualizado correctamente ");
      } else {
        //  Crear nuevo en la BD
        await createTestimonioApi(payload);
        alert("Testimonio creado correctamente ");
      }

      // Limpiar formulario
      setNombre("");
      setTexto("");
      setVideo("");

      if (onGuardar) onGuardar();
    } catch (error) {
      console.error("Error guardando testimonio:", error);
      alert("Ocurrió un error al guardar el testimonio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[--surface] rounded-xl shadow-md border border-[--border]">
      <h2 className="text-lg font-semibold mb-4 text-[--main] text-center">
        {testimonio ? "Editar Testimonio" : "Crear Testimonio"}
      </h2>

      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        className="w-full mb-3 p-2 border rounded-md border-[--border] focus:outline-none focus:ring-2 focus:ring-[--main]"
      />

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Texto del testimonio"
        className="w-full mb-3 p-2 border rounded-md border-[--border] focus:outline-none focus:ring-2 focus:ring-[--main] min-h-[100px]"
      />

      <input
        type="text"
        value={video}
        onChange={(e) => setVideo(e.target.value)}
        placeholder="URL del video (opcional)"
        className="w-full mb-4 p-2 border rounded-md border-[--border] focus:outline-none focus:ring-2 focus:ring-[--main]"
      />

      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="w-full py-2 rounded-md bg-[--main] text-white font-semibold hover:bg-[--mainHover] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
