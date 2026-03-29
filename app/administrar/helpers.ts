export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
