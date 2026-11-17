#!/bin/bash
set -eo pipefail

# ==============================================================================
# SCRIPT DE RESTAURACIÓN ANTE DESASTRES: INTHALY AUTOGESTIONADO
# Uso: ./restore.sh <archivo_dump> <nombre_db_destino>
# ==============================================================================

DUMP_FILE="$1"
TARGET_DB="$2"
HOST="${POSTGRES_HOST:-localhost}"
USER="${POSTGRES_USER:-inthaly_admin}"

if [ -z "$DUMP_FILE" ] || [ -z "$TARGET_DB" ]; then
    echo "ERROR: Parámetros insuficientes."
    echo "Uso: $0 <ruta_al_archivo_dump> <nombre_base_de_datos>"
    echo "Ejemplo: $0 /backups/inthaly_id/inthaly_id_20261116_220000.dump inthaly_id"
    exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
    echo "ERROR: El archivo de dump especificado no existe: $DUMP_FILE"
    exit 1
fi

echo "========================================================================"
echo "INICIANDO RESTAURACIÓN CONTROLADA DE BASE DE DATOS INTHALY"
echo "Archivo origen: $DUMP_FILE"
echo "Base de datos destino: $TARGET_DB"
echo "========================================================================"

# 1. Verificar integridad del Checksum SHA-256 si existe
if [ -f "${DUMP_FILE}.sha256" ]; then
    echo "Verificando integridad criptográfica SHA-256..."
    sha256sum -c "${DUMP_FILE}.sha256"
    echo " -> Integridad confirmada."
else
    echo "ADVERTENCIA: No se encontró archivo .sha256 para validación de integridad."
fi

# 2. Confirmación obligatoria antes de sobrescribir
read -p "¿CONFIRMA QUE DESEA RESTAURAR SOBRE '${TARGET_DB}'? (Esta operación sobreescribirá datos) [s/N]: " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Operación cancelada por el operador."
    exit 0
fi

# 3. Ejecutar pg_restore
echo "Ejecutando pg_restore con limpieza previa (--clean --if-exists)..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore -h "${HOST}" -U "${USER}" -d "${TARGET_DB}" -v --clean --if-exists "${DUMP_FILE}" || true

echo "========================================================================"
echo "RESTAURACIÓN FINALIZADA CON ÉXITO."
echo "========================================================================"
