import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PALETTE } from "./palette";

interface Props {
  photo?: string;
  email?: string;
  /** Compatibilidad: ya no se permite subir foto (seguridad). */
  canEdit?: boolean;
  setPhoto?: (value: string | undefined) => void;
}

/**
 * Foto de perfil — SOLO LECTURA.
 * Por seguridad informática los usuarios no suben archivos:
 * se usa la foto de la cuenta de Google (avatar_url) o un avatar generado.
 */
export default function FotoPerfil({ photo, email }: Props) {
  const t = useTranslations("perfil.edit.photo");
  const [preview, setPreview] = useState<string | undefined>(photo);

  useEffect(() => {
    setPreview(photo);
  }, [photo]);

  const displayPhoto =
    preview ||
    (email
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          email
        )}&background=E6CCB2&color=7F5539`
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
          alt={t("alt")}
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <p className="small mb-0" style={{ color: PALETTE.main, opacity: 0.75 }}>
        {t("hint")}
      </p>
    </motion.div>
  );
}
