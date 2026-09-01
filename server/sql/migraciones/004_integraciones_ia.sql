-- ============================================================================
-- 004 — integraciones_ia
-- ----------------------------------------------------------------------------
-- Ya aplicada directamente contra el proyecto de Supabase mediante el MCP
-- (migración "integraciones_ia_cifradas"). Este archivo la deja documentada
-- en el repositorio junto con las demás.
--
-- Guarda la clave de API que la doctora pega desde el panel del copiloto,
-- cifrada con pgcrypto (nunca en texto plano). Solo el backend Express la
-- toca -- conecta directo por DATABASE_URL, no por PostgREST/anon key, así
-- que no hace falta RLS: por diseño esta tabla nunca se expone a ninguna
-- ruta pública ni al cliente. NO confundir con configuracion_sitio, que sí
-- es de lectura pública.
-- ============================================================================

create table if not exists integraciones_ia (
  proveedor        text primary key,
  api_key_cifrada  bytea not null,
  configurada_en   timestamptz not null default now(),
  configurada_por  uuid references usuarios(id)
);

comment on table integraciones_ia is
  'Claves de API de proveedores de IA (copiloto), cifradas con pgcrypto. Solo accesible desde el backend Express -- nunca expuesta al cliente ni a rutas públicas.';
