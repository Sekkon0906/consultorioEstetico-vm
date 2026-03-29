// app/administrar/procedimientos/helpers.ts

import type {
  Procedimiento,
  CategoriaProcedimiento,
} from "../../types/domain";

// ============================================================
// Buscar procedimientos por categoría (usando una lista ya cargada)
// ============================================================
export function buscarPorCategoria(
  procedimientos: Procedimiento[],
  categoria: CategoriaProcedimiento
): Procedimiento[] {
  return procedimientos.filter((p) => p.categoria === categoria);
}

// ============================================================
// Formatear precio con separadores
//  - Si viene como número: lo formateamos COP.
//  - Si viene como string "raro" (rango, texto, 'Según valoración médica')
//    lo devolvemos tal cual.
// ============================================================
export function formatearPrecio(precio: string | number): string {
  // Caso: precio numérico
  if (typeof precio === "number") {
    if (Number.isNaN(precio)) return "$0";
    return `$${precio.toLocaleString("es-CO")}`;
  }

  // Caso: string
  const raw = precio.trim();

  // Si contiene texto, rango, palabras, etc., lo dejamos como está
  if (!/^\d+([.,]\d+)?$/.test(raw)) {
    return raw;
  }

  // Sólo dígitos (posible con puntos/commas) -> normalizamos
  const num = parseInt(raw.replace(/[.,]/g, ""), 10);
  if (Number.isNaN(num)) return raw;

  return `$${num.toLocaleString("es-CO")}`;
}
