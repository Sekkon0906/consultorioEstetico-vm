"use client";
import QRCode from "react-qr-code";

export default function QRPago({ valor = 120000, citaId }: { valor?: number; citaId: number }) {
  const mensaje = `Pago de valoración: $${valor} - Cita #${citaId}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">Escanea para pagar</h2>
      <QRCode value={mensaje} size={180} />
      <p className="text-sm text-gray-600 mt-2">{mensaje}</p>
      <p className="text-xs text-gray-400">(QR de demostración)</p>
    </div>
  );
}
