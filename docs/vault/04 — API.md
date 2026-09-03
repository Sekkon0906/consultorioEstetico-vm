---
tags: [proyecto, api]
actualizado: 2026-09-03
---

# API

Volver a [[00 — Consultorio Estético (índice)]]

Express 4 en Railway. 60 endpoints en 13 módulos. Todas las respuestas van
como `{ ok: true, ... }` o `{ ok: false, error: "..." }`.

## Niveles de acceso

| Nivel | Qué exige |
|---|---|
| **Pública** | Nada. Contenido que ve cualquier visitante |
| **Sesión** | Token válido. El dato se filtra por dueño |
| **Admin** | Estar en `admin_users` |

## Módulos

### `/auth2` — autenticación propia (11)
`POST /registro` · `POST /login` · `POST /refresh` · `POST /logout` ·
`POST /verificar` · `POST /reenviar-verificacion` · `POST /recuperar` ·
`POST /recuperar/confirmar` · `GET /google` · `GET /google/callback` ·
`GET /estado`

Todos públicos por naturaleza, pero con límite de intentos: 10 por cuarto de
hora en login y registro (solo cuentan los fallidos), 5 por hora en los que
envían correo.

### `/auth` — retirada
Existió mientras convivieron los dos sistemas de login. Ya no está: la
autenticación es toda `/auth2`.

### `/citas` (5)
| Endpoint | Acceso | Nota |
|---|---|---|
| `GET /` | Sesión | **Un paciente solo ve las suyas.** Admin ve todas |
| `POST /` | Sesión | Crear cita |
| `PUT /:id` | Sesión | Paciente: solo cancelar la propia. Admin: todo |
| `POST /:id/confirmar-pago` | Admin | |
| `DELETE /:id` | Admin | |

### `/procedimientos` (6)
`GET /`, `GET /:id`, `GET /:id/galeria` públicos · `POST`, `PUT`, `DELETE` admin

### `/testimonios` (4) · `/charlas` (5) · `/bloqueos-horas` (4)
Lectura pública, escritura admin.

### `/configuracion` (3)
`GET /` público (el sitio necesita la dirección y los teléfonos) ·
`GET /campos` y `PUT /` admin.

### `/copiloto` (7) — todo admin
`POST /mensaje` · `POST /confirmar` · `POST /rechazar` · `GET /auditoria` ·
`GET|PUT|DELETE /config`

Límite de 60 por hora: ahí el tope es de seguridad **y de factura**, porque
cada mensaje cuesta por token.

### `/analytics` (5) · `/reportes` (2) — todo admin
Resúmenes e ingresos.

### `/reagendas` (4)
`POST /citas/:id/solicitar-reagenda` (paciente) ·
`GET /reagendas`, `POST /reagendas/:id/aprobar`, `.../rechazar` (admin)

### `/usuarios` (3)
`GET /me`, `PUT /me` (sesión) · `GET /` (admin)

## Desde el frontend

Nunca se llama con `fetch` suelto. Se usa `src/lib/apiCliente.ts`:

```ts
import { apiFetch, apiAuth } from "@/lib/apiCliente";

const procedimientos = await apiFetch<Procedimiento[]>("/procedimientos");
await apiAuth("/procedimientos/123", { method: "DELETE" });
```

Esa capa pone la URL base, las cabeceras, el token y el `credentials:
"include"` que la cookie del refresh necesita.

> [!note] Irregularidad conocida
> El envoltorio de la respuesta no es uniforme: unos endpoints devuelven
> `{ ok, data }`, otros `{ ok, testimonios }`, otros `{ ok, citas }`. Se
> soporta con el parámetro `clave` de `apiFetch`. Uniformarlo queda
> pendiente: hacerlo de golpe rompería el panel mientras se hace.
