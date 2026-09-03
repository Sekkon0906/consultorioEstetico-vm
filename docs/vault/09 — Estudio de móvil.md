---
tags: [proyecto, ux, movil]
actualizado: 2026-09-02
---

# Estudio de móvil

Volver a [[00 — Consultorio Estético (índice)]] · Backlog en [[10 — Cosas por hacer]]

Medido **en producción**, viewport real de **375 × 812** (iPhone X/11/12/13
mini — el ancho más común y el más exigente), en claro y en oscuro.
No es opinión: cada hallazgo tiene su medición.

---

## Resumen en una frase

El sitio no está "mal diseñado" para móvil — está **diseñado para escritorio y
parcheado para móvil**. El 78 % del CSS son overrides responsive con 442
`!important` y 23 breakpoints distintos. Por eso cada arreglo rompe otra cosa.

---

## Diagnóstico de raíz (las 4 causas)

### 1. Desktop-first con parches

| Medición | Valor |
|---|---|
| `@media (max-width: …)` | **38** |
| `@media (min-width: …)` | **2** |
| Breakpoints distintos | **23** (380, 420, 480, 520, 576, 600, 640, 700, 767, 768, 820, 900, 980, 991, 992, 1200, 1280…) |
| `!important` en `06-responsive.css` | **442** |
| Peso del archivo responsive | **3.817 de 4.880 líneas de CSS (78 %)** |

El estilo base asume escritorio; móvil se corrige "hacia abajo" apilando
excepciones. Cada excepción necesita más especificidad que la anterior → 442
`!important`. **Este es el problema que hay que resolver primero**; lo demás
son síntomas.

### 2. `100vh` en lugar de `100dvh`

5 usos de `min-height: 100vh` y 3 de `100dvh` conviviendo. En móvil `100vh`
**incluye la barra del navegador**, así que la sección mide más que la pantalla
visible y el contenido de abajo se corta. Es la causa técnica exacta de que en
el hero la foto se coma la pantalla y el titular quede fuera.

### 3. Sin sistema de espaciado ni de contenedores

Un solo `container-fluid` con `padding: 17.4px` y `max-width: none`. Las cards
del carrusel sangran fuera del viewport (se ven cortadas a ambos lados) porque
nadie define el canal lateral de forma consistente.

### 4. El tema oscuro no cubre todo

`02-tema-oscuro.css` (295 líneas) solo redefine parte de los colores. Los que
quedaron escritos a mano en los componentes (~607) se quedan con el valor claro
→ **texto negro/beige sobre fondo oscuro**.

---

## Hallazgos por pantalla

### Home — cabecera

- Topbar 38 px + navbar 62 px = **99 px de cabecera** (12 % de la pantalla).
  El navbar es sticky, así que 62 px se pierden permanentemente.
- El navbar **tapa los títulos de sección** al hacer scroll: falta
  `scroll-margin-top`. Se ve cortada la primera línea de "Conoce los
  procedimientos…".
- La topbar es una **marquesina** (`topbar-track`, 743 px de ancho desplazándose
  en 375). Se lee a media palabra: "…02. Ibagué – Tolima." Ilegible en
  movimiento y en una pantalla pequeña.
- Junto al logo aparece la **sección actual** ("Inicio", "Procedimientos") que
  duplica lo que ya dice la página y roba ancho.

### Home — hero

- La sección mide exactamente 1 viewport (812 px) pero la foto ocupa ~70 % y el
  titular + descripción + 2 botones se apretujan en el resto. **El titular no se
  ve sin hacer scroll.**
- La **palabra pintada se corta horizontalmente** ("autenticidac", "be … ai.").
  El efecto de máscara no respeta el ancho del contenedor.
- Total de la home: **4.741 px = 5,8 pantallas de scroll**.

### Home — "Por qué confiarme…"

- 1.160 px (1,43 pantallas) para una sección de apoyo.
- La imagen lleva una **lista de 15 procedimientos quemada encima** en texto
  diminuto, que se corta ("Manejo de cicatrices", "Manejo de estrias") y encima
  la tapa el botón "Ver presentación". Ilegible en móvil.

### Home — "Conoce los procedimientos"

- Las cards del carrusel **se cortan por ambos lados** — no hay padding lateral
  ni scroll-snap con margen.
- **No hay flechas** (sí las tiene el carrusel de `/procedimientos`).
- El título queda parcialmente bajo el navbar sticky.

### /procedimientos

- Al cargar, **una pantalla entera casi vacía**: el título aparece en gris casi
  invisible sobre fondo claro y una marca de agua JM gigante. Es la animación de
  entrada que no termina de disparar. Misma patología en `/agendar`.
- El párrafo introductorio ocupa **media pantalla** (8 líneas).
- En el carrusel destacado, **los dots y las flechas están DENTRO de la imagen**,
  encima del contenido.
- La foto del carrusel trae texto quemado que se corta ("otipo de piel",
  "Protocolizada según").

### /agendar

- Misma pantalla fantasma al cargar (calendario con opacidad ~0).
- El calendario en sí **funciona bien en móvil** — días grandes, buen área
  táctil. Es lo mejor resuelto del sitio.
- El card "Selecciona un día" mide ~400 px para mostrar un icono y una línea.
- El botón **"Continuar" es rectangular** cuando todo el sistema usa pills, y
  está suelto en medio de mucho espacio muerto.

### Tema oscuro

- Los **títulos de las cards del carrusel salen en negro serif sobre fondo café
  oscuro** → ilegibles. Es el caso concreto que reportaste.
- "Nuestra ubicación" sí queda bien (fondo grafito azulado, texto blanco): ese
  es el acento que te gustó y el que hay que extender.
- El navbar tiene un estado de transición en gris claro antes de tomar el tema.

---

## La reestructura propuesta

### Fase 0 — Cimientos (sin esto, lo demás se vuelve a romper)

1. **Escala de breakpoints única.** De 23 a 4:
   `480` (móvil chico) · `768` (tablet) · `1024` (portátil) · `1280` (escritorio).
2. **Invertir a mobile-first.** El estilo base es el de móvil; se sube con
   `min-width`. Esto es lo que elimina la mayoría de los 442 `!important`.
3. **`100dvh` en todas partes.** Nunca `100vh` en secciones de pantalla completa.
4. **Tokens de espaciado y contenedor:** un `--gutter` (16 px móvil / 24 tablet /
   32 escritorio) y un `--content-max` aplicados desde un solo sitio.
5. **Terminar de tokenizar los ~607 colores** — prerrequisito real del tema
   oscuro (F14/F15 del backlog).

### Fase 1 — Cabecera

- Navbar a **56 px** en móvil, logo + hamburguesa, **fuera la "sección actual"**.
- Topbar: **no marquesina en móvil**. Solo los 3 iconos sociales + un botón de
  teléfono; la dirección completa vive en el footer y en "Nuestra ubicación".
- `scroll-margin-top` en todas las secciones con `id`.

### Fase 2 — Hero

- Móvil: **foto de fondo a sangre + overlay + texto encima**, no dos bloques
  apilados. Altura `100dvh` real.
- Orden: kicker · titular (con la palabra pintada **contenida**, con
  `overflow: visible` controlado y `max-width` propio) · 1 línea de descripción ·
  **un solo botón primario** ("Agendar cita"). El secundario pasa a enlace de
  texto.

### Fase 3 — Carruseles (home y /procedimientos)

- Un **único componente de carrusel** para los dos sitios. Hoy son dos
  implementaciones con defectos opuestos (uno sin flechas, el otro con los
  controles dentro de la imagen).
- Controles **fuera** del área de contenido: flechas a los lados en ≥768,
  ocultas en móvil (ahí manda el swipe), dots siempre debajo.
- `scroll-snap` con `scroll-padding-inline` = `--gutter` para que las cards no
  se corten.

### Fase 4 — Densidad y textos

- Recortar los párrafos introductorios (el de `/procedimientos` a 2–3 líneas con
  "leer más").
- Quitar el texto quemado de las imágenes de procedimiento o sustituirlo por
  texto real bajo la foto (además es inaccesible y no lo lee Google).
- Revisar la altura de los cards con mucho aire muerto ("Selecciona un día").

### Fase 5 — Animaciones de entrada

- Las secciones que aparecen con `opacity: 0` deben tener **estado final
  garantizado** (`prefers-reduced-motion`, y un fallback si el `IntersectionObserver`
  no dispara). Hoy `/procedimientos` y `/agendar` pueden quedarse en fantasma.

---

## Cómo verificar cada fase

Medir siempre en **375 × 812** y **412 × 915**, en claro y oscuro:

```js
// overflow horizontal
document.documentElement.scrollWidth > document.documentElement.clientWidth
// alto total en pantallas
(document.documentElement.scrollHeight / innerHeight).toFixed(1)
// elementos que se salen
[...document.querySelectorAll('*')].filter(el=>{
  const r=el.getBoundingClientRect();
  return r.width>0 && r.right>innerWidth+1;
})
```

Objetivos: **0 elementos desbordados**, home **≤ 4 pantallas** (hoy 5,8),
cabecera **≤ 7 %** de la pantalla (hoy 12 %), y contraste AA en los dos temas.

---

## Orden recomendado

**Fase 0 primero, sí o sí.** Es aburrido y no se ve, pero sin eso cada arreglo
visual de las fases 1–5 se hace peleando con `!important` y se vuelve a romper.
Con los cimientos puestos, las fases 1–3 son rápidas y son el 80 % de lo que se
percibe.
