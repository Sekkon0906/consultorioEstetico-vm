---
tags: [proyecto, base-de-datos]
actualizado: 2026-09-01
---

# Base de datos

Volver a [[00 — Consultorio Estético (índice)]]

PostgreSQL 17. Hoy corre en Supabase, pero **el esquema completo está en el
repositorio** y se reconstruye idéntico en cualquier Postgres.

## Levantarla desde cero

```bash
psql $DATABASE_URL -f server/sql/schema/000_baseline.sql
psql $DATABASE_URL -f server/sql/migraciones/001_configuracion_sitio.sql
psql $DATABASE_URL -f server/sql/migraciones/002_auth_propia.sql
psql $DATABASE_URL -f server/sql/migraciones/003_auditoria_ia.sql
psql $DATABASE_URL -f server/sql/migraciones/004_integraciones_ia.sql
psql $DATABASE_URL -f server/sql/indexes.sql
psql $DATABASE_URL -f server/sql/datos/010_contenido.sql
```

Eso deja una base funcional con todo el contenido del sitio y **cero datos de
pacientes**, que es lo que se quiere en desarrollo o pruebas.

Los datos de pacientes se migran base-a-base el día del corte, con
`server/scripts/migrar-datos-operativos.sh`. **Nunca pasan por Git.**

## Las 19 tablas

### Contenido del sitio
| Tabla | Qué guarda |
|---|---|
| `procedimientos` | Los 14 tratamientos: precio, categoría, promoción, en qué galerías sale |
| `procedimiento_galeria` | Fotos y videos de cada procedimiento |
| `testimonios` | Testimonios en video de pacientes |
| `charlas` / `charla_galeria` | Formación continua de la doctora |
| `configuracion_sitio` | 25 claves editables desde el panel: dirección, teléfonos, datos legales |

### Operación
| Tabla | Qué guarda |
|---|---|
| `citas` | La tabla central: 33 columnas — paciente, procedimiento, fecha, pago, consentimiento |
| `reagendas` | Solicitudes de cambio de fecha, con aprobación de la doctora |
| `horario_global` | Las 21 franjas de 30 min que se pueden agendar |
| `bloqueos_globales` | Horas bloqueadas todos los días |
| `bloqueos_horas` | Bloqueos de una fecha concreta |
| `reportes_mensuales` | Cierres de mes de ingresos |
| `comentarios_pacientes` | Reseñas, con aprobación previa |

### Identidad
| Tabla | Qué guarda |
|---|---|
| `usuarios` | Personas. Desde la migración 002 también correo y contraseña |
| `admin_users` | **Quién es administrador. La autoridad, no `usuarios.rol`** |
| `sesiones` | Refresh tokens, hasheados |
| `tokens_unicos` | Verificación de correo y recuperación, hasheados |

### Sistema
| Tabla | Qué guarda |
|---|---|
| `auditoria_ia` | Toda acción del copiloto: quién pidió qué y qué pasó |
| `integraciones_ia` | Clave de API del copiloto, cifrada con pgcrypto |

## Reglas que viven en la base

No todo está en el código. Estas se cumplen aunque alguien escriba SQL a mano:

- **`uq_citas_slot_activo`** — índice único sobre `(fecha, hora)` para citas no
  canceladas. **Impide dos citas en el mismo turno**, incluso si dos
  peticiones llegan a la vez. El chequeo previo en `citas.js` tiene una
  ventana de carrera; este índice la cierra.
- **`enforce_usuarios_rol`** — impide que alguien se ascienda a admin
  editando su propio perfil.
- **`enforce_firma_para_atendida`** — no se puede marcar una cita como
  atendida sin el consentimiento firmado.
- **`set_updated_at`** — mantiene `actualizado_en` sin que el código lo toque.

## Vistas de reportes

`ingresos`, `v_citas_por_mes`, `v_procedimientos_mas_solicitados`,
`v_procedimientos_por_mes`, `v_resumen_consultorio`,
`v_top_procedimientos_mes_actual`. Las consume el panel de analítica.

## Sobre RLS

Las políticas RLS de Supabase están documentadas en
`server/sql/schema/001_rls_solo_supabase.sql` pero **no hacen falta** en un
Postgres propio: dependen de `auth.uid()`, que solo existe porque Supabase
Auth lo inyecta. El backend se conecta con un rol que hace `BYPASSRLS`, así
que **hoy lo que protege los datos es `verifyToken`/`requireRole` en la API**,
no RLS. Ver [[05 — Seguridad]].
