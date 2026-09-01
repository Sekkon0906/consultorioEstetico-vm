// Paleta del flujo de agendamiento.
// Está aquí (no en page.tsx) porque App Router solo permite ciertos
// named exports en archivos de página.
// Los valores apuntan a CSS vars del tema → reacciona a modo claro/oscuro.
export const PALETTE = {
  bgGradFrom: "var(--surface-soft)",
  bgGradTo: "var(--bg-elevated)",
  surface: "var(--surface)",
  border: "var(--border)",
  main: "var(--brand)",
  mainHover: "var(--brand-deep)",
  accent: "var(--brand-soft)",
  text: "var(--text)",
  textSoft: "var(--text-soft)",
};
