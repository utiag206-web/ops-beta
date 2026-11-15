const test = require('node:test');
const assert = require('node:assert');

// Regla de aislamiento multiempresa de INTHALY
function applyIsolation(query, companyId, role) {
  const normalizedRole = role?.toLowerCase();
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin';
  const isUuid = (val) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  if (isSuperAdmin && !companyId) {
    return { applied: 'global', query };
  }

  if (!isUuid(companyId)) {
    return { applied: 'blocked', filter: { column: 'id', value: '00000000-0000-0000-0000-000000000000' } };
  }

  return { applied: 'isolated', filter: { column: 'company_id', value: companyId } };
}

test('Seguridad Multiempresa: Super Admin sin company_id tiene acceso global', () => {
  const res = applyIsolation({}, null, 'super_admin');
  assert.strictEqual(res.applied, 'global');
});

test('Seguridad Multiempresa: Usuario regular sin company_id válido es bloqueado', () => {
  const res = applyIsolation({}, 'invalid-uuid-123', 'admin');
  assert.strictEqual(res.applied, 'blocked');
  assert.strictEqual(res.filter.value, '00000000-0000-0000-0000-000000000000');
});

test('Seguridad Multiempresa: Usuario con company_id válido recibe filtro estricto', () => {
  const validUuid = '12345678-1234-4234-8234-123456789abc';
  const res = applyIsolation({}, validUuid, 'admin');
  assert.strictEqual(res.applied, 'isolated');
  assert.strictEqual(res.filter.column, 'company_id');
  assert.strictEqual(res.filter.value, validUuid);
});
