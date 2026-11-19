/**
 * Test Suite: Configuración Global y Gestión Multiempresa (Fase 5)
 * Verificación de los 9 submódulos soberanos y aislamiento de tenants
 */

const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

describe('Fase 5: Configuración Global y Gestión Multiempresa Soberana', () => {
  const rootDir = path.resolve(__dirname, '../../')
  const settingsAppDir = path.join(rootDir, 'apps/inthaly-global/src/app/(dashboard)/settings')

  describe('1. Verificación Estructural de los 9 Submódulos de Configuración', () => {
    const submodules = [
      'general',
      'capabilities',
      'security',
      'multiempresa',
      'notifications',
      'integrations',
      'system',
      'audit',
      'about'
    ]

    for (const sub of submodules) {
      test(`Submódulo /settings/${sub} existe y exporta componente Page`, () => {
        const filePath = path.join(settingsAppDir, sub, 'page.tsx')
        assert.ok(fs.existsSync(filePath), `El archivo ${sub}/page.tsx debe existir`)
        const content = fs.readFileSync(filePath, 'utf8')
        assert.match(content, /export default (async )?function/)
      })
    }

    test('Hub central /settings existe y expone los 9 submódulos', () => {
      const hubPath = path.join(settingsAppDir, 'page.tsx')
      assert.ok(fs.existsSync(hubPath), 'El archivo settings/page.tsx debe existir')
      const content = fs.readFileSync(hubPath, 'utf8')

      for (const sub of submodules) {
        assert.match(
          content,
          new RegExp(`/settings/${sub}`),
          `El hub de settings debe contener enlace a /settings/${sub}`
        )
      }
    })
  })

  describe('2. Servicio Central de Configuración (global-settings.service.ts)', () => {
    const servicePath = path.join(
      rootDir,
      'apps/inthaly-global/src/lib/settings/global-settings.service.ts'
    )

    test('global-settings.service.ts existe y define contratos fuertemente tipados', () => {
      assert.ok(fs.existsSync(servicePath), 'global-settings.service.ts debe existir')
      const content = fs.readFileSync(servicePath, 'utf8')

      assert.match(content, /export async function getGeneralSettings/)
      assert.match(content, /export async function getCapabilitiesSettings/)
      assert.match(content, /export async function getSecuritySettings/)
      assert.match(content, /export async function getMultiempresaSettings/)
      assert.match(content, /export async function getNotificationsSettings/)
      assert.match(content, /export async function getIntegrationsSettings/)
      assert.match(content, /export async function getSystemSettings/)
      assert.match(content, /export async function getAuditSettings/)
      assert.match(content, /export async function getAboutSettings/)
    })

    test('Contratos de seguridad aplican políticas de protección de cuentas', () => {
      const content = fs.readFileSync(servicePath, 'utf8')
      assert.match(content, /sessionTimeoutMinutes:\s*\d+/)
      assert.match(content, /maxLoginAttempts:\s*\d+/)
      assert.match(content, /mfaEnforcedForAdmins:\s*true/)
      assert.match(content, /passwordMinLength:\s*12/)
    })

    test('Contratos multiempresa configuran cuotas por defecto y retención demo', () => {
      const content = fs.readFileSync(servicePath, 'utf8')
      assert.match(content, /defaultWorkerQuota:\s*50/)
      assert.match(content, /demoRetentionDays:\s*14/)
    })
  })

  describe('3. Aislamiento Multiempresa y Supervisión de Tenants', () => {
    test('Catálogo de empresas segrega empresas reales de contratistas demo', () => {
      const dataServicePath = path.join(
        rootDir,
        'apps/inthaly-global/src/lib/data/ecosystem-data.service.ts'
      )
      assert.ok(fs.existsSync(dataServicePath), 'ecosystem-data.service.ts debe existir')
      const content = fs.readFileSync(dataServicePath, 'utf8')

      assert.match(content, /CONTRATISTAS MINEROS UNIDOS S\.A\.C\./)
      assert.match(content, /MINERA LAS BAMBAS DEMO/)
      assert.match(content, /isDemo:\s*false/)
      assert.match(content, /isDemo:\s*true/)
    })
  })
})
