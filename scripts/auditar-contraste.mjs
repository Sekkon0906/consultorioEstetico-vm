/**
 * Auditoría de contraste sobre los TOKENS DECLARADOS, no sobre el navegador.
 *
 * POR QUÉ ESTÁTICA Y NO EN EL NAVEGADOR
 * Lo natural sería abrir la web en tema oscuro y medir `getComputedStyle`.
 * Se intentó y no vale: al cambiar de tema, los estilos calculados que
 * devuelve el navegador de previsualización se quedan con los valores del
 * tema anterior, así que la auditoría daba fallos donde la captura mostraba
 * texto perfectamente legible. Justo lo que cambia entre temas es lo que peor
 * se mide.
 *
 * Leer los tokens del archivo tiene además dos ventajas que la medición no
 * tiene: corre sin navegador (sirve en integración continua) y compara los
 * DOS temas de una vez.
 *
 * QUÉ NO CUBRE, Y CONVIENE SABERLO
 * Solo mira las parejas declaradas aquí abajo. No ve texto sobre fotos, ni
 * sobre degradados, ni colores escritos a mano en componentes. Para eso hacen
 * falta ojos en un navegador real. Esto es el suelo, no el techo.
 *
 * USO
 *   node scripts/auditar-contraste.mjs
 *
 * Sale con código 1 si alguna pareja incumple, para poder engancharlo a CI.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const RUTA = path.join(aqui, "..", "app", "estilos", "01-tokens.css");

/* ── Parejas que de verdad se usan juntas ──────────────────────────────────
   Cada una es "este texto se pinta sobre este fondo". La lista se escribió
   mirando el código, no inventando combinaciones: una pareja que no exista en
   la práctica sólo genera ruido, y un auditor ruidoso se deja de mirar. */
const PAREJAS = [
  ["--text", "--bg", "Texto normal sobre el fondo de página"],
  ["--text", "--bg-elevated", "Texto normal sobre tarjeta elevada"],
  ["--text", "--surface", "Texto normal sobre superficie"],
  ["--text", "--surface-soft", "Texto normal sobre superficie suave"],
  ["--text-soft", "--bg", "Texto secundario sobre el fondo"],
  ["--text-soft", "--bg-elevated", "Texto secundario sobre tarjeta"],
  ["--text-soft", "--surface", "Texto secundario sobre superficie"],
  ["--text-soft", "--surface-soft", "Texto secundario sobre superficie suave"],
  ["--text-muted", "--bg", "Texto atenuado sobre el fondo"],
  ["--text-muted", "--surface", "Texto atenuado sobre superficie"],
  ["--brand-contrast", "--brand", "Texto encima de la marca (botones)"],
  ["--brand", "--bg", "La marca como texto sobre el fondo"],
  ["--brand", "--surface", "La marca como texto sobre superficie"],
  ["--danger", "--surface", "Aviso de error sobre superficie"],
  ["--danger", "--bg-elevated", "Aviso de error sobre tarjeta"],
  ["--success", "--surface", "Aviso de acierto sobre superficie"],
  ["--estado-atendida", "--surface", "Estado 'atendida' sobre superficie"],
  ["--estado-cancelada", "--surface", "Estado 'cancelada' sobre superficie"],
];

/* ── Lo que ya se sabe y está esperando una decisión de marca ─────────────
   Estas tres incumplen y NO se arreglan solas: la única forma de que pasen es
   oscurecer la marca, y eso cambia el aspecto de toda la web. No es técnico.

   Se listan aquí en vez de borrarlas de PAREJAS por dos razones: se siguen
   imprimiendo cada vez que alguien corre esto —así no se olvidan— y el script
   puede salir con 0 para no bloquear la integración continua por algo ya
   sabido. Si aparece una CUARTA, esa sí sale con 1.

   Los números, para cuando toque decidir:
     · Blanco sobre la marca da 3.17. Para llegar a 4.5 la marca tendría que
       ser #8B6A4B —que ya existe como --brand-deep— y da 4.93.
     · La marca como texto se arregla usando --brand-deep en su lugar: 4.68
       en vez de 3.01. Eso no cambia ningún fondo, solo el color de algunos
       textos. */
const CONOCIDAS = new Set([
  "--brand-contrast|--brand",
  "--brand|--bg",
  "--brand|--surface",
]);

/* 4.5:1 es el mínimo de WCAG AA para texto normal. El texto grande admite 3,
   pero estos tokens se usan sobre todo en texto normal, así que se exige el
   estricto: aprobar con el laxo y usarlo en texto pequeño es el error que
   este script existe para evitar. */
const MINIMO = 4.5;

function aRgb(hex) {
  const h = hex.trim().replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}

function luminancia([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contraste(a, b) {
  const l1 = luminancia(aRgb(a));
  const l2 = luminancia(aRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Saca los tokens de cada tema.
 *
 * Se parte por los selectores en vez de usar una expresión regular sobre todo
 * el archivo: los dos temas declaran los MISMOS nombres con valores distintos,
 * y una búsqueda global se quedaría con el último y compararía el tema oscuro
 * contra sí mismo, aprobándolo todo.
 */
function leerTemas(css) {
  const temas = { claro: {}, oscuro: {} };
  const bloques = css.split(/(?=^:root)/m);
  for (const b of bloques) {
    const cabecera = b.slice(0, b.indexOf("{"));
    if (!cabecera.includes(":root")) continue;
    const destino = cabecera.includes('data-theme="dark"')
      ? "oscuro"
      : cabecera.includes('data-theme="light"') || cabecera.trim() === ":root" || cabecera.includes(":root,")
      ? "claro"
      : null;
    if (!destino) continue;
    for (const m of b.matchAll(/(--[\w-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) {
      temas[destino][m[1]] = m[2];
    }
  }
  return temas;
}

const css = fs.readFileSync(RUTA, "utf8");
const temas = leerTemas(css);

let fallos = 0;
let conocidas = 0;
let sinDefinir = 0;

for (const [tema, tokens] of Object.entries(temas)) {
  const n = Object.keys(tokens).length;
  console.log(`\n── Tema ${tema} (${n} tokens de color) ─────────────────────────`);
  if (!n) {
    console.log("  No se encontró ningún token. ¿Cambió la estructura del archivo?");
    fallos++;
    continue;
  }
  for (const [frente, fondo, descripcion] of PAREJAS) {
    const a = tokens[frente];
    const b = tokens[fondo];
    if (!a || !b) {
      sinDefinir++;
      console.log(`  ?      ${descripcion}  (${!a ? frente : fondo} no definido en este tema)`);
      continue;
    }
    const r = contraste(a, b);
    const pasa = r >= MINIMO;
    const conocida = CONOCIDAS.has(`${frente}|${fondo}`);
    if (!pasa && !conocida) fallos++;
    if (!pasa && conocida) conocidas++;
    const etiqueta = pasa ? "ok" : conocida ? "sabido" : "FALLA";
    console.log(
      `  ${etiqueta.padEnd(6)} ${r.toFixed(2).padStart(5)}:1  ${descripcion}` +
        (pasa ? "" : `\n           ${frente} ${a} sobre ${fondo} ${b} — mínimo ${MINIMO}`)
    );
  }
}

console.log("");
if (sinDefinir) console.log(`${sinDefinir} pareja(s) sin poder comprobar por tokens no definidos.`);
if (conocidas) {
  console.log(
    `${conocidas} incumplimiento(s) marcado(s) como "sabido", a la espera de una\n` +
      `decisión de marca. No bloquean: arreglarlos exige oscurecer la marca, y eso\n` +
      `cambia el aspecto de toda la web. Los números están en el bloque CONOCIDAS\n` +
      `de este archivo.`
  );
}
if (fallos) {
  console.log(`\n✖ ${fallos} pareja(s) NUEVA(s) por debajo de ${MINIMO}:1.\n`);
  process.exit(1);
}
console.log(`\n✔ Ninguna pareja nueva por debajo de ${MINIMO}:1, en ninguno de los dos temas.\n`);
