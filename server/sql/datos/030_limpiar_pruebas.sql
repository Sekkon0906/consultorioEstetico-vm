-- ============================================================================
-- 030 — LIMPIAR DATOS DE PRUEBA (destructivo — leer antes de correr)
-- ----------------------------------------------------------------------------
-- Borra de la base los registros de prueba inventariados en
-- 020_datos_prueba.sql. Pensado para correrlo UNA vez contra producción
-- cuando la doctora confirme que ninguno de estos hace falta.
--
-- BORRA:
--   - el procedimiento "ronron" y sus 4 elementos de galería
--   - las 2 charlas de prueba ('a' y 'salida pedagogica') y sus 5 imágenes
--   - las 22 citas de prueba (todas de la cuenta medinapipe123@gmail.com)
--   - el comentario de paciente de prueba
--
-- NO borra: procedimientos reales, testimonios, configuración, horarios,
-- bloqueos globales, ni la cuenta de la doctora.
--
-- Antes de correr esto en producción: hacer respaldo. En Supabase, un backup
-- se dispara desde el panel (Database → Backups). Los archivos de Storage que
-- estos registros referencian (las imágenes de "ronron" y de las charlas)
-- quedan huérfanos en el bucket y hay que borrarlos aparte, a mano.
-- ============================================================================

BEGIN;

-- Citas de prueba. Se identifican por la cuenta de prueba, no por fecha:
-- borrar por rango de fechas arrastraría citas reales si ya las hubiera.
DELETE FROM horarios_por_fecha
 WHERE cita_id IN (SELECT id FROM citas WHERE correo = 'medinapipe123@gmail.com');

DELETE FROM reagendas
 WHERE cita_id IN (SELECT id FROM citas WHERE correo = 'medinapipe123@gmail.com');

DELETE FROM citas WHERE correo = 'medinapipe123@gmail.com';

-- Procedimiento de prueba "ronron" y su galería.
DELETE FROM procedimiento_galeria WHERE procedimiento_id = '302dd503-205b-4c15-b5e5-77058e8d64b7';
DELETE FROM procedimiento_media   WHERE procedimiento_id = '302dd503-205b-4c15-b5e5-77058e8d64b7';
DELETE FROM procedimientos        WHERE id = '302dd503-205b-4c15-b5e5-77058e8d64b7';

-- Charlas de prueba y sus galerías.
DELETE FROM charla_galeria WHERE charla_id IN (
  'c8f20324-eed2-45be-abb9-6cd9ff93e707',
  'd671f6b1-6d53-4fb3-9040-7679dbb1eef8'
);
DELETE FROM charlas WHERE id IN (
  'c8f20324-eed2-45be-abb9-6cd9ff93e707',
  'd671f6b1-6d53-4fb3-9040-7679dbb1eef8'
);

-- Comentario de paciente de prueba (queda solo si es de la cuenta de prueba).
DELETE FROM comentarios_pacientes
 WHERE user_id IN (SELECT id FROM usuarios WHERE nombres = 'Juan' AND apellidos = 'Medina');

-- Revisar el resultado antes de confirmar. Si algo no cuadra: ROLLBACK;
COMMIT;
