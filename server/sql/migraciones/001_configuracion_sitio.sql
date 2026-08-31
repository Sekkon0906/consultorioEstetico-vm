-- ============================================================================
-- 001 — configuracion_sitio
-- ----------------------------------------------------------------------------
-- Saca de código los datos del consultorio que cambian con el tiempo:
-- dirección, teléfonos, horario, identidad legal y textos del home.
--
-- Hoy están escritos a mano en 8 archivos (Footer, agendarPago,
-- FirmaConsentimiento y las 4 páginas legales). Cambiar de consultorio o de
-- número exige tocar código y desplegar. Con esta tabla es un formulario.
--
-- Idempotente: se puede volver a ejecutar sin perder valores ya editados.
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion_sitio (
  clave           text PRIMARY KEY,
  valor           text NOT NULL DEFAULT '',
  grupo           text NOT NULL DEFAULT 'general',
  etiqueta        text NOT NULL DEFAULT '',
  ayuda           text NOT NULL DEFAULT '',
  tipo            text NOT NULL DEFAULT 'texto'
                    CHECK (tipo IN ('texto','texto_largo','telefono','email','url','numero','booleano','fecha')),
  orden           integer NOT NULL DEFAULT 0,
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  actualizado_por uuid
);

COMMENT ON TABLE configuracion_sitio IS
  'Pares clave-valor editables desde /administrar/configuracion. Lectura pública.';

CREATE INDEX IF NOT EXISTS idx_configuracion_sitio_grupo
  ON configuracion_sitio (grupo, orden);

-- ---------------------------------------------------------------------------
-- Semilla. ON CONFLICT DO NOTHING en el valor: si la doctora ya lo editó, se
-- respeta. Los metadatos (etiqueta, ayuda, orden) sí se refrescan.
-- ---------------------------------------------------------------------------
INSERT INTO configuracion_sitio (clave, valor, grupo, etiqueta, ayuda, tipo, orden) VALUES

-- Contacto ------------------------------------------------------------------
('contacto_whatsapp',       '573155445748',                    'contacto', 'WhatsApp',            'Solo dígitos con indicativo país, sin + ni espacios. Se usa en los enlaces wa.me.', 'telefono', 10),
('contacto_telefono_visible','+57 315 544 5748',               'contacto', 'Teléfono visible',    'Como se muestra al paciente. Puede llevar espacios y signos.', 'texto', 20),
('contacto_email',          'dra.vanessamedinao@gmail.com',    'contacto', 'Correo de contacto',  'Aparece en el footer y en las páginas legales.', 'email', 30),
('contacto_instagram',      'https://www.instagram.com/dravanessamedinao28/', 'contacto', 'Instagram', 'URL completa del perfil.', 'url', 40),
('contacto_facebook',       '',                                'contacto', 'Facebook',            'URL completa. Se oculta si está vacío.', 'url', 50),
('contacto_tiktok',         '',                                'contacto', 'TikTok',              'URL completa. Se oculta si está vacío.', 'url', 60),

-- Ubicación -----------------------------------------------------------------
('ubicacion_direccion',     'Carrera 5ta #11-24',              'ubicacion', 'Dirección',          'Calle y número, sin ciudad.', 'texto', 10),
('ubicacion_edificio',      'Edificio Torre Empresarial',      'ubicacion', 'Edificio',           'Nombre del edificio o complejo.', 'texto', 20),
('ubicacion_consultorio',   'Consultorio 502',                 'ubicacion', 'Consultorio',        'Número de oficina o consultorio.', 'texto', 30),
('ubicacion_ciudad',        'Ibagué',                          'ubicacion', 'Ciudad',             '', 'texto', 40),
('ubicacion_departamento',  'Tolima',                          'ubicacion', 'Departamento',       '', 'texto', 50),
('ubicacion_pais',          'Colombia',                        'ubicacion', 'País',               '', 'texto', 60),
('ubicacion_maps_lat',      '',                                'ubicacion', 'Latitud',            'Para el mapa. Se obtiene en Google Maps con clic derecho sobre el punto.', 'texto', 70),
('ubicacion_maps_lng',      '',                                'ubicacion', 'Longitud',           'Para el mapa.', 'texto', 80),

-- Horario -------------------------------------------------------------------
('horario_texto',           'Lunes a Sábado, 9:00 a.m. - 6:00 p.m.', 'horario', 'Horario (texto)', 'Como se muestra en el footer.', 'texto', 10),
('horario_hora_apertura',   '09:00',                           'horario', 'Hora de apertura',    'Formato 24h. Limita las horas agendables.', 'texto', 20),
('horario_hora_cierre',     '18:00',                           'horario', 'Hora de cierre',      'Formato 24h.', 'texto', 30),

-- Identidad legal -----------------------------------------------------------
('legal_razon_social',      'Julieth Vanessa Medina Orjuela',  'legal', 'Razón social',           'Nombre del responsable del tratamiento de datos.', 'texto', 10),
('legal_nit',               '',                                'legal', 'NIT',                    'PENDIENTE. Obligatorio en términos y condiciones y en el PDF de consentimiento.', 'texto', 20),
('legal_registro_profesional','',                              'legal', 'Registro profesional',   'PENDIENTE. Va en el PDF de consentimiento informado.', 'texto', 30),
('legal_tarjeta_profesional','',                               'legal', 'Tarjeta profesional',    'PENDIENTE.', 'texto', 40),

-- Marca y contenido ---------------------------------------------------------
('marca_nombre',            'Dra. Julieth Vanessa Medina Orjuela', 'marca', 'Nombre público',     'Encabezado del sitio y del PDF.', 'texto', 10),
('marca_especialidad',      'Medicina Estética y Antienvejecimiento', 'marca', 'Especialidad',    'Subtítulo bajo el nombre.', 'texto', 20),
('marca_promocion_activa',  'false',                           'marca', 'Mostrar aviso de promoción', 'Activa la franja de promoción en el home.', 'booleano', 30),
('marca_promocion_texto',   '',                                'marca', 'Texto de la promoción',  'Se muestra solo si el aviso está activo.', 'texto_largo', 40)

ON CONFLICT (clave) DO UPDATE
  SET grupo = EXCLUDED.grupo,
      etiqueta = EXCLUDED.etiqueta,
      ayuda = EXCLUDED.ayuda,
      tipo = EXCLUDED.tipo,
      orden = EXCLUDED.orden;
