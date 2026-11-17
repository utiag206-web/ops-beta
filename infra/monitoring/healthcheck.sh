#!/bin/bash
set -e

# ==============================================================================
# SCRIPT DE MONITOREO Y TELEMETRÍA DE INFRAESTRUCTURA: INTHALY
# ==============================================================================

HOST="${POSTGRES_HOST:-localhost}"
USER="${POSTGRES_USER:-inthaly_admin}"
PORT="${POSTGRES_PORT:-5432}"

echo "=== DIAGNÓSTICO DE SALUD DE INFRAESTRUCTURA INTHALY ==="
echo "Fecha y Hora: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 1. Comprobación del motor PostgreSQL
if pg_isready -h "$HOST" -p "$PORT" -U "$USER" > /dev/null 2>&1; then
    echo " [OK] Motor PostgreSQL en ejecución y respondiendo en ${HOST}:${PORT}."
else
    echo " [CRITICAL] Motor PostgreSQL NO RESPONDE en ${HOST}:${PORT}."
    exit 2
fi

# 2. Conectividad con base de datos inthaly_id
ID_DB="${INTHALY_ID_DB_NAME:-inthaly_id}"
if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$ID_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    ID_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$ID_DB" -t -c "SELECT count(*) FROM inthaly_id.identities;" 2>/dev/null | xargs || echo "0")
    echo " [OK] Base de datos ${ID_DB}: Conectada y operativa. Identidades registradas: ${ID_COUNT}"
else
    echo " [WARNING] Base de datos ${ID_DB}: No accesible o esquema pendiente."
fi

# 3. Conectividad con base de datos inthaly_community
COM_DB="${INTHALY_COMMUNITY_DB_NAME:-inthaly_community}"
if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$COM_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    COM_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$HOST" -p "$PORT" -U "$USER" -d "$COM_DB" -t -c "SELECT count(*) FROM inthaly_community.profiles;" 2>/dev/null | xargs || echo "0")
    echo " [OK] Base de datos ${COM_DB}: Conectada y operativa. Perfiles registrados: ${COM_COUNT}"
else
    echo " [WARNING] Base de datos ${COM_DB}: No accesible o esquema pendiente."
fi

# 4. Estado de Espacio en Disco para Respaldos
if [ -d "/backups" ]; then
    DISK_USAGE=$(df -h /backups | awk 'NR==2 {print $5}')
    echo " [OK] Espacio ocupado en volumen de respaldos (/backups): ${DISK_USAGE}"
fi

echo "=== DIAGNÓSTICO FINALIZADO CORRECTAMENTE ==="
exit 0
