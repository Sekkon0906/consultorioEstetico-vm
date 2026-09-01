# Consultorio Estético — Dra. Julieth Vanessa Medina Orjuela

Aplicación web del consultorio de medicina estética y antienvejecimiento
(Ibagué – Tolima): página pública, agendamiento de citas en línea, panel
administrativo, testimonios, galería de procedimientos y consentimiento
informado con firma digital.

## Tech stack

- **Frontend:** Next.js 15 (App Router, Turbopack), React 19, TypeScript
- **Estilos / animación:** CSS global + Bootstrap, Tailwind v4, Framer Motion
- **Datos / Auth:** Supabase (Postgres + Auth + Storage), consultado
  directamente desde el frontend con `@supabase/supabase-js`
- **Backend auxiliar:** Express (`server/`) para sincronía de usuario,
  reagendas, subida de imágenes de charlas y otras operaciones con
  `service_role`
- **Otros:** jsPDF (PDF de consentimiento), Three.js / R3F (fondos),
  Recharts (analítica)

## Estructura

La regla: **`app/` son solo rutas de Next.js; `src/` es todo lo demás.**

```
app/                       RUTAS — cada carpeta es una URL
  page.tsx                   /               inicio
  doctora/  consultorio/     páginas públicas
  procedimientos/            listado y detalle [id]
  testimonios/  agendar/     testimonios y flujo de reserva
  login/  register/  recuperar/
  perfil/                    citas del paciente y edición de datos
  legal/                     privacidad, términos, cookies, aviso
  administrar/               PANEL (solo admin)
  api/                       3 rutas de servidor: correos de cita
  actions/                   server actions (cambio de idioma)
  estilos/                   CSS por dominio (ver abajo)
  globals.css                punto de entrada: solo ordena los @import

src/                       TODO LO DEMÁS
  components/                componentes compartidos
    ui/                        Button, ButtonLink — sistema de botones
  context/                   AuthContext
  lib/                       utilidades
    sesion.ts                  único sitio que sabe de dónde sale el token
    apiCliente.ts              capa HTTP compartida
  services/                  clientes de la API por dominio
  types/                     tipos del dominio
  i18n/request.ts            configuración de next-intl

server/                    BACKEND (Express)
  src/
    routes/                  13 módulos, 60 endpoints
    services/  middlewares/  lib/  ia/
  sql/
    schema/                  000_baseline.sql — el esquema completo
    migraciones/             001-004, en orden
    datos/                   contenido del sitio, en SQL
  scripts/                   migración de datos operativos
  pruebas/                   pruebas de integración

docs/                      documentación
  vault/                     notas para Obsidian (arquitectura, API, ...)
messages/                  es.json / en.json
public/                    estáticos servidos tal cual
```

### Los estilos

`globals.css` es solo el punto de entrada. El contenido está en `app/estilos/`
partido por dominio: `01-tokens`, `02-tema-oscuro`, `03-compatibilidad`,
`04-galeria`, `05-admin`, `06-responsive`.

> **El orden de los `@import` importa.** Reproduce el que tenían cuando era un
> solo archivo: la cascada de CSS depende de él y reordenarlos cambia qué
> regla gana sin que salte ningún error.

### Qué hace cada archivo de la raíz

Casi todos están ahí porque **su herramienta los exige en la raíz**, no por
desorden:

| Archivo | Quién lo exige |
|---|---|
| `package.json` · `package-lock.json` | npm |
| `tsconfig.json` | TypeScript |
| `next.config.ts` · `next-env.d.ts` | Next.js |
| `postcss.config.mjs` | PostCSS / Tailwind |
| `eslint.config.mjs` | ESLint |
| `vercel.json` | Vercel |
| `instrumentation.ts` | Next.js — Sentry en servidor y edge |
| `instrumentation-client.ts` | Next.js — Sentry en el navegador |
| `.env.example` | Plantilla de variables **del frontend** |

El backend tiene su propia plantilla en `server/.env.example`: son dos
conjuntos de variables distintos y cada uno vive junto a lo que configura.

## Requisitos

- Node.js 20+
- Cuenta/proyecto de Supabase

## Variables de entorno

### Frontend — `.env.local` (raíz)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key pública>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend — `server/.env`

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key — SECRETA, nunca al frontend>
DATABASE_URL=postgres://...
CORS_ORIGIN=http://localhost:3000
PORT=4000
NODE_ENV=development
```

> ⚠️ **Seguridad:** `.env*` está en `.gitignore`. La `service_role key` y
> el `DATABASE_URL` son secretos: no se exponen en el frontend ni se
> commitean. Si una clave se filtró, rótala desde Supabase
> (Settings → API → Reset).

## Puesta en marcha

```bash
# 1. Dependencias
npm install
cd server && npm install && cd ..

# 2. Base de datos: ejecuta server/sql/indexes.sql en el
#    SQL Editor de Supabase (mejora el rendimiento; es idempotente)

# 3. Backend (terminal 1)
cd server && npm run dev      # http://localhost:4000

# 4. Frontend (terminal 2)
npm run dev                   # http://localhost:3000
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Frontend en desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |
| `cd server && npm run dev` | Backend Express (nodemon) |

> Nota: el build de producción no bloquea por ESLint (el proyecto usa
> estilo `var`/`any` heredado); el chequeo de tipos de TypeScript sí
> permanece activo.

## Funcionalidades

- **Público:** home, perfil de la doctora, consultorio, procedimientos
  por categoría con galería, testimonios en video y comentarios de
  pacientes.
- **Agendamiento:** calendario con horas disponibles (bloquea horas
  pasadas y ocupadas), datos del paciente, pago en consultorio + aviso
  por WhatsApp, tarjeta de confirmación.
- **Cuenta:** registro, login (email y Google), recuperar contraseña,
  editar perfil, "Mis citas agendadas" con aceptar/rechazar reagenda.
- **Consentimiento informado:** el paciente firma (canvas); se genera un
  PDF que solo ve la doctora.
- **Admin:** gestión de horarios, citas (confirmar, reagendar, facturar,
  cancelar), procedimientos, testimonios, formación y analítica.

## Despliegue

- **Frontend:** Vercel (configurar las variables `NEXT_PUBLIC_*`).
- **Backend:** cualquier host Node (Render/Railway/VPS) con las variables
  de `server/.env` y `CORS_ORIGIN` apuntando al dominio del frontend.
- Ejecutar `server/sql/indexes.sql` una vez en la base de datos.

## Pendiente / por configurar

- Página de **términos y condiciones / tratamiento de datos** (requiere
  el texto legal y el **NIT** del consultorio).
- **NIT / Registro Profesional** en el PDF de consentimiento.
- Verificar políticas RLS de los buckets de Storage y de la tabla
  `reagendas` en Supabase.

---

© Consultorio Estético Dra. Julieth Medina. Todos los derechos reservados.
