import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * COLORES ESCRITOS A MANO — regla con trinquete.
 *
 * QUÉ PROBLEMA RESUELVE
 * El sitio tiene dos temas. Un color escrito a mano solo puede ser correcto
 * en uno de los dos: el mismo marrón que se lee bien sobre crema desaparece
 * sobre negro. Eso ha producido, entre otras cosas, botones vacíos, un 404
 * en blanco sobre fondo negro y un calendario con las horas invisibles.
 *
 * Se corrigieron a mano una y otra vez, y volvían a aparecer en el archivo
 * siguiente. Bajar la deuda sin cerrar la puerta es achicar agua.
 *
 * CÓMO FUNCIONA EL TRINQUETE
 * La regla es un ERROR en todo el proyecto. Los archivos que todavía tienen
 * deuda están listados abajo como excepción temporal: no molestan hoy, pero
 * **no se puede añadir ninguno**. Cuando uno se limpia, se borra de la lista
 * y ya no puede volver atrás.
 *
 * La lista es, además, el inventario de lo que queda. Si está vacía, la
 * deuda se acabó.
 *
 * LO QUE NO ES DEUDA
 * `Footer.tsx` y `FirmaConsentimiento.tsx` van aparte y se quedan para
 * siempre. Sus colores fijos son CORRECTOS y tokenizarlos los rompería:
 *
 *   · El pie es oscuro en LOS DOS temas —`--footer-bg` vale #5A4A3A en claro
 *     y #0B0A0D en oscuro—, así que su texto va claro siempre. Con
 *     `var(--text)` quedaría texto oscuro sobre fondo oscuro en modo claro.
 *   · El trazo de la firma se guarda como imagen y acaba dentro del PDF del
 *     consentimiento. Con un color de tema, en modo oscuro la firma se
 *     dibujaría en crema y el documento firmado saldría en blanco.
 */
const SIN_COLORES_A_MANO = {
  "no-restricted-syntax": [
    "error",
    {
      // Cubre los dos sitios donde aparecen: `color: "#ABC123"` en estilos en
      // línea y `color: #ABC123;` dentro de un <style> con template literal.
      selector: "Literal[value=/#[0-9a-fA-F]{6}/]",
      message:
        "Color escrito a mano. Usa un token del tema (--text, --brand, --surface, --estado-*). " +
        "Un color fijo solo puede ser correcto en uno de los dos temas.",
    },
    {
      selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}/]",
      message:
        "Color escrito a mano dentro de un template. Usa un token del tema. " +
        "Un color fijo solo puede ser correcto en uno de los dos temas.",
    },
  ],
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // La regla, activa en todo el código de interfaz.
  {
    files: ["app/**/*.tsx", "src/**/*.tsx"],
    rules: SIN_COLORES_A_MANO,
  },

  /* DEUDA PENDIENTE — esta lista solo puede encoger.
   *
   * Si vas a añadir un archivo aquí, para: significa que estás escribiendo un
   * color a mano en sitio nuevo, que es justo lo que la regla evita.
   */
  {
    files: [
      "app/administrar/analitica/historialReportes.tsx",
      "app/administrar/charlas/charlasList.tsx",
      "app/administrar/citas/citasAgendadas.tsx",
      "app/administrar/citas/citasAgendadasCard.tsx",
      "app/administrar/citas/citasAgendadasEditor.tsx",
      "app/administrar/citas/citasAgendadasModalSimple.tsx",
      "app/administrar/procedimientos/modalGaleriaItem.tsx",
      "app/administrar/procedimientos/procedimientosForm.tsx",
      "app/administrar/procedimientos/procedimientosList.tsx",
      "app/administrar/testimonios/testimoniosForm.tsx",
      "app/administrar/testimonios/testimoniosList.tsx",
      "app/agendar/agendarPago.tsx",
      "app/agendar/page.tsx",
      "app/consultorio/page.tsx",
      "app/doctora/filosofia.tsx",
      "app/doctora/formacionContinua.tsx",
      "app/doctora/page.tsx",
      "app/doctora/visionMision.tsx",
      "app/global-error.tsx",
      "app/layout.tsx",
      "app/legal/layout.tsx",
      "app/loading.tsx",
      "app/login/LoginForm.tsx",
      "app/login/page.tsx",
      "app/page.tsx",
      "app/perfil/editar_info/datosPersonalesForm.tsx",
      "app/perfil/editar_info/perfilCard.tsx",
      /* `*` en vez del nombre real de la carpeta. Las rutas dinamicas de
         Next se llaman "[id]", y los corchetes son sintaxis de glob —una
         clase de caracteres—, asi que el patron literal buscaria una carpeta
         llamada "i" o "d". Escaparlos con barras invertidas tampoco funciona
         aqui. Con `*` se evita el problema entero. */
      "app/procedimientos/*/page.tsx",
      "app/procedimientos/page.tsx",
      "app/recuperar/page.tsx",
      "app/register/page.tsx",
      "app/register/step1DatosPersonales.tsx",
      "app/register/step2DatosMedicos.tsx",
      "app/register/step3exito.tsx",
      "src/components/CookieBanner.tsx",
      "src/components/FondoAnim.tsx",
      "src/components/Galeria3D.tsx",
      "src/components/ModalAviso.tsx",
      "src/components/NavbarClient.tsx",
      "src/components/VideoAnim.tsx",
    ],
    rules: { "no-restricted-syntax": "off" },
  },

  /* COLORES FIJOS A PROPÓSITO — no son deuda, no se tocan.
     El porqué está en el comentario de arriba y dentro de cada archivo. */
  {
    files: [
      "src/components/Footer.tsx",
      "src/components/FirmaConsentimiento.tsx",
    ],
    rules: { "no-restricted-syntax": "off" },
  },
];

export default eslintConfig;
