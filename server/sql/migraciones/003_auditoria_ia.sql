-- ============================================================================
-- 003 — Auditoría del copiloto de IA
-- ----------------------------------------------------------------------------
-- Toda acción que el copiloto ejecuta queda registrada: quién la pidió, qué
-- pidió, qué herramienta se usó, con qué argumentos y qué pasó.
--
-- Es un consultorio médico: si un precio o un procedimiento aparece cambiado,
-- tiene que poder rastrearse hasta la frase que lo originó.
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria_ia (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  conversacion_id uuid NOT NULL,
  mensaje        text NOT NULL,
  herramienta    text,
  argumentos     jsonb,
  resultado      text NOT NULL DEFAULT 'propuesta'
                   CHECK (resultado IN ('propuesta','confirmada','rechazada','error','solo_lectura')),
  detalle        text,
  entidad_tipo   text,
  entidad_id     uuid,
  creado_en      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_ia_creado_en ON auditoria_ia (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_ia_user      ON auditoria_ia (user_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_ia_conv      ON auditoria_ia (conversacion_id, creado_en);

COMMENT ON COLUMN auditoria_ia.resultado IS
  'propuesta: el modelo propuso y espera confirmación. confirmada: la doctora aprobó y se ejecutó. rechazada: la descartó. solo_lectura: consulta que no escribe nada.';
