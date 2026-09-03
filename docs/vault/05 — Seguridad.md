---
tags: [proyecto, seguridad]
actualizado: 2026-09-03
---

# Seguridad

Volver a [[00 — Consultorio Estético (índice)]]

Es un consultorio médico: las citas guardan nombre, teléfono, correo,
procedimiento y consentimiento firmado. Eso es información sujeta a la
**Ley 1581 de 2012** (habeas data) y al secreto profesional.

## Dónde se decide quién puede qué

```
Petición → helmet (cabeceras) → límite por IP → verifyToken → requireRole → ruta
```

**La autoridad de administración es la tabla `admin_users`.** Nunca
`usuarios.rol`, que es una columna que el propio usuario puede editar desde
el formulario de su perfil.

Esa distinción es el centro del modelo: si los permisos dependieran de un
campo editable por el usuario, cualquiera se haría administrador.

## Contraseñas y tokens

| Qué | Cómo | Por qué |
|---|---|---|
| Contraseñas | argon2id | Resiste ataques con GPU mucho mejor que bcrypt |
| Refresh token | SHA-256 en la base | Si se filtra la tabla, no sirven para entrar |
| Tokens de un solo uso | SHA-256 | Igual |
| Access token | 15 minutos | Si lo roban, la ventana es corta |
| Refresh token | 30 días, rotativo | Se invalida al usarlo; se puede revocar |

En el navegador: **access token solo en memoria** (lo que está en
localStorage lo lee cualquier script que se cuele), refresh en **cookie
`httpOnly`** (el JS de la página no puede leerla por definición).

## Límites por IP

| Ruta | Tope | Por qué |
|---|---|---|
| Login y registro | 10 / 15 min | Solo cuentan los fallidos: entrar bien no gasta cupo |
| Envío de correos | 5 / hora | Cada petición manda un correo real; sin tope el sitio serviría para inundar buzones ajenos |
| Copiloto | 60 / hora | Seguridad y factura |
| General | 600 / 15 min | Frena barridos sin estorbar |

`trust proxy` está activo: detrás de Railway, sin eso todas las peticiones
parecerían venir de la IP del proxy y un solo atacante agotaría el cupo de
todos.

## Principios que se aplican

> [!important] Fallar cerrado, no abierto
> Los permisos se deciden por **lo que sí está permitido**, no por lo que no.
> `if (rol !== "admin") filtrar` en vez de `if (rol === "usuario") filtrar`.
> La segunda forma abre las puertas ante cualquier valor inesperado — un rol
> nuevo, un `null`, un cambio en cómo se resuelve.

> [!important] No confirmar lo que no existe
> Al cancelar una cita ajena la respuesta es "no encontrada", igual que si no
> existiera. Decir "no es tuya" confirmaría que existe.
> Lo mismo en el login: mismo mensaje exista o no la cuenta, para no revelar
> qué correos están registrados.

> [!important] Los errores no dibujan el sistema
> Un 403 dice "no tienes permiso", no "se requiere rol admin o developer".
> El detalle va al log del servidor, que es donde sirve.

## Vulnerabilidades corregidas el 2026-09-01

Ver [[07 — Bitácora 2026-09-01]] para el detalle.

1. **`PUT /citas/:id` fallaba abierto** — cualquier usuario autenticado cuyo
   rol no fuera la cadena exacta `"usuario"` podía reescribir fechas, montos
   y estado de pago de **cualquier** cita.
2. **`GET /citas` igual** — filtraba el listado completo de pacientes con
   nombres, teléfonos y correos.
3. **Puerta trasera en `requireRole`** — `if (rol === "developer") return
   next()` saltaba todas las comprobaciones en todas las rutas.
4. **`ADMIN_EMAILS` en el frontend** — la lista de correos administradores
   viajaba al navegador de cualquier visitante, publicando qué cuenta atacar.
5. **`integraciones_ia` sin RLS** — la tabla con las claves de API cifradas
   era legible con la clave pública `anon` vía la API REST de Supabase.

## Pruebas

`server/pruebas/` — 29 comprobaciones contra Postgres **real**, no simulado.
La autenticación depende de restricciones, triggers e índices; un simulacro
no los ejercita, y de hecho fue una prueba real la que descubrió que ningún
paciente podía registrarse.

```bash
node pruebas/autenticacion.test.js   # 17
node pruebas/seguridad.test.js       # 7
node pruebas/permisos.test.js        # 6  ← aislamiento entre pacientes
```

## Pendiente

- Activar Sentry (instalado, sin configurar).
- **Rotar la contraseña de Neon y el token de R2.** Se pegaron en un chat
  durante la migración del 2026-09-02. Es lo primero antes de que haya
  pacientes reales.
- **Crear el bucket privado de R2** (`R2_BUCKET_PRIVADO`). Sin él, los
  consentimientos firmados se siguen guardando en el bucket público.
- **Migrar los consentimientos firmados antes del 2026-09-03**, que tienen
  guardada una URL pública en vez de una clave.
- Restringir la clave de Google Maps por dominio (necesita el dominio).
