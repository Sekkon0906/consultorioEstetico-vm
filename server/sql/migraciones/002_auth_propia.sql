-- ============================================================================
-- 002 — Auth propia
-- ----------------------------------------------------------------------------
-- Hoy el correo y la contraseña viven en auth.users, que es de Supabase y NO
-- viaja en un pg_dump del esquema public. Esta migración trae esa información
-- a public.usuarios para poder emitir JWT propios.
--
-- Verificado contra el proyecto: hay 1 cuenta, entró por Google y NO tiene
-- contraseña. Por eso no hace falta compatibilidad con los hashes bcrypt de
-- Supabase: se arranca con argon2 limpio.
--
-- Los UUID se conservan: son la llave foránea de citas, reagendas y
-- comentarios_pacientes.
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email             text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash     text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS proveedor         text NOT NULL DEFAULT 'password'
  CHECK (proveedor IN ('password','google'));
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado  boolean NOT NULL DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_sub        text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso_en  timestamptz;

-- El id lo ponía el cliente desde auth.uid(). Ahora lo genera el servidor.
ALTER TABLE usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Un correo, una cuenta. Case-insensitive: nadie debe poder registrar
-- "Dra@x.com" teniendo ya "dra@x.com".
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unico
  ON usuarios (lower(email)) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_sub
  ON usuarios (google_sub) WHERE google_sub IS NOT NULL;

-- WHERE email = $1 — server/src/services/users.js findUserByEmail
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- ---------------------------------------------------------------------------
-- Sesiones: el refresh token se guarda hasheado, nunca en claro. Si la tabla
-- se filtra, los tokens que contiene no sirven para iniciar sesión.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  user_agent      text,
  ip              inet,
  expira_en       timestamptz NOT NULL,
  revocada_en     timestamptz,
  creada_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_user_id ON sesiones (user_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira  ON sesiones (expira_en) WHERE revocada_en IS NULL;

-- ---------------------------------------------------------------------------
-- Tokens de un solo uso: verificación de correo y recuperación de contraseña.
-- También hasheados.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens_unicos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  proposito   text NOT NULL CHECK (proposito IN ('verificar_email','recuperar_password')),
  expira_en   timestamptz NOT NULL,
  usado_en    timestamptz,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tokens_unicos_user ON tokens_unicos (user_id, proposito);

-- ---------------------------------------------------------------------------
-- admin_users ya existe y es la autoridad real de administración (la lee
-- is_admin()). Se conserva tal cual: la API propia debe replicar ese patrón,
-- consultando esta tabla y NUNCA la columna usuarios.rol, que el propio
-- usuario puede modificar.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Desacople de Supabase Auth (añadido 2026-09-01, aplicado a producción)
--
-- `usuarios.id` referenciaba auth.users(id). Con esa llave foránea es
-- IMPOSIBLE crear una cuenta sin pasar antes por Supabase, así que la
-- autenticación propia no podría registrar a nadie. Se elimina y las
-- relaciones se repuntan a public.usuarios, que pasa a ser la tabla de
-- identidad del proyecto.
--
-- No se pierde ningún dato: las filas conservan su UUID, que es lo que citan
-- citas, reagendas y comentarios_pacientes.
-- ---------------------------------------------------------------------------
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS perfiles_id_fkey;

ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_user_id_fkey;
ALTER TABLE citas ADD CONSTRAINT citas_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_uid_fkey;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_uid_fkey
  FOREIGN KEY (uid) REFERENCES usuarios(id) ON DELETE CASCADE;

-- La restricción de rol solo aceptaba 'user', pero el DEFAULT y el trigger
-- enforce_usuarios_rol asignan 'usuario': ningún paciente nuevo podía
-- registrarse porque el valor que generaba la base violaba su restricción.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol = ANY (ARRAY['usuario','user','admin']));

-- Solo el backend toca estas tablas, por conexión directa. RLS activo sin
-- políticas = nadie entra con la clave anon vía PostgREST.
ALTER TABLE sesiones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_unicos ENABLE ROW LEVEL SECURITY;
