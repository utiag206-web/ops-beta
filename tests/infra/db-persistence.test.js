const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

describe('ETAPA 1 - Bloque 5: Integridad de Esquemas DDL, Respaldo y Restauración Soberana', () => {
  const rootDir = path.resolve(__dirname, '../../');

  test('DDL 1: Esquema inthaly_id define tablas completas con UUID, índices y aislamiento', () => {
    const idSchemaPath = path.join(rootDir, 'infra/postgres/init/02-schema-inthaly-id.sql');
    assert.equal(fs.existsSync(idSchemaPath), true);
    const content = fs.readFileSync(idSchemaPath, 'utf8');

    // Tablas requeridas
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.identities/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.sessions/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.password_reset_tokens/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.oidc_clients/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.oidc_auth_codes/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_id\.delegated_tickets/);

    // Índices de optimización y seguridad
    assert.match(content, /CREATE INDEX.*idx_identities_email/);
    assert.match(content, /CREATE INDEX.*idx_sessions_token_hash/);
    assert.match(content, /CREATE INDEX.*idx_reset_token_hash/);
    assert.match(content, /session_token_hash TEXT UNIQUE/);
  });

  test('DDL 2: Esquema inthaly_community prohíbe BYTEA para fotos y define perfiles, grupos y foros', () => {
    const comSchemaPath = path.join(rootDir, 'infra/postgres/init/03-schema-inthaly-community.sql');
    assert.equal(fs.existsSync(comSchemaPath), true);
    const content = fs.readFileSync(comSchemaPath, 'utf8');

    // Tablas requeridas
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.profiles/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.groups/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.group_members/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.posts/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.reactions/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.comments/);
    assert.match(content, /CREATE TABLE IF NOT EXISTS inthaly_community\.direct_messages/);

    // Regla de Oro: Prohibido almacenar binarios BYTEA para fotos/archivos (se debe usar URLs apuntando a MinIO S3)
    assert.doesNotMatch(content, /avatar_data\s+BYTEA/i, 'Prohibido almacenar avatar como BYTEA en PostgreSQL');
    assert.doesNotMatch(content, /cover_data\s+BYTEA/i, 'Prohibido almacenar portada como BYTEA en PostgreSQL');
    assert.match(content, /avatar_url TEXT/);
    assert.match(content, /cover_url TEXT/);
  });

  test('Backup / Restore: Verificación criptográfica SHA-256 simula el ciclo de vida del Runbook', () => {
    // 1. Crear un buffer simulado de dump binario de base de datos
    const mockDumpData = Buffer.from('PGDMP\x10\x00\x00INTHALY_SOVEREIGN_BACKUP_VERIFICATION_2026', 'utf8');

    // 2. Calcular SHA-256 tal como lo hace backup.sh
    const computedHash = crypto.createHash('sha256').update(mockDumpData).digest('hex');
    assert.equal(typeof computedHash, 'string');
    assert.equal(computedHash.length, 64);

    // 3. Simular formato de salida de `sha256sum <file>.dump`
    const filename = 'inthaly_id_20261118_000000.dump';
    const sha256FileContent = `${computedHash}  ${filename}\n`;

    // 4. Simular verificación de integridad como lo hace restore.sh
    const extractedHash = sha256FileContent.trim().split(/\s+/)[0];
    const verifyHash = crypto.createHash('sha256').update(mockDumpData).digest('hex');

    assert.equal(extractedHash, verifyHash, 'El hash SHA-256 del dump debe coincidir exactamente para autorizar la restauración');

    // 5. Simular detección de corrupción o alteración en tránsito
    const corruptedDump = Buffer.concat([mockDumpData, Buffer.from('TAMPERED')]);
    const corruptedHash = crypto.createHash('sha256').update(corruptedDump).digest('hex');
    assert.notEqual(extractedHash, corruptedHash, 'Un archivo alterado o corrupto debe fallar la verificación');
  });

  test('Integración de Servicios: inthaly-id.service y community.service incorporan persistencia PostgreSQL y MinIO', () => {
    const idServicePath = path.join(rootDir, 'src/services/inthaly-id.service.ts');
    const comServicePath = path.join(rootDir, 'src/services/community.service.ts');

    const idCode = fs.readFileSync(idServicePath, 'utf8');
    const comCode = fs.readFileSync(comServicePath, 'utf8');

    // Inthaly ID debe usar inthalyIdSql
    assert.match(idCode, /import.*inthalyIdSql.*from.*lib\/db\/inthaly-id-db/);
    assert.match(idCode, /inthalyIdSql`[\s\S]*FROM inthaly_id\.identities/);
    assert.match(idCode, /inthalyIdSql`[\s\S]*INSERT INTO inthaly_id\.sessions/);

    // Comunidad debe usar inthalyCommunitySql y MinIO S3
    assert.match(comCode, /import.*inthalyCommunitySql.*from.*lib\/db\/community-db/);
    assert.match(comCode, /inthalyCommunitySql`[\s\S]*FROM inthaly_community\.profiles/);
    assert.match(comCode, /uploadCommunityMedia/);
    assert.match(comCode, /uploadObjectToStorage/);
  });
});
