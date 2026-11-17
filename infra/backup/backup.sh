#!/bin/bash
set -eo pipefail

# ==============================================================================
# SCRIPT DE RESPALDO AUTOMÁTICO: INTHALY AUTOGESTIONADO
# Realiza backups independientes para inthaly_id e inthaly_community
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${RETENTION_DAYS:-30}"
HOST="${POSTGRES_HOST:-postgres}"
USER="${POSTGRES_USER:-inthaly_admin}"

mkdir -p "${BACKUP_DIR}/inthaly_id"
mkdir -p "${BACKUP_DIR}/inthaly_community"
mkdir -p "${BACKUP_DIR}/logs"

LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "========================================================================"
echo "INICIANDO RESPALDO DE BASES DE DATOS INTHALY: ${TIMESTAMP}"
echo "========================================================================"

# 1. Respaldo de inthaly_id
ID_DB="${INTHALY_ID_DB_NAME:-inthaly_id}"
ID_FILE="${BACKUP_DIR}/inthaly_id/${ID_DB}_${TIMESTAMP}.dump"

echo "[1/2] Respaldando base de datos: ${ID_DB}..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${HOST}" -U "${USER}" -d "${ID_DB}" -F c -b -v -f "${ID_FILE}"

# Generar Checksum SHA-256 de verificación de integridad
sha256sum "${ID_FILE}" > "${ID_FILE}.sha256"
ID_SIZE=$(du -h "${ID_FILE}" | cut -f1)
echo " -> Respaldo completado: ${ID_FILE} (Tamaño: ${ID_SIZE})"

# 2. Respaldo de inthaly_community
COM_DB="${INTHALY_COMMUNITY_DB_NAME:-inthaly_community}"
COM_FILE="${BACKUP_DIR}/inthaly_community/${COM_DB}_${TIMESTAMP}.dump"

echo "[2/2] Respaldando base de datos: ${COM_DB}..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${HOST}" -U "${USER}" -d "${COM_DB}" -F c -b -v -f "${COM_FILE}"

# Generar Checksum SHA-256
sha256sum "${COM_FILE}" > "${COM_FILE}.sha256"
COM_SIZE=$(du -h "${COM_FILE}" | cut -f1)
echo " -> Respaldo completado: ${COM_FILE} (Tamaño: ${COM_SIZE})"

# 3. Aplicar Política de Retención (Eliminar copias anteriores a 30 días)
echo "Aplicando política de retención: eliminando backups mayores a ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}/inthaly_id" -name "*.dump*" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/inthaly_community" -name "*.dump*" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/logs" -name "*.log" -mtime "+${RETENTION_DAYS}" -delete

echo "========================================================================"
echo "RESPALDO FINALIZADO EXITOSAMENTE A LAS $(date +"%Y-%m-%d %H:%M:%S")"
echo "========================================================================"
