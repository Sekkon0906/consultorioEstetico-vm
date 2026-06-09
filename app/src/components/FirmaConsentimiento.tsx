"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";

interface Props {
  citaId: number | string;
  pacienteNombre: string;
  pacienteApellidos?: string;
  pacienteTelefono?: string;
  pacienteCorreo?: string;
  procedimiento: string;
  fecha: string;
  hora?: string;
  onFirmado?: () => void;
}

function generarPDFConsentimiento(
  nombre: string, apellidos: string, telefono: string, correo: string,
  procedimiento: string, fecha: string, hora: string, firmaDataUrl: string
): jsPDF {
  var doc = new jsPDF("p", "mm", "letter");
  var W = doc.internal.pageSize.getWidth();
  var M = 20; // margin
  var y = 20;

  function addHeader() {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICINA ESTETICA Y ANTIENVEJECIMIENTO", W / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Ibague-Tolima", W / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CONSENTIMIENTO INFORMADO", W / 2, y, { align: "center" });
    y += 10;
  }

  function addWrappedText(text: string, fontSize: number, bold: boolean, maxW?: number) {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    var lines = doc.splitTextToSize(text, maxW || (W - M * 2));
    for (var i = 0; i < lines.length; i++) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(lines[i], M, y);
      y += fontSize * 0.45;
    }
    y += 2;
  }

  // ====== PAGE 1 - Authorization for image use ======
  addHeader();

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("AUTORIZACION DE USO DE DERECHOS DE IMAGEN SOBRE FOTOGRAFIAS Y VIDEOS COMO DATOS", W / 2, y, { align: "center" });
  y += 4;
  doc.text("PERSONALES OTORGADOS A LA DRA. JULIETH VANESSA MEDINA ORJUELA", W / 2, y, { align: "center" });
  y += 8;

  addWrappedText("Yo, " + nombre + " " + apellidos + ", identificado como aparece al final de este documento, autorizo a la Dra. Julieth Vanessa Medina Orjuela para que haga uso de las imagenes en las que yo aparezca, (fotografias, videos y cualquier produccion audiovisual) asi como, de los derechos de autor, los derechos conexos y en general todos aquellos derechos de propiedad intelectual que tengan que ver con el derecho de imagen como dato personal.", 8, false);

  addWrappedText("Manifiesto mediante la firma de este documento de consentimiento informado, mi autorizacion para dar tratamiento a mis datos personales de conformidad con la Ley 1581 de 2012, Ley 1564 de 2012, Decreto 1377 de 2013 y demas que adicionen, modifiquen o complementen que: 1. Autorizo la toma de fotografias y videos antes, durante y despues de los procedimientos clinicos, con el objetivo de evaluar resultados del antes y despues de los procedimientos realizados, adicionalmente, podran ser utilizados con fines educativos, informativos o promocionales, para ser utilizadas en las diferentes plataformas digitales pagina web, instagram, facebook o en las presentaciones academico-educativas de la Dra. Julieth Vanessa Medina Orjuela, 2. Autorizo que el material fotografico, videos, que hagan parte del archivo de la Dra. Julieth Vanessa Medina Orjuela, y sus bases de datos, 4. Esta autorizacion no tiene ningun limite de tiempo para su concesion, ni para utilizacion de las imagenes, o parte de estas, por lo que mi autorizacion se considera concedida por un plazo de tiempo ilimitado.", 8, false);

  y += 4;

  // Patient data table
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  var tableY = y;
  doc.rect(M, tableY, W - M * 2, 24);
  doc.line(M, tableY + 6, W - M, tableY + 6);
  doc.line(M, tableY + 12, W - M, tableY + 12);
  doc.line(M, tableY + 18, W - M, tableY + 18);
  doc.line(M + 40, tableY, M + 40, tableY + 24);

  doc.text("NOMBRE", M + 2, tableY + 4);
  doc.text("IDENTIFICACION", M + 2, tableY + 10);
  doc.text("TELEFONO", M + 2, tableY + 16);
  doc.text("CORREO", M + 2, tableY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(nombre + " " + apellidos, M + 42, tableY + 4);
  doc.text("", M + 42, tableY + 10); // ID left empty for doctor
  doc.text(telefono, M + 42, tableY + 16);
  doc.text(correo, M + 42, tableY + 22);

  y = tableY + 30;
  doc.setFont("helvetica", "bold");
  doc.rect(M, y, 6, 6);
  doc.text("ACEPTO LAS POLITICAS DE LA EMPRESA", M + 8, y + 4);
  doc.text("X", M + 1.5, y + 4.5); // checked

  y += 15;
  doc.line(M, y, M + 80, y);
  y += 4;
  doc.text("Firma", M, y);

  // Add signature on page 1
  if (firmaDataUrl) {
    try { doc.addImage(firmaDataUrl, "PNG", M, y - 20, 60, 18); } catch (e) { /* ignore */ }
  }

  y += 5;
  addFooter(doc, W);

  // ====== PAGE 2 - Procedure consent ======
  doc.addPage();
  y = 20;
  addHeader();

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PROCEDIMIENTOS DE ARMONIZACION OROFACIAL", W / 2, y, { align: "center" });
  y += 6;

  // Patient info
  doc.setFont("helvetica", "normal");
  doc.text("Paciente: " + nombre + " " + apellidos, M, y); y += 5;
  doc.text("Telefono: " + telefono + "    Correo: " + correo, M, y); y += 5;
  doc.text("Fecha: " + fecha + "    Hora: " + hora, M, y); y += 5;
  doc.text("Profesional tratante: Dra. Julieth Medina Orjuela", M, y); y += 8;

  addWrappedText("1. OBJETO DEL DOCUMENTO\nEl presente documento tiene por objeto dejar constancia de que el paciente ha recibido informacion clara, suficiente, comprensible y oportuna sobre el/los procedimiento(s) de medicina estetica a realizar, sus beneficios, limitaciones, alternativas, cuidados posteriores, riesgos, efectos secundarios y posibles complicaciones; y que otorga su autorizacion libre y voluntaria para la ejecucion del/los mismo(s).", 8, false);

  addWrappedText("2. MARCO NORMATIVO Y FUNDAMENTO LEGAL (COLOMBIA)\n- Ley 23 de 1981 (Etica Medica)\n- Ley 1751 de 2015 (Ley Estatutaria de Salud)\n- Resolucion 1995 de 1999 (Historia Clinica)\n- Ley 1581 de 2012 (Proteccion de Datos Personales)", 8, false);

  addWrappedText("3. PROCEDIMIENTOS AUTORIZADOS\nProcedimiento seleccionado: " + procedimiento, 8, false);

  addWrappedText("4. NATURALEZA DEL PROCEDIMIENTO, ALCANCE Y LIMITES\nDeclaro que entiendo que los procedimientos de medicina estetica: Son procedimientos medicos electivos, no urgentes ni indispensables para preservar la vida. Buscan una mejoria estetica pero NO constituyen una promesa de perfeccion.", 8, false);

  if (y > 240) { doc.addPage(); y = 20; addHeader(); }

  addWrappedText("5. INFORMACION CLINICA PREVIA Y DECLARACIONES DEL PACIENTE\nDeclaro que he informado de manera veraz y completa a la profesional tratante sobre: antecedentes medicos, alergias, enfermedades autoinmunes, procesos infecciosos, uso de medicamentos, embarazo/lactancia, procedimientos previos, habitos, y cualquier otra condicion relevante.", 8, false);

  addWrappedText("6. BENEFICIOS ESPERADOS Y ALTERNATIVAS\nSe me han explicado beneficios esperados, asi como alternativas razonables, incluida la no realizacion del procedimiento.", 8, false);

  addWrappedText("7. RIESGOS GENERALES (APLICABLES A CUALQUIER PROCEDIMIENTO)\nAcepto que pueden presentarse: dolor, inflamacion, enrojecimiento, edema, hematomas, sensibilidad, prurito, irritacion, reacciones alergicas, infeccion, cambios pigmentarios, resultados no esperados, asimetrias, irregularidades.", 8, false);

  // Page 3+
  if (y > 200) { doc.addPage(); y = 20; addHeader(); }

  addWrappedText("8. RIESGOS Y COMPLICACIONES ESPECIFICAS SEGUN EL PROCEDIMIENTO MARCADO\nHe sido informado(a) de los riesgos especificos del procedimiento seleccionado.", 8, false);

  addWrappedText("9. CUIDADOS POSTERIORES Y CONTROLES\nSe me entregaron recomendaciones especificas segun procedimiento, y entiendo que debo cumplir controles y manejo indicado.", 8, false);

  addWrappedText("10. CONDUCTA ANTE EVENTOS ADVERSOS / URGENCIAS\nMe comprometo a informar oportunamente cualquier reaccion o evento adverso.", 8, false);

  addWrappedText("11. CLAUSULA ECONOMICA: NO DEVOLUCION DE DINERO\nDECLARO QUE COMPRENDO Y ACEPTO QUE, UNA VEZ INICIADO O REALIZADO EL PROCEDIMIENTO, NO PROCEDE DEVOLUCION DE DINERO TOTAL NI PARCIAL.", 8, false);

  if (y > 220) { doc.addPage(); y = 20; addHeader(); }

  addWrappedText("16. DECLARACION FINAL DEL PACIENTE\n1. He leido completamente este documento.\n2. He tenido oportunidad de hacer preguntas.\n3. Entiendo riesgos, cuidados, limitaciones y variabilidad de resultados.\n4. Otorgo mi autorizacion libre, voluntaria y consciente, sin presion.", 8, false);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FIRMA PACIENTE:", M, y); y += 3;
  doc.setFont("helvetica", "italic");
  doc.text("\"COMPRENDI EL CONTENIDO DE ESTE CONSENTIMIENTO INFORMADO Y LO ACEPTO\"", M, y);
  y += 8;

  // Signature
  if (firmaDataUrl) {
    try { doc.addImage(firmaDataUrl, "PNG", M, y, 60, 18); } catch (e) { /* ignore */ }
  }
  y += 20;
  doc.line(M, y, M + 70, y); y += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Nombre y firma del paciente: " + nombre + " " + apellidos, M, y); y += 5;
  doc.text("Fecha: " + fecha + "    Hora: " + hora, M, y); y += 10;

  doc.text("Firma del profesional: ___________________", M, y); y += 5;
  doc.text("Dra. Julieth Medina Orjuela", M, y); y += 5;
  doc.text("Registro Profesional: ___________", M, y);

  addFooter(doc, W);

  return doc;

  function addFooter(d: jsPDF, w: number) {
    d.setFontSize(7);
    d.setFont("helvetica", "normal");
    var fy = 270;
    d.text("Medicina Estetica y Antienvejecimiento Ibague-Tolima", w / 2, fy, { align: "center" }); fy += 3;
    d.text("Carrera 5ta #11-24. Edificio Torre Empresarial. Torre consultorios 502", w / 2, fy, { align: "center" }); fy += 3;
    d.text("Telefonos 3155445748 - 3152230544", w / 2, fy, { align: "center" }); fy += 3;
    d.text("Ibague Tolima Colombia", w / 2, fy, { align: "center" });
  }
}

export default function FirmaConsentimiento(props: Props) {
  const t = useTranslations("firma");
  var [showModal, setShowModal] = useState(false);
  var [step, setStep] = useState<"intro" | "firma" | "guardando" | "listo">("intro");
  var canvasRef = useRef<HTMLCanvasElement>(null);
  var [isDrawing, setIsDrawing] = useState(false);
  var [hasFirma, setHasFirma] = useState(false);
  var [firmaError, setFirmaError] = useState<string | null>(null);

  useEffect(function() {
    if (step !== "firma") return;
    var c = canvasRef.current; if (!c) return;
    var ctx = c.getContext("2d"); if (!ctx) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    ctx.scale(2, 2); ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#2A1C12";
  }, [step]);

  var getPos = function(e: React.MouseEvent | React.TouchEvent) {
    var c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    var rect = c.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  var startDraw = function(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); var ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    setIsDrawing(true); var p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  var draw = function(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); if (!isDrawing) return; var ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    var p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasFirma(true);
  };
  var endDraw = function() { setIsDrawing(false); };
  var limpiar = function() { var c = canvasRef.current; if (!c) return; c.getContext("2d")?.clearRect(0, 0, c.width, c.height); setHasFirma(false); };

  var guardarFirma = async function() {
    var c = canvasRef.current; if (!c || !hasFirma) return;
    setFirmaError(null);
    setStep("guardando");
    try {
      var firmaDataUrl = c.toDataURL("image/png");
      var blob = await (await fetch(firmaDataUrl)).blob();
      var fileName = "firma_" + props.citaId + "_" + Date.now() + ".png";
      var upRes = await supabase.storage.from("ConsultorioImagenes").upload("firmas/" + fileName, blob, { contentType: "image/png", upsert: true });
      if (upRes.error) throw new Error(upRes.error.message);
      var firmaUrl = "https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/ConsultorioImagenes/firmas/" + fileName;

      // Generate PDF
      var pdf = generarPDFConsentimiento(
        props.pacienteNombre, props.pacienteApellidos || "", props.pacienteTelefono || "",
        props.pacienteCorreo || "", props.procedimiento, props.fecha, props.hora || "", firmaDataUrl
      );
      var pdfBlob = pdf.output("blob");
      var pdfName = "consentimiento_" + props.citaId + "_" + Date.now() + ".pdf";
      var pdfUpRes = await supabase.storage.from("ConsultorioImagenes").upload("consentimientos/" + pdfName, pdfBlob, { contentType: "application/pdf", upsert: true });
      if (pdfUpRes.error) throw new Error(pdfUpRes.error.message);
      var pdfUrl = "https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/ConsultorioImagenes/consentimientos/" + pdfName;

      // Update cita
      await supabase.from("citas").update({ consentimiento_firmado: true, firma_url: firmaUrl, firma_fecha: new Date().toISOString(), consentimiento_pdf: pdfUrl }).eq("id", props.citaId);

      setStep("listo");
      if (props.onFirmado) props.onFirmado();
    } catch (err: any) { console.error(err); setFirmaError(t("saveError") + " " + (err?.message || "")); setStep("firma"); }
  };

  var cerrar = function() { setShowModal(false); setTimeout(function() { setStep("intro"); }, 300); };

  // Lock scroll del body cuando el modal está abierto, y desbloquea al cerrar.
  useEffect(function() {
    if (showModal) {
      var prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return function() { document.body.style.overflow = prev; };
    }
  }, [showModal]);

  // Cerrar con ESC
  useEffect(function() {
    if (!showModal) return;
    var onKey = function(e: KeyboardEvent) { if (e.key === "Escape") cerrar(); };
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [showModal]);

  // El modal se renderiza vía portal a document.body, así escapa
  // de cualquier wrapper con overflow/transform que limite position:fixed.
  var modalContent = (
    <AnimatePresence>
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1.5rem" }}
          onClick={cerrar}>
          <motion.div className="firma-modal-card dark-aware-card" initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{ background: "#FFFDF9", borderRadius: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto", position: "relative" }}
            onClick={function(e) { e.stopPropagation(); }}>
              <div style={{ height: 4, background: "linear-gradient(90deg, #B08968, #C9AD8D)" }} />
              <button onClick={cerrar} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%", background: "rgba(78,59,43,0.06)", border: "none", color: "#4E3B2B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}><X size={16} /></button>

              <div style={{ padding: "2rem 2rem 2.5rem" }}>
                {step === "intro" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #B08968, #C9AD8D)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 4px 12px rgba(176,137,104,0.25)" }}><FileText size={22} color="white" /></div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "#2A1C12", marginBottom: "0.8rem" }}>{t("title")}</h3>
                    </div>
                    <div className="dark-aware-panel firma-intro-panel" style={{ background: "#F4E9DC", borderRadius: 16, padding: "1.4rem", border: "1px solid rgba(176,137,104,0.3)", marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "1.02rem", color: "#3A2A1A", lineHeight: 1.7, margin: 0 }}>{t("intro")}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                      <button onClick={cerrar} style={{ padding: "0.7rem 1.5rem", borderRadius: 100, border: "1px solid rgba(176,137,104,0.3)", background: "transparent", color: "#6C584C", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>{t("cancel")}</button>
                      <button onClick={function() { setStep("firma"); }} style={{ padding: "0.7rem 1.8rem", borderRadius: 100, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 3px 12px rgba(176,137,104,0.25)" }}>{t("addSignature")}</button>
                    </div>
                  </motion.div>
                )}

                {step === "firma" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.3rem", textAlign: "center" }}>{t("drawTitle")}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#8A7565", textAlign: "center", marginBottom: "1rem" }}>{t("drawHint")}</p>
                    <div className="firma-canvas-wrap dark-aware-keep" style={{ border: "2px dashed rgba(176,137,104,0.3)", borderRadius: 16, overflow: "hidden", marginBottom: "1rem", background: "white" }}>
                      <canvas ref={canvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                        style={{ width: "100%", height: 180, cursor: "crosshair", touchAction: "none", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "1rem" }}>
                      <button onClick={function() { limpiar(); setFirmaError(null); }} style={{ padding: "0.5rem 1.2rem", borderRadius: 100, border: "1px solid rgba(176,137,104,0.3)", background: "transparent", color: "#6C584C", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>{t("clear")}</button>
                    </div>
                    {firmaError && (
                      <p style={{ color: "#b02e2e", fontSize: "0.82rem", textAlign: "center", marginBottom: "0.8rem" }}>{firmaError}</p>
                    )}
                    <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                      <button onClick={function() { setStep("intro"); }} style={{ padding: "0.7rem 1.5rem", borderRadius: 100, border: "1px solid rgba(176,137,104,0.3)", background: "transparent", color: "#6C584C", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>{t("back")}</button>
                      <button onClick={guardarFirma} disabled={!hasFirma} style={{ padding: "0.7rem 1.8rem", borderRadius: 100, background: hasFirma ? "linear-gradient(135deg, #B08968, #C9AD8D)" : "#E9DED2", color: hasFirma ? "white" : "#9B8575", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: hasFirma ? "pointer" : "not-allowed" }}>{t("confirm")}</button>
                    </div>
                  </motion.div>
                )}

                {step === "guardando" && (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div className="spinner-border" style={{ color: "#B08968" }} />
                    <p style={{ color: "#6C584C", marginTop: "1rem" }}>{t("savingMessage")}</p>
                  </div>
                )}

                {step === "listo" && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#3A2A1A", marginBottom: "0.5rem" }}>{t("doneTitle")}</h3>
                    <p style={{ fontSize: "0.88rem", color: "#6C584C", marginBottom: "1.5rem" }}>{t("doneMessage")}</p>
                    <button onClick={cerrar} style={{ padding: "0.7rem 2rem", borderRadius: 100, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>{t("close")}</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={function() { setShowModal(true); }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.65rem 1.5rem", borderRadius: 100, background: "linear-gradient(135deg, #B08968, #C9AD8D)", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 3px 12px rgba(176,137,104,0.2)" }}>
        <FileText size={16} /> {t("addSignature")}
      </motion.button>

      {typeof document !== "undefined" ? createPortal(modalContent, document.body) : null}
    </>
  );
}

// Component for admin to download the PDF
export function BotonPDFConsentimiento(props: { citaId: string | number; firmado: boolean; pdfUrl?: string }) {
  const t = useTranslations("firma");
  return (
    <motion.button whileHover={props.firmado ? { scale: 1.03 } : {}} whileTap={props.firmado ? { scale: 0.97 } : {}}
      onClick={function() {
        if (props.firmado && props.pdfUrl) { window.open(props.pdfUrl, "_blank"); }
      }}
      disabled={!props.firmado}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 100,
        background: props.firmado ? "linear-gradient(135deg, #2E7D32, #43A047)" : "transparent",
        color: props.firmado ? "white" : "#ccc",
        border: props.firmado ? "none" : "1px solid #E9DED2",
        fontWeight: 600, fontSize: "0.78rem", cursor: props.firmado ? "pointer" : "default",
        opacity: props.firmado ? 1 : 0.4,
      }}>
      <Download size={14} /> {t("downloadPdf")}
    </motion.button>
  );
}