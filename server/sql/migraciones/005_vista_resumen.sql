-- Amplía v_resumen_consultorio con dos columnas que el panel de analítica
-- necesitaba y sacaba de consultas sueltas desde el navegador:
--   - total_confirmadas: para el KPI "Pendientes / Confirmadas".
--   - usuarios_registrados: cuentas creadas (distinto de pacientes_unicos,
--     que son quienes han agendado al menos una cita).
-- Las columnas nuevas van AL FINAL: CREATE OR REPLACE VIEW solo permite
-- añadir columnas después de las existentes, nunca intercaladas.
-- Idempotente.

CREATE OR REPLACE VIEW v_resumen_consultorio AS
 SELECT count(*) AS total_citas_historico,
    count(*) FILTER (WHERE estado = 'atendida')  AS total_atendidas,
    count(*) FILTER (WHERE estado = 'cancelada') AS total_canceladas,
    count(*) FILTER (WHERE estado = 'pendiente') AS total_pendientes,
    count(*) FILTER (WHERE fecha >= date_trunc('month', CURRENT_DATE::timestamptz)) AS citas_este_mes,
    count(*) FILTER (WHERE fecha = CURRENT_DATE) AS citas_hoy,
    count(DISTINCT procedimiento) AS procedimientos_distintos_usados,
    count(DISTINCT user_id) AS pacientes_unicos,
    count(*) FILTER (WHERE estado = 'confirmada') AS total_confirmadas,
    (SELECT count(*) FROM usuarios) AS usuarios_registrados
   FROM citas;
