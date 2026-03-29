"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
//  Usamos la MISMA Cita y formatCurrency que en el módulo de citas
import type { Cita } from "../citas/helpers";
import { formatCurrency } from "../citas/helpers";

/**
 * Genera y descarga una factura PDF con los datos de una cita.
 * @param cita Objeto Cita
 */
export async function generarFacturaPDF(cita: Cita) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // === Fondo general ===
  doc.setFillColor(255, 252, 247);
  doc.rect(0, 0, 210, 297, "F");

  // === Encabezado ===
  doc.setTextColor(59, 42, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CONSULTORIO ESTÉTICO JM", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Factura de atención y procedimiento", 105, 28, { align: "center" });

  // Logo (si tienes uno en /public/logo.png)
  try {
    const logoUrl = "/logo.png";
    const img = await fetch(logoUrl).then((res) => res.blob());
    const imgData = await blobToBase64(img);
    doc.addImage(imgData, "PNG", 15, 12, 25, 25);
  } catch {
    // si no hay logo, lo ignoramos
  }

  // === Datos de la cita ===
  doc.setDrawColor(176, 137, 104);
  doc.line(15, 35, 195, 35);

  doc.setFontSize(12);
  doc.text("DATOS DEL PACIENTE", 15, 45);
  doc.setFontSize(10);
  doc.text(`Nombre: ${cita.nombres} ${cita.apellidos}`, 15, 53);
  doc.text(`Correo: ${cita.correo}`, 15, 59);
  doc.text(`Teléfono: ${cita.telefono}`, 15, 65);

  doc.text("DETALLES DE LA CITA", 15, 78);
  doc.text(`Fecha: ${cita.fecha.toString().slice(0, 10)}`, 15, 86);
  doc.text(`Hora: ${cita.hora}`, 15, 92);
  doc.text(`Procedimiento: ${cita.procedimiento}`, 15, 98);
  doc.text(`Tipo de cita: ${cita.tipoCita}`, 15, 104);

  // === Pago ===
  let metodo = "Sin método registrado";

  if (cita.metodoPago === "Consultorio") {
    metodo = `Pago en consultorio (${cita.tipoPagoConsultorio ?? "-"})`;
  } else if (cita.metodoPago === "Online") {
    metodo = `Pago en línea (${cita.tipoPagoOnline ?? "-"})`;
  }

  const montoTotal = cita.monto ?? 0;
  const estadoPago = Boolean(cita.pagado) ? "Pagado " : "Pendiente";

  doc.text("DETALLES DEL PAGO", 15, 118);
  doc.text(`Método de pago: ${metodo}`, 15, 126);
  doc.text(`Monto: ${formatCurrency(montoTotal)}`, 15, 132);
  doc.text(`Estado: ${estadoPago}`, 15, 138);

  // === QR con información ===
  const qrData = `Cita #${cita.id} - ${cita.nombres} ${cita.apellidos}\n${cita.procedimiento}\n${cita.fecha} ${cita.hora}`;
  const qrUrl = await QRCode.toDataURL(qrData);
  doc.addImage(qrUrl, "PNG", 150, 110, 40, 40);

  // === Firma y pie ===
  doc.setDrawColor(180, 160, 130);
  doc.line(15, 210, 195, 210);
  doc.setFontSize(10);
  doc.setTextColor(90, 70, 50);
  doc.text(
    "Gracias por confiar en nuestros servicios. Para dudas o reprogramaciones, comuníquese con la doctora responsable.",
    105,
    220,
    { align: "center", maxWidth: 160 }
  );

  doc.setFont("helvetica", "italic");
  doc.text("Doctora Responsable: _______________________", 15, 250);
  doc.text("Firma del paciente: ___________________________", 15, 260);

  // === Descargar ===
  doc.save(`Factura_Cita_${cita.id}.pdf`);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
