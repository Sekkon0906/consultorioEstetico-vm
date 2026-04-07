"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import domtoimage from "dom-to-image";

// === URL BASE DEL BACKEND ===
const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface PuntoSemanal {
  semana: string;
  total: number;
}

interface GenerarReporteMensualPDFProps {
  mes: number;
  anio: number;
  ingresos: {
    totalOnline: number;
    totalConsultorio: number;
    totalEsperado: number;
  };
  dataSemanal: PuntoSemanal[];
  chartId: string;
}

//  tipo extendido para usar lastAutoTable de jspdf-autotable
type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

export async function generarReporteMensualPDF({
  mes,
  anio,
  ingresos,
  dataSemanal,
  chartId,
}: GenerarReporteMensualPDFProps) {
  const doc = new jsPDF("p", "mm", "a4");

  const nombresMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // === Encabezado ===
  doc.setFillColor(252, 249, 245);
  doc.rect(0, 0, 210, 297, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(80, 55, 35);
  doc.text("Reporte de Ingresos Mensuales", 105, 25, { align: "center" });

  doc.setFontSize(14);
  doc.text(`${nombresMes[mes]} ${anio}`, 105, 35, { align: "center" });

  // === Totales ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(70, 50, 30);
  doc.text(`Pagos Online: $${ingresos.totalOnline.toLocaleString()}`, 25, 55);
  doc.text(
    `Pagos en Consultorio: $${ingresos.totalConsultorio.toLocaleString()}`,
    25,
    65
  );
  doc.text(
    `Total Esperado: $${ingresos.totalEsperado.toLocaleString()}`,
    25,
    75
  );

  // === Tabla de ingresos semanales ===
  autoTable(doc as JsPDFWithAutoTable, {
    startY: 90,
    head: [["Semana", "Total Ingresos"]],
    body: dataSemanal.map((d) => [d.semana, `$${d.total.toLocaleString()}`]),
    styles: {
      fontSize: 11,
      cellPadding: 4,
      textColor: [60, 45, 30],
      lineColor: [224, 205, 181],
    },
    headStyles: {
      fillColor: [176, 137, 104],
      textColor: 255,
      halign: "center",
    },
  });

  // === Agregar gráfica desde el DOM ===
  const chartElement = document.getElementById(chartId);
  if (chartElement) {
    const imgData = await domtoimage.toPng(chartElement);

    const docWithTable = doc as JsPDFWithAutoTable;
    const finalY = docWithTable.lastAutoTable?.finalY ?? 120;

    doc.addImage(imgData, "PNG", 15, finalY + 10, 180, 90);
  }

  // === Pie de página ===
  const fecha = new Date();
  const mesNombreActual = nombresMes[fecha.getMonth()];

  doc.setDrawColor(176, 137, 104);
  doc.line(15, 270, 195, 270);

  doc.setFontSize(10);
  doc.setTextColor(90, 70, 50);
  doc.text(
    `Generado automáticamente el ${fecha.getDate()} de ${mesNombreActual} ${fecha.getFullYear()} – Consultorio Estético JM`,
    105,
    278,
    { align: "center" }
  );

  // === Generar PDF en Base64 (data:application/pdf;...) ===
  const pdfBase64 = doc.output("datauristring");

  // === Enviar al backend para guardar en reportes_mensuales ===
  try {
    await fetch(`${API}/reportes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mes: nombresMes[mes],                  //  tu tabla usa mes en texto
        anio,
        totalOnline: ingresos.totalOnline,
        totalConsultorio: ingresos.totalConsultorio,
        totalEsperado: ingresos.totalEsperado,
        archivoURL: pdfBase64,                 // lo que luego lees en HistorialReportes
      }),
    });
  } catch (error) {
    console.error("Error al guardar reporte mensual en backend:", error);
  }

  // === Descargar localmente en el navegador ===
  doc.save(`Reporte-${nombresMes[mes]}-${anio}.pdf`);
}
