const test = require('node:test');
const assert = require('node:assert');

// Validación de creación abierta y gobernanza de grupos
function validateGroupCreation(groupInput) {
  if (!groupInput.name || groupInput.name.trim().length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }
  if (!groupInput.category) {
    return { valid: false, error: 'La categoría orientativa es requerida' };
  }
  // En Comunidad Inthaly cualquier usuario puede definir sus propios tags libres
  const customTags = (groupInput.custom_tags || []).map(t => t.startsWith('#') ? t : `#${t}`);
  return { valid: true, customTags };
}

function canModeratePost(userRole) {
  return ['owner', 'admin', 'moderator'].includes(userRole);
}

test('Grupos Dinámicos: Creación abierta permite cualquier categoría o nicho técnico', () => {
  const customGroup = {
    name: 'Técnicos de Bobinado de Motores Eléctricos',
    category: 'Electromecánica',
    custom_tags: ['Bobinado', 'AltaTension', 'Motores']
  };

  const validation = validateGroupCreation(customGroup);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.customTags.length, 3);
  assert.strictEqual(validation.customTags[0], '#Bobinado');
});

test('Gobernanza de Grupos: Owner, Admin y Moderador tienen facultades de moderación; Member no', () => {
  assert.strictEqual(canModeratePost('owner'), true);
  assert.strictEqual(canModeratePost('admin'), true);
  assert.strictEqual(canModeratePost('moderator'), true);
  assert.strictEqual(canModeratePost('member'), false);
});
