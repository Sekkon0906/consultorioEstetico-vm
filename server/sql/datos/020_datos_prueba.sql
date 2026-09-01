-- ============================================================================
-- 020 — DATOS DE PRUEBA (OPCIONAL — normalmente NO se corre)
-- ----------------------------------------------------------------------------
-- Basura de desarrollo que quedó en la base de producción. Se conserva aquí
-- para no perder nada al migrar, pero un despliegue limpio NO debería
-- cargarla: son registros de prueba, no contenido del consultorio.
--
-- Qué es cada cosa, para que la decisión de borrarla sea informada:
--
--   - Procedimiento "ronron" / "rodolfo hernandez de las prilla", categoría
--     Capilar, $400.000. Claramente una prueba de creación desde el panel.
--     Está marcado como DESTACADO, así que hoy aparece resaltado en el sitio.
--   - Las 4 filas de procedimiento_galeria cuelgan todas de "ronron".
--   - Las 2 charlas: una es 'a'/'a'/'a' con fecha año 2321; la otra,
--     "salida pedagogica" con descripción 'asd' y detalle 'fghshgsdgsdfg...'.
--   - Las 5 imágenes de charla_galeria cuelgan de la charla "salida pedagogica".
--   - Los 7 bloqueos_horas son bloqueos manuales en fechas de marzo-mayo 2026
--     (uno con motivo 'Bloqueo manualaas', otra prueba). Son operativos, no
--     contenido: al migrar de verdad conviene traerlos del script de datos
--     operativos, no de aquí.
--
-- RECOMENDACIÓN: no correr este archivo en el despliegue nuevo, y borrar
-- estos registros también de producción cuando la doctora confirme. Ver
-- server/sql/datos/030_limpiar_pruebas.sql.
-- ============================================================================

INSERT INTO procedimientos (id, nombre, descripcion, precio, imagen, categoria, duracion_min, destacado, descripcion_completa, subcategoria, en_promocion, precio_promocional, promocion_hasta, mostrar_galeria_home, mostrar_galeria_procedimientos) VALUES
('302dd503-205b-4c15-b5e5-77058e8d64b7', 'ronron', 'rodolfo', '400000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/proc_1775435813675_5ag.png', 'Capilar', 45, 't', 'rodolfo hernandez de las prilla', NULL, 'f', NULL, NULL, 'f', 't')
ON CONFLICT (id) DO NOTHING;

INSERT INTO procedimiento_galeria (procedimiento_id, tipo, url, titulo, descripcion, orden) VALUES
('302dd503-205b-4c15-b5e5-77058e8d64b7', 'imagen', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/proc_1775435826412_r2z.jpeg', '', '', 0),
('302dd503-205b-4c15-b5e5-77058e8d64b7', 'imagen', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/proc_1775435832115_37j.jpeg', '', '', 1),
('302dd503-205b-4c15-b5e5-77058e8d64b7', 'imagen', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/proc_1775435835319_gus.jpeg', '', '', 2),
('302dd503-205b-4c15-b5e5-77058e8d64b7', 'video', 'https://youtube.com/shorts/9kaV_avyPJo', '', '', 3);

INSERT INTO charlas (id, titulo, descripcion, detalle, imagen, fecha) VALUES
('c8f20324-eed2-45be-abb9-6cd9ff93e707', 'a', 'a', 'a', '', '2321-02-20'),
('d671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'salida pedagogica', 'asd', 'fghshgsdgsdfgsdgfdsgsdfgdsfgdsfgs', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/1774752236213.jpeg', '2004-08-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO charla_galeria (id, charla_id, url, tipo, orden) VALUES
('45afe2b7-5aea-4b74-944f-14cd71ee0b5f', 'd671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/galeria/1774752270131_kjq0b7zlx2l.jpeg', 'imagen', 0),
('081df61f-f3eb-44fe-afd2-91e7a336aabc', 'd671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/galeria/1774752270487_oeeizvyc0ql.png', 'imagen', 1),
('018cb6bd-ed4d-4cca-9762-80c331cbfbf5', 'd671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/galeria/1774752271183_jh30z3izg8h.png', 'imagen', 2),
('d017291f-24e8-44b9-a4ab-5b0a201fa5fe', 'd671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/galeria/1774752271743_819jwai785a.jpeg', 'imagen', 3),
('f6fb8ae1-66fc-48e8-9621-3022a0d4ca81', 'd671f6b1-6d53-4fb3-9040-7679dbb1eef8', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/charlas/galeria/1774752272090_4qfqtkt2w33.png', 'imagen', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bloqueos_horas (fecha, hora, motivo) VALUES
  ('2026-03-04', '08:30 AM', 'Bloqueo manual'),
  ('2026-03-11', '01:00 PM', 'Bloqueo manualaas'),
  ('2026-03-11', '02:30 PM', 'Bloqueo manualaas'),
  ('2026-03-30', '08:30 AM', 'Bloqueo manual'),
  ('2026-03-30', '09:30 AM', 'Bloqueo manual'),
  ('2026-04-16', '09:30 AM', 'Bloqueo manual'),
  ('2026-05-19', '10:00 AM', 'Bloqueo manual')
ON CONFLICT (fecha, hora) DO NOTHING;
