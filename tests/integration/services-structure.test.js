const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Arquitectura Modular: Capa src/types/ existe con exportadores canónicos', () => {
  const typesDir = path.join(process.cwd(), 'apps', 'inthaly-ops', 'src', 'types');
  assert.ok(fs.existsSync(typesDir), 'apps/inthaly-ops/src/types/ debe existir');
  
  const expectedFiles = [
    'common.types.ts',
    'workers.types.ts',
    'tareo.types.ts',
    'inventory.types.ts',
    'mechanics.types.ts',
    'index.ts'
  ];

  for (const file of expectedFiles) {
    assert.ok(fs.existsSync(path.join(typesDir, file)), `src/types/${file} debe existir`);
  }
});

test('Arquitectura Modular: Capa src/hooks/ existe con exportadores canónicos', () => {
  const hooksDir = path.join(process.cwd(), 'apps', 'inthaly-ops', 'src', 'hooks');
  assert.ok(fs.existsSync(hooksDir), 'apps/inthaly-ops/src/hooks/ debe existir');

  const expectedHooks = [
    'useTerminology.ts',
    'useOperationalContext.ts',
    'useSidebar.ts',
    'useRbac.ts',
    'useOffline.ts',
    'useGlobalSettings.ts',
    'index.ts'
  ];

  for (const hook of expectedHooks) {
    assert.ok(fs.existsSync(path.join(hooksDir, hook)), `src/hooks/${hook} debe existir`);
  }
});

test('Arquitectura Modular: Capa src/services/ existe con exportadores de negocio', () => {
  const servicesDir = path.join(process.cwd(), 'apps', 'inthaly-ops', 'src', 'services');
  assert.ok(fs.existsSync(servicesDir), 'apps/inthaly-ops/src/services/ debe existir');

  const expectedServices = [
    'workers.service.ts',
    'tareo.service.ts',
    'inventory.service.ts',
    'index.ts'
  ];

  for (const service of expectedServices) {
    assert.ok(fs.existsSync(path.join(servicesDir, service)), `src/services/${service} debe existir`);
  }
});
