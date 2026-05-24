import LegalDoc from "../LegalDoc";

export const metadata = {
  title: "Política de Cookies · Dra. Vanessa Medina",
  description: "Información sobre el uso de cookies y tecnologías similares en este sitio.",
};

export default function CookiesPage() {
  return (
    <LegalDoc
      titulo="Política de Cookies"
      actualizado="[FECHA_ACTUALIZACION]"
      current="/legal/cookies"
    >
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que se descargan en tu dispositivo
        cuando visitas un sitio web. Permiten recordar tus preferencias,
        mantener tu sesión iniciada y obtener información estadística sobre
        el uso del sitio.
      </p>

      <h2>2. Tipos de cookies que usamos</h2>
      <h3>Esenciales (siempre activas)</h3>
      <p>
        Son necesarias para que el sitio funcione: mantener tu sesión
        iniciada, recordar tu preferencia de cookies y permitir el
        agendamiento de citas. Sin ellas, las funciones críticas no
        operarían correctamente.
      </p>

      <h3>Analíticas (opcionales)</h3>
      <p>
        Nos permiten entender cómo usas el sitio (páginas visitadas, tiempo
        en cada sección) de forma agregada y anónima para mejorarlo. Hoy{" "}
        <strong>no estamos usando herramientas de analítica de terceros</strong>;
        si en el futuro las activamos (por ejemplo Google Analytics), solo se
        cargarán si has aceptado esta categoría.
      </p>

      <h3>Marketing (opcionales)</h3>
      <p>
        Permitirían personalizar contenido o medir campañas en redes
        sociales. Actualmente <strong>no se están usando</strong>; al igual
        que las analíticas, solo se activarán si das tu consentimiento
        explícito.
      </p>

      <h2>3. Cookies de terceros</h2>
      <p>Los servicios externos integrados pueden establecer sus propias cookies:</p>
      <ul>
        <li><strong>Supabase</strong> — autenticación y sesión.</li>
        <li><strong>Google</strong> (solo si inicias sesión con Google) — autenticación OAuth.</li>
        <li><strong>YouTube</strong> (al reproducir videos de testimonios) — bajo su propia política.</li>
        <li><strong>Google Maps</strong> (mapa del consultorio) — bajo su propia política.</li>
      </ul>

      <h2>4. Cómo gestionar tu consentimiento</h2>
      <p>
        Al entrar al sitio por primera vez verás un banner con opciones para{" "}
        <strong>Aceptar todas</strong>, <strong>Rechazar las opcionales</strong> o
        <strong> Personalizar</strong> por categoría. Puedes cambiar tu preferencia
        en cualquier momento borrando los datos del sitio en tu navegador.
      </p>

      <h2>5. Más información</h2>
      <p>
        Si tienes preguntas sobre nuestro uso de cookies, escríbenos a{" "}
        <a href="mailto:dra.vanessamedinao@gmail.com">dra.vanessamedinao@gmail.com</a>.
      </p>
    </LegalDoc>
  );
}
