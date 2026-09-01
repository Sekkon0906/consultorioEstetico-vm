-- ============================================================================
-- indexes.sql — Índices de rendimiento (additivos, seguros e idempotentes)
-- ----------------------------------------------------------------------------
-- CÓMO USAR:
--   Copie y pegue este archivo completo en el SQL Editor de Supabase y
--   ejecútelo. Es seguro volver a ejecutarlo cuantas veces se quiera:
--   todas las sentencias usan CREATE INDEX IF NOT EXISTS, por lo que NO
--   fallan si el índice ya existe y NO modifican datos ni el esquema.
--
-- NOTAS:
--   - No se usa CONCURRENTLY (debe correr fuera de transacción; el editor
--     de Supabase envuelve el script en una transacción). En tablas
--     pequeñas/medianas el bloqueo es muy breve.
--   - No se crean índices para columnas ya cubiertas por PRIMARY KEY (id)
--     ni por restricciones UNIQUE existentes
--     (bloqueos_horas(fecha,hora) y reportes_mensuales(mes,anio) ya tienen
--     UNIQUE por las cláusulas ON CONFLICT del código).
--   - Solo se indexan columnas que SE CONFIRMARON filtradas / ordenadas /
--     unidas en rutas calientes del código.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- TABLA: citas
-- ---------------------------------------------------------------------------

-- WHERE user_id = $1
--   server/src/routes/citas.js  GET /citas (rol=usuario), POST solicitar-reagenda
--   server/src/routes/reagendas.js  SELECT ... WHERE id=$1 AND user_id=$2
--   app/services/citasApi.ts  getCitasApi / getMisCitasApi (.eq("user_id", ...))
CREATE INDEX IF NOT EXISTS idx_citas_user_id ON citas (user_id);

-- WHERE fecha = $1  +  ORDER BY fecha ASC, hora ASC
--   server/src/routes/citas.js  GET /citas (?fecha=), ORDER BY fecha, hora
--   app/administrar/citas/helpers.ts  getCitasByDayAPI / getCitasAPI
--   app/services/citasApi.ts  getCitasByDayApi / getCitasApi / getMisCitasApi
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas (fecha, hora);

-- WHERE fecha=$1 AND hora=$2 AND estado NOT IN ('cancelada')
--   server/src/routes/citas.js  POST /citas (chequeo de disponibilidad)
--   app/services/citasApi.ts  createCitaApi (.eq fecha,.eq hora,.neq estado)
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora_estado ON citas (fecha, hora, estado);


-- ---------------------------------------------------------------------------
-- TABLA: bloqueos_horas
--   La consulta por (fecha,hora) ya está cubierta por la restricción UNIQUE
--   (fecha,hora) que usa el ON CONFLICT en server/src/routes/bloqueosHoras.js.
--   Solo falta soportar el filtro/orden por la columna fecha sola.
-- ---------------------------------------------------------------------------

-- WHERE fecha=$1  /  ORDER BY fecha DESC, hora ASC
--   server/src/routes/bloqueosHoras.js  GET /bloqueos-horas
--   app/services/citasApi.ts  getBloqueosPorFechaApi (.eq("fecha", ...))
CREATE INDEX IF NOT EXISTS idx_bloqueos_horas_fecha ON bloqueos_horas (fecha);


-- ---------------------------------------------------------------------------
-- TABLA: reagendas
-- ---------------------------------------------------------------------------

-- JOIN citas c ON c.id = r.cita_id  (lookup por cita_id)
--   server/src/routes/reagendas.js  GET /reagendas (JOIN reagendas/citas)
CREATE INDEX IF NOT EXISTS idx_reagendas_cita_id ON reagendas (cita_id);

-- ORDER BY r.creada_en DESC
--   server/src/routes/reagendas.js  GET /reagendas
CREATE INDEX IF NOT EXISTS idx_reagendas_creada_en ON reagendas (creada_en);


-- ---------------------------------------------------------------------------
-- TABLA: testimonios
-- ---------------------------------------------------------------------------

-- ORDER BY destacado DESC, creado_en DESC
--   server/src/routes/testimonios.js  GET /testimonios
--   app/services/testimoniosApi.ts  getTestimoniosApi
CREATE INDEX IF NOT EXISTS idx_testimonios_destacado_creado_en
  ON testimonios (destacado, creado_en);


-- ---------------------------------------------------------------------------
-- TABLA: procedimientos
-- ---------------------------------------------------------------------------

-- ORDER BY categoria ASC, nombre ASC
--   server/src/routes/procedimientos.js  GET /procedimientos
--   app/services/procedimientosApi.ts  getProcedimientosApi
CREATE INDEX IF NOT EXISTS idx_procedimientos_categoria_nombre
  ON procedimientos (categoria, nombre);


-- ---------------------------------------------------------------------------
-- TABLA: charlas
-- ---------------------------------------------------------------------------

-- ORDER BY c.fecha DESC NULLS LAST, c.creado_en DESC
--   server/src/routes/charlas.js  GET /charlas
CREATE INDEX IF NOT EXISTS idx_charlas_fecha_creado_en
  ON charlas (fecha DESC NULLS LAST, creado_en DESC);


-- ---------------------------------------------------------------------------
-- TABLA: charla_galeria
-- ---------------------------------------------------------------------------

-- LEFT JOIN charla_galeria g ON g.charla_id = c.id  (+ ORDER BY g.orden)
-- DELETE FROM charla_galeria WHERE charla_id = $1
--   server/src/routes/charlas.js  GET /charlas, PUT /charlas/:id
CREATE INDEX IF NOT EXISTS idx_charla_galeria_charla_id_orden
  ON charla_galeria (charla_id, orden);


-- ---------------------------------------------------------------------------
-- TABLA: usuarios
--   La búsqueda por id ya está cubierta por la PRIMARY KEY.
-- ---------------------------------------------------------------------------

-- idx_usuarios_email vive en migraciones/002_auth_propia.sql: la columna
-- `email` no existe en usuarios hasta que esa migración corre (fase de auth
-- propia, todavía no aplicada). Ponerla aquí rompía un deploy limpio del
-- baseline en un Postgres nuevo.

-- ORDER BY creado_en DESC
--   server/src/routes/usuarios.js  GET /usuarios (listado admin)
CREATE INDEX IF NOT EXISTS idx_usuarios_creado_en ON usuarios (creado_en);


-- ---------------------------------------------------------------------------
-- TABLA: reportes_mensuales
--   ORDER BY fecha_generacion DESC en server/src/routes/reportes.js GET /reportes
--   (la clave (mes,anio) ya tiene UNIQUE por el ON CONFLICT (mes, anio)).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reportes_mensuales_fecha_generacion
  ON reportes_mensuales (fecha_generacion);
