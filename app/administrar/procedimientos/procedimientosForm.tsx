"use client";

import React, { useState } from "react";
//  Tipos de dominio (ya no usamos localDB)
import type { Procedimiento, CategoriaProcedimiento } from "../../types/domain";
//  Servicios que hablan con el backend
import {
  createProcedimientoApi,
  updateProcedimientoApi,
} from "../../services/procedimientosApi";

interface Props {
  procedimiento?: Procedimiento;
  onGuardar?: () => void;
}

export default function ProcedimientosForm({ procedimiento, onGuardar }: Props) {
  const [nombre, setNombre] = useState(procedimiento?.nombre || "");
  const [desc, setDesc] = useState(procedimiento?.desc || "");
  const [descCompleta, setDescCompleta] = useState(procedimiento?.descCompleta || "");
  const [precio, setPrecio] = useState(
    procedimiento?.precio != null ? procedimiento.precio.toString() : ""
  );
  const [categoria, setCategoria] = useState<CategoriaProcedimiento>(
    procedimiento?.categoria || "Facial"
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) return alert("El nombre del procedimiento es obligatorio");

    const precioString = precio.trim(); //  SIEMPRE STRING

const payload = {
  nombre,
  desc,
  descCompleta,
  precio: precioString,
  imagen: procedimiento?.imagen || "",
  categoria,
  duracionMin: procedimiento?.duracionMin ?? null,
  destacado: procedimiento?.destacado ?? false,
};


    try {
      setSaving(true);

      if (procedimiento) {
        //  Editar en BD real
        await updateProcedimientoApi(procedimiento.id, payload);
        alert("Procedimiento actualizado correctamente ");
      } else {
        //  Crear en BD real
        await createProcedimientoApi(payload);
        alert("Procedimiento creado correctamente ");
      }

      if (onGuardar) onGuardar();

      // limpiar formulario
      setNombre("");
      setDesc("");
      setPrecio("");
      setCategoria("Facial");
    } catch (err) {
      console.error("Error guardando procedimiento:", err);
      alert("Ocurrió un error al guardar el procedimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[--surface] rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-[--main]">
        {procedimiento ? "Editar Procedimiento" : "Crear Procedimiento"}
      </h2>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Nombre del procedimiento"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[--main]"
        />

        <textarea
          placeholder="Descripcion breve (se muestra en la lista)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[--main]"
          rows={2}
        />

        <textarea
          placeholder="Descripcion completa (se muestra al ver detalle del procedimiento)"
          value={descCompleta}
          onChange={(e) => setDescCompleta(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[--main]"
          rows={5}
        />

        <input
          type="number"
          placeholder="Precio (ej: 150000)"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[--main]"
        />

        <select
          value={categoria}
          onChange={(e) =>
            setCategoria(e.target.value as CategoriaProcedimiento)
          }
          className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[--main]"
        >
          <option value="Facial">Facial</option>
          <option value="Corporal">Corporal</option>
          <option value="Capilar">Capilar</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 bg-[--main] hover:bg-[--mainHover] text-white font-medium py-2 px-4 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}