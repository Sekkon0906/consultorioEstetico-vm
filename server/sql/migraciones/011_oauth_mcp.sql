-- 011 · OAuth para el conector MCP.
--
-- PARA QUÉ
-- El servidor MCP se protegía con un token compartido. Sirve para conectar
-- Claude Desktop a mano, pero no para publicarlo como conector en claude.ai,
-- que exige OAuth 2.1. Y un token compartido tiene dos problemas de fondo: no
-- distingue quién llama, y no caduca solo.
--
-- POR QUÉ EN LA BASE Y NO EN MEMORIA
-- Railway reinicia y duplica procesos cuando le conviene. Con el estado en
-- memoria, cada reinicio desconectaría a la doctora sin avisar y tendría que
-- volver a autorizar; con dos procesos, el que atendiera la segunda mitad del
-- intercambio no reconocería el código emitido por el primero.
--
-- LOS SECRETOS SE GUARDAN EN RESUMEN, NO EN CLARO
-- Igual que las contraseñas. Un volcado de esta tabla no puede convertirse en
-- acceso: para usar un token hay que presentarlo, y aquí solo está su huella.
-- Se usa SHA-256 y no argon2 a propósito — argon2 es lento por diseño para
-- resistir fuerza bruta sobre contraseñas humanas, y estos son valores
-- aleatorios de 256 bits que no se pueden adivinar. Meter medio segundo de
-- argon2 en CADA llamada del conector sería pagar un coste sin comprar nada.
--
-- QUIÉN PUEDE AUTORIZAR
-- Solo un administrador, y se guarda cuál. Estas herramientas cambian precios
-- y promociones del consultorio: que un paciente pudiera autorizar un conector
-- sería regalarle el panel.

-- ── Clientes registrados ────────────────────────────────────────────────────
-- claude.ai se registra solo (RFC 7591) la primera vez. No hay una lista fija
-- que mantener a mano: lo que controla el acceso es la autorización de la
-- doctora, no conocer al cliente de antemano.
CREATE TABLE IF NOT EXISTS oauth_clientes (
  client_id       text PRIMARY KEY,
  -- Nulo en clientes públicos (los que usan PKCE y no pueden guardar un
  -- secreto). claude.ai es uno de ellos.
  client_secret   text,
  nombre          text NOT NULL DEFAULT '',
  redirect_uris   text[] NOT NULL,
  metadatos       jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en       timestamptz NOT NULL DEFAULT now()
);

-- ── Códigos de autorización ─────────────────────────────────────────────────
-- Viven un minuto y se usan una sola vez. Son el eslabón más corto y el más
-- delicado: viajan por la barra de direcciones del navegador, así que acaban
-- en el historial y en los registros de cualquier intermediario.
CREATE TABLE IF NOT EXISTS oauth_codigos (
  codigo_hash     text PRIMARY KEY,
  client_id       text NOT NULL REFERENCES oauth_clientes(client_id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  redirect_uri    text NOT NULL,
  -- El reto de PKCE. Sin esto, quien intercepte el código en la barra de
  -- direcciones puede canjearlo; con esto necesita además el verificador, que
  -- nunca sale del cliente.
  code_challenge  text NOT NULL,
  scopes          text[] NOT NULL DEFAULT '{}',
  resource        text,
  expira_en       timestamptz NOT NULL,
  usado_en        timestamptz,
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_codigos_expira ON oauth_codigos (expira_en);

-- ── Tokens ──────────────────────────────────────────────────────────────────
-- Acceso y refresco en la misma tabla, distinguidos por `tipo`. Son el mismo
-- objeto con distinta vida y distinto uso, y separarlos en dos tablas
-- duplicaría la revocación: al revocar hay que matar los dos, y con una sola
-- tabla es una condición más en el mismo DELETE en vez de dos consultas que
-- alguien puede olvidarse de mantener sincronizadas.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  token_hash      text PRIMARY KEY,
  tipo            text NOT NULL CHECK (tipo IN ('acceso', 'refresco')),
  client_id       text NOT NULL REFERENCES oauth_clientes(client_id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  scopes          text[] NOT NULL DEFAULT '{}',
  resource        text,
  expira_en       timestamptz,
  revocado_en     timestamptz,
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_usuario ON oauth_tokens (user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expira  ON oauth_tokens (expira_en);

COMMENT ON TABLE oauth_clientes IS
  'Clientes MCP registrados dinámicamente (RFC 7591). Lo que controla el acceso es la autorización de un administrador, no conocer al cliente de antemano.';
COMMENT ON TABLE oauth_codigos IS
  'Códigos de autorización: un minuto de vida, un solo uso. Se guarda el resumen, no el código.';
COMMENT ON TABLE oauth_tokens IS
  'Tokens de acceso y refresco, guardados en resumen SHA-256. Revocar es marcar revocado_en.';
