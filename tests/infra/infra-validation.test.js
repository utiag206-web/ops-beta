const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('ETAPA 1: Verificación de Artefactos de Infraestructura Autogestionada', () => {
  const rootDir = path.resolve(__dirname, '../../');

  test('Infra 1: Todos los archivos de infraestructura existen y tienen contenido', () => {
    const requiredFiles = [
      'infra/docker/docker-compose.yml',
      'infra/postgres/init/01-init-databases-and-users.sh',
      'infra/postgres/init/02-schema-inthaly-id.sql',
      'infra/postgres/init/03-schema-inthaly-community.sql',
      'infra/postgres/conf/postgresql.conf',
      'infra/postgres/conf/pg_hba.conf',
      'infra/backup/backup.sh',
      'infra/backup/restore.sh',
      'infra/deploy/setup-vps.sh',
      'infra/deploy/caddy/Caddyfile',
      'infra/monitoring/healthcheck.sh',
      'infra/.env.example',
      'infra/docs/01_INFRASTRUCTURE_ARCHITECTURE.md',
      'infra/docs/02_VPS_AND_HOSTING_ANALYSIS.md',
      'infra/docs/03_DATABASE_SEPARATION_AND_SECURITY.md',
      'infra/docs/04_DISASTER_RECOVERY_AND_RUNBOOK.md',
      'infra/docs/05_PENDING_HOSTING_INVENTORY.md'
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(rootDir, relPath);
      assert.equal(fs.existsSync(fullPath), true, `Archivo requerido no encontrado: ${relPath}`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 50, `El archivo ${relPath} está vacío o incompleto`);
    }
  });

  test('Infra 2: docker-compose.yml define servicios modulares y red interna aislada', () => {
    const composeContent = fs.readFileSync(path.join(rootDir, 'infra/docker/docker-compose.yml'), 'utf8');
    assert.match(composeContent, /postgres:/);
    assert.match(composeContent, /pgbouncer:/);
    assert.match(composeContent, /redis:/);
    assert.match(composeContent, /backup:/);
    assert.match(composeContent, /caddy:/);
    assert.match(composeContent, /inthaly_internal:/);
    assert.match(composeContent, /127\.0\.0\.1:5432:5432/, 'PostgreSQL no debe exponerse a 0.0.0.0');
  });

  test('Infra 3: Inicialización de PostgreSQL separa inthaly_id e inthaly_community con usuarios propios', () => {
    const initScript = fs.readFileSync(path.join(rootDir, 'infra/postgres/init/01-init-databases-and-users.sh'), 'utf8');
    assert.match(initScript, /CREATE DATABASE \$ID_DB OWNER \$ID_USER/);
    assert.match(initScript, /CREATE DATABASE \$COM_DB OWNER \$COM_USER/);
  });

  test('Infra 4: postgresql.conf aplica SCRAM-SHA-256 y optimización de memoria', () => {
    const conf = fs.readFileSync(path.join(rootDir, 'infra/postgres/conf/postgresql.conf'), 'utf8');
    assert.match(conf, /password_encryption = scram-sha-256/);
    assert.match(conf, /shared_buffers = 512MB/);
  });

  test('Infra 5: Script de respaldo genera hashes SHA-256 y política de retención de 30 días', () => {
    const backupScript = fs.readFileSync(path.join(rootDir, 'infra/backup/backup.sh'), 'utf8');
    assert.match(backupScript, /sha256sum/);
    assert.match(backupScript, /RETENTION_DAYS/);
    assert.match(backupScript, /pg_dump.*-F c/);
  });

  test('Infra 6: .env.example no contiene credenciales reales y documenta todas las variables', () => {
    const envExample = fs.readFileSync(path.join(rootDir, 'infra/.env.example'), 'utf8');
    assert.match(envExample, /POSTGRES_SUPERUSER_PASSWORD=DEFINIR_/);
    assert.match(envExample, /INTHALY_ID_DATABASE_URL=/);
    assert.match(envExample, /INTHALY_COMMUNITY_DATABASE_URL=/);
    assert.doesNotMatch(envExample, /SuperAdmin2026!/);
  });
});
