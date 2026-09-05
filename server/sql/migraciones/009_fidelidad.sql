-- 009 · Los dos números de la tarjeta de fidelidad.
--
-- POR QUÉ VAN EN configuracion_sitio Y NO EN EL CÓDIGO
-- "Al séptimo procedimiento, un 20 %" no es una regla técnica: es una
-- decisión comercial que la doctora va a querer mover según le funcione. Si
-- vive en el código, cambiar el 7 por un 5 es tocar un archivo y desplegar.
-- Aquí es un formulario que ella ya sabe usar, y el panel de configuración es
-- genérico —pinta lo que haya en la tabla—, así que no hace falta ni pantalla
-- nueva.
--
-- POR QUÉ SOLO DOS NÚMEROS
-- Se quedaron fuera a propósito dos cosas que parecían obvias:
--
--   · La caducidad. "Siete en un año" y "siete en cinco" no son lo mismo,
--     pero ponerle fecha de caducidad a un beneficio sin que nadie lo haya
--     pedido convierte una recompensa en una cuenta atrás. Si hace falta, se
--     añade luego; quitarla después de haberla anunciado es peor.
--   · Si se reinicia al usarlo. Eso no lo puede decidir el código, porque el
--     descuento lo aplica ella en consulta y es ella quien sabe si ya lo dio.
--     El sitio cuenta procedimientos; no lleva la contabilidad del canje.
--
-- QUÉ NO HACE ESTO
-- No aplica ningún descuento en el flujo de agendar. El precio final depende
-- de la valoración —lo dice la propia web—, así que un descuento automático
-- prometería un importe que la consulta puede no confirmar. La tarjeta
-- INFORMA: "llevas 5 de 7". El descuento lo aplica la doctora.

INSERT INTO configuracion_sitio (clave, valor, grupo, etiqueta, ayuda, tipo, orden) VALUES

('fidelidad_cada',      '7',  'fidelidad', 'Procedimientos para el beneficio',
 'Cuántos procedimientos ATENDIDOS hacen falta para el descuento. Solo cuentan las citas ya atendidas: ni las agendadas ni las canceladas. Pon 0 para desactivar la tarjeta y que no aparezca en ningún perfil.',
 'numero', 10),

('fidelidad_descuento', '20', 'fidelidad', 'Descuento (%)',
 'El porcentaje que anuncia la tarjeta. Es informativo: el sitio no aplica ningún descuento al agendar, lo aplicas tú en consulta.',
 'numero', 20)

ON CONFLICT (clave) DO NOTHING;
