---
tipo: decision
proyecto: consultorioEstetico-vm
fecha: 2026-09-01
estado: vigente
---

# 001 — Postgres portable, sin SDK de Supabase para datos

Volver a [[00 — Consultorio Estético (índice)]]

## Contexto

El proyecto nació sobre Supabase (base, auth, storage). El objetivo es que la
plataforma no dependa de Supabase ni de cuentas personales.

## Opciones

- Seguir usando el SDK de Supabase (`supabase-js`) para leer y escribir datos.
- Usar una base propietaria de otro proveedor (Firebase, PlanetScale, etc.).
- Hablar con PostgreSQL por SQL directo (`pg.Pool`) y tratar la base como un
  Postgres cualquiera.

## Qué elegimos

SQL directo contra Postgres. El backend **nunca** usa el SDK de Supabase para
datos. El esquema completo y el contenido del sitio viven versionados en
`server/sql/`.

## Por qué

Postgres sigue siendo Postgres en cualquier proveedor. Migrar la base pasa a
ser cambiar `DATABASE_URL` y correr los `.sql` — sin reescribir consultas, sin
riesgo de una capa propietaria que se comporte distinto.

## A qué renunciamos

A las comodidades del SDK (RLS con `auth.uid()`, realtime, PostgREST). Las
políticas RLS quedan documentadas pero inertes: hoy lo que protege los datos es
`verifyToken` / `requireRole` en la API, no la base.

## Cómo saldríamos de aquí

Volver al SDK obligaría a reescribir los 60 endpoints y reintroducir la
dependencia. Improbable: la portabilidad es justamente el objetivo del proyecto.
