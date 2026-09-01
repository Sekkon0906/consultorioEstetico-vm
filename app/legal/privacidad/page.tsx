import LegalDoc from "../LegalDoc";

export const metadata = {
  title: "Política de Privacidad · Consultorio JM",
  description: "Política de tratamiento de datos personales conforme a la Ley 1581 de 2012.",
};

export default function PrivacidadPage() {
  return (
    <LegalDoc
      titulo="Política de Privacidad y Tratamiento de Datos"
      actualizado="5 de junio de 2026"
      current="/legal/privacidad"
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>Dra. Julieth Vanessa Medina Orjuela</strong> (en adelante, &ldquo;la Doctora&rdquo; o
        &ldquo;el Consultorio&rdquo;), identificada con NIT <strong>1.105.689.615-9</strong>,
        con domicilio en Carrera 5ta #11-24, Edificio Torre Empresarial,
        Consultorio 502, Ibagué — Tolima, Colombia. Correo de contacto:{" "}
        <a href="mailto:dra.vanessamedinao@gmail.com">dra.vanessamedinao@gmail.com</a>. Teléfono:
        +57 315 544 5748.
      </p>

      <h2>2. Marco normativo</h2>
      <p>
        El tratamiento de los datos personales que reciba el Consultorio se
        rige por la <strong>Ley 1581 de 2012</strong>, el{" "}
        <strong>Decreto 1377 de 2013</strong>, la <strong>Resolución 1995 de
        1999</strong> (historia clínica) y demás normas concordantes de la
        República de Colombia.
      </p>

      <h2>3. Datos que recolectamos</h2>
      <ul>
        <li><strong>Datos de identificación:</strong> nombres, apellidos, documento, teléfono, correo electrónico.</li>
        <li><strong>Datos clínicos y sensibles:</strong> antecedentes médicos, alergias, medicamentos, fotografías y videos antes/durante/después de los procedimientos.</li>
        <li><strong>Datos de la cita:</strong> fecha, hora, procedimiento, método de pago, montos.</li>
        <li><strong>Datos técnicos:</strong> dirección IP, dispositivo, navegador y cookies (ver Política de Cookies).</li>
      </ul>

      <h2>4. Finalidades</h2>
      <ol>
        <li>Prestar el servicio médico-estético y agendar citas.</li>
        <li>Llevar la historia clínica conforme a la Resolución 1995 de 1999.</li>
        <li>Contactar al paciente por temas de su atención (recordatorios, reagendas, controles).</li>
        <li>Registro fotográfico/visual clínico, evolutivo y, cuando exista autorización expresa, para fines educativos o promocionales en redes sociales y página web.</li>
        <li>Facturación, contabilidad y cumplimiento de obligaciones legales.</li>
        <li>Mejorar la calidad del servicio y de este sitio web.</li>
      </ol>

      <h2>5. Autorización del titular</h2>
      <p>
        Al registrarse, agendar una cita o firmar el consentimiento informado,
        el titular autoriza de manera previa, expresa e informada el
        tratamiento de sus datos personales por parte del Consultorio para las
        finalidades aquí descritas.
      </p>

      <h2>6. Datos sensibles y de menores</h2>
      <p>
        Los datos clínicos son sensibles. Su tratamiento exige autorización
        cualificada del titular y se realiza con medidas reforzadas de
        seguridad. En el caso de menores de edad, el tratamiento sigue
        primando el interés superior del menor y requiere autorización de los
        representantes legales.
      </p>

      <h2>7. Derechos del titular</h2>
      <p>El titular puede en cualquier momento:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos.</li>
        <li>Solicitar prueba de la autorización otorgada.</li>
        <li>Ser informado sobre el uso dado a sus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        <li>Revocar la autorización y/o solicitar la supresión, cuando ello no contradiga obligaciones legales (p. ej. conservación de la historia clínica).</li>
        <li>Acceder gratuitamente a sus datos personales que hayan sido objeto de tratamiento.</li>
      </ul>

      <h2>8. Cómo ejercer sus derechos</h2>
      <p>
        Las solicitudes pueden enviarse al correo{" "}
        <a href="mailto:dra.vanessamedinao@gmail.com">dra.vanessamedinao@gmail.com</a>
        indicando nombre completo, documento, descripción de la solicitud y
        datos de contacto. Plazos de respuesta conforme a la ley (consultas:
        10 días hábiles; reclamos: 15 días hábiles, prorrogables).
      </p>

      <h2>9. Seguridad de la información</h2>
      <p>
        Aplicamos medidas técnicas, humanas y administrativas razonables para
        proteger sus datos: control de acceso, cifrado en tránsito (HTTPS),
        almacenamiento en proveedores con estándares de seguridad reconocidos
        (Supabase), respaldo periódico y políticas internas de manejo de la
        información clínica.
      </p>

      <h2>10. Conservación y transferencia</h2>
      <p>
        Los datos clínicos se conservan por los plazos legales aplicables a la
        historia clínica. Los datos pueden ser tratados por los siguientes
        proveedores tecnológicos bajo contratos o políticas que garantizan
        equivalente nivel de protección:
      </p>
      <ul>
        <li><strong>Supabase</strong> — base de datos, autenticación y almacenamiento de imágenes y firmas (servidores con certificaciones de seguridad reconocidas).</li>
        <li><strong>Vercel</strong> — alojamiento del sitio web.</li>
        <li><strong>Google</strong> — únicamente cuando el usuario elige iniciar sesión con su cuenta de Google (OAuth).</li>
        <li><strong>WhatsApp</strong> — utilizado por la doctora como canal de contacto y para recibir la notificación de las citas agendadas.</li>
        <li><strong>Resend</strong> — envío de correos de recordatorio de citas (procesa el nombre y el correo del paciente).</li>
        <li><strong>Sentry</strong> — diagnóstico técnico de errores para mantener el sitio estable; la grabación de sesión solo se activa con tu consentimiento de cookies de analítica (ver Política de Cookies).</li>
      </ul>
      <p>
        No utilizamos herramientas de analítica publicitaria ni píxeles de
        marketing de terceros, ni vendemos datos personales. La única
        herramienta de diagnóstico técnico es Sentry, descrita arriba.
      </p>

      <h2>11. Vigencia y cambios</h2>
      <p>
        Esta política rige desde su publicación. Cualquier modificación se
        comunicará en este sitio. Versión vigente: <strong>5 de junio de 2026</strong>.
      </p>
    </LegalDoc>
  );
}
