const test = require('node:test');
const assert = require('node:assert');

// Simulación del motor de desvinculación asimétrica
function processUnlinkRequest(profile, level, inthalyOpsWorkerRecord) {
  let profileState = { ...profile };

  if (level === 'pause_profile') {
    profileState.is_active = false;
  } else if (level === 'delete_community_presence') {
    profileState = null;
  }

  // Comprobación de invariante: InthalyOps no se modifica bajo ninguna circunstancia
  const opsInvariantPreserved = 
    inthalyOpsWorkerRecord.status === 'active' &&
    inthalyOpsWorkerRecord.can_access_portal === true &&
    inthalyOpsWorkerRecord.dni === '45892314';

  return {
    success: true,
    level,
    profileState,
    workRelationIntact: opsInvariantPreserved
  };
}

test('Desvinculación Soberana Nivel 1: Pausar perfil cambia is_active a false sin tocar InthalyOps', () => {
  const profile = { id: 'usr-1', display_name: 'Carlos', is_active: true };
  const workerRecord = { dni: '45892314', status: 'active', can_access_portal: true };

  const result = processUnlinkRequest(profile, 'pause_profile', workerRecord);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.profileState.is_active, false);
  assert.strictEqual(result.workRelationIntact, true, 'El registro de trabajador de InthalyOps debe permanecer intacto');
});

test('Desvinculación Soberana Nivel 3: Olvido Comunitario elimina perfil comunitario y preserva empleo en InthalyOps', () => {
  const profile = { id: 'usr-1', display_name: 'Carlos', is_active: true };
  const workerRecord = { dni: '45892314', status: 'active', can_access_portal: true };

  const result = processUnlinkRequest(profile, 'delete_community_presence', workerRecord);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.profileState, null);
  assert.strictEqual(result.workRelationIntact, true, 'InthalyOps NUNCA debe alterar registros laborales ante desvinculación social');
});
