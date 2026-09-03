---
tags: [proyecto, migracion, historico]
actualizado: 2026-09-02
---

# Migración fuera de Supabase

Volver a [[00 — Consultorio Estético (índice)]]

> [!success] Terminada el 2026-09-02
> Supabase ya no interviene en nada: 0 importaciones del SDK, 0 llamadas, el
> paquete fuera de los dos `package.json`. Esta nota se queda como **historia**
> — el porqué de cada decisión, que no está en el `git log`.

**El objetivo era:** que la plataforma no dependiera de Supabase ni de cuentas
personales. Un proyecto independiente.

## Qué reemplazó a qué

| Antes lo hacía Supabase | Lo hace ahora | Dónde vive |
|---|---|---|
| Base de datos | **Neon** (Postgres 18) | `server/src/db.js`, `pg.Pool` |
| Inicio de sesión | **Auth propia** + Google OAuth | `/auth2`, `src/lib/sesion.ts` |
| Correos | **Resend** | `server/src/lib/correo.js` |
| Imágenes y archivos | **Cloudflare R2** | `server/src/routes/uploads.js` |

## Por qué se pudo hacer sin reescribir medio proyecto

Las tres decisiones que lo hicieron barato, tomadas antes de empezar:

1. **Postgres en cualquier proveedor**, no una base propietaria. Postgres sigue
   siendo Postgres: migrar fue cambiar una variable de entorno, no traducir
   consultas.
2. **El backend nunca usó el SDK de Supabase para datos**, solo SQL directo con
   `pg`. Es lo que convirtió "migrar la base" en un trámite.
3. **Los datos de pacientes nunca fueron al repositorio.** Se movieron base a
   base, en una transacción, verificando que los conteos coincidieran. Ver
   [[05 — Seguridad]].

## Lo que sí costó

- **El frontend.** ~38 archivos usaban Supabase, la mayoría solo para leer la
  sesión. El patrón fue siempre el mismo: comprobar que el endpoint devuelve
  **todos** los campos que el frontend lee (`procedimientos` devolvía 8 de 15,
  y por eso el frontend lo esquivaba), reescribir con `apiFetch`/`apiAuth`,
  typecheck y build.
- **Los dos sistemas de login convivieron** durante la migración en vez de
  cortar de golpe. Cortarle el acceso al panel a la doctora en un despliegue es
  como se pierde un lunes. Ver la decisión 002 en la bóveda de Obsidian.
- **No había `psql` en el entorno**, así que el esquema se carga con un script
  propio que usa el cliente `pg` del backend: `server/scripts/cargar-esquema.js`.

## Trampas que costaron tiempo, por si vuelven

- `CREATE OR REPLACE VIEW` **solo deja añadir columnas al final**. Intentar
  intercalarlas falla con `cannot change name of view column`.
- Neon da dos cadenas de conexión: la *pooled* y la directa. **El DDL necesita
  la directa** — hay que quitarle el `-pooler.` al host.
- Las carpetas de R2 están en PascalCase (`ConsultorioImagenes/Logo`). El
  mapeo vive en `server/src/routes/uploads.js`.

## Lo que quedó pendiente al terminar

No es de la migración en sí, pero salió de ella. Todo está en
[[10 — Cosas por hacer]]:

- **DEP1 · Rotar credenciales.** La contraseña de Neon y el token de R2 se
  pegaron en un chat durante la migración. **Antes de que haya pacientes
  reales.**
- **B1 · Bucket privado para consentimientos y firmas.** Hoy van al bucket
  público. Es el punto más delicado que queda.
- **C1 · Verificar el dominio en Resend** (SPF/DKIM/DMARC). Es lo que más
  tarda por propagación de DNS.
- **E1 · Sacar los videos de la cuenta personal de YouTube.**
