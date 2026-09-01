#!/usr/bin/env bash
# ============================================================================
# migrar-datos-operativos.sh
# ----------------------------------------------------------------------------
# Copia los datos OPERATIVOS (citas, usuarios, comentarios, bloqueos por fecha,
# reagendas, reportes) de la base actual a la nueva, directo de una a otra, sin
# que esos datos pasen nunca por el repositorio.
#
# Se usa UNA vez, el día del corte a la infraestructura nueva. El contenido del
# sitio (procedimientos, testimonios, configuración) NO lo toca: eso ya está
# versionado en server/sql/datos/010_contenido.sql y se carga desde ahí.
#
# POR QUÉ ES UN SCRIPT Y NO UN ARCHIVO .sql EN EL REPO
# Las citas guardan nombre, teléfono, correo y consentimiento firmado de
# pacientes. Eso no puede quedar en el historial de Git. Este script lee de una
# base y escribe en otra en el momento, y el volcado temporal se borra al
# terminar.
#
# USO
#   export ORIGEN='postgres://...'    # la base actual (Supabase)
#   export DESTINO='postgres://...'   # la base nueva
#   ./server/scripts/migrar-datos-operativos.sh
#
# REQUISITOS
#   - pg_dump y psql en el PATH (paquete postgresql-client)
#   - El esquema ya creado en DESTINO: correr antes server/sql/schema/ +
#     migraciones + server/sql/datos/010_contenido.sql
#
# SEGURIDAD
#   - No escribe credenciales a disco ni al log.
#   - El volcado temporal se crea con permisos 600 y se borra siempre al
#     salir, incluso si el script falla a la mitad.
# ============================================================================

set -euo pipefail

if [[ -z "${ORIGEN:-}" || -z "${DESTINO:-}" ]]; then
  echo "ERROR: faltan las variables ORIGEN y DESTINO." >&2
  echo "  export ORIGEN='postgres://usuario:clave@host:5432/base'" >&2
  echo "  export DESTINO='postgres://usuario:clave@host:5432/base'" >&2
  exit 1
fi

# Tablas operativas, en orden de dependencia: usuarios antes que citas
# (citas.user_id la referencia), citas antes que reagendas y horarios_por_fecha.
TABLAS=(
  usuarios
  admin_users
  citas
  reagendas
  horarios_por_fecha
  bloqueos_horas
  comentarios_pacientes
  reportes_mensuales
)

VOLCADO="$(mktemp -t datos-operativos.XXXXXX.sql)"
chmod 600 "$VOLCADO"
# Se borra pase lo que pase: éxito, error o Ctrl-C.
trap 'rm -f "$VOLCADO"' EXIT INT TERM

echo "==> Exportando ${#TABLAS[@]} tablas operativas desde ORIGEN..."

# --data-only: el esquema ya existe en el destino.
# --column-inserts: INSERT con nombres de columna, así el volcado no se rompe
#   si el orden de las columnas difiere entre las dos bases.
# --disable-triggers: evita que trg_firma_para_atendida rechace las citas ya
#   marcadas como atendidas que se están copiando (la validación aplica a
#   cambios nuevos, no a datos históricos que ya son válidos).
ARGS_TABLAS=()
for t in "${TABLAS[@]}"; do
  ARGS_TABLAS+=(--table="public.$t")
done

pg_dump "$ORIGEN" \
  --data-only \
  --column-inserts \
  --disable-triggers \
  --no-owner \
  --no-privileges \
  "${ARGS_TABLAS[@]}" \
  > "$VOLCADO"

FILAS=$(grep -c '^INSERT INTO' "$VOLCADO" || true)
echo "==> $FILAS filas exportadas."

if [[ "$FILAS" -eq 0 ]]; then
  echo "ERROR: el volcado salió vacío. Se aborta sin tocar el destino." >&2
  exit 1
fi

echo "==> Importando a DESTINO (en una transacción: o entra todo, o nada)..."

# ON_ERROR_STOP + --single-transaction: si algo falla, el destino queda
# exactamente como estaba. Nada de importaciones a medias.
psql "$DESTINO" \
  --set ON_ERROR_STOP=on \
  --single-transaction \
  --quiet \
  -f "$VOLCADO"

echo "==> Verificando conteos origen vs destino..."

for t in "${TABLAS[@]}"; do
  n_origen=$(psql "$ORIGEN"  -tAc "select count(*) from public.$t")
  n_destino=$(psql "$DESTINO" -tAc "select count(*) from public.$t")
  if [[ "$n_origen" == "$n_destino" ]]; then
    printf '    OK    %-24s %s filas\n' "$t" "$n_origen"
  else
    printf '    ERROR %-24s origen=%s destino=%s\n' "$t" "$n_origen" "$n_destino" >&2
    exit 1
  fi
done

echo
echo "==> Migración de datos operativos completa. Conteos idénticos en ambas bases."
echo "    Siguiente paso: apuntar DATABASE_URL del backend a la base nueva,"
echo "    y dejar la vieja en solo lectura unas semanas antes de darla de baja."
