---
tipo: decision
proyecto: consultorioEstetico-vm
fecha: 2026-09-02
estado: vigente
---

# 004 — Neon + R2 + Railway + Vercel (fin de Supabase)

Volver a [[00 — Consultorio Estético (índice)]]

Cierra el plan de [[06 — Migración fuera de Supabase]]. Complementa a la
[[001 — Postgres portable, sin SDK de Supabase para datos|001]] (SQL directo) y
[[003 — Los datos de pacientes nunca van al repositorio|003]] (datos base a base).

## Contexto

El esquema, el contenido y la auth propia ya estaban listos en el repo. Faltaba
elegir **dónde vive cada pieza** al salir de Supabase, priorizando: capa
gratuita generosa, y que ninguna decisión encierre.

## Opciones

- **Base de datos:** Neon · Postgres de Railway · Supabase (quedarse).
- **Archivos:** Cloudflare R2 · Object Storage de Neon (beta) · S3 · quedarse en
  Supabase Storage.
- **Backend:** Railway (ya estaba) · Render · VPS.
- **Frontend:** Vercel (ya estaba).

## Qué elegimos

| Pieza | Dónde | Costo |
|---|---|---|
| Base de datos | **Neon** (proyecto `crimson-salad-07015885`) | $0 |
| Archivos | **Cloudflare R2** (bucket `consultorio`) | $0 |
| Backend Express | Railway | ~$5/mes |
| Frontend Next.js | Vercel | $0 |
| Errores | Sentry (plan Developer gratuito) | $0 |

Auth propia (`/auth2`, argon2id, JWT 15 min + refresh 30 días en cookie
httpOnly) reemplaza a Supabase Auth. Correos por Resend (opcional).

## Por qué

- **Neon y no Railway para la base:** Neon tiene capa gratuita **permanente**
  (0.5 GB + 100 CU-h/mes, sin tarjeta). Railway quitó su plan gratuito; su
  Postgres consume el crédito de $5/mes del plan Hobby. Para una base diminuta
  (1 consultorio) Neon sobra.
- **R2 y no el object storage de Neon:** el de Neon está en **beta** sin precio
  anunciado. Los PDF de consentimiento son datos de salud (Ley 1581) — no van a
  infraestructura beta. R2 es GA, con precio conocido y **egress $0**, que es lo
  que importa en un sitio lleno de fotos.
- **Corte limpio de auth** en vez de la convivencia que planteaba la 002: el
  sitio nunca tuvo usuarios reales en producción, solo lo veía el desarrollador.

## A qué renunciamos

- **Un solo proveedor.** Son tres (Neon, R2, Railway) más Vercel. Cada uno es un
  dato en `server/.env`; no hay integración que mantener entre ellos.
- **Scale-to-zero de Neon** obligatorio en el plan gratuito: la primera consulta
  tras ~5 min de inactividad tarda ~1 s (arranque en frío). Aceptable para un
  sitio de bajo tráfico; el backend en Railway queda encendido.
- El **object storage de Neon**, que si sale de beta con buen precio unificaría
  archivos + base en un proveedor.

## Cómo saldríamos de aquí

- **Neon → otro Postgres:** `pg_dump | pg_restore`. Cero reescritura (por la 001).
- **R2 → otro S3:** `server/scripts/migrar-storage-a-r2.js` era la plantilla
  (se borró tras la migración manual); rehacer al revés es trivial.
- **Railway → VPS:** mover el proceso a PM2, apuntar `DATABASE_URL`. Nada del
  código cambia.
