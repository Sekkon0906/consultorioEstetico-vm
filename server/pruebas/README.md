# Pruebas

Pruebas de integración contra una base de datos **real**, no simulada: la
autenticación y la seguridad dependen de restricciones, triggers e índices de
Postgres, y un simulacro no los ejercita. Una prueba que no toca la base no
habría detectado que la restricción de `rol` impedía registrar pacientes.

## Preparar la base de prueba

```bash
sudo -u postgres psql -c "CREATE DATABASE auth_test;"
sudo -u postgres psql -d auth_test \
  -f ../sql/schema/000_baseline.sql \
  -f ../sql/migraciones/001_configuracion_sitio.sql \
  -f ../sql/migraciones/002_auth_propia.sql \
  -f ../sql/migraciones/003_auditoria_ia.sql \
  -f ../sql/migraciones/004_integraciones_ia.sql
```

## Correr

```bash
node pruebas/autenticacion.test.js   # 17 comprobaciones
node pruebas/seguridad.test.js       # 7 comprobaciones
node pruebas/permisos.test.js        # 6 comprobaciones
```

Ambos salen con código 0 si todo pasa, así que sirven tal cual en CI.

## Qué cubren

**autenticacion.test.js** — registro, duplicados, contraseñas cortas, login
correcto e incorrecto, que el mensaje de error sea idéntico exista o no la
cuenta (para no revelar qué correos están registrados), rotación del refresh
token, que un refresh usado no sirva dos veces, que los tokens se guarden
hasheados, y que editar `usuarios.rol` NO conceda administrador.

**seguridad.test.js** — cabeceras de seguridad, que no se anuncie Express,
corte por fuerza bruta en el login, y rechazo de rutas protegidas sin token o
con un token inventado.

**permisos.test.js** — aislamiento entre pacientes, que es lo que protege la
historia clínica: crea dos cuentas y una cita de la primera, y comprueba que
la segunda no la ve en el listado, no la puede cancelar y no puede tocar sus
montos. Comprueba además que el 403 no nombra los roles del sistema.

Ajusta `DATABASE_URL` al principio de cada archivo si tu Postgres local no usa
`postgres:testpw@127.0.0.1:5432`.
