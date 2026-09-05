---
tags: [proyecto, seguridad, diagnostico]
fecha: 2026-09-04
---

# Diagnóstico de seguridad — 4 de septiembre de 2026

Volver a [[00 — Consultorio Estético (índice)]] · Ver también [[05 — Seguridad]]

Revisión completa antes de configurar credenciales y buckets, para saber qué
hay que proteger antes de protegerlo.

> **Titular:** el código está bien. Lo que hay pendiente es **configuración**,
> y hay **un solo riesgo real de filtración de datos de pacientes**.

---

## Lo que está bien, y conviene no romper

No es cortesía: son cosas que suelen faltar y aquí están, así que hay que
saber que existen para no deshacerlas sin querer.

| Área | Estado |
|---|---|
| **Contraseñas** | argon2id (no bcrypt, no SHA). Correcto. |
| **Tokens de recuperación** | Se guardan **hasheados**, con propósito y caducidad. Si alguien lee la base, no puede usarlos. |
| **Enumeración de usuarios** | Al intentar entrar con un correo que no existe se verifica contra un **hash señuelo**, para que tarde lo mismo. Sin eso se puede averiguar quién tiene cuenta midiendo tiempos. |
| **Refresh token** | Cookie `httpOnly` + `secure` en producción. Fuera del alcance del JS del sitio. |
| **Inyección SQL** | Todas las consultas parametrizadas. Cero concatenación de variables. |
| **Límites por IP** | `express-rate-limit` con topes distintos por endpoint, y la IP real sacada de `X-Forwarded-For` — sin eso, detrás de Railway todos compartirían cupo. Login: 10 fallos / 15 min, sin gastar cupo al acertar. Correo: 5 / hora. |
| **Cabeceras** | `helmet` en la API, y en Next `X-Frame-Options` y `Strict-Transport-Security` con `preload`. |
| **CORS** | Lista blanca de orígenes, no `*`. |
| **Autorización** | `admin_users` es la única autoridad. `GET /citas` filtra por `user_id` salvo rol admin exacto: **falla cerrado**. |
| **IDOR en consentimientos** | `GET /citas/:id/consentimiento` comprueba que la cita es tuya antes de dar el enlace. |
| **Secretos en el repo** | Ninguno. Solo `.env.example`, sin valores reales, y `.env` está en `.gitignore` desde el principio. |
| **Datos sensibles en registros** | Nada de contraseñas, tokens ni documentos. |
| **Cron de recordatorios** | Exige `Bearer CRON_SECRET` y **falla cerrado** si la variable no está puesta. |

---

## Riesgos, por orden de lo que puede pasar de verdad

### 🔴 R1 · Los consentimientos firmados están en un bucket público

**El único riesgo real de filtración de datos de pacientes.**

`R2_BUCKET_PRIVADO` no está configurado, y el código tiene un plan B
explícito: si no está, usa el bucket normal — que es público y se sirve desde
`r2.dev`. Ahí dentro hay consentimientos con **nombre, documento y firma**.

Lo que lo contiene ahora mismo:

- La clave del archivo es `carpeta/{timestamp}_{12 hex}` — unos 48 bits de
  azar. No se adivina de un vistazo.
- R2 no permite **listar** el contenido desde la URL pública.
- En la base, las rutas se guardan como **clave**, no como URL pública: se
  comprobó, hay 0 filas con `http%`. Así que no hay enlaces permanentes
  circulando.
- El endpoint que las entrega ya devuelve **URL firmada que caduca en 10
  minutos**, y comprueba de quién es la cita.

Lo que no lo contiene:

- El objeto **sigue siendo legible por cualquiera que consiga la URL**, y una
  URL viaja por el historial, por WhatsApp y por los registros de cualquier
  intermediario.
- 48 bits con una ventana de tiempo conocida no es una barrera criptográfica.

**Estado de exposición hoy: NINGUNA — corregido el 2026-09-04.**

El diagnóstico decía "1 cita con consentimiento". **Era falso, y el error fue
mío.** Lo conté con `count(firma_url)`, y `count()` en SQL cuenta las cadenas
vacías como presentes. Al ir a migrar el archivo, el script encontró 0: las
dos columnas de esa cita guardan `''`, no una ruta, y
`consentimiento_firmado` es `false`.

> **La lección:** para saber si un campo de texto tiene contenido no vale
> `IS NOT NULL` ni `count()`. Hay que mirar la longitud —`length(coalesce(x,''))
> > 0`— o comparar contra `''`. Una cadena vacía no es nulo, y en una consulta
> de auditoría esa diferencia es la que separa "hay un documento clínico
> expuesto" de "no hay ninguno".

Así que **nunca se ha firmado un consentimiento en producción** y el riesgo era
teórico, no actual. Sigue habiendo que crear el bucket privado antes del primer
paciente real —el código usaría el público mientras no exista—, pero no hay
nada que migrar ni nada expuesto ahora mismo.

**Efecto secundario:** guardar `''` en vez de `NULL` hace que
`WHERE firma_url IS NOT NULL` mienta. No rompe nada —el endpoint comprueba
`if (!clave)`, que trata bien la cadena vacía— pero conviene normalizarlo para
que las consultas de auditoría digan la verdad.

---

### 🟠 R2 · Dependencias con vulnerabilidades conocidas

- **Front:** 1 alta + 1 moderada. La de PostCSS (divulgación de archivos
  `.map` por *path traversal*) llega **a través de Next**. Arreglarla obliga a
  subir a Next 16, que es un cambio con ruptura.
- **Servidor:** ~~3 moderadas en `body-parser` y `qs`, vía Express 4.~~
  **RESUELTO el 2026-09-04.** `npm audit fix` decía tener arreglo pero no lo
  aplicaba: Express 4 fija un rango de `qs` que se queda corto. Se resolvió
  con un `overrides` a `qs@^6.16.0` en `server/package.json`. Comprobado que
  no rompe el parseo —que es justo lo que toca `qs`—: GET público 200, query
  string 401, POST con JSON válido 401. **0 vulnerabilidades.**

El del servidor se arregla hoy. El del front necesita una tarde y pruebas.

---

### 🟢 R3 · Credenciales que estuvieron expuestas — **rotadas el 2026-09-04**

Contraseña de Neon y token de R2 pasaron por sitios menos controlados durante
la migración (DEP1 del backlog). No hay indicio de uso indebido, pero rotarlas
es barato y cierra el tema.

---

### 🟡 R4 · CSP — **puesta en observación el 2026-09-04**

Con una CSP, un script inyectado —por una dependencia comprometida, por
ejemplo— no podría enviar datos a un servidor ajeno. Sin ella, sí. Es la
diferencia entre "un fallo" y "un fallo que además se lleva los datos".

Está en `next.config.ts` en modo **`Content-Security-Policy-Report-Only`**:
avisa de lo que bloquearía, sin bloquear. Aplicarla a ciegas en un sitio con
mapas incrustados y vídeos es la forma segura de romper media web un viernes.

**Verificación hecha, y cómo:** listando los orígenes que cada página carga de
verdad (`performance.getEntriesByType("resource")`) y comparándolos con la
política. En `/`, `/consultorio`, `/testimonios` y `/procedimientos` los únicos
externos son la API, `www.google.com` (el mapa, en `frame-src`) y el bucket de
R2 (`img-src`). Todos permitidos.

> **Ojo con el método.** Primero se intentó leer las violaciones de la consola
> y salía "ninguna" — pero al inyectar una violación **deliberada** tampoco
> aparecía: el lector de consola no captura los avisos de CSP en modo reporte.
> El resultado no valía nada. Una sonda con `securitypolicyviolation` sí las
> ve, y confirmó `disposition: "report"`. **Antes de creerse un "no hay
> problemas", hay que comprobar que el detector detecta.**

**Antes de pasarla a modo bloqueante:**

1. `NEXT_PUBLIC_API_URL` **tiene que estar definida en Vercel al construir**:
   la línea se resuelve en tiempo de compilación y, sin ella, queda
   `connect-src 'self'` y el sitio no podría hablar con su propia API. Hay un
   aviso en consola durante el build que lo recuerda.
2. Pasearse por el sitio reproduciendo un vídeo, que es el único caso que la
   verificación anterior no cubre —los vídeos cargan al pulsar, no al abrir.

---

### 🟢 R5 · Un correo en los registros — **resuelto el 2026-09-04**

`roles.js` escribía el correo del primer administrador en el log. Que se
sembró un administrador es la información útil; **quién** se consulta en
`admin_users`, que es donde vive.

### 🟢 R6 · Un cuerpo mal formado daba 500 — **resuelto el 2026-09-04**

Encontrado al probar el cambio de `qs`: mandar JSON roto a cualquier endpoint
devolvía **500** con la traza completa en el registro. Dos problemas: el 500
dice "es culpa mía" cuando la petición venía rota, y **cualquiera podía llenar
el log de trazas** mandando basura — ruido donde luego hay que buscar un
incidente de verdad.

Ahora `entity.parse.failed` responde 400 y `entity.too.large` responde 413,
las dos sin traza y sin decir *dónde* falla el JSON: eso le ahorraría trabajo a
quien esté probando el límite. Comprobado: JSON roto 400, válido 401,
GET público 200.

> **Revisado y descartado:** el mecanismo que nombra al primer administrador
> **no** es escalable. Exige **las dos cosas a la vez**: que el correo esté en
> una lista blanca de variables de entorno **y** que `admin_users` esté vacía.
> Con la tabla poblada no hace nada.

---

## Plan, en el orden en que conviene hacerlo

### Antes del primer paciente real

1. **Crear `R2_BUCKET_PRIVADO`** en Cloudflare R2 —bucket **sin** acceso
   público— y definir la variable en Railway. *(Usuario. Cierra R1.)*
2. ~~**Mover el consentimiento que ya existe.**~~ **No hay ninguno**: se
   comprobó al ejecutar la migración. El script queda hecho
   (`server/scripts/migrar-consentimientos-a-privado.js`) por si algo se firma
   antes de que la variable esté puesta en Railway.
3. ~~**`npm audit fix` en el servidor.**~~ **Hecho el 2026-09-04.**
4. ~~**Rotar la contraseña de Neon y el token de R2.**~~ **Hecho el
   2026-09-04.** Comprobado que las nuevas credenciales dan acceso: el backend
   responde y R2 lista el bucket.

### Las semanas siguientes

5. **CSP en `next.config`**, empezando en modo solo-reporte para ver qué
   rompería antes de aplicarla. *(Puedo hacerlo yo.)*
6. **Subir a Next 16** para cerrar la vulnerabilidad de PostCSS. Necesita
   pruebas de todas las páginas. *(Yo, con una sesión dedicada.)*
7. ~~**Quitar el correo del log.**~~ **Hecho el 2026-09-04.**
8. **Restringir la clave de Google Maps** por referente HTTP. *(Usuario, C2.)*

### Cuando haya volumen

9. **Registro de auditoría** de accesos a consentimientos: quién abrió qué y
   cuándo. Con datos clínicos, poder responder "¿quién vio esto?" importa
   tanto como impedir que lo vean.
10. **Copias de seguridad probadas.** Neon tiene restauración por tiempo, pero
    *tener* copia y *saber restaurarla* son cosas distintas.

---

## Lo que NO hace falta

Para no gastar esfuerzo donde no rinde:

- **Cifrar la base entera.** Neon ya cifra en reposo y en tránsito. Cifrar por
  columna complicaría todas las consultas a cambio de casi nada mientras el
  riesgo real esté en el bucket.
- **Autenticación en dos pasos.** Con una sola administradora y argon2 más
  límite de 10 intentos por cuarto de hora, el beneficio no compensa la
  fricción diaria. Reevaluar si entra personal.
- **WAF o similar.** El tráfico esperado no lo justifica.

---

## Cómo se hizo esta revisión

Sobre el código, no sobre suposiciones: se contaron rutas con y sin
`verifyToken`, se buscó concatenación en las consultas SQL, se revisó el
filtrado por `user_id` en los endpoints que devuelven datos de pacientes, se
corrió `npm audit` en los dos paquetes, se miró el historial de git en busca
de secretos y **se consultó la base de producción** para saber cuántos
consentimientos hay y en qué formato están guardadas sus rutas.

No se hizo prueba de penetración ni se probó la API en ejecución con dos
sesiones distintas. El IDOR está comprobado **leyendo el código**, no
atacándolo: la comprobación existe y es correcta, pero no se ha ejecutado un
intento real de leer la cita de otro paciente.
