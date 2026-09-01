# Migración de Supabase a infraestructura propia

Estado: **planificación cerrada e inventario verificado. Esperando el VPS.**

> Los hallazgos de seguridad de este documento fueron **corregidos** tras verificar
> las políticas reales. Ver `INVENTARIO-SUPABASE.md`, que manda sobre este archivo.

Estudio completo y navegable: ver el artifact de la sesión (Salir de Supabase).
Este documento es el resumen operativo versionado.

## Decisiones tomadas

| Decisión | Elegido |
|---|---|
| Infraestructura | **Servicios gestionados, no VPS** (revisado). Vercel + Railway + Neon + Cloudflare R2. ~$0-2 USD/mes. Un VPS queda como camino de escalado futuro, no como punto de partida. |
| Estrategia | **Camino C** — migración por fases, sin caída del sitio |
| Base de datos | PostgreSQL 17 en el mismo VPS |
| Copiloto de IA | Contenido del sitio + consultas agregadas sin datos identificables |

El hosting compartido de Hostinger (Premium / Business / Cloud) **no sirve**:
no ofrece PostgreSQL ni un runtime de Node controlable. Solo el VPS.

## Revisión de estrategia (2026-08-31)

Decisión inicial: Postgres y el backend en un VPS de Hostinger propio.
Con el costo real sobre la mesa (~$7-13 USD/mes + trabajo de sysadmin) para un
proyecto con 1 usuario real, se revisa a **servicios gestionados**:

- **Vercel** (frontend Next.js) — gratis
- **Railway** (backend Express) — gratis o ~$5/mes según uso
- **Neon** (Postgres) — gratis hasta 0.5 GB
- **Cloudflare R2** (archivos) — gratis hasta 10 GB

Es un camino válido de "empezar barato, crecer después" porque **la base de
datos sigue siendo Postgres en todo momento** — a diferencia de proponer
hosting compartido (que solo ofrece MySQL), no hay reescritura de esquema si
más adelante se migra a VPS. Migrar sería: `pg_dump` de Neon → `pg_restore`
en el VPS nuevo, y mover el proceso de Railway a PM2. Nada del código construido
hasta ahora (`configuracion_sitio`, el copiloto, las rutas de Express) cambia:
todo habla con Postgres por `DATABASE_URL`, sin importar quién la aloja.

Un VPS (Hostinger KVM 1 o 2) sigue siendo la opción si el proyecto crece más
allá de los niveles gratuitos, o si se prefiere tener todo bajo un solo techo
propio en vez de varios proveedores gestionados.

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
| 00 | Inventario real de Supabase | **hecho** |
| 01 | Preparar VPS: SSH, ufw, fail2ban, Postgres, Node, Nginx, **backups verificados** | ~1 d |
| 02 | Migrar base de datos y archivos; separar público de privado; podar tablas muertas | ~1 d |
| 03 | Auth propia: JWT, argon2, Google OAuth, SMTP (sin compatibilidad bcrypt: no hay contraseñas) | ~2-3 d |
| 04 | Frontend a la API propia, por dominio: consentimientos → citas → usuarios → charlas → contenido público | ~4-6 d |
| 05 | `configuracion_sitio` + pantalla de administración | ~2 d |
| 06 | Videos fuera de la cuenta personal de YouTube | ~1 d |
| 07 | Copiloto de IA (tool calling, confirmar antes de escribir, auditoría) | ~3-4 d |
| 08 | Corte a producción; Supabase en solo lectura unas semanas | ~0.5 d |

## Estado del arranque

La fase 00 está cerrada: el inventario real está en `INVENTARIO-SUPABASE.md`.

**El único bloqueo es el VPS.** Mientras tanto se puede avanzar sin servidor en
el esquema de `configuracion_sitio`, las migraciones SQL, la estructura de la
API y las herramientas del copiloto.

Decisiones pendientes que abrió el inventario:

- ¿Las 22 citas de prueba se descartan en la migración? (los 15 procedimientos
  y 3 testimonios sí parecen contenido real)
- ¿`bloqueos_horas` o `horarios_por_fecha`? ¿`procedimiento_galeria` o
  `procedimiento_media`? Propuesta: conservar las que el código usa.

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

## Esquema de base de datos versionado en el repo (2026-09-01)

El objetivo del día: que la base de datos completa "viva" en el repositorio
como código, para que el día que se despliegue fuera de Supabase sea solo
correr los archivos SQL contra un Postgres nuevo — no reconstruir el esquema
desde cero ni reinventar decisiones ya tomadas.

**Archivos nuevos:**

- `server/sql/schema/000_baseline.sql` — el esquema COMPLETO tal como existe
  hoy en producción: las 17 tablas, sus columnas/checks/defaults, las
  funciones y triggers de negocio (`set_updated_at`, `enforce_usuarios_rol`,
  `enforce_firma_para_atendida`) y las 6 vistas de reportes. Volcado a mano
  vía introspección SQL contra el proyecto real (`ibpkihfjripvizismhsk`), no
  con `pg_dump` (sin acceso de shell al proyecto de Supabase desde este
  entorno). **Verificado**: corre limpio de punta a punta contra un Postgres
  16 local vacío, incluyendo después las migraciones 001/002/003/004 y
  `indexes.sql` en cadena, sin un solo error.
- `server/sql/schema/001_rls_solo_supabase.sql` — las políticas RLS que hay
  hoy en Supabase, documentadas como referencia. **No hacen falta** para un
  Postgres propio: dependen de `auth.uid()`/`auth.jwt()`, que solo existen
  porque Supabase Auth + PostgREST los inyectan. El backend Express nunca
  pasa por ahí — se conecta directo con `pg.Pool` usando un rol con
  `BYPASSRLS` (confirmado en producción), y cada ruta ya valida el rol con
  `verifyToken`/`requireRole`. La seguridad real hoy es esa capa, no RLS.

**Orden de despliegue en un Postgres nuevo** (Railway Postgres, Neon, RDS, un
contenedor propio):

```bash
psql $DATABASE_URL -f server/sql/schema/000_baseline.sql
psql $DATABASE_URL -f server/sql/migraciones/001_configuracion_sitio.sql
psql $DATABASE_URL -f server/sql/migraciones/003_auditoria_ia.sql
psql $DATABASE_URL -f server/sql/migraciones/004_integraciones_ia.sql
psql $DATABASE_URL -f server/sql/indexes.sql
# Solo si ya se migró el login fuera de Supabase Auth (fase 03):
# psql $DATABASE_URL -f server/sql/migraciones/002_auth_propia.sql
```

Después de eso, apuntar `DATABASE_URL` del backend a esa base y listo — el
código nunca usa el SDK de Supabase para datos, solo SQL directo.

**Bug real encontrado y corregido de paso**: las migraciones
`001_configuracion_sitio.sql` y `003_auditoria_ia.sql` estaban escritas en el
repo pero **nunca se habían aplicado** a la base de producción — las tablas
`configuracion_sitio` y `auditoria_ia` no existían. Esto es casi con certeza
la causa del error 404 reportado antes en "Información general" del panel.
Se aplicaron ambas contra producción (son idempotentes, no tocan nada
existente) y se confirmó que las tablas ya existen.

**Hallazgo de seguridad corregido**: `integraciones_ia` (donde se cifran las
claves de API del copiloto) tenía RLS desactivado — cualquiera con la clave
`anon` pública del proyecto podía leerla vía la API REST automática de
Supabase, aunque el backend nunca la usa así. Se activó RLS sin políticas
(deny-all vía PostgREST); el backend sigue funcionando porque bypassa RLS.

**Qué queda pendiente todavía** (deliberadamente, no es un olvido):

- Migrar los **datos** reales (no solo el esquema) fuera de Supabase Postgres.
- Migrar **Auth** fuera de Supabase (fase 03, `002_auth_propia.sql` ya
  preparada pero sin aplicar).
- Migrar **Storage** (imágenes, firmas, PDFs de consentimiento) fuera de los
  buckets de Supabase.

## Pendientes de UI sueltos

- **Favicon adaptado a modo oscuro/claro.** El logo del navbar ya se
  invierte por CSS en modo oscuro, pero el favicon (pestaña del navegador)
  es un archivo de imagen fijo — CSS no lo toca. Falta: una versión clara
  del logo (invertida) + declarar `<link rel="icon" media="(prefers-color-scheme: dark)">`
  en `app/layout.tsx` para que el navegador elija sola. Bloqueado por mi
  entorno: no puedo bajar `LogoJM.jpg` desde Supabase (dominio bloqueado
  por política de red). Se resuelve adjuntando el archivo del logo
  directamente en el chat.
