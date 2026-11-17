# ==============================================================================
# SCRIPT DE VERIFICACIÓN LOCAL DE INFRAESTRUCTURA: INTHALY (POWERSHELL)
# ==============================================================================

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "VERIFICADOR DE ARTEFACTOS DE INFRAESTRUCTURA: INTHALY" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

$requiredFiles = @(
    "infra/docker/docker-compose.yml",
    "infra/postgres/init/01-init-databases-and-users.sh",
    "infra/postgres/init/02-schema-inthaly-id.sql",
    "infra/postgres/init/03-schema-inthaly-community.sql",
    "infra/postgres/conf/postgresql.conf",
    "infra/postgres/conf/pg_hba.conf",
    "infra/backup/backup.sh",
    "infra/backup/restore.sh",
    "infra/deploy/setup-vps.sh",
    "infra/deploy/caddy/Caddyfile",
    "infra/monitoring/healthcheck.sh",
    "infra/.env.example"
)

$allPresent = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host " [OK] Encontrado: $file" -ForegroundColor Green
    } else {
        Write-Host " [FALTA] No encontrado: $file" -ForegroundColor Red
        $allPresent = $false
    }
}

Write-Host ""
if ($allPresent) {
    Write-Host "Todos los artefactos de infraestructura están presentes y listos." -ForegroundColor Green
} else {
    Write-Host "Faltan archivos requeridos en la infraestructura." -ForegroundColor Red
}

# Verificación de herramientas del host
Write-Host "`nComprobación de herramientas en el entorno local:" -ForegroundColor Yellow

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host " -> Docker está disponible en el host." -ForegroundColor Green
} else {
    Write-Host " -> Docker NO está instalado en el host local. Pruebas de ejecución de contenedores requieren VPS o Docker Desktop." -ForegroundColor Gray
}

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlCmd) {
    Write-Host " -> psql está disponible en el host." -ForegroundColor Green
} else {
    Write-Host " -> psql NO está instalado en el host local." -ForegroundColor Gray
}
