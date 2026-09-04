-- 007 · De quién salió la solicitud de cambio de fecha.
--
-- EL PROBLEMA
-- `reagendas` guarda las dos direcciones de la misma conversación:
--
--   · la doctora propone otro día  → el paciente acepta o rechaza
--   · el paciente pide otro día    → la doctora aprueba o rechaza
--
-- y las dos insertaban EXACTAMENTE la misma fila: `cita_id`, `user_id`,
-- `nueva_fecha`, `nueva_hora`, `motivo`, con `estado = 'pendiente'`. El
-- `user_id` es siempre el del paciente —es el dueño de la cita— también
-- cuando quien escribe es la doctora. No había forma de saber quién pidió.
--
-- POR QUÉ IMPORTA
-- Sin distinguirlo, cada pantalla enseña también lo que le toca a la otra:
-- la doctora vería sus propias propuestas listadas como "un paciente pide
-- cambiar su cita", y el paciente vería su propia petición presentada como
-- una propuesta de la doctora, con botones de aceptar y rechazar. Uno
-- acabaría aceptándose a sí mismo.
--
-- Aguantaba porque la mitad del paciente no estaba conectada: el endpoint
-- existía y no había ningún botón que lo llamara. Al conectarla, el choque
-- aparece.
--
-- LA COLUMNA
-- 'consultorio' de defecto porque, hasta hoy, TODAS las filas que podían
-- existir venían de ahí — la otra dirección no tenía interfaz. La tabla
-- está vacía en producción a día de hoy, así que además no hay nada que
-- reinterpretar.
--
-- Se deja como texto con CHECK y no como enum: añadir un valor a un enum
-- de Postgres es una migración; a un CHECK, también, pero sin el tipo
-- huérfano que queda detrás.

ALTER TABLE reagendas
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'consultorio';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reagendas_origen_valido'
  ) THEN
    ALTER TABLE reagendas
      ADD CONSTRAINT reagendas_origen_valido
      CHECK (origen IN ('consultorio', 'paciente'));
  END IF;
END $$;

-- Las dos pantallas preguntan siempre por estado + origen, así que el
-- índice cubre las dos consultas que existen.
CREATE INDEX IF NOT EXISTS idx_reagendas_estado_origen
  ON reagendas (estado, origen, creada_en DESC);
