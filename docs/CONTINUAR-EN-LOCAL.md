# Cómo seguir trabajando desde tu máquina

Estado del repo al momento de escribir esto: `main` en `c534f3f`, todo lo del
PR #1 ya fusionado (auth propia, seguridad, reestructura, documentación).

## 1. Clonar y ubicarte

```bash
git clone https://github.com/Sekkon0906/consultorioEstetico-vm.git
cd consultorioEstetico-vm
git checkout main
git pull
```

## 2. Versión de Node

El backend **exige Node ≥ 22** (lo declara `server/package.json`, es lo que
acabamos de corregir para que Railway desplegara). Usa la misma en local o
vas a ver comportamientos distintos a los de producción:

```bash
node --version   # debe dar v22.x o superior
```

Si usas `nvm`: `nvm install 22 && nvm use 22`.

## 3. Instalar dependencias (dos proyectos, dos instalaciones)

```bash
npm install            # frontend, en la raíz
cd server && npm install && cd ..   # backend
```

## 4. Variables de entorno

Hay **dos** archivos `.env`, uno por proyecto — no se comparten:

```bash
cp .env.example .env.local          # frontend (Next.js lee .env.local)
cp server/.env.example server/.env  # backend
```

### Mínimo para que ambos arranquen

**Frontend (`.env.local`)** — obligatorias mientras el frontend siga usando
Supabase Auth/Storage:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend (`server/.env`)** — solo `DATABASE_URL` es obligatoria de verdad;
todo lo demás es opcional y el servidor arranca igual, avisando qué falta:
```
DATABASE_URL=postgres://usuario:clave@localhost:5432/consultorio
JWT_SECRET=$(openssl rand -base64 48)
CORS_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

Todo lo demás (Google OAuth, Resend, R2, el copiloto) es opcional: sin
configurarlo, esa función responde con un mensaje claro en vez de romper
nada. El detalle de cada variable está comentado en los dos `.env.example`.

## 5. Base de datos local

No hace falta Supabase para desarrollar: el esquema completo está en el
repo y se reconstruye igual en cualquier Postgres.

```bash
createdb consultorio
psql $DATABASE_URL -f server/sql/schema/000_baseline.sql
psql $DATABASE_URL -f server/sql/migraciones/001_configuracion_sitio.sql
psql $DATABASE_URL -f server/sql/migraciones/002_auth_propia.sql
psql $DATABASE_URL -f server/sql/migraciones/003_auditoria_ia.sql
psql $DATABASE_URL -f server/sql/migraciones/004_integraciones_ia.sql
psql $DATABASE_URL -f server/sql/indexes.sql
psql $DATABASE_URL -f server/sql/datos/010_contenido.sql
```

Eso deja los 14 procedimientos reales, testimonios y configuración — sin
ningún dato de paciente. Detalle completo en `server/sql/datos/README.md`.

## 6. Arrancar los dos servidores

En dos terminales:

```bash
# Terminal 1 — backend, puerto 4000
cd server && npm run dev

# Terminal 2 — frontend, puerto 3000
npm run dev
```

Abre `http://localhost:3000`. El backend responde en
`http://localhost:4000/health`.

## 7. Antes de cada commit

```bash
npx tsc --noEmit --project app   # o desde app/: npx tsc --noEmit
npm run build                     # build de producción, atrapa lo que el dev server no
cd server && node pruebas/autenticacion.test.js \
              && node pruebas/seguridad.test.js \
              && node pruebas/permisos.test.js
```

Las pruebas del backend corren contra Postgres real (no un simulacro): usan
la misma `DATABASE_URL` del paso 5. `server/pruebas/README.md` tiene el
detalle de qué cubre cada una.

## Para orientarte en el proyecto

Todo el contexto —arquitectura, estructura de carpetas, los 60 endpoints de
la API, el modelo de seguridad y la migración fuera de Supabase— está en
`docs/vault/`, empezando por `docs/vault/00 — Consultorio Estético (índice).md`.
Son las mismas notas que se armaron para llevar a Obsidian.

## Dos cosas pendientes que no dependen de código

- **Favicon en modo oscuro**: falta el archivo del logo (`LogoJM.jpg` o
  similar) para generar la versión clara. Ponlo en `public/` y avisa para
  conectar los `<link>` con media query.
- **Servicios externos**: Google OAuth, Resend y Cloudflare R2 están
  implementados y esperando claves. El detalle de qué falta y de qué depende
  cada uno está en `docs/vault/06 — Migración fuera de Supabase.md`.
