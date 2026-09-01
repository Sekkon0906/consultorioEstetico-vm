"use client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ModalAviso({
  show,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
}: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center"
          >
            <h3 className="text-lg font-semibold text-[#6E4F37] mb-2">{title}</h3>
            <p className="text-[#6E5A49] mb-4">{message}</p>
            <div className="flex justify-center gap-3">
              {onConfirm && (
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="bg-[#8B6A4B] text-white px-4 py-2 rounded hover:bg-[#6E4F37] transition"
                >
                  {confirmText}
                </button>
              )}
              <button
                onClick={onClose}
                className="border border-[#C7A27A] text-[#6E4F37] px-4 py-2 rounded hover:bg-[#F3E9E0] transition"
              >
                {onConfirm ? cancelText : "Cerrar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
