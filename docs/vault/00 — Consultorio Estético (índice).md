---
tags: [proyecto, indice]
actualizado: 2026-09-01
---

# Consultorio Estético — Dra. Julieth Vanessa Medina Orjuela

Sitio web y sistema de gestión para un consultorio de medicina estética en
Ibagué (Tolima, Colombia). Hace dos cosas a la vez:

- **De cara al paciente:** vitrina de procedimientos, testimonios, información
  del consultorio y agendamiento de citas en línea con firma de consentimiento.
- **De cara a la doctora:** panel de administración para gestionar citas,
  procedimientos, promociones, horarios, testimonios, reportes de ingresos y
  un asistente de IA que edita contenido por chat o por voz.

## Mapa de notas

- [[01 — Arquitectura]] — cómo está montado y por qué
- [[02 — Estructura de carpetas]] — qué hay dónde
- [[03 — Base de datos]] — tablas, reglas y cómo levantarla
- [[04 — API]] — endpoints y quién puede llamarlos
- [[05 — Seguridad]] — qué protege qué
- [[06 — Migración fuera de Supabase]] — el plan y en qué punto va
- [[07 — Bitácora 2026-09-01]] — todo lo que se hizo ese día y por qué

## Estado en una línea

Funcionando en producción (Vercel + Railway), con la base de datos todavía en
Supabase pero ya **versionada por completo en el repositorio**: se reconstruye
idéntica en cualquier Postgres con un comando.

## Números

| | |
|---|---|
| Frontend | ~20.500 líneas (TypeScript/React) |
| Backend | ~3.560 líneas (Node/Express) |
| Estilos | ~4.880 líneas (CSS) |
| Esquema y datos | ~1.130 líneas (SQL) |
| Endpoints | 60 en 13 módulos |
| Páginas | 18 rutas |
| Tablas | 19 |
| Pruebas | 29 comprobaciones de integración |

## Enlaces

- Repositorio: `Sekkon0906/consultorioEstetico-vm`
- Rama de trabajo: `claude/supabase-migration-hostinger-upywuz`
- Frontend: Vercel · Backend: Railway · Base: Supabase (en migración)
