-- ============================================================================
-- 001 — Políticas RLS de Supabase (SOLO referencia, NO hace falta correr esto
-- para levantar la base en un Postgres propio)
-- ----------------------------------------------------------------------------
-- Estas políticas dependen de auth.uid() y auth.jwt(), funciones que solo
-- existen porque Supabase Auth + PostgREST inyectan ese contexto en cada
-- request HTTP a la API automática. El backend Express de este proyecto
-- (server/) NUNCA pasa por ahí: se conecta directo a Postgres con `pg.Pool`
-- usando un rol con BYPASSRLS (verificado en producción: rolbypassrls=true),
-- y cada ruta ya valida el rol con verifyToken/requireRole
-- (server/src/middlewares/). Es decir: hoy la seguridad real la hace la capa
-- de la API, no RLS.
--
-- Se documentan aquí por dos razones:
--   1. Si en algún momento se vuelve a exponer la base directo a un cliente
--      (p.ej. usar el SDK de Supabase desde el frontend para algo puntual),
--      hace falta saber qué política existía.
--   2. Es la fotografía exacta de lo que hay en producción a 2026-09-01, para
--      no perder el rastro si se decide desactivar Supabase Auth del todo.
--
-- Si migras a un Postgres propio y NO vas a usar Supabase Auth/PostgREST,
-- ignora este archivo — no aplica.
-- ============================================================================

-- Requiere que exista la función auth.uid()/auth.jwt() (las provee Supabase).
-- No se puede correr tal cual en un Postgres genérico sin recrear ese schema.

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.admin_users a where a.uid = (select auth.uid())
  );
$function$;

-- admin_users: solo admins pueden verla.
CREATE POLICY admin_users_sel ON admin_users FOR SELECT USING (is_admin());

-- Catálogos de lectura pública, escritura solo admin (procedimientos,
-- testimonios, charlas y sus galerías, horarios, bloqueos).
-- Patrón repetido: <tabla>_sel (true), <tabla>_ins/upd/del (is_admin()).
-- procedimientos, procedimiento_media, procedimiento_galeria, testimonios,
-- charlas, charla_galeria, horario_global, horarios_por_fecha,
-- bloqueos_horas, bloqueos_globales siguen este mismo patrón — ver
-- `select tablename, policyname, cmd, qual, with_check from pg_policies
--  where schemaname='public'` contra el proyecto para el detalle exacto de
-- cada una si hace falta reconstruirlas.

-- citas y reagendas: cada quien ve/edita las suyas; admin ve todo.
--   cit_sel/upd: (user_id = auth.uid()) OR is_admin()
--   cit_ins:     (user_id = auth.uid()) OR is_admin()
--   cit_del:     (user_id = auth.uid()) OR is_admin()

-- comentarios_pacientes: lectura pública si aprobado=true, o admin, o dueño.
--   cp_sel: (aprobado = true) OR is_admin() OR (user_id = auth.uid())
--   cp_ins: (user_id = auth.uid())
--   cp_upd/cp_del: is_admin()

-- reportes_mensuales: solo admin, sin excepción (ni SELECT público).

-- usuarios: cada quien ve/edita su propia fila; los dos correos admin ven
-- cualquiera (usr_sel usa auth.jwt()->>'email' contra la lista fija de
-- correos admin, no admin_users — así se puede ver el propio perfil antes de
-- que exista fila en admin_users).
--   usr_ins: auth.uid() = id
--   usr_sel: (auth.uid() = id) OR (auth.jwt()->>'email' IN ('medinapipe123@gmail.com','admin@clinicavm.com'))
--   usr_upd: auth.uid() = id

-- integraciones_ia: RLS habilitado SIN políticas (deny-all vía PostgREST).
-- Solo el backend, que bypassa RLS, puede leer/escribir. Aplicado en
-- producción el 2026-09-01 tras detectarse que estaba con RLS desactivado
-- (exposición real, aunque nunca explotada: el backend no la usa vía SDK).
