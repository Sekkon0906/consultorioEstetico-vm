-- Avisos del sitio: lo que la doctora quiera decir, dicho por ella desde
-- Claude y visible en la web sin tocar código.
--
-- QUÉ PROBLEMA RESUELVE
-- Hasta ahora, desde el conector solo se podían cambiar cosas que ya existían:
-- un precio, una promoción, un horario. Cualquier cosa que la doctora quisiera
-- comunicar y no cupiera en esos moldes —«cierro del 20 al 25», «llegó el
-- equipo nuevo», «esta semana atiendo en otra sede»— no tenía sitio, y acababa
-- pidiéndose por WhatsApp a quien mantiene el código.
--
-- POR QUÉ HAY FECHAS Y NO SOLO UN INTERRUPTOR
-- Porque un aviso sin caducidad se queda puesto. El caso típico de esta tabla
-- es un aviso que deja de ser cierto en una fecha conocida el día que se
-- escribe, y nadie vuelve a entrar a apagarlo: la web se queda anunciando un
-- cierre de diciembre en marzo, que es peor que no haber avisado nada.
-- `hasta` se rellena en el momento en que se sabe, que es el único momento en
-- que alguien se acuerda.
--
-- Aplicar DESPUÉS de desplegar el código que la lee. Es una tabla nueva, así
-- que añadirla antes tampoco rompe nada: el paso que AÑADE puede ir primero.

CREATE TABLE IF NOT EXISTS avisos_sitio (
  id          SERIAL PRIMARY KEY,
  titulo      TEXT NOT NULL,
  cuerpo      TEXT NOT NULL DEFAULT '',

  -- Qué tan fuerte se pinta. No es decoración: un cierre por vacaciones y una
  -- promoción no deberían competir por la misma atención.
  --   informativo  gris, discreto
  --   importante   destacado — cierres, cambios de sede, avisos que afectan a
  --                una cita ya agendada
  --   promocion    con el color de la marca
  tipo        TEXT NOT NULL DEFAULT 'informativo'
              CHECK (tipo IN ('informativo', 'importante', 'promocion')),

  activo      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Ventana de publicación. NULL en `desde` = desde ya; NULL en `hasta` = sin
  -- caducidad, que se permite pero conviene evitar.
  desde       DATE,
  hasta       DATE,

  orden       INT NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por  TEXT NOT NULL DEFAULT 'panel',

  CONSTRAINT avisos_ventana_coherente CHECK (desde IS NULL OR hasta IS NULL OR desde <= hasta)
);

-- El índice cubre la única consulta que hace la web pública —los vigentes de
-- hoy, en orden—, que se ejecuta en cada visita a la portada.
CREATE INDEX IF NOT EXISTS idx_avisos_vigentes
  ON avisos_sitio (activo, desde, hasta, orden);
