# Datos de la base

Este directorio contiene los **datos** de la base (las filas). El **esquema**
(las tablas) está en `../schema/` y `../migraciones/`.

## Por qué los datos están partidos en dos

No todos los datos de una base pueden vivir en un repositorio de Git. Aquí la
línea es clara y no es negociable:

| Tipo | Ejemplo | ¿Va al repo? |
|---|---|---|
| **Contenido del sitio** | procedimientos, precios, testimonios, dirección, horarios | **Sí** — es contenido público, ya visible en la web |
| **Datos de pacientes** | citas, nombres, teléfonos, correos, firmas, consentimientos, antecedentes médicos | **Nunca** |

Las citas guardan nombre, teléfono, correo, procedimiento y consentimiento
firmado. Eso es información médica sujeta a la Ley 1581 de 2012 (habeas data)
y al secreto profesional. Un repositorio se clona, se comparte, se vuelve
público por error y queda en el historial para siempre — aunque se borre el
archivo después. Por eso los datos de pacientes se migran **directo de base a
base** el día del corte, con el script de `../../scripts/`, sin pasar nunca
por Git.

Hoy esto es teórico —las 22 citas que hay son todas de la cuenta de prueba
`medinapipe123@gmail.com`, no hay pacientes reales todavía— pero el patrón
queda montado ahora, para que cuando lleguen pacientes reales nadie tenga que
acordarse de la regla.

## Archivos

| Archivo | Qué es | ¿Correr en despliegue nuevo? |
|---|---|---|
| `010_contenido.sql` | Contenido real: 14 procedimientos, 3 testimonios, 25 claves de configuración, 21 franjas horarias, 11 bloqueos globales | **Sí** |
| `020_datos_prueba.sql` | Basura de desarrollo que quedó en producción (procedimiento "ronron", 2 charlas de prueba, sus galerías, 7 bloqueos manuales) | **No** |
| `030_limpiar_pruebas.sql` | Borra de producción lo inventariado en `020` **(destructivo)** | Solo una vez, contra producción, con respaldo previo |

Todos los `INSERT` de `010` y `020` llevan `ON CONFLICT`, así que se pueden
correr varias veces sin duplicar nada.

## Orden completo para levantar la base desde cero

```bash
psql $DATABASE_URL -f server/sql/schema/000_baseline.sql
psql $DATABASE_URL -f server/sql/migraciones/001_configuracion_sitio.sql
psql $DATABASE_URL -f server/sql/migraciones/003_auditoria_ia.sql
psql $DATABASE_URL -f server/sql/migraciones/004_integraciones_ia.sql
psql $DATABASE_URL -f server/sql/indexes.sql
psql $DATABASE_URL -f server/sql/datos/010_contenido.sql
# Solo tras migrar el login fuera de Supabase Auth (fase 03):
# psql $DATABASE_URL -f server/sql/migraciones/002_auth_propia.sql
```

Eso deja una base funcional con todo el contenido del sitio y cero datos de
pacientes — que es exactamente lo que se quiere en un entorno nuevo, de
pruebas o de desarrollo.

## Lo que estos archivos NO cubren

- **Los archivos de Storage.** Las URLs que aparecen aquí apuntan a
  `ibpkihfjripvizismhsk.supabase.co`. Las imágenes en sí (procedimientos,
  testimonios, charlas, firmas, PDFs de consentimiento) siguen viviendo en los
  buckets de Supabase. Migrarlas es un paso aparte: copiar los archivos al
  destino elegido y luego reemplazar el dominio en estas columnas con un
  `UPDATE ... SET imagen = replace(imagen, 'viejo', 'nuevo')`.
- **Las cuentas de usuario.** Viven en `auth.users`, que es de Supabase Auth y
  no está en el esquema `public`. Ver la fase 03 en `docs/MIGRACION.md`.
- **Los videos de testimonios**, que apuntan a una cuenta personal de YouTube.
