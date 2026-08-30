# Migración de Supabase a infraestructura propia

Estado: **planificación cerrada, esperando el volcado de Supabase.**

Estudio completo y navegable: ver el artifact de la sesión (Salir de Supabase).
Este documento es el resumen operativo versionado.

## Decisiones tomadas

| Decisión | Elegido |
|---|---|
| Infraestructura | Hostinger **VPS KVM 2** (2 vCPU / 8 GB), Ubuntu 24.04. Pendiente de contratar. |
| Estrategia | **Camino C** — migración por fases, sin caída del sitio |
| Base de datos | PostgreSQL 17 en el mismo VPS |
| Copiloto de IA | Contenido del sitio + consultas agregadas sin datos identificables |

El hosting compartido de Hostinger (Premium / Business / Cloud) **no sirve**:
no ofrece PostgreSQL ni un runtime de Node controlable. Solo el VPS.

## Inventario de acoplamiento a Supabase

- **Base de datos:** 12 tablas + 5 vistas `v_*`. Postgres estándar, migración directa.
- **Auth:** GoTrue. Email+contraseña, Google OAuth, recuperación. `usuarios.id` = `auth.uid()`.
- **Storage:** buckets `ConsultorioImagenes` y `charlas`. Ambos públicos.
- **Realtime / Edge Functions / RPC:** sin uso.
- **Frontend:** `@supabase/supabase-js` importado en **23 archivos**. Es la capa de
  datos completa, no una integración periférica.
- **Backend Express:** 10 rutas; ya usa SQL directo con `pg`. Solo cambia la
  verificación del token.

## Hallazgos de seguridad a corregir durante la migración

1. **CRÍTICO** — Los PDF de consentimiento informado y las firmas se suben a un
   bucket **público** con nombre predecible (`consentimiento_{idCita}_{ts}.pdf`).
   Son datos sensibles de salud bajo la Ley 1581 de 2012.
   `app/src/components/FirmaConsentimiento.tsx:239,250`
2. **CRÍTICO** — `getCitasByDayApi()` pide nombre, teléfono, correo y
   procedimiento de todas las citas de una fecha desde el navegador con la
   `anon key`. Solo es seguro si RLS lo impide. `app/services/citasApi.ts:34`
3. **CRÍTICO** — El rol de administrador se decide en el cliente
   (`isAdmin` en `citasApi.ts:47`, `ADMIN_EMAILS` en `app/src/lib/api.ts:3`).
4. **ALTA** — Dirección, WhatsApp y correo escritos a mano en 8 archivos.
   Lo resuelve la tabla `configuracion_sitio`.
5. **MEDIA** — El proyecto del código (`ibpkihfjripvizismhsk`) está escrito a
   mano en `imagenes.ts`, `next.config.ts` y `FirmaConsentimiento.tsx`.

## Fases

| # | Fase | Estimado |
|---|---|---|
| 00 | Volcado real de Supabase (**bloquea todo**) | — |
| 01 | Preparar VPS: SSH, ufw, fail2ban, Postgres, Node, Nginx, **backups verificados** | ~1 d |
| 02 | Migrar base de datos y archivos; separar público de privado | ~1-2 d |
| 03 | Auth propia: JWT, argon2 con compatibilidad bcrypt, Google OAuth, SMTP | ~3-4 d |
| 04 | Frontend a la API propia, por dominio: consentimientos → citas → usuarios → charlas → contenido público | ~4-6 d |
| 05 | `configuracion_sitio` + pantalla de administración | ~2 d |
| 06 | Videos fuera de la cuenta personal de YouTube | ~1 d |
| 07 | Copiloto de IA (tool calling, confirmar antes de escribir, auditoría) | ~3-4 d |
| 08 | Corte a producción; Supabase en solo lectura 2 semanas | ~1 d |

## Lo que se necesita de Supabase para arrancar

Ejecutar en el SQL Editor del proyecto y pegar los resultados:

```sql
-- 1. Políticas de seguridad vigentes
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by tablename;

-- 2. Buckets y si son públicos
select id, name, public, file_size_limit from storage.buckets;

-- 3. Peso y cantidad de archivos por bucket
select bucket_id, count(*) archivos,
       pg_size_pretty(sum((metadata->>'size')::bigint)) peso
from storage.objects group by bucket_id;

-- 4. Cuentas por proveedor (define si migramos hashes o pedimos reset)
select raw_app_meta_data->>'provider' proveedor, count(*)
from auth.users group by 1;
```

Y el esquema completo, con la CLI de Supabase:

```bash
supabase db dump --db-url "$DATABASE_URL" --schema public --schema-only > docs/schema.sql
```

## Después del deploy

Checklist completo en el artifact. Los puntos que más se olvidan:

- **Google Cloud Console:** cliente OAuth propio. Redirect
  `https://api.<dominio>/auth/google/callback`. Ámbitos solo `email profile openid`.
  **Publicar la app** — si queda en modo Prueba, solo entran los correos listados.
- **SMTP propio con SPF, DKIM y DMARC.** Supabase enviaba los correos de
  verificación y recuperación; al migrar eso desaparece.
- **Google Maps:** restringir la clave por referente HTTP y por API, y poner
  límite de gasto.
- **Restaurar un backup de verdad** antes de dar la fase 01 por cerrada.
- Completar **NIT y registro profesional**, pendientes según el README.
