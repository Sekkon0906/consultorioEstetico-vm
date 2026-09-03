---
tipo: decision
proyecto: consultorioEstetico-vm
fecha: 2026-09-01
estado: vigente
---

# 002 — Los dos sistemas de login conviven durante la migración

Volver a [[00 — Consultorio Estético (índice)]]

## Contexto

Hay que reemplazar Supabase Auth por autenticación propia sin cortarle el
acceso al panel a la doctora, que es la única administradora y quien ve las
historias clínicas.

## Opciones

- Cortar en un solo despliegue: quitar `/auth` (Supabase) y activar `/auth2`
  (propia) a la vez.
- Montar los dos sistemas en paralelo y migrar pantalla por pantalla.

## Qué elegimos

Los dos conviven. `/auth2` (JWT + argon2id + Google OAuth) se monta junto a
`/auth`. `verifyToken` acepta ambos tipos de token: prueba primero el propio
(verificación local de firma) y cae al de Supabase. El frontend pregunta el
token en un solo sitio: `src/lib/sesion.ts`.

## Por qué

Cortar el login en un solo despliegue es exactamente como se pierde el acceso
al panel un lunes por la mañana. Con los dos activos se migra por pantallas y
cada cambio es reversible.

## A qué renunciamos

A la simplicidad temporal: durante la migración hay dos rutas de auth, dos
caminos de token y más superficie que mantener. Se acepta como coste de
transición.

## Cómo saldríamos de aquí

Cuando todas las pantallas usen `/auth2`, se retira `/auth` y la rama de
Supabase de `verifyToken`. Es una limpieza, no una migración.
