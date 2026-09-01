-- ============================================================================
-- 010 — CONTENIDO REAL DEL SITIO
-- ----------------------------------------------------------------------------
-- Los datos que SON el sitio: los procedimientos que ofrece el consultorio,
-- los testimonios publicados, la información general (dirección, teléfonos,
-- datos legales) y la configuración de horarios.
--
-- Extraído del proyecto de producción (ibpkihfjripvizismhsk) el 2026-09-01.
--
-- Se corre DESPUÉS de:
--   server/sql/schema/000_baseline.sql
--   server/sql/migraciones/001_configuracion_sitio.sql
--
-- Idempotente: todos los INSERT llevan ON CONFLICT, así que se puede correr
-- varias veces sin duplicar ni pisar ediciones hechas desde el panel.
--
-- NO INCLUYE datos de pacientes (citas, usuarios, comentarios). Eso nunca va
-- a un repositorio de Git — ver server/sql/datos/README.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROCEDIMIENTOS (14)
-- Los UUID se conservan tal cual: son la llave foránea de citas y de las
-- galerías, y las URLs de imagen que ya están publicadas los referencian.
-- ---------------------------------------------------------------------------
INSERT INTO procedimientos (id, nombre, descripcion, precio, imagen, categoria, duracion_min, destacado, descripcion_completa, subcategoria, en_promocion, precio_promocional, promocion_hasta, mostrar_galeria_home, mostrar_galeria_procedimientos) VALUES
('ffea54eb-fa2f-49ee-81e9-abd32abc8951', 'Tratamiento para Estrías', 'Protocolo intensivo para reducir la apariencia de estrías con bioestimulación y radiofrecuencia.', '220000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_tratamientoEstrias.jpg', 'Corporal', 60, 'f', '', NULL, 'f', NULL, NULL, 'f', 't'),
('97cb8729-4005-4c99-9206-129d0acd1aa9', 'Ácido Hialurónico', 'Relleno dérmico para restaurar volumen, suavizar líneas de expresión y dar hidratación profunda.', '350000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Acido_hialuronico.jpg', 'Facial', 45, 't', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('58ed4b26-f242-41d0-9ef7-cf26bd0dca52', 'Ácido Hialurónico Facial', 'Aplicación estratégica en puntos clave del rostro para rejuvenecimiento global.', '400000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Acido_hialuronicoFacial.jpg', 'Facial', 60, 'f', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('3b126e74-0615-427a-b41d-5948760f4e24', 'Ácido Hialurónico Labios', 'Aumento y definición de labios con ácido hialurónico. Resultados naturales y duraderos.', '280000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Acido_hialuronico_labios.jpg', 'Facial', 30, 'f', '', 'Labios', 'f', NULL, NULL, 'f', 't'),
('0dd8ecf3-6b15-4513-8ea3-fee647229b8a', 'Bótox Complementario', 'Sesión complementaria de toxina botulínica para zonas específicas del rostro.', '300000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_botox2.jpg', 'Facial', 30, 'f', '', 'Tratamiento de arrugas', 'f', NULL, NULL, 'f', 't'),
('dd450b7d-6191-412b-8921-cfb16c5244f8', 'Limpieza Facial Básica', 'Limpieza suave ideal para mantenimiento mensual. Incluye vapor, extracción y mascarilla calmante.', '80000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/limpiezaFacial2.jpg', 'Facial', 45, 'f', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('ef3c1671-5a61-4dd2-81fd-35cbb0386241', 'Limpieza Facial Profunda', 'Elimina impurezas, puntos negros y células muertas para una piel radiante y saludable.', '120000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_LimpiezaFacial.jpg', 'Facial', 60, 't', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('d5b48c5e-f88c-49b4-b65e-7f058a8d5bb7', 'Perfilamiento de Rostro', 'Tratamiento integral de definición con rellenos y bioestimuladores.', '480000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_perfilamientoRostro.jpg', 'Facial', 75, 'f', '', 'Perfilamiento', 'f', NULL, NULL, 'f', 't'),
('1217b733-6936-469a-9931-da45fe23be5e', 'Perfilamiento Facial', 'Armonización facial no quirúrgica que define los rasgos y equilibra las proporciones del rostro.', '500000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Perfilamiento_Facial.jpg', 'Facial', 90, 't', '', 'Perfilamiento', 'f', NULL, NULL, 'f', 't'),
('a16e9b21-0aa1-4e6a-8566-b94919920a26', 'Perfilamiento Facial Avanzado', 'Sesión avanzada de perfilamiento con técnicas combinadas de bioestimulación.', '550000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Perfilamiento_Facial2.jpg', 'Facial', 90, 'f', '', 'Perfilamiento', 'f', NULL, NULL, 'f', 't'),
('a50da889-54ca-448a-8038-0093ec2aa128', 'Toxina Botulínica (Bótox)', 'Reduce arrugas dinámicas de expresión. Resultados naturales en 7-14 días.', '450000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_toxinaBotulinica.jpg', 'Facial', 30, 't', '', 'Tratamiento de arrugas', 'f', NULL, NULL, 'f', 't'),
('601550c8-ad24-43c8-97ff-dcad6dc2592a', 'Tratamiento Dermatitis', 'Protocolo calmante y reparador para pieles sensibles. Reduce la inflamación y restaura la barrera cutánea.', '160000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_tratamientoDermatitis.jpg', 'Facial', 50, 'f', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('f7a1b033-b89b-47fb-84c7-ae799d822773', 'Tratamiento para Acné', 'Protocolo para control del acné activo y reducción de cicatrices. Incluye limpieza, peeling y luz LED.', '180000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Tratamiento_Acne.jpg', 'Facial', 60, 'f', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't'),
('f148b7ba-e631-4d78-9a79-3062b9f047f2', 'Tratamiento para Manchas', 'Tratamiento despigmentante para uniformar el tono de la piel.', '200000', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/procedimientos/P_Tratamiento_Manchas.jpg', 'Facial', 60, 'f', '', 'Tratamiento para la piel', 'f', NULL, NULL, 'f', 't')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- TESTIMONIOS (3)
-- OJO: los tres apuntan a videos de YouTube en la cuenta personal. Migrarlos
-- es la fase 06 pendiente — al hacerlo hay que actualizar estas URLs.
-- ---------------------------------------------------------------------------
INSERT INTO testimonios (id, nombre, texto, video, thumb, activo, destacado) VALUES
('d10146db-5f1a-4c1c-978e-16a0c6fbd716', 'Paciente satisfecha', 'Excelente atención y resultados increíbles. Me sentí muy cómoda durante todo el procedimiento. 100% recomendado.', 'https://youtube.com/shorts/2sooGeas5VU', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/testimonios/testimonio1.jpg', 't', 'f'),
('5d599b7c-f67e-4cab-ba36-8ada08e6a266', 'Gran experiencia', 'El ambiente del consultorio es muy agradable y la atención es personalizada. Volveré sin dudarlo.', 'https://www.youtube.com/shorts/wTAMYOhU5D4', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/testimonios/testimonio3.jpg', 't', 'f'),
('76f48c90-0b57-48cf-ba3e-9678a9822316', 'Resultado natural', 'Buscaba un cambio sutil y natural. La doctora entendió exactamente lo que quería. Los resultados superaron mis expectativas.', 'https://youtube.com/shorts/2sooGeas5VU', 'https://ibpkihfjripvizismhsk.supabase.co/storage/v1/object/public/testimonios/testimonio2.jpg', 't', 'f')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CONFIGURACIÓN DEL SITIO (25 claves)
-- Estos son los valores VIVOS de producción, que pueden diferir de la semilla
-- de la migración 001 si la doctora los editó desde el panel. Por eso este
-- archivo actualiza el valor; la migración 001 solo lo siembra si no existe.
-- ---------------------------------------------------------------------------
INSERT INTO configuracion_sitio (clave, valor, grupo, etiqueta, ayuda, tipo, orden) VALUES
  ('contacto_whatsapp', '573155445748', 'contacto', 'WhatsApp', 'Solo dígitos con indicativo país, sin + ni espacios. Se usa en los enlaces wa.me.', 'telefono', 10),
  ('contacto_telefono_visible', '+57 315 544 5748', 'contacto', 'Teléfono visible', 'Como se muestra al paciente. Puede llevar espacios y signos.', 'texto', 20),
  ('contacto_email', 'dra.vanessamedinao@gmail.com', 'contacto', 'Correo de contacto', 'Aparece en el footer y en las páginas legales.', 'email', 30),
  ('contacto_instagram', 'https://www.instagram.com/dravanessamedinao28/', 'contacto', 'Instagram', 'URL completa del perfil.', 'url', 40),
  ('contacto_facebook', '', 'contacto', 'Facebook', 'URL completa. Se oculta si está vacío.', 'url', 50),
  ('contacto_tiktok', '', 'contacto', 'TikTok', 'URL completa. Se oculta si está vacío.', 'url', 60),
  ('horario_texto', 'Lunes a Sábado, 9:00 a.m. - 6:00 p.m.', 'horario', 'Horario (texto)', 'Como se muestra en el footer.', 'texto', 10),
  ('horario_hora_apertura', '09:00', 'horario', 'Hora de apertura', 'Formato 24h. Limita las horas agendables.', 'texto', 20),
  ('horario_hora_cierre', '18:00', 'horario', 'Hora de cierre', 'Formato 24h.', 'texto', 30),
  ('legal_razon_social', 'Julieth Vanessa Medina Orjuela', 'legal', 'Razón social', 'Nombre del responsable del tratamiento de datos.', 'texto', 10),
  ('legal_nit', '', 'legal', 'NIT', 'PENDIENTE. Obligatorio en términos y condiciones y en el PDF de consentimiento.', 'texto', 20),
  ('legal_registro_profesional', '', 'legal', 'Registro profesional', 'PENDIENTE. Va en el PDF de consentimiento informado.', 'texto', 30),
  ('legal_tarjeta_profesional', '', 'legal', 'Tarjeta profesional', 'PENDIENTE.', 'texto', 40),
  ('marca_nombre', 'Dra. Julieth Vanessa Medina Orjuela', 'marca', 'Nombre público', 'Encabezado del sitio y del PDF.', 'texto', 10),
  ('marca_especialidad', 'Medicina Estética y Antienvejecimiento', 'marca', 'Especialidad', 'Subtítulo bajo el nombre.', 'texto', 20),
  ('marca_promocion_activa', 'false', 'marca', 'Mostrar aviso de promoción', 'Activa la franja de promoción en el home.', 'booleano', 30),
  ('marca_promocion_texto', '', 'marca', 'Texto de la promoción', 'Se muestra solo si el aviso está activo.', 'texto_largo', 40),
  ('ubicacion_direccion', 'Carrera 5ta #11-24', 'ubicacion', 'Dirección', 'Calle y número, sin ciudad.', 'texto', 10),
  ('ubicacion_edificio', 'Edificio Torre Empresarial', 'ubicacion', 'Edificio', 'Nombre del edificio o complejo.', 'texto', 20),
  ('ubicacion_consultorio', 'Consultorio 502', 'ubicacion', 'Consultorio', 'Número de oficina o consultorio.', 'texto', 30),
  ('ubicacion_ciudad', 'Ibagué', 'ubicacion', 'Ciudad', '', 'texto', 40),
  ('ubicacion_departamento', 'Tolima', 'ubicacion', 'Departamento', '', 'texto', 50),
  ('ubicacion_pais', 'Colombia', 'ubicacion', 'País', '', 'texto', 60),
  ('ubicacion_maps_lat', '', 'ubicacion', 'Latitud', 'Para el mapa. Se obtiene en Google Maps con clic derecho sobre el punto.', 'texto', 70),
  ('ubicacion_maps_lng', '', 'ubicacion', 'Longitud', 'Para el mapa.', 'texto', 80)
ON CONFLICT (clave) DO UPDATE
  SET valor = EXCLUDED.valor, grupo = EXCLUDED.grupo, etiqueta = EXCLUDED.etiqueta,
      ayuda = EXCLUDED.ayuda, tipo = EXCLUDED.tipo, orden = EXCLUDED.orden;

-- ---------------------------------------------------------------------------
-- HORARIO GLOBAL (21 franjas de 30 min, 08:00 AM – 06:00 PM)
-- Las horas agendables del consultorio. El formato es texto con AM/PM
-- porque así lo guarda y compara el frontend.
-- ---------------------------------------------------------------------------
INSERT INTO horario_global (hora, disponible) VALUES
  ('08:00 AM', 't'), ('08:30 AM', 't'), ('09:00 AM', 't'), ('09:30 AM', 't'),
  ('10:00 AM', 't'), ('10:30 AM', 't'), ('11:00 AM', 't'), ('11:30 AM', 't'),
  ('12:00 PM', 't'), ('12:30 PM', 't'), ('01:00 PM', 't'), ('01:30 PM', 't'),
  ('02:00 PM', 't'), ('02:30 PM', 't'), ('03:00 PM', 't'), ('03:30 PM', 't'),
  ('04:00 PM', 't'), ('04:30 PM', 't'), ('05:00 PM', 't'), ('05:30 PM', 't'),
  ('06:00 PM', 't')
ON CONFLICT (hora) DO NOTHING;

-- ---------------------------------------------------------------------------
-- BLOQUEOS GLOBALES (11)
-- Horas que la doctora dejó bloqueadas de forma permanente, todos los días.
-- ---------------------------------------------------------------------------
INSERT INTO bloqueos_globales (hora, motivo) VALUES
  ('08:00 AM', 'Bloqueo global permanente'),
  ('08:30 AM', 'Bloqueo global'),
  ('09:00 AM', 'Bloqueo global'),
  ('09:30 AM', 'Bloqueo global'),
  ('12:30 PM', 'Bloqueo global'),
  ('01:00 PM', 'Bloqueo global'),
  ('01:30 PM', 'Bloqueo global'),
  ('02:00 PM', 'Bloqueo global'),
  ('02:30 PM', 'Bloqueo global'),
  ('03:00 PM', 'Bloqueo global'),
  ('03:30 PM', 'Bloqueo global')
ON CONFLICT (hora) DO NOTHING;
