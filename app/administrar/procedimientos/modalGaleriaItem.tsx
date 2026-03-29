"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
//  Ahora usamos el tipo de dominio
import type { MediaItem } from "../../types/domain";

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
  modo?: "ver" | "crear";
  item?: MediaItem;
}

export default function ModalGaleriaItem({
  show,
  onClose,
  onSave,
  item,
  modo = "crear",
}: Props) {
  const [tipo, setTipo] = useState<"imagen" | "video">(item?.tipo || "imagen");
  const [titulo, setTitulo] = useState(item?.titulo || "");
  const [descripcion, setDescripcion] = useState(item?.descripcion || "");
  const [url, setUrl] = useState(item?.url || "");
  const [preview, setPreview] = useState(item?.url || "");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUrl(e.target?.result as string);
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = () => {
    if (!titulo.trim()) return alert("Debe ingresar un título.");
    if (tipo === "imagen" && !url)
      return alert("Debe subir una imagen o URL válida.");

    const nuevo: MediaItem = {
      id: crypto.randomUUID(),
      tipo,
      titulo,
      descripcion,
      url,
    };
    onSave(nuevo);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[#FBF7F2] rounded-lg shadow-xl p-6 w-[95%] max-w-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h3 className="text-lg font-semibold text-[#6E4F37] mb-4">
            {modo === "crear" ? "Añadir elemento a galería" : "Ver elemento"}
          </h3>

          <div className="flex flex-col gap-3">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "imagen" | "video")}
              className="border border-[#E5D8C8] rounded p-2"
            >
              <option value="imagen">Imagen</option>
              <option value="video">Video</option>
            </select>

            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del medio"
              className="border border-[#E5D8C8] rounded p-2"
            />

            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve"
              className="border border-[#E5D8C8] rounded p-2"
            />

            {tipo === "imagen" ? (
              <div
                className="border-2 border-dashed border-[#C7A27A] rounded p-4 text-center cursor-pointer"
                onClick={() =>
                  document.getElementById("uploadImageFile")?.click()
                }
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="mx-auto rounded w-40 h-40 object-cover"
                  />
                ) : (
                  <p className="text-[#6E4F37] opacity-70">
                    Presiona para subir una imagen
                  </p>
                )}
                <input
                  id="uploadImageFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleFile(e.target.files[0])
                  }
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Pega URL de video (YouTube o embebido)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border border-[#E5D8C8] rounded p-2"
              />
            )}

            {url && tipo === "video" && (
              <iframe
                src={url}
                title="Video"
                className="rounded mt-2"
                style={{ width: "100%", height: "180px", border: "none" }}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={onClose}
              className="border border-[#C7A27A] text-[#6E4F37] px-4 py-2 rounded hover:bg-[#F3E9E0]"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="bg-[#B08968] text-white px-4 py-2 rounded hover:bg-[#9b7450]"
            >
              Guardar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
