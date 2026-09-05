---
tags: [proyecto, backlog]
actualizado: 2026-09-03
---

# Cosas por hacer

Volver a [[00 — Consultorio Estético (índice)]]

Backlog vivo. Nada de esto está en desarrollo todavía — es la lista para ir
priorizando. Origen: feedback de la sesión del 2026-09-02 + pendientes de la
[[06 — Migración fuera de Supabase|migración]].

---

## 🐞 Bugs (código) — reportados 2026-09-02

Cosas rotas, no rediseños. Van antes que la reestructura porque son baratas y
se ven.

- [x] **BUG1 · El indicador del navbar salta solo (escritorio).** Al entrar, el
      subrayado queda bien en "Inicio"; **a los pocos segundos el navbar se
      re-renderiza y el indicador salta a "Dra. Vanessa Medina"**.
      *Causa (identificada):* el indicador guarda una **posición numérica**
      (`el.offsetLeft` / `offsetWidth` en el estado `indicator`), no una
      referencia al elemento. En `NavbarClient.tsx` el bloque de la derecha es
      `{loading ? null : !user ? <botón Iniciar sesión/> : <avatar/>}`. Mientras
      `AuthContext` resuelve, ese bloque **no ocupa nada**; al resolver aparece
      el botón (o el avatar) y **el menú centrado se redistribuye** — todos los
      ítems se desplazan a la izquierda. La posición capturada se queda donde
      estaba, y visualmente cae debajo del ítem siguiente ("Dra. Vanessa
      Medina"). Si además el usuario es admin, se añade "Administrar" y el
      desplazamiento es mayor.
      *Arreglo:* dejar de guardar números. Anclar el indicador al `<li>` activo
      (por ejemplo con `layoutId` de framer-motion sobre el propio ítem, que ya
      se usa en `user-button-indicator`), o re-medir con un `ResizeObserver`
      sobre el `<ul>` en vez de con `setTimeout(80/250/600)`. Y reservar el
      ancho del bloque derecho durante `loading` para que no haya salto.
- [x] **BUG2 · El menú hamburguesa es transparente (móvil).** `.mobile-sidebar`
      no tiene fondo sólido: se lee la página por detrás y los enlaces se
      mezclan con el contenido ("Nuestro Consultorio" encima de los ítems del
      menú). Ilegible. Falta `background` opaco + backdrop que bloquee el fondo.
- [x] **BUG3 · Botones que se salen de los modals (móvil, `/procedimientos`).**
      En la ficha del procedimiento, "Agendar este procedimiento" **sobresale
      del card** "Precio estándar" por la derecha y por abajo. Revisar el resto
      de cards por el mismo patrón (botón más ancho que su contenedor).
- [x] **BUG4 · Títulos cortados por el navbar sticky.** "Sobre este
      procedimiento" queda a medias debajo de la barra. Es el mismo
      `scroll-margin-top` que falta (ver M1), pero se puede arreglar ya.

---

## 🟦 Código — Reestructura de móvil

Diagnóstico completo y verificación en **[[09 — Estudio de móvil]]**.
**La fase 0 va primero**: sin ella, cada arreglo visual pelea con 442
`!important` y se vuelve a romper.

- [x] **M0 · Cimientos.** Escala única de 4 breakpoints (480/768/1024/1280) ·
      invertir a **mobile-first** (`min-width`) · `100dvh` en vez de `100vh` ·
      tokens `--gutter` y `--content-max` · terminar de tokenizar los ~607
      colores. Hoy: 38 `max-width` vs 2 `min-width`, 23 breakpoints, 442
      `!important`, 78 % del CSS son overrides.
      ⟶ **Parcial (PR #3):** tokens y `100dvh` hechos. La escala de 4
      breakpoints queda como **convención documentada**, no impuesta, y la
      inversión a mobile-first se hace sección por sección: mover un
      `max-width: 820px` a 768 cambia lo que ve una pantalla de 800px, que
      es un cambio de diseño y no un refactor mecánico.
- [x] **M1 · Cabecera.** Navbar a 56 px en móvil, fuera la "sección actual"
      junto al logo, topbar sin marquesina en móvil (solo iconos + teléfono),
      `scroll-margin-top` en las secciones con `id`.
- [x] **M2 · Hero.** Foto de fondo a sangre + texto encima (no dos bloques
      apilados), `100dvh` real, un solo botón primario, y la palabra pintada
      **contenida** (hoy se corta: "autenticidac").
- [x] **M3 · Carrusel único.** Un solo componente para el home y
      ⟶ **Parcial (PR #3):** se unificó el COMPORTAMIENTO de los controles
      (flechas y dots fuera del contenido, ocultas en móvil, dots debajo),
      no el componente. La rueda 3D del home y el destacado de
      /procedimientos son piezas distintas; unificarlas era tirar la rueda.
      `/procedimientos`. Controles **fuera** del contenido, `scroll-snap` con
      `scroll-padding-inline` para que las cards no se corten.
- [x] **M3b · "Conoce los procedimientos" en móvil — composición.** Las cards
      deben quedar **alineadas a la derecha** y **girar sobre ese eje**, de modo
      que se lea a la doctora a la izquierda **apuntando con la mano** hacia
      ellas. Es la versión móvil de lo mismo que se pidió en escritorio (F5):
      la foto no es decoración de fondo, es parte de la composición.
- [x] **M4 · Densidad y textos.** Recortar párrafos introductorios, quitar el
      texto quemado sobre las fotos (ilegible en móvil y no lo lee Google),
      revisar cards con aire muerto.
      ⟶ **Parcial (PR #3):** hecho el reencuadre de la miniatura del vídeo.
      Falta recortar los párrafos introductorios y los cards con aire muerto.
      La miniatura necesita **una imagen nueva sin texto quemado**.
- [x] **M5 · Animaciones de entrada.** Garantizar el estado final: hoy
      `/procedimientos` y `/agendar` pueden quedarse en pantalla fantasma
      (opacidad ~0) si el observer no dispara.

---

## 🟦 Código — Frontend / UI

### Hero (apartado de la doctora)

- [x] **F1 · Palabra pintada.** Quitar la palabra rotativa que se revela de
      izquierda a derecha (efecto ya muy visto). Poner **una sola palabra fija**
      (ej. "confianza") que se escriba **con trazo de pincel, letra por letra**
      (traza la C, luego la O, y así), desde cero. No rota, no se borra: se
      queda esa.
      ⟶ **PR #3:** arreglado el recorte ("autenticidac") y que apareciera a
      trozos, pero **el rediseño sigue pendiente**: hoy sigue rotando y se
      revela con una máscara de izquierda a derecha, no letra por letra.

### Navbar

- [x] **F2 · Altura del navbar.** Está muy alto verticalmente — roba ~15-20 %
      de la pantalla sin necesidad. Reducirlo. Es la causa de que la sección
      "Conoce los procedimientos…" se sienta apretada.
- [x] **F3 · Indicador de cuenta.** El avatar/menú al hacer hover o estar
      logueado no convence. Rediseñarlo.
- [x] **F4 · Botón "Iniciar sesión" del navbar.** Hoy despliega un panel al
      pulsarlo. Decidir el comportamiento (¿mantener el botón?, ¿que solo
      navegue a `/login`?). **Pendiente recomendación.**

### Home — sección "Conoce los procedimientos más demandados y promociones"

- [x] **F5 · Rehacer el layout de la sección.** Hoy se sale de la pantalla y
      toca calibrar con scroll para leerla — problema de proporciones. Objetivo
      (ver la última captura de la sesión): título legible + la doctora
      apuntando con la mano + un **carrusel de procedimientos que pasa de
      derecha a izquierda**.
- [x] **F6 · Separar los elementos** de esa sección: el indicador de posición
      **más abajo**, las cards de procedimiento **más arriba**. Que todo tenga
      aire.
- [x] **F7 · Flechas de navegación** en ese carrusel del home (hoy solo hay
      dots, faltan flechas — sí las tiene el carrusel de `/procedimientos`).
- [x] **F8 · Modal de procedimiento (al seleccionar una card).** Hoy oscurece
      el fondo pero deja seguir scrolleando con el modal "en la mano" — se ve
      mal. Cambiar a un **flip del modal** (se da la vuelta y muestra la info) y
      **bloquear el scroll** mientras está abierto.

### Página /procedimientos

- [x] **F9 · Carrusel "Destacados y promociones del mes".** Mover el
      **indicador de dots FUERA del modal** (debajo) y las **flechas FUERA del
      modal**. Hoy están dentro y no tiene razón de ser.
- [x] **F10 · Animación al filtrar.** Al elegir "Facial" → subcategoría
      (p. ej. "Perfilamiento"), las cards aparecen "regadas" por la pantalla y
      luego se acomodan solas. Se ve horrible. Arreglar la entrada / el layout
      shift. (5ª captura de la sesión.)
- [x] **F11 · Ficha de procedimiento (detalle).** El modal aparece muy
      reducido; usar más ancho de pantalla; reemplazar el botón gris "Volver a
      procedimientos" + flecha por los **botones propios** ya planteados en el
      sistema de diseño. (6ª captura.)

### Transversal

- [x] **F12 · Uso del ancho de pantalla.** El sitio deja ~40 % del ancho vacío
      en columnas laterales y comprime formularios y contenido. Rebalancear el
      layout global (contenedores, `max-width`, márgenes).

### Agendar cita

- [x] **F13 · Gate de sesión.** Al seleccionar hora y pulsar "Continuar" sin
      sesión, hoy redirige directo a `/login`. En su lugar: **mensaje en la
      misma pantalla** ("para agendar una cita debes iniciar sesión") con dos
      botones — **Iniciar sesión** y **Registrarse** (el visitante puede tener
      cuenta y no haber entrado, o no tener cuenta).

### Tema oscuro / colores

- [~] **F14 · Auditoría de colores oscuro/claro.** *(Dos pasadas hechas: 147
      colores tokenizados + 13 fondos claros más. Queda abierta porque **el
      audit automático por getComputedStyle NO es fiable en el panel de
      previsualización** —informaba contraste 1,0 en un botón que la captura
      mostraba perfectamente legible, comprobado dos veces en páginas
      distintas con carga limpia. Hay que auditar en un navegador real.)*
- [ ] **F14b · Auditoría de colores — pasada final en navegador real.** Cada color del sitio debe
      tener su equivalente en modo oscuro y claro. Hoy el **beige del modo
      claro se cuela en el modo oscuro** (ej. la sección "Conoce los
      procedimientos…": letras negras + beige que no pegan sobre fondo oscuro).
- [x] **F15 · Afinar el acento oscuro.** *(Cerrada 2026-09-03.)* Fuimos a
      buscar el "azul pastel" del modo oscuro y **no existe**. La sección
      "Nuestra ubicación" la pinta `02-tema-oscuro.css` con
      `background-color: var(--bg-elevated)`, y ese token vale **`#1F1C22`**
      (leído en el navegador, no en el código): un grafito con una pizca de
      morado, del mismo ciruela que el tinte de las fotos. En toda la paleta
      oscura no hay un solo azul.
      **Por qué se leía como azul:** `#1F1C22` es el único tono *frío* de la
      página; todo lo demás —el champán `#E8C9A0`, textos, botones— es cálido.
      Un frío rodeado de cálidos se percibe azulado aunque no lo sea. Es
      contraste simultáneo, no color.
      **Decisión:** no se mete un azul nuevo. Se extiende el frío que ya
      existe (`--bg-elevated`), que además encaja con el ciruela elegido para
      las fotos. Meter un azul de verdad habría movido la marca del
      nude/champán hacia lo clínico.
- **Prerrequisito de F14/F15:** tokenizar los **~607 colores** escritos a mano
      en el CSS (ya estaba en el backlog).

### Frontend — ya conocidas

- [x] **F16 · Favicon en modo oscuro** — `<link rel="icon" media="(prefers-color-scheme: dark)">`
      + `app/icon`. **Desbloqueado (2026-09-02):** ya están en R2
      `ConsultorioImagenes/Logo/LogoLimpioBlanco.png` (para fondo oscuro) y
      `LogoLimpioNegro.png` (para fondo claro). Ojo: pesan 1,29 MB y 843 KB —
      hay que **optimizarlos y generar los tamaños** (32/180/192/512) antes de
      usarlos como favicon.
- [x] **F18 · Errores en cada carga completa.** *(Cerrada 2026-09-04.)*
      Eran **dos** errores encadenados en todas las páginas:
      `SyntaxError: Invalid or unexpected token` y, detrás,
      `Hydration failed because the server rendered HTML didn't match`.

      **La causa era una sola: el script antiflash del tema.** Iba como
      `<script dangerouslySetInnerHTML>` dentro de `<head>`, así que React lo
      trataba como un nodo suyo y lo volvía a tocar al hidratar. Pasó a
      `next/script` con `strategy="beforeInteractive"`, que Next inyecta
      fuera del árbol que React hidrata.

      > **Por qué se creyó que seguía abierto:** al arreglarlo se comprobó
      > enseguida y el fallo de hidratación seguía saliendo, así que se dio
      > por medio resuelto y se bisecó media hora más —desmontando `Footer`,
      > `CookieBanner`, `QuickAccessFab`, `NavbarClient`, el `<head>` manual
      > y la barra superior— sin encontrar nada. **La medición estaba
      > contaminada por una compilación vieja**: Turbopack no había
      > recompilado el layout todavía.
      >
      > La lección para la próxima: tras tocar el layout raíz, **parar el
      > servidor, borrar `.next` y arrancar de cero** antes de creerse una
      > medición. Recargar el navegador no basta.

      Comprobado así: servidor parado, `.next` borrada, arranque limpio, y
      recarga completa en `/`, `/testimonios` y `/consultorio`. Cero errores.

- [ ] **F17 · Videos.** Cambiar los `src` de los `<iframe>` cuando se muevan de
      la cuenta personal de YouTube.

---

## 🟦 Código — Backend

- [x] **B1 · Bucket privado para consentimientos y firmas.** ⚠️ **El código
      está hecho, pero FALTA CREAR EL BUCKET en Cloudflare.** Mientras
      `R2_BUCKET_PRIVADO` esté vacío se sigue usando el público (el servidor
      avisa al arrancar). Los consentimientos firmados ANTES del cambio
      siguen con su URL pública guardada; migrarlos es un paso aparte.
      Nuevo bucket R2
      privado + `GET /citas/:id/consentimiento.pdf` (autenticado, URL firmada),
      guardar la *clave* y no la URL pública. Cierra el hallazgo **CRÍTICO #1**
      del inventario. Necesita crear el bucket en Cloudflare (config).
- [x] **B2 · `jspdf@3` → `jspdf@4`.** Vuln crítica pre-existente
      (`FirmaConsentimiento`). Major con cambios de API — probar que el PDF
      sigue generándose.
- [x] **B3 · `withSentryConfig` import.** `from "@sentry/nextjs/config"` — una
      línea, avisa en cada build (romperá en v11).
- [ ] **B4 · (opcional)** Que el cron de recordatorios de Vercel llame directo
      a Railway en vez del proxy `app/api/reminders/send`.

---

## 🟦 Código — Documentación

- [x] **D1 · `docs/vault/` 01–05** (Arquitectura, API, Seguridad, Base de
      datos, Estructura) — describen el estado pre-migración (Supabase, 60
      endpoints).
- [x] **D2 · Tabla "Números"** de la nota raíz (líneas, endpoints) — está al
      2026-09-01.
- [ ] **D3 · Commit `72062f2`** de `docs/vault/` (en la rama ya mergeada) →
      llevar a `main` o descartar.

---

## 🟨 Deploy

- [ ] **DEP1 · Rotar credenciales.** Contraseña de Neon + token de R2 →
      actualizar `DATABASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` en
      Railway. **Antes de que la doctora lo use en serio.**
- [ ] **DEP7 · El despliegue de *preview* de Vercel falla.**
      *(2026-09-04.)* Producción **sí** construye bien —comprobado: sirve la CSP
      y el título nuevos—, así que `npm ci` y Next 16 funcionan en Vercel. Lo
      que falla es el preview de una rama.

      **Hipótesis principal, ya mitigada:** faltaba declarar `engines`. Next 16
      exige Node ≥ 20.9 y un proyecto de hace meses puede seguir fijado a Node
      18. Ya está declarado en los dos `package.json`.

      **Segunda hipótesis:** las variables de entorno de Preview (**DEP4**). La
      diferencia típica entre producción y preview es justo esa.

      Para cerrarlo hace falta el log, que vive en la cuenta del usuario:
      `npx vercel inspect <id-del-despliegue> --logs`, y mirar la primera línea
      con `Error:`.

- [ ] **DEP6 · `server/railway.json` declara un builder que quizá no se usa.**
      *(Encontrado 2026-09-04.)* El archivo dice `"builder": "NIXPACKS"` pero
      el panel de Railway muestra **Railpack**. Son constructores distintos y
      usan variables de entorno distintas: `NIXPACKS_INSTALL_CMD` frente a
      `RAILPACK_INSTALL_COMMAND`. Importa porque de ahí depende que el
      despliegue instale con `npm ci` y respete el lockfile.
      No se tocó el archivo: cambiar de builder a ciegas puede romper un
      despliegue que funciona. Hay que mirar en Railway cuál usó el último
      despliegue y alinear el archivo con eso.

- [ ] **DEP2 · Dominio propio.** Comprarlo → DNS a Vercel + Railway, actualizar
      `NEXT_PUBLIC_SITE_URL` / `APP_URL` / `CORS_ORIGIN` / `API_URL`, subdominio
      para R2, rehacer branding de OAuth. Desbloquea DEP3, C2, C3.
- [ ] **DEP3 · `R2_PUBLIC_URL` → subdominio propio** (`archivos.dominio.com`)
      cuando haya dominio + re-correr el rewrite de URLs en la base y el código.
- [ ] **DEP4 · Variables en Preview de Vercel** (si se quieren previews
      funcionales de las ramas).
- [ ] **DEP5 · `SENTRY_AUTH_TOKEN` en Vercel** — para subir source maps
      (mejores stack traces). Opcional.

---

## 🟥 Configuración (paneles)

- [ ] **C1 · Resend.** Verificar dominio (SPF/DKIM/DMARC en DNS), `RESEND_API_KEY`
      + `CORREO_DESDE` en Railway. Sin esto, los correos (verificación,
      recordatorios, avisos de cita) quedan en el log del servidor.
- [ ] **C2 · Google Maps.** Restringir la clave por referente HTTP + límite de
      gasto.
- [ ] **C3 · OAuth con dominio propio.** Hoy la pantalla de Google muestra
      `consultorioestetico-vm-production.up.railway.app`. Cuando haya dominio:
      cambiar branding + redirect URIs, agregar logo, mantener publicada.
- [ ] **C4 · Vercel Web Analytics / Speed Insights** — un toggle.
- [ ] **C5 · Neon scale-to-zero.** Evaluar desactivarlo si los arranques en
      frío molestan (plan pago).

---

## 🟩 Externo / Contenido

- [ ] **E1 · Videos** — subir a otra cuenta (Vimeo, canal aparte, o R2).
- [ ] **E2 · NIT y registro profesional** — pendientes del README viejo.
- [ ] **E3 · Contenido semilla** — la doctora revisa procedimientos, precios,
      horarios y dirección en producción.

---

## 🐞 Bugs — reportados 2026-09-03

- [x] **BUG5 · "Invalid Date" en Mis Citas Agendadas.** La tarjeta de la cita
      muestra literalmente `Invalid Date` donde debería ir la fecha y la hora.
      **No es un problema de color** — es una fecha que no se está parseando.
      Sospecha: la cita se guarda con `fecha` y `hora` en columnas separadas y
      en el cliente se construye un `new Date()` con un formato que el
      navegador no acepta (`"2026-09-02 10:00"` sin la `T`, o la hora sola).
      Revisar `app/perfil/citas_agendadas/`.
      *Visto en la cita "Bótox Complementario" del 2026-09-03.*
      ⟶ **Hecho.** La causa estaba en el backend: `pg` convertía la columna
      `date` a un `Date` de JavaScript y le pegaba la medianoche en la zona
      del servidor. Arreglado en el origen (devuelve texto "YYYY-MM-DD") y
      con un helper compartido en el frontend. Había un segundo fallo
      latente detrás: con el servidor en UTC la cita se habría mostrado un
      día antes.

- [x] **BUG6 · El selector de procedimiento del formulario de agendar está
      roto.** Al abrir el modal para escoger el tipo de procedimiento, la lista
      aparece **cortada por arriba**: el ítem resaltado se solapa con la
      cabecera "FACIALES" y se ve media línea. El scroll arranca en una
      posición intermedia en vez de arriba.
      Sospecha: el `scrollIntoView` de la opción seleccionada corre antes de
      que el modal termine de montar, o falta `scroll-margin-top` sobre la
      cabecera pegajosa del grupo.
      ⟶ **Hecho.** El desplazamiento al elemento elegido ahora es
      intencionado y centrado, y los ítems llevan `scroll-margin-top`.
      La búsqueda se replanteó con **chips de categoría** para filtrar sin
      teclear. Queda por evaluar si hace falta además navegación con
      teclado (flechas + Enter).

---

## 🎨 Tema oscuro — segunda pasada (reportado 2026-09-03)

La primera pasada dejó la paleta y los tokens; esto es lo que **quedó sin
adaptar**. Hay un patrón de fondo: son los sitios donde el color está escrito
a mano en el componente y no cita el token, así que en oscuro se queda con el
valor claro. Es la continuación natural de F14.

- [x] **O1 · Recuadros de "Lo que me distingue" (home).** Los títulos
      ("Tecnología HydraFacial", "Productos premium", "Mínimo dolor",
      "Atención personalizada") son **casi invisibles** sobre la tarjeta
      oscura; solo se lee el subtítulo. Los íconos también salen demasiado
      claros y se pierden contra el fondo.

- [x] **O2 · Sección "Conoce los procedimientos más demandados y promociones"
      (home) no está en modo oscuro.** Sigue con el fondo café/beige claro
      mientras el resto de la página ya es oscuro. Es la sección entera, no un
      detalle.

- [x] **O3 · El botón "Agendar cita" se vuelve ilegible.** El champán de
      `--brand` en oscuro es muy claro, y con el texto encima el contraste no
      alcanza. Pasa en el navbar, en la ficha de procedimiento ("Agendar este
      procedimiento") y en el resto de botones primarios.
      *Nota:* `--brand-contrast` existe justamente para esto (`#1A1720` en
      oscuro). El problema es que estos botones no lo están usando.

- [x] **O4 · "Formación / crecimiento continuo" (página de la doctora) no está
      adaptado.** Aparece un bloque blanco/crema a pantalla completa —con el
      texto "Sin actividades registradas aún"— en medio de una página oscura.

- [x] **O5 · Botones de la página /procedimientos ilegibles.** Mismo caso que
      O3: el fondo claro del botón con texto claro encima.

- [x] **O6 · "Mis Citas Agendadas" en oscuro.** La tarjeta de la cita y la
      columna de filtros (Todos / Pendiente / Confirmada…) no están adaptadas.

> [!tip] Cómo atacarlos de una vez
> No ir uno por uno a ojo. Auditar con la consulta del estudio de móvil:
> recorrer los elementos visibles en `[data-theme="dark"]` y listar los que
> tengan un contraste texto/fondo por debajo de AA. Eso saca los seis de
> arriba y los que aún no hemos visto, en una pasada.

---

## 🟦 Rediseño pedido — Consultorio (2026-09-03)

- [x] **R1 · "Elegancia, confort y tecnología" → galería con descripción
      sincronizada.** Hoy la sección es un bloque de texto y aparte una
      galería. Juan quiere separarlas y convertirlo en:
      **foto a la izquierda · descripción breve a la derecha**, y que **al
      cambiar de imagen cambie la descripción** (los implementos que se ven,
      la zona del consultorio, la vista…).
      Objetivo suyo, textual: *"darle como un récord visual a esa parte"*.
      ⟶ **Hecho.** Foto a la izquierda, descripción a la derecha, cambiando
      con la imagen. **Los cinco textos son un borrador** escrito a partir
      de lo que se ve en cada foto: la doctora debería revisarlos.
      ⟶ Implica **contenido nuevo**: hace falta un texto corto por cada foto de
      la galería. Eso lo tiene que escribir la doctora, o sacarse de lo que se
      ve en cada imagen. Es la parte que bloquea, no el código.

---

## ✅ Hecho el 2026-09-02

- Rol **admin** para `medinapipe123@gmail.com` en producción (fila en
  `admin_users`). Para verlo: recargar la página o cerrar y volver a entrar.
