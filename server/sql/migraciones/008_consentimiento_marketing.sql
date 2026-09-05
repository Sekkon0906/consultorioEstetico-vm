-- 008 · Permiso para enviar correos comerciales.
--
-- POR QUÉ HACE FALTA UNA COLUMNA Y NO BASTA CON "ES CLIENTE"
-- La Ley 1581 de 2012 (habeas data) exige consentimiento previo, expreso e
-- informado para tratar datos personales con fines comerciales. "Previo"
-- quiere decir antes de enviar el primer correo; "expreso" quiere decir que
-- el silencio no vale, así que una casilla premarcada no es consentimiento;
-- e "informado" quiere decir que hay que decir para qué.
--
-- La consecuencia práctica es que hay DOS clases de correo y no se pueden
-- mezclar:
--
--   · Los que el servicio necesita para funcionar —cita confirmada,
--     recordatorio, recuperar contraseña, reagenda— NO piden permiso aparte.
--     Se envían porque la persona pidió una cita, y sin ellos la cita no
--     funciona. Esta columna NO los gobierna.
--
--   · Los comerciales —promociones, descuentos, la tarjeta de fidelidad—
--     solo se pueden enviar si esta columna dice `true`.
--
-- Confundirlas en el código sería el error caro: dejaría a un paciente sin
-- su recordatorio por no haber querido publicidad.
--
-- POR QUÉ SE GUARDA CUÁNDO Y DESDE DÓNDE
-- Ante una queja, lo que hay que poder demostrar no es que la casilla está
-- marcada hoy: es que la persona la marcó, y cuándo. Un booleano solo dice
-- el estado actual. `marketing_aceptado_en` da la fecha y `marketing_origen`
-- dice en qué pantalla ocurrió ('registro', 'perfil'), que es lo que permite
-- reconstruir qué texto estaba viendo cuando aceptó.
--
-- Al darse de baja NO se borran esas dos columnas: se pone el booleano en
-- false y se deja el rastro de cuándo se había aceptado. Borrarlo dejaría al
-- consultorio sin la prueba de los envíos que sí fueron legítimos.
--
-- DEFAULT false
-- No es una preferencia de producto, es el requisito: quien ya está
-- registrado nunca dio este permiso, así que no lo tiene. Poner `true` de
-- defecto convertiría a toda la base actual en una lista de correo sin
-- consentimiento.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS acepta_marketing boolean NOT NULL DEFAULT false;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS marketing_aceptado_en timestamptz;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS marketing_origen text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_marketing_origen_valido'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_marketing_origen_valido
      CHECK (marketing_origen IS NULL OR marketing_origen IN ('registro', 'perfil'));
  END IF;
END $$;

-- El único uso real de estas columnas es "dame a quién puedo escribirle".
-- Un índice parcial sobre los que aceptaron es mucho más pequeño que uno
-- sobre la tabla entera, porque la mayoría no acepta.
CREATE INDEX IF NOT EXISTS idx_usuarios_acepta_marketing
  ON usuarios (acepta_marketing)
  WHERE acepta_marketing = true;

COMMENT ON COLUMN usuarios.acepta_marketing IS
  'Permiso EXPRESO para correos comerciales (Ley 1581). No gobierna los correos del servicio: cita confirmada, recordatorio, reagenda y contraseña se envían igual.';
COMMENT ON COLUMN usuarios.marketing_aceptado_en IS
  'Cuándo se dio el permiso. Se conserva tras darse de baja: es la prueba de que los envíos anteriores fueron legítimos.';
COMMENT ON COLUMN usuarios.marketing_origen IS
  'En qué pantalla se aceptó (registro | perfil), para poder reconstruir qué texto estaba viendo la persona.';
