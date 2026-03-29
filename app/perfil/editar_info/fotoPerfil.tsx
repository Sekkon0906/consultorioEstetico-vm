import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PALETTE } from "./palette";
import { supabase } from "@/lib/supabaseClient";
import { updateCurrentUser } from "@/lib/api";

interface Props {
  photo?: string;
  email?: string;
  canEdit: boolean;
  setPhoto: (value: string | undefined) => void;
}

export default function FotoPerfil({ photo, email, canEdit, setPhoto }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(photo);

  useEffect(() => { setPreview(photo); }, [photo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      // Nombre único basado en el email del usuario
      const path = `${email.replace(/[@.]/g, "_")}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-perfil")                                      //  bucket correcto
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("fotos-perfil").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      await updateCurrentUser({ photo: publicUrl });

      setPhoto(publicUrl);
      setPreview(publicUrl);
    } catch (err: any) {
      console.error("Error subiendo foto:", err);
      alert("No se pudo subir la foto: " + err.message);
      setPreview(photo);
    } finally {
      setUploading(false);
    }
  };

  const displayPhoto =
    preview ||
    (email
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=E6CCB2&color=7F5539`
      : "/default-avatar.png");

  return (
    <motion.div
      className="text-center mb-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="mx-auto mb-3 position-relative"
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          overflow: "hidden",
          border: `4px solid ${PALETTE.main}`,
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          backgroundColor: "#f8f9fa",
        }}
      >
        <img
          src={displayPhoto}
          alt="Foto de perfil"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="spinner-border spinner-border-sm text-white" role="status" />
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <label
            htmlFor="fileInput"
            className="btn btn-outline-secondary btn-sm"
            style={{ borderColor: PALETTE.main, color: PALETTE.main, cursor: "pointer" }}
          >
            {uploading ? "Subiendo…" : "Cambiar foto"}
          </label>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </>
      )}
    </motion.div>
  );
}