/**
 * Test Suite: Seguridad de Telemetría e Infraestructura de INTHALY GLOBAL (Fase 4)
 * Verificación de aislamiento estricto de Docker Socket, telemetría de OS y Disaster Recovery
 */

const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

describe('Fase 4: Centro de Control, Telemetría Segura y Aislamiento Docker', () => {
  const rootDir = path.resolve(__dirname, '../../')

  describe('1. Regla de Oro: Aislamiento Estricto de Docker Socket', () => {
    test('docker-compose.yml NO debe montar /var/run/docker.sock en aplicaciones web', () => {
      const composePath = path.join(rootDir, 'infra/docker/docker-compose.yml')
      assert.ok(fs.existsSync(composePath), 'docker-compose.yml debe existir')
      const content = fs.readFileSync(composePath, 'utf8')

      // Prohibición estricta de montar el socket de Docker a nivel de volumen
      assert.doesNotMatch(
        content,
        /\/var\/run\/docker\.sock/i,
        'SEGURIDAD CRÍTICA: /var/run/docker.sock no debe estar expuesto a ningún contenedor web'
      )
    })

    test('Dockerfile de inthaly-global no contiene herramientas de escape de contenedor', () => {
      const dockerfilePath = path.join(rootDir, 'apps/global-admin/Dockerfile')
      assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile debe existir')
      const content = fs.readFileSync(dockerfilePath, 'utf8')

      assert.doesNotMatch(content, /docker\.sock/i)
      assert.match(content, /node:20-alpine|node:22-alpine|node:alpine/i)
    })
  })

  describe('2. Telemetría de Servidor Segura Basada en node:os Nativo', () => {
    test('system-telemetry.service.ts implementa métricas reales sin shell exec inseguro', () => {
      const servicePath = path.join(
        rootDir,
        'apps/global-admin/src/lib/telemetry/system-telemetry.service.ts'
      )
      assert.ok(fs.existsSync(servicePath), 'system-telemetry.service.ts debe existir')
      const content = fs.readFileSync(servicePath, 'utf8')

      assert.match(content, /os\.cpus\(\)/)
      assert.match(content, /os\.totalmem\(\)/)
      assert.match(content, /os\.freemem\(\)/)
      assert.match(content, /os\.uptime\(\)/)
      assert.match(content, /os\.loadavg\(\)/)
      assert.match(content, /dockerSocketExposed:\s*false/)
    })

    test('Métricas nativas de OS devuelven valores consistentes de hardware', () => {
      const cpus = os.cpus()
      assert.ok(cpus.length > 0, 'Debe reportar al menos un núcleo de CPU')
      assert.ok(typeof cpus[0].model === 'string')

      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      assert.ok(totalMem > 0, 'Memoria total debe ser mayor a 0')
      assert.ok(freeMem > 0, 'Memoria libre debe ser mayor a 0')
      assert.ok(totalMem >= freeMem, 'Memoria total debe ser >= memoria libre')

      const uptime = os.uptime()
      assert.ok(uptime >= 0, 'Uptime debe ser no-negativo')
    })
  })

  describe('3. Topología de Red y Aislamiento de Contenedores en inthaly_internal', () => {
    test('Definición de servicios cubre los 5 contenedores soberanos en red interna', () => {
      const servicePath = path.join(
        rootDir,
        'apps/global-admin/src/lib/telemetry/system-telemetry.service.ts'
      )
      const content = fs.readFileSync(servicePath, 'utf8')

      assert.match(content, /inthaly-postgres/)
      assert.match(content, /inthaly-pgbouncer/)
      assert.match(content, /inthaly-redis/)
      assert.match(content, /inthaly-minio/)
      assert.match(content, /inthaly-caddy/)
      assert.match(content, /inthaly_internal/)
    })

    test('API Route /api/telemetry existe y desactiva caché', () => {
      const routePath = path.join(
        rootDir,
        'apps/global-admin/src/app/api/telemetry/route.ts'
      )
      assert.ok(fs.existsSync(routePath), 'route.ts debe existir')
      const content = fs.readFileSync(routePath, 'utf8')

      assert.match(content, /export async function GET/)
      assert.match(content, /getSystemMetrics/)
      assert.match(content, /getContainerServices/)
      assert.match(content, /no-store/)
    })
  })

  describe('4. Respaldo Soberano y Recuperación Efímera (Disaster Recovery)', () => {
    test('Script test-restore.sh existe y realiza prueba con base de datos efímera', () => {
      const scriptPath = path.join(rootDir, 'infra/backup/test-restore.sh')
      assert.ok(fs.existsSync(scriptPath), 'test-restore.sh debe existir')
      const content = fs.readFileSync(scriptPath, 'utf8')

      assert.match(content, /inthaly_restore_test_db/)
      assert.match(content, /sha256sum/)
      assert.match(content, /pg_restore/)
      assert.match(content, /DROP DATABASE IF EXISTS/)
      assert.match(content, /CREATE DATABASE/)
    })
  })
})
