const test = require('node:test');
const assert = require('node:assert');

// Implementación matemática del motor heurístico ponderado
function calculateMatchScore(candidate, userProfile, userCompanyId, weights) {
  // Filtro Anti-Espionaje Laboral
  if (!candidate.allow_employer_matching && userCompanyId && candidate.company_id === userCompanyId) {
    return null; // Filtrado estrictamente
  }

  // 1. Especialidad (40%)
  const userSpecs = new Set(userProfile.specialties.map(s => s.toLowerCase()));
  const commonSpecs = candidate.specialties.filter(s => userSpecs.has(s.toLowerCase()));
  const specialtyScore = Math.min(100, (commonSpecs.length / Math.max(1, userSpecs.size)) * 100);

  // 2. Proximidad Geográfica (25%)
  let proximityScore = 0;
  if (userProfile.location_region && candidate.location_region) {
    const uLoc = userProfile.location_region.toLowerCase();
    const cLoc = candidate.location_region.toLowerCase();
    if (uLoc === cLoc) proximityScore = 100;
    else if (uLoc.split(',')[0].trim() === cLoc.split(',')[0].trim()) proximityScore = 80;
    else proximityScore = 30;
  }

  // 3. Grupos Compartidos (20%)
  const userGroups = new Set(userProfile.groups || []);
  const commonGroups = (candidate.groups || []).filter(g => userGroups.has(g));
  const sharedGroupsScore = commonGroups.length > 0 ? 100 : 0;

  // 4. Conexiones Mutuas (15%)
  const mutualConnectionsScore = 50;

  const totalScore = Math.round(
    specialtyScore * weights.specialtyWeight +
    proximityScore * weights.proximityWeight +
    sharedGroupsScore * weights.sharedGroupsWeight +
    mutualConnectionsScore * weights.mutualConnectionsWeight
  );

  return { totalScore, specialtyScore, proximityScore, sharedGroupsScore };
}

const defaultWeights = {
  specialtyWeight: 0.40,
  proximityWeight: 0.25,
  sharedGroupsWeight: 0.20,
  mutualConnectionsWeight: 0.15
};

test('Motor Heurístico: Coincidencia perfecta de especialidad, región y grupo arroja afinidad máxima', () => {
  const user = {
    specialties: ['Perforación', 'Voladura'],
    location_region: 'Arequipa, Perú',
    groups: ['grp-mina']
  };

  const candidate = {
    specialties: ['Perforación', 'Voladura'],
    location_region: 'Arequipa, Perú',
    groups: ['grp-mina'],
    allow_employer_matching: true
  };

  const result = calculateMatchScore(candidate, user, null, defaultWeights);
  assert.ok(result !== null);
  // (100*0.4) + (100*0.25) + (100*0.2) + (50*0.15) = 40 + 25 + 20 + 7.5 = 92.5 -> 93
  assert.strictEqual(result.totalScore, 93);
});

test('Motor Heurístico: Salvaguarda Anti-Espionaje excluye candidatos de la misma empresa si matching está desactivado', () => {
  const user = {
    specialties: ['SOMA'],
    location_region: 'Cusco, Perú'
  };

  const supervisor = {
    company_id: 'empresa-alpha-123',
    specialties: ['SOMA'],
    location_region: 'Cusco, Perú',
    allow_employer_matching: false // Salvaguarda activada
  };

  const result = calculateMatchScore(supervisor, user, 'empresa-alpha-123', defaultWeights);
  assert.strictEqual(result, null, 'El supervisor debe ser filtrado para proteger la privacidad del trabajador');
});

test('Motor Heurístico: Candidatos de diferente región y sin grupos compartidos reciben puntuación proporcional menor', () => {
  const user = {
    specialties: ['Mecánica Pesada'],
    location_region: 'Arequipa, Perú',
    groups: []
  };

  const candidate = {
    specialties: ['Mecánica Pesada'],
    location_region: 'Piura, Perú',
    groups: ['grp-pesca'],
    allow_employer_matching: true
  };

  const result = calculateMatchScore(candidate, user, null, defaultWeights);
  assert.ok(result !== null);
  // (100*0.4) + (30*0.25) + (0*0.2) + (50*0.15) = 40 + 7.5 + 0 + 7.5 = 55
  assert.strictEqual(result.totalScore, 55);
});
