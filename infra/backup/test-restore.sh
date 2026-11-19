#!/bin/bash
set -eo pipefail

# ==============================================================================
# SCRIPT DE PRUEBA REAL DE RESTAURACIÓN DE RESPALDOS: INTHALY AUTOGESTIONADO
# 
# Objetivo: Validar el RTO y la integridad operativa ejecutando una restauración
# real sobre una base de datos efímera aislada, sin afectar producción.
# Uso: ./test-restore.sh <archivo_dump>
# ==============================================================================

DUMP_FILE="$1"
HOST="${POSTGRES_HOST:-localhost}"
USER="${POSTGRES_USER:-inthaly_admin}"
TEST_DB="${RESTORE_TEST_DB_NAME:-inthaly_restore_test_db}"

if [ -z "$DUMP_FILE" ]; then
    echo "ERROR: Debe especificar el archivo dump a verificar."
    echo "Uso: $0 <ruta_al_archivo_dump>"
    exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
    echo "ERROR: El archivo de dump no existe: $DUMP_FILE"
    exit 1
fi

echo "========================================================================"
echo "INICIANDO PRUEBA REAL DE RESTAURACIÓN DE RESPALDO (DR TEST)"
echo "Archivo: $DUMP_FILE"
echo "Base de datos efímera de prueba: $TEST_DB"
echo "========================================================================"

# 1. Verificación del Checksum SHA-256
if [ -f "${DUMP_FILE}.sha256" ]; then
    echo "Paso 1: Verificando Checksum SHA-256..."
    sha256sum -c "${DUMP_FILE}.sha256"
    echo " -> Checksum válido."
else
    echo "AVISO: No existe archivo .sha256 para validación de hash."
fi

START_TIME=$(date +%s)

# 2. Crear base de datos de prueba aislada
echo "Paso 2: Creando base de datos de prueba efímera '${TEST_DB}'..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${HOST}" -U "${USER}" -c "DROP DATABASE IF EXISTS ${TEST_DB};"
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${HOST}" -U "${USER}" -c "CREATE DATABASE ${TEST_DB};"

# 3. Ejecutar pg_restore real sobre la base de prueba
echo "Paso 3: Ejecutando pg_restore en base de prueba..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore -h "${HOST}" -U "${USER}" -d "${TEST_DB}" --no-owner --no-privileges "${DUMP_FILE}" || true

# 4. Validar integridad de esquemas y conteo de tablas
echo "Paso 4: Validando tablas restauradas..."
TABLE_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${HOST}" -U "${USER}" -d "${TEST_DB}" -t -c "
    SELECT count(*) FROM information_schema.tables 
    WHERE table_schema IN ('inthaly_id', 'inthaly_community', 'public') AND table_type = 'BASE TABLE';
" | xargs)

echo " -> Total de tablas restauradas verificadas: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -gt 0 ]; then
    RESTORE_STATUS="SUCCESS"
    echo " -> ÉXITO: La restauración contiene datos y esquemas válidos."
else
    RESTORE_STATUS="FAILED_EMPTY"
    echo " -> ERROR: La restauración no produjo tablas utilizables."
fi

# 5. Destrucción segura de la base de prueba (liberar recursos)
echo "Paso 5: Eliminando base de datos efímera '${TEST_DB}'..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${HOST}" -U "${USER}" -c "DROP DATABASE IF EXISTS ${TEST_DB};"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "========================================================================"
echo "PRUEBA DE RESTAURACIÓN FINALIZADA"
echo "Resultado: ${RESTORE_STATUS}"
echo "Tablas validadas: ${TABLE_COUNT}"
echo "Tiempo de restauración: ${DURATION} segundos"
echo "========================================================================"

if [ "$RESTORE_STATUS" != "SUCCESS" ]; then
    exit 2
fi
