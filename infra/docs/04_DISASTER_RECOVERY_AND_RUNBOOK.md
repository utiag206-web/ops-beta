# GUÍA DE OPERACIONES, RESPALDOS Y RECUPERACIÓN ANTE DESASTRES
## Manual de Despliegue y Recuperación para el Operador de Sistemas Inthaly

---

### 1. PROCEDIMIENTO DE DESPLIEGUE EN EL SERVIDOR VPS

Una vez que se disponga del servidor VPS con Ubuntu 22.04 / 24.04 LTS:

#### Paso 1: Conexión SSH y Provisión Base
```bash
ssh root@<IP_DEL_VPS>
# Descargar o clonar el script de aprovisionamiento
curl -fsSL https://raw.githubusercontent.com/inthaly/infra/main/deploy/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

#### Paso 2: Copia de Archivos de Infraestructura
```bash
mkdir -p /opt/inthaly/infra
# Copiar el contenido de la carpeta infra/ al servidor
scp -r ./infra/* root@<IP_DEL_VPS>:/opt/inthaly/infra/
cd /opt/inthaly/infra
```

#### Paso 3: Configuración de Variables de Entorno Seguras
```bash
cp .env.example .env
nano .env
# Generar claves criptográficas seguras:
# openssl rand -hex 32
```

#### Paso 4: Inicialización de Contenedores Docker
```bash
cd /opt/inthaly/infra/docker
docker compose up -d
# Verificar que todos los servicios estén 'healthy'
docker compose ps
```

---

### 2. POLÍTICA DE COPIAS DE SEGURIDAD (BACKUPS)

- **Frecuencia:** Cada 6 horas de forma automatizada mediante cron en el contenedor `inthaly_backup`.
- **Formato:** Dump binario comprimido de PostgreSQL (`pg_dump -F c -b`).
- **Verificación de Integridad:** Cada dump genera un archivo complementario `.sha256`.
- **Retención:** 30 días de histórico. Las copias con más de 30 días se purgan automáticamente para evitar saturación de disco.
- **Ubicación:** Volumen persistente `inthaly_backup_data_vol` en `/backups` del host.

#### Ejecución Manual de Respaldo Inmediato:
```bash
docker exec -it inthaly_backup /usr/local/bin/backup.sh
```

---

### 3. PROCEDIMIENTO DE RECUPERACIÓN ANTE DESASTRES (RESTORE)

En caso de corrupción de datos o incidente mayor:

#### Paso 1: Identificar el Respaldo Más Reciente
```bash
ls -lt /opt/inthaly/backups/inthaly_id/
ls -lt /opt/inthaly/backups/inthaly_community/
```

#### Paso 2: Ejecutar la Restauración Controlada
```bash
# Para restaurar inthaly_id:
docker exec -it inthaly_backup /usr/local/bin/restore.sh \
  /backups/inthaly_id/inthaly_id_20261116_180000.dump inthaly_id

# Para restaurar inthaly_community:
docker exec -it inthaly_backup /usr/local/bin/restore.sh \
  /backups/inthaly_community/inthaly_community_20261116_180000.dump inthaly_community
```

#### Paso 3: Verificación Post-Restauración
```bash
docker exec -it inthaly_backup /usr/local/bin/healthcheck.sh
```
