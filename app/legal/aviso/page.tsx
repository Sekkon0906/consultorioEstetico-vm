import Link from "next/link";
import LegalDoc from "../LegalDoc";

export const metadata = {
  title: "Aviso de Privacidad · Consultorio JM",
  description: "Resumen corto del aviso de privacidad y tratamiento de datos.",
};

export default function AvisoPage() {
  return (
    <LegalDoc
      titulo="Aviso de Privacidad"
      actualizado="5 de junio de 2026"
      current="/legal/aviso"
    >
      <p>
        La <strong>Dra. Julieth Vanessa Medina Orjuela</strong> (NIT{" "}
        <strong>1.105.689.615-9</strong>), con domicilio en
        Carrera 5ta #11-24, Edificio Torre Empresarial, Consultorio 502,
        Ibagué — Tolima, recolecta y trata tus datos personales con las
        siguientes finalidades:
      </p>

      <ul>
        <li>Agendar y prestar el servicio de medicina estética.</li>
        <li>Llevar tu historia clínica conforme a la Resolución 1995 de 1999.</li>
        <li>Contactarte por temas de tu atención (recordatorios, reagendas, controles).</li>
        <li>Registrar fotografías/videos clínicos y, con autorización expresa, usarlos con fines educativos o promocionales.</li>
        <li>Cumplir obligaciones legales (facturación, contabilidad).</li>
      </ul>

      <p>
        Como titular de los datos tienes derecho a conocerlos, actualizarlos,
        rectificarlos, solicitar prueba de la autorización, ser informado
        sobre su uso, revocar la autorización (cuando la ley lo permita) y
        presentar reclamos ante la Superintendencia de Industria y Comercio.
      </p>

      <p>
        Para ejercer estos derechos o consultar la política completa,
        escríbenos a{" "}
        <a href="mailto:dra.vanessamedinao@gmail.com">dra.vanessamedinao@gmail.com</a>
        {" "}o consulta la{" "}
        <Link href="/legal/privacidad">Política de Privacidad completa</Link>.
      </p>

      <p style={{ marginTop: "1.4rem", fontSize: "0.88rem", color: "var(--text-muted)" }}>
        Este aviso se entrega en cumplimiento de la Ley 1581 de 2012 y el
        Decreto 1377 de 2013.
      </p>
    </LegalDoc>
  );
}
