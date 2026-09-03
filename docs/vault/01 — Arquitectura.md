---
tags: [proyecto, arquitectura]
actualizado: 2026-09-03
---

# Arquitectura

Volver a [[00 — Consultorio Estético (índice)]]

## Forma general

Es un **monolito partido en dos despliegues**, no microservicios:

```
Navegador
   │
   ├─→ Next.js 15 (Vercel)          páginas, React, i18n
   │      │
   │      └─→ /app/api/*            3 rutas de servidor (correos de cita)
   │
   └─→ Express 4 (Railway)          la API: 60 endpoints
          │
          └─→ PostgreSQL 18         en Neon (serverless)
```

La decisión de fondo: **el backend habla con Postgres por SQL directo**
(`pg.Pool`), nunca a través del SDK de un proveedor. Eso fue lo que hizo que
migrar de Supabase a Neon (2026-09-02) fuera cambiar `DATABASE_URL` y poco
más — Postgres sigue siendo Postgres en cualquier proveedor. Ver
[[06 — Migración fuera de Supabase]].

## Piezas y por qué están

| Pieza | Para qué | Notas |
|---|---|---|
| **Next.js 15** (App Router) | Sitio público y panel | React 19, renderizado en servidor |
| **Express 4** | La API | Toda la lógica de permisos vive aquí |
| **PostgreSQL 17** | Datos | Esquema versionado en `server/sql/` |
| **next-intl** | Español / inglés | 438 claves, parejas en ambos |
| **Framer Motion** | Animaciones | Carga diferida donde pesa |
| **Anthropic SDK** | Copiloto del panel | Con confirmación humana antes de escribir |
| **Resend** | Correos | Notificaciones y recuperación de contraseña |
| **Sentry** | Errores en producción | Instalado, falta activarlo |

## Autenticación: propia

`/auth2` — JWT de acceso de 15 min + refresh rotativo de 30 días en cookie
`httpOnly`, contraseñas con argon2id, y Google OAuth.

Durante la migración convivieron dos sistemas a propósito (`verifyToken`
aceptaba token propio y de Supabase), para poder migrar pantalla por
pantalla en vez de cortar el acceso de golpe: cortar el login de la doctora
en un solo despliegue es como se pierde el acceso al panel un lunes por la
mañana. Terminada la migración, quedó solo el propio.

El frontend pregunta el token en **un solo sitio**: `src/lib/sesion.ts`.
Antes había nueve llamadas sueltas al SDK, y con eso cambiar de proveedor
obligaba a tocar nueve archivos y arriesgarse a olvidar uno. Esa
centralización es la razón de que el corte final fuera barato.

## Dónde vive cada dato sensible

| Dato | Dónde | Cómo |
|---|---|---|
| Contraseñas | `usuarios.password_hash` | argon2id |
| Token de sesión (refresh) | `sesiones.token_hash` | SHA-256, nunca en claro |
| Tokens de un solo uso | `tokens_unicos.token_hash` | SHA-256 |
| Clave de API del copiloto | `integraciones_ia` | Cifrada con pgcrypto |
| Access token (navegador) | **solo en memoria** | Nunca en localStorage |
| Refresh token (navegador) | Cookie `httpOnly` | El JS de la página no la lee |

## Lo que ata a Supabase

**Nada.** Cero importaciones del SDK, cero llamadas, el paquete fuera de los
dos `package.json`. Se verificó el 2026-09-02.

Lo que sí queda del pasado: los consentimientos firmados **antes** del
2026-09-03 tienen guardada una URL pública completa en vez de una clave, y
siguen en el bucket público. Migrarlos es un paso aparte, anotado en
[[10 — Cosas por hacer]].
- El resto son utilidades que arrastran el import.

Ver [[06 — Migración fuera de Supabase]].
