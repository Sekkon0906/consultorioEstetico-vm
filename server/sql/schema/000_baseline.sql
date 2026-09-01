-- ============================================================================
-- 000 — BASELINE: esquema completo tal como existe hoy en producción
-- ----------------------------------------------------------------------------
-- Volcado a mano (no con pg_dump, por no tener acceso de shell al proyecto de
-- Supabase) a partir de introspección real vía SQL contra el proyecto
-- ibpkihfjripvizismhsk el 2026-09-01. Representa el esquema COMPLETO de
-- `public` en ese momento: tablas, columnas, defaults, checks, funciones,
-- triggers y vistas de reportes.
--
-- PARA QUÉ SIRVE ESTE ARCHIVO
-- Es la fotografía que permite levantar la base en cualquier Postgres nuevo
-- (Railway Postgres, Neon, RDS, un contenedor local) sin depender de
-- Supabase. El día que se despliegue en otro lado, el proceso es:
--
--   1. createdb consultorio   (o el nombre que uses)
--   2. psql $DATABASE_URL -f server/sql/schema/000_baseline.sql
--   3. psql $DATABASE_URL -f server/sql/migraciones/002_auth_propia.sql
--      (SOLO si ya se migró el login fuera de Supabase Auth — ver docs/MIGRACION.md)
--   4. Listo: el backend Express (server/) apunta a esa base con DATABASE_URL
--      y funciona igual, porque nunca usa el SDK de Supabase para datos —
--      solo `pg.Pool` con SQL directo.
--
-- QUÉ NO INCLUYE A PROPÓSITO
-- - Las políticas RLS (Row Level Security) y la función is_admin(): dependen
--   de auth.uid()/auth.jwt(), que solo existen porque Supabase Auth inyecta
--   ese contexto en cada request vía PostgREST. El backend Express NUNCA pasa
--   por PostgREST — usa una conexión directa con un rol que hace BYPASSRLS
--   (rolbypassrls=true, verificado en producción) — así que hoy RLS no es lo
--   que protege los datos: lo hace verifyToken/requireRole en cada ruta de
--   server/src/routes/*.js. Quedan documentadas en
--   server/sql/schema/001_rls_solo_supabase.sql para no perderlas, pero NO
--   hacen falta para levantar la base en un Postgres propio.
-- - Los datos de auth.users (correos, contraseñas, proveedor OAuth): eso es
--   Supabase Auth. La migración 002_auth_propia.sql ya prepara las columnas
--   para reemplazarlo con JWT propios; falta el paso de exportar/migrar las
--   cuentas existentes cuando se ejecute esa fase.
-- - Las tablas procedimiento_media y horarios_por_fecha: se borraron el
--   2026-09-01 por estar vacías y sin una sola referencia en el código. Eran
--   duplicados de procedimiento_galeria y bloqueos_horas respectivamente.
-- - Los buckets de Storage (imágenes, firmas, PDFs de consentimiento): viven
--   fuera de Postgres. Al migrar hay que llevarlos a donde se decida (R2, S3,
--   disco del servidor) y actualizar las URLs guardadas en las tablas.
--
-- Este archivo es idempotente (CREATE ... IF NOT EXISTS / OR REPLACE): se
-- puede correr varias veces sin romper nada.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres                   text NOT NULL,
  apellidos                 text NOT NULL,
  edad                      integer,
  genero                    text CHECK (genero = ANY (ARRAY['Masculino','Femenino','Otro'])),
  telefono                  text,
  -- 'usuario' es el valor que ponen el DEFAULT y el trigger
  -- enforce_usuarios_rol. En producción la restricción solo aceptaba
  -- 'user', así que ningún paciente podía registrarse: el valor que
  -- generaba la propia base violaba su propia restricción.
  rol                       text NOT NULL DEFAULT 'usuario'
                              CHECK (rol = ANY (ARRAY['usuario','user','admin'])),
  antecedentes              text DEFAULT '',
  antecedentes_descripcion  text DEFAULT '',
  alergias                  text DEFAULT '',
  alergias_descripcion      text DEFAULT '',
  medicamentos              text DEFAULT '',
  medicamentos_descripcion  text DEFAULT '',
  photo                     text,
  creado_en                 timestamptz DEFAULT now(),
  actualizado_en            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  uid       uuid PRIMARY KEY REFERENCES usuarios(id),
  added_at  timestamptz NOT NULL DEFAULT now(),
  note      text
);

CREATE TABLE IF NOT EXISTS procedimientos (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                          text NOT NULL,
  descripcion                     text NOT NULL DEFAULT '',
  precio                          text NOT NULL DEFAULT '',
  imagen                          text DEFAULT '',
  categoria                       text NOT NULL CHECK (categoria = ANY (ARRAY['Facial','Corporal','Capilar'])),
  duracion_min                    integer,
  destacado                       boolean DEFAULT false,
  creado_en                       timestamptz DEFAULT now(),
  actualizado_en                  timestamptz DEFAULT now(),
  descripcion_completa            text DEFAULT '',
  subcategoria                    text,
  en_promocion                    boolean NOT NULL DEFAULT false,
  precio_promocional              text,
  promocion_hasta                 date,
  mostrar_galeria_home            boolean NOT NULL DEFAULT false,
  mostrar_galeria_procedimientos  boolean NOT NULL DEFAULT true
);
COMMENT ON COLUMN procedimientos.en_promocion IS 'Marca el procedimiento como promoción activa.';
COMMENT ON COLUMN procedimientos.precio_promocional IS 'Precio con descuento si en_promocion = true (string flexible como el precio normal).';
COMMENT ON COLUMN procedimientos.promocion_hasta IS 'Fecha límite de la promoción (opcional). Al pasarse, la doctora debe desmarcar en_promocion manualmente.';
COMMENT ON COLUMN procedimientos.mostrar_galeria_home IS 'Si aparece en la Galería 3D de la home.';
COMMENT ON COLUMN procedimientos.mostrar_galeria_procedimientos IS 'Si aparece en el listado de /procedimientos (default true: visible).';

CREATE TABLE IF NOT EXISTS procedimiento_galeria (
  id               integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  procedimiento_id uuid NOT NULL REFERENCES procedimientos(id),
  tipo             text NOT NULL DEFAULT 'imagen',
  url              text NOT NULL,
  titulo           text DEFAULT '',
  descripcion      text DEFAULT '',
  orden            integer DEFAULT 0,
  creado_en        timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  texto           text NOT NULL DEFAULT '',
  video           text DEFAULT '',
  thumb           text DEFAULT '',
  activo          boolean DEFAULT true,
  destacado       boolean DEFAULT false,
  creado_en       timestamptz DEFAULT now(),
  actualizado_en  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charlas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          text NOT NULL,
  descripcion     text NOT NULL DEFAULT '',
  detalle         text DEFAULT '',
  imagen          text DEFAULT '',
  fecha           date,
  creado_en       timestamptz DEFAULT now(),
  actualizado_en  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charla_galeria (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charla_id  uuid NOT NULL REFERENCES charlas(id),
  url        text NOT NULL,
  tipo       text DEFAULT 'imagen' CHECK (tipo = ANY (ARRAY['imagen','video','youtube'])),
  orden      integer DEFAULT 0,
  creado_en  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citas (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  nombres                  text NOT NULL,
  apellidos                text NOT NULL,
  telefono                 text NOT NULL,
  correo                   text NOT NULL,
  procedimiento_id         uuid REFERENCES procedimientos(id),
  procedimiento            text NOT NULL,
  tipo_cita                text NOT NULL DEFAULT 'implementacion' CHECK (tipo_cita = ANY (ARRAY['valoracion','implementacion'])),
  nota                     text,
  fecha                    date NOT NULL,
  hora                     text NOT NULL,
  metodo_pago              text CHECK (metodo_pago = ANY (ARRAY['Consultorio','Online'])),
  tipo_pago_consultorio    text CHECK (tipo_pago_consultorio = ANY (ARRAY['Efectivo','Tarjeta'])),
  tipo_pago_online         text CHECK (tipo_pago_online = ANY (ARRAY['PayU','PSE'])),
  pagado                   boolean DEFAULT false,
  monto                    integer,
  monto_pagado             integer,
  monto_restante           integer GENERATED ALWAYS AS (GREATEST((COALESCE(monto, 0) - COALESCE(monto_pagado, 0)), 0)) STORED,
  creada_por               text DEFAULT 'usuario' CHECK (creada_por = ANY (ARRAY['usuario','doctora'])),
  estado                   text DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','confirmada','atendida','cancelada'])),
  motivo_cancelacion       text,
  qr_url                   text,
  creado_en                timestamptz DEFAULT now(),
  actualizado_en           timestamptz DEFAULT now(),
  consentimiento_firmado   boolean DEFAULT false,
  firma_url                text DEFAULT '',
  firma_fecha              timestamp,
  consentimiento_pdf       text DEFAULT '',
  recordatorio_enviado_en  timestamptz,
  firma_documento          text,
  firma_direccion          text,
  firma_uso_promocional    boolean
);

CREATE TABLE IF NOT EXISTS horario_global (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hora            text NOT NULL UNIQUE,
  disponible      boolean DEFAULT true,
  actualizado_en  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bloqueos_horas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha      date NOT NULL,
  hora       text NOT NULL,
  motivo     text DEFAULT 'doctora',
  creado_en  timestamptz DEFAULT now(),
  UNIQUE (fecha, hora)
);

CREATE TABLE IF NOT EXISTS bloqueos_globales (
  id         integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  hora       text NOT NULL UNIQUE,
  motivo     text DEFAULT 'Bloqueo global',
  creado_en  timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reportes_mensuales (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes               integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio              integer NOT NULL,
  total_online      numeric DEFAULT 0,
  total_consultorio numeric DEFAULT 0,
  total_esperado    numeric DEFAULT 0,
  archivo_url       text,
  fecha_generacion  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mes, anio)
);

CREATE TABLE IF NOT EXISTS reagendas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id      uuid NOT NULL REFERENCES citas(id),
  user_id      uuid REFERENCES usuarios(id),
  nueva_fecha  date NOT NULL,
  nueva_hora   text NOT NULL,
  motivo       text DEFAULT '',
  estado       text NOT NULL DEFAULT 'pendiente' CHECK (estado = ANY (ARRAY['pendiente','aprobada','rechazada'])),
  creada_en    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comentarios_pacientes (
  id            integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  user_id       uuid REFERENCES usuarios(id),
  nombre        text NOT NULL,
  procedimiento text NOT NULL,
  texto         text NOT NULL,
  puntuacion    integer NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  aprobado      boolean DEFAULT false,
  creado_en     timestamp DEFAULT now()
);

-- integraciones_ia y configuracion_sitio y auditoria_ia: ya cubiertas por
-- server/sql/migraciones/001_configuracion_sitio.sql,
-- server/sql/migraciones/003_auditoria_ia.sql y
-- server/sql/migraciones/004_integraciones_ia.sql — se corren después de este
-- archivo, en orden, y son igual de idempotentes.

-- ============================================================================
-- ÍNDICES QUE EXISTEN EN PRODUCCIÓN
-- ----------------------------------------------------------------------------
-- Se replican aquí porque `server/sql/indexes.sql` había quedado desfasado:
-- varios de estos se crearon directo contra Supabase y nunca se versionaron.
-- Sin ellos, un despliegue nuevo arrancaría más lento — y, en el caso de
-- uq_citas_slot_activo, directamente con un bug de negocio.
-- ============================================================================

-- NOTA sobre nombres: en producción tres restricciones conservan el nombre
-- autogenerado de cuando las tablas se llamaban distinto — `perfiles_pkey`
-- (hoy usuarios), `bloqueos_pkey` y `bloqueos_fecha_hora_key` (hoy
-- bloqueos_horas). Una base creada desde este archivo las tendrá con el
-- nombre nuevo (`usuarios_pkey`, etc.). Son las mismas restricciones: misma
-- tabla, mismas columnas, mismo efecto. No es una diferencia a corregir.

-- REGLA DE NEGOCIO, no una optimización: impide que existan dos citas activas
-- en la misma fecha y hora. Es lo que hace que no se puedan agendar dos
-- pacientes en el mismo turno aunque dos peticiones lleguen a la vez (el
-- chequeo previo en server/src/routes/citas.js tiene una ventana de carrera;
-- este índice la cierra a nivel de base). Las canceladas quedan fuera, así
-- que un turno cancelado se puede volver a agendar.
CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_slot_activo
  ON citas (fecha, hora) WHERE (estado IS DISTINCT FROM 'cancelada');

CREATE INDEX IF NOT EXISTS idx_citas_fecha            ON citas (fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado           ON citas (estado);
CREATE INDEX IF NOT EXISTS idx_citas_pagado           ON citas (pagado);
CREATE INDEX IF NOT EXISTS idx_citas_procedimiento_id ON citas (procedimiento_id);

-- Barrido del cron de recordatorios: solo mira citas sin recordatorio enviado
-- y todavía vigentes, así que el índice parcial cubre exactamente esa consulta.
CREATE INDEX IF NOT EXISTS idx_citas_pending_reminder
  ON citas (fecha)
  WHERE recordatorio_enviado_en IS NULL AND estado = ANY (ARRAY['pendiente','confirmada']);

CREATE INDEX IF NOT EXISTS idx_bloqueos_horas_fecha_hora   ON bloqueos_horas (fecha, hora);
CREATE INDEX IF NOT EXISTS idx_reagendas_user_id           ON reagendas (user_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_user_id         ON comentarios_pacientes (user_id);
CREATE INDEX IF NOT EXISTS idx_proc_galeria_procedimiento_id ON procedimiento_galeria (procedimiento_id);

-- ============================================================================
-- FUNCIONES Y TRIGGERS DE NEGOCIO (sí hacen falta: no son de Supabase Auth)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_perfiles_updated ON usuarios;
CREATE TRIGGER trg_perfiles_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_procedimientos_updated ON procedimientos;
CREATE TRIGGER trg_procedimientos_updated BEFORE UPDATE ON procedimientos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_testimonios_updated ON testimonios;
CREATE TRIGGER trg_testimonios_updated BEFORE UPDATE ON testimonios FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_charlas_updated ON charlas;
CREATE TRIGGER trg_charlas_updated BEFORE UPDATE ON charlas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_citas_updated ON citas;
CREATE TRIGGER trg_citas_updated BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Nadie cambia su propio rol a admin (ni al registrarse ni luego). Antes
-- dependía de is_admin() (Supabase Auth); en Postgres propio sigue
-- funcionando igual mientras exista admin_users, pero el backend YA hace
-- esta misma validación en server/src/middlewares/requireRole.js — este
-- trigger es una segunda barrera a nivel de base, no la única.
CREATE OR REPLACE FUNCTION enforce_usuarios_rol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists (select 1 from admin_users a where a.uid = new.id) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.rol := 'usuario';
  elsif tg_op = 'UPDATE' then
    new.rol := old.rol;
  end if;
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_usuarios_rol ON usuarios;
CREATE TRIGGER trg_enforce_usuarios_rol BEFORE INSERT OR UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION enforce_usuarios_rol();

-- No se puede marcar una cita como "atendida" sin firma de consentimiento.
CREATE OR REPLACE FUNCTION enforce_firma_para_atendida()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.estado = 'atendida'
     and old.estado is distinct from 'atendida'
     and coalesce(new.consentimiento_firmado, false) = false then
    raise exception 'No se puede marcar la cita como atendida sin el consentimiento firmado'
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

DROP TRIGGER IF EXISTS trg_firma_para_atendida ON citas;
CREATE TRIGGER trg_firma_para_atendida BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION enforce_firma_para_atendida();

-- ============================================================================
-- VISTAS DE REPORTES (usadas por server/src/routes/analytics.js y reportes.js)
-- ============================================================================

CREATE OR REPLACE VIEW ingresos AS
 SELECT id AS cita_id,
    (nombres || ' ' || apellidos) AS paciente,
    procedimiento,
    COALESCE(monto_pagado, monto, 0) AS monto,
    metodo_pago,
    fecha,
    creado_en
   FROM citas
  WHERE pagado = true;

CREATE OR REPLACE VIEW v_citas_por_mes AS
 SELECT date_trunc('month', fecha::timestamp with time zone) AS mes,
    EXTRACT(year FROM fecha)::integer AS anio,
    EXTRACT(month FROM fecha)::integer AS mes_num,
    count(*) AS total_citas,
    count(*) FILTER (WHERE estado = 'atendida') AS atendidas,
    count(*) FILTER (WHERE estado = 'cancelada') AS canceladas,
    count(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
    count(*) FILTER (WHERE estado = 'confirmada') AS confirmadas,
    count(DISTINCT procedimiento) AS procedimientos_distintos
   FROM citas
  GROUP BY date_trunc('month', fecha::timestamp with time zone), EXTRACT(year FROM fecha), EXTRACT(month FROM fecha)
  ORDER BY date_trunc('month', fecha::timestamp with time zone) DESC;

CREATE OR REPLACE VIEW v_procedimientos_mas_solicitados AS
 SELECT p.id, p.nombre, p.categoria, p.imagen, p.precio,
    count(c.id) AS total_citas,
    count(c.id) FILTER (WHERE c.estado = 'atendida') AS total_atendidas,
    count(c.id) FILTER (WHERE c.estado = 'cancelada') AS total_canceladas,
    count(c.id) FILTER (WHERE c.estado = 'pendiente') AS total_pendientes,
    count(c.id) FILTER (WHERE c.estado = 'confirmada') AS total_confirmadas,
    round(((count(c.id) FILTER (WHERE c.estado = 'atendida'))::numeric / NULLIF(count(c.id), 0)::numeric) * 100, 1) AS tasa_completado_pct
   FROM procedimientos p
     LEFT JOIN citas c ON c.procedimiento = p.nombre
  GROUP BY p.id, p.nombre, p.categoria, p.imagen, p.precio
  ORDER BY count(c.id) DESC;

CREATE OR REPLACE VIEW v_procedimientos_por_mes AS
 SELECT EXTRACT(year FROM c.fecha)::integer AS anio,
    EXTRACT(month FROM c.fecha)::integer AS mes,
    c.procedimiento, p.categoria, p.imagen,
    count(c.id) AS total,
    count(c.id) FILTER (WHERE c.estado = 'atendida') AS atendidas
   FROM citas c
     LEFT JOIN procedimientos p ON p.nombre = c.procedimiento
  GROUP BY EXTRACT(year FROM c.fecha), EXTRACT(month FROM c.fecha), c.procedimiento, p.categoria, p.imagen
  ORDER BY 1 DESC, 2 DESC, count(c.id) DESC;

CREATE OR REPLACE VIEW v_resumen_consultorio AS
 SELECT count(*) AS total_citas_historico,
    count(*) FILTER (WHERE estado = 'atendida') AS total_atendidas,
    count(*) FILTER (WHERE estado = 'cancelada') AS total_canceladas,
    count(*) FILTER (WHERE estado = 'pendiente') AS total_pendientes,
    count(*) FILTER (WHERE fecha >= date_trunc('month', CURRENT_DATE::timestamp with time zone)) AS citas_este_mes,
    count(*) FILTER (WHERE fecha = CURRENT_DATE) AS citas_hoy,
    count(DISTINCT procedimiento) AS procedimientos_distintos_usados,
    count(DISTINCT user_id) AS pacientes_unicos
   FROM citas;

CREATE OR REPLACE VIEW v_top_procedimientos_mes_actual AS
 SELECT c.procedimiento, p.categoria, p.imagen,
    count(c.id) AS total,
    count(c.id) FILTER (WHERE c.estado = 'atendida') AS atendidas,
    round(((count(c.id) FILTER (WHERE c.estado = 'atendida'))::numeric / NULLIF(count(c.id), 0)::numeric) * 100, 1) AS tasa_exito_pct
   FROM citas c
     LEFT JOIN procedimientos p ON p.nombre = c.procedimiento
  WHERE date_trunc('month', c.fecha::timestamp with time zone) = date_trunc('month', CURRENT_DATE::timestamp with time zone)
  GROUP BY c.procedimiento, p.categoria, p.imagen
  ORDER BY count(c.id) DESC
  LIMIT 5;
