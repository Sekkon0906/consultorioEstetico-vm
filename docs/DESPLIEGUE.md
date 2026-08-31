# Desplegar frontend y backend (fase intermedia, antes de Neon)

Estado: front y back se mueven a Vercel/Railway **manteniendo la dependencia
actual de Supabase** (Postgres + Auth). La independencia de Supabase llega
después, en las fases 03-04 ya documentadas en `MIGRACION.md`. Esto no es un
rodeo: es el mismo Camino C por fases, solo que primero resolvemos "dónde
vive el código" y después "de dónde saca los datos".

## Orden de creación de cuentas

1. **Vercel** — vercel.com, entra con la cuenta de GitHub que tiene el repo.
2. **Railway** — railway.app, igual, con GitHub.
3. (Más adelante) Neon, Resend/Brevo, Cloudflare R2 — cuando ataquemos las
   fases 02-03.

## 1 · Backend en Railway

**New Project → Deploy from GitHub repo** → selecciona `consultorioEstetico-vm`.

Railway va a intentar construir desde la raíz del repo. Hay que corregirlo:

- **Settings → Root Directory** → escribe `server`
- Con eso detecta `server/railway.json` (ya está en el repo) y usa
  `node src/index.js` como comando de arranque.

**Variables → Raw Editor**, pega esto y completa los tres valores marcados:

```env
NODE_ENV=production

# Postgres de Supabase (el mismo de siempre — cambia cuando migremos a Neon)
DATABASE_URL=postgres://postgres:REEMPLAZAR_PASSWORD@db.ibpkihfjripvizismhsk.supabase.co:5432/postgres

# Verificación de sesión con Supabase Auth (hasta construir auth propia)
SUPABASE_URL=https://ibpkihfjripvizismhsk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REEMPLAZAR_SERVICE_ROLE_KEY

# Se corrige después de crear el proyecto de Vercel (paso 2)
CORS_ORIGIN=REEMPLAZAR_URL_DE_VERCEL

# Opcional: sin esto el copiloto responde 503 en vez de romperse
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-5
```

Dónde sacar lo que falta:
- `REEMPLAZAR_PASSWORD` — la contraseña de la base de datos. Si no la
  recuerdas: Supabase → Settings → Database → **Reset database password**.
- `REEMPLAZAR_SERVICE_ROLE_KEY` — Supabase → Settings → API →
  `service_role` (la secreta, nunca la `anon`). No la pegues en ningún otro
  sitio ni la subas al repo.

`PORT` no hace falta definirlo: Railway lo inyecta solo y el código ya lo
respeta (`server/src/index.js`).

Al desplegar, Railway te da una URL tipo `consultorio-back.up.railway.app`.
Pruébala en el navegador en `/health` — debe responder
`{"ok":true,"status":"Consultorio VM API corriendo"}`.

## 2 · Frontend en Vercel

**Add New → Project** → mismo repo. Vercel detecta Next.js solo — no toques
el Root Directory, déjalo en la raíz (el `server/` no interfiere).

**Settings → Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ibpkihfjripvizismhsk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGtpaGZqcmlwdml6aXNtaHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjAzNDIsImV4cCI6MjA4ODI5NjM0Mn0.IQlqE3i2SJXjcvI96Z37-j0reJlegonxB3JcRzbs6fQ
NEXT_PUBLIC_API_URL=REEMPLAZAR_URL_DE_RAILWAY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño — puede vivir en el
frontend sin problema, es la misma que ya está en el código hoy. La
`service_role` del paso anterior es la que nunca sale del backend.

`NEXT_PUBLIC_API_URL` es la URL de Railway del paso 1 (con `https://`).

Despliega. Vercel te da una URL tipo `consultorio-vm.vercel.app`.

## 3 · Cerrar el círculo

Vuelve a Railway → Variables → corrige `CORS_ORIGIN` con la URL real de
Vercel (puede llevar varias separadas por coma si luego agregas el dominio
propio):

```env
CORS_ORIGIN=https://consultorio-vm.vercel.app
```

Railway redespliega solo al guardar. Prueba el flujo completo: entra al
sitio en Vercel, inicia sesión, agenda una cita de prueba — confirma que
frontend y backend se están hablando.

## 4 · Cuando compres el dominio

- En Vercel: **Settings → Domains** → agrega `tudominio.com` y `www`.
- En Railway: **Settings → Networking → Custom Domain** → `api.tudominio.com`.
- Actualiza `CORS_ORIGIN` en Railway y `NEXT_PUBLIC_API_URL` en Vercel para
  que apunten a los dominios propios en vez de a las URLs `.vercel.app` /
  `.up.railway.app`.

## Lo que sigue pendiente (no bloquea este despliegue)

- Migrar la base de datos de Supabase a Neon (fase 02).
- Construir auth propia y quitar `SUPABASE_SERVICE_ROLE_KEY` (fase 03).
- Sacar `supabase-js` de los 23 archivos del frontend (fase 04).

Cuando lleguemos ahí, solo cambian las variables de entorno en Railway y
Vercel — el despliegue en sí no se vuelve a tocar.
