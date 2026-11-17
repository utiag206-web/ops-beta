#!/bin/bash
set -eo pipefail

# ==============================================================================
# SCRIPT DE PROVISIÓN AUTOMATIZADA DE VPS LINUX: ECOSISTEMA INTHALY
# Sistema Operativo Soportado: Ubuntu 22.04 LTS / 24.04 LTS
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Este script debe ejecutarse como root o con sudo."
  exit 1
fi

echo "========================================================================"
echo "PROVISIÓN AUTOMÁTICA DE SERVIDOR VPS PARA ECOSISTEMA INTHALY"
echo "========================================================================"

# 1. Actualización de paquetes del sistema
echo "[1/7] Actualizando repositorios y paquetes del sistema..."
apt-get update && apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release ufw fail2ban htop git jq

# 2. Configuración de SWAP (2GB) para estabilidad en cargas de memoria
if [ ! -f /swapfile ]; then
    echo "[2/7] Creando archivo SWAP de 2GB..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
    echo "[2/7] Archivo SWAP ya existente."
fi

# 3. Instalación de Docker y Docker Compose Oficial
echo "[3/7] Instalando Docker Engine y Docker Compose..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo " -> Docker instalado correctamente."
else
    echo " -> Docker ya está instalado."
fi

# 4. Configuración del Firewall UFW (Seguridad y Privacidad de Puertos)
echo "[4/7] Configurando cortafuegos UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy/Nginx)'
ufw allow 443/tcp comment 'HTTPS (Caddy/Nginx)'
# Note: Puertos 5432 (Postgres) y 6379 (Redis) NO se abren en UFW
ufw --force enable
echo " -> UFW activado: Solo puertos 22, 80 y 443 expuestos."

# 5. Configuración de Fail2Ban (Anti-Fuerza Bruta SSH)
echo "[5/7] Configurando Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 6. Preparación de Directorio Operativo en /opt/inthaly
echo "[6/7] Creando directorio de infraestructura en /opt/inthaly..."
mkdir -p /opt/inthaly/infra
mkdir -p /opt/inthaly/backups

# 7. Resumen de Despliegue
echo "========================================================================"
echo "PROVISIÓN DE VPS COMPLETADA CON ÉXITO"
echo "========================================================================"
echo "Siguientes pasos para el operador:"
echo " 1. Copiar los archivos de la carpeta 'infra/' a '/opt/inthaly/infra/'."
echo " 2. Crear el archivo '/opt/inthaly/infra/.env' a partir de '.env.example'."
echo " 3. Ejecutar: cd /opt/inthaly/infra/docker && docker compose up -d"
echo " 4. Verificar salud: docker compose ps"
echo "========================================================================"
