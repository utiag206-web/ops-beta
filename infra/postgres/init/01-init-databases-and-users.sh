#!/bin/bash
set -e

# ==============================================================================
# SCRIPT DE INICIALIZACIÓN: BASES DE DATOS SEPARADAS Y USUARIOS DEDICADOS
# Ecosistema Inthaly: inthaly_id e inthaly_community
# ==============================================================================

echo "=== INICIANDO CONFIGURACIÓN DE BASES DE DATOS DEDICADAS DE INTHALY ==="

ID_DB="${INTHALY_ID_DB_NAME:-inthaly_id}"
ID_USER="${INTHALY_ID_DB_USER:-inthaly_id_user}"
ID_PASS="${INTHALY_ID_DB_PASSWORD:-inthaly_id_secret_pass}"

COM_DB="${INTHALY_COMMUNITY_DB_NAME:-inthaly_community}"
COM_USER="${INTHALY_COMMUNITY_DB_USER:-inthaly_community_user}"
COM_PASS="${INTHALY_COMMUNITY_DB_PASSWORD:-inthaly_com_secret_pass}"

# 1. Crear Usuario y Base de Datos para Inthaly ID
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER $ID_USER WITH PASSWORD '$ID_PASS';
    CREATE DATABASE $ID_DB OWNER $ID_USER;
    GRANT ALL PRIVILEGES ON DATABASE $ID_DB TO $ID_USER;
EOSQL

echo " -> Base de datos y usuario creados para Inthaly ID: $ID_DB ($ID_USER)"

# 2. Crear Usuario y Base de Datos para Comunidad Inthaly
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER $COM_USER WITH PASSWORD '$COM_PASS';
    CREATE DATABASE $COM_DB OWNER $COM_USER;
    GRANT ALL PRIVILEGES ON DATABASE $COM_DB TO $COM_USER;
EOSQL

echo " -> Base de datos y usuario creados para Comunidad Inthaly: $COM_DB ($COM_USER)"

# 3. Aplicar Extensiones en inthaly_id
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$ID_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

# 4. Aplicar Extensiones en inthaly_community
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COM_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

echo "=== CONFIGURACIÓN DE BASES DE DATOS DE INTHALY COMPLETADA CON ÉXITO ==="
