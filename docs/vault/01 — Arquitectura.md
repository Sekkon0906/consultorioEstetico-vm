---
tags: [proyecto, arquitectura]
actualizado: 2026-09-01
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
          └─→ PostgreSQL 17         hoy en Supabase, migrable
```

La decisión de fondo: **el backend habla con Postgres por SQL directo**
(`pg.Pool`), nunca a través del SDK de Supabase. Eso es lo que hace que
migrar la base sea cambiar `DATABASE_URL` y nada más — Postgres sigue siendo
Postgres en cualquier proveedor.

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

## Autenticación: dos sistemas conviviendo

Hay **dos** a propósito, mientras dura la migración:

- `/auth` → Supabase Auth. Lo que usa el frontend hoy.
- `/auth2` → propia. JWT + argon2id + Google OAuth. Ya funciona, sin usar aún.

`verifyToken` acepta **los dos tipos de token**: prueba primero el propio
(verificación local de firma, sin salir a red) y cae al de Supabase. Eso
permite migrar pantalla por pantalla en vez de cortar el acceso de golpe —
cortar el login de la doctora en un solo despliegue es como se pierde el
acceso al panel un lunes por la mañana.

El frontend pregunta el token en un solo sitio: `src/lib/sesion.ts`. Antes
había nueve llamadas sueltas a `supabase.auth.getSession()`, y con eso
cambiar de proveedor obligaba a tocar nueve archivos y arriesgarse a olvidar
uno.

## Dónde vive cada dato sensible

| Dato | Dónde | Cómo |
|---|---|---|
| Contraseñas | `usuarios.password_hash` | argon2id |
| Token de sesión (refresh) | `sesiones.token_hash` | SHA-256, nunca en claro |
| Tokens de un solo uso | `tokens_unicos.token_hash` | SHA-256 |
| Clave de API del copiloto | `integraciones_ia` | Cifrada con pgcrypto |
| Access token (navegador) | **solo en memoria** | Nunca en localStorage |
| Refresh token (navegador) | Cookie `httpOnly` | El JS de la página no la lee |

## Lo que aún ata a Supabase

**30 archivos del frontend** todavía lo usan. Separados por tipo:

- **~8 solo para autenticación** → migración mecánica con `sesion.ts`.
- **~15 para datos o archivos** → necesitan que el endpoint de la API exista
  y devuelva los mismos campos. Ya migrados: procedimientos, testimonios,
  notificaciones.
- El resto son utilidades que arrastran el import.

Ver [[06 — Migración fuera de Supabase]].
