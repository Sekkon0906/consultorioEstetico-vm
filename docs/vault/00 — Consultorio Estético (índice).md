---
tags: [proyecto, indice]
actualizado: 2026-09-02
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
- [[06 — Migración fuera de Supabase]] — **terminada**; queda como historia
- [[07 — Bitácora 2026-09-01]] — el día de la migración
- [[08 — Bitácora 2026-09-02]] — corte final de Supabase y reestructura de móvil
- [[09 — Estudio de móvil]] — por qué el sitio se veía mal en un teléfono, medido
- [[10 — Cosas por hacer]] — backlog vivo, por tipo de trabajo

## Estado en una línea

Funcionando en producción (Vercel + Railway) sobre **infraestructura propia**:
Postgres en Neon, archivos en Cloudflare R2, autenticación propia con Google
OAuth, correos por Resend. **Supabase ya no interviene en nada.**

## Números

Contados el 2026-09-02.

| | |
|---|---|
| Frontend | ~19.900 líneas (TypeScript/React) |
| Backend | ~4.240 líneas (Node/Express) |
| Estilos | ~5.270 líneas (CSS) |
| Endpoints | 60+ en 15 módulos |
| Rutas | 23 |
| Tablas | 19 |
| Dependencias de Supabase | **0** |

## Enlaces

- Repositorio: `Sekkon0906/consultorioEstetico-vm`
- Frontend: Vercel · Backend: Railway · Base: **Neon** · Archivos: **Cloudflare R2**
- Errores: Sentry (solo producción)

> [!warning] Antes de que la doctora lo use con pacientes reales
> Rotar la contraseña de Neon y el token de R2 — se pegaron en un chat
> durante la migración. Es el punto **DEP1** de [[10 — Cosas por hacer]].
