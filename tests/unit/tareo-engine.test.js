const test = require('node:test');
const assert = require('node:assert');

// Funciones puras del motor de tareo
function applyOvertimeRounding(minutes, roundingMode) {
  if (roundingMode === 'NONE' || minutes <= 0) return minutes;
  const interval = roundingMode === 'NEAREST_15' ? 15 : 30;
  return Math.round(minutes / interval) * interval;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    const hours = (d.getUTCHours() - 5 + 24) % 24;
    return hours * 60 + d.getUTCMinutes();
  }
  const parts = timeStr.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

test('Motor Tareo: timeToMinutes convierte correctamente formato HH:MM', () => {
  assert.strictEqual(timeToMinutes('08:00'), 480);
  assert.strictEqual(timeToMinutes('12:30'), 750);
  assert.strictEqual(timeToMinutes('00:00'), 0);
  assert.strictEqual(timeToMinutes(''), 0);
});

test('Motor Tareo: applyOvertimeRounding sin redondeo retorna minutos exactos', () => {
  assert.strictEqual(applyOvertimeRounding(43, 'NONE'), 43);
  assert.strictEqual(applyOvertimeRounding(0, 'NONE'), 0);
});

test('Motor Tareo: applyOvertimeRounding al múltiplo de 15 más cercano', () => {
  assert.strictEqual(applyOvertimeRounding(14, 'NEAREST_15'), 15);
  assert.strictEqual(applyOvertimeRounding(7, 'NEAREST_15'), 0);
  assert.strictEqual(applyOvertimeRounding(22, 'NEAREST_15'), 15);
  assert.strictEqual(applyOvertimeRounding(25, 'NEAREST_15'), 30);
});

test('Motor Tareo: applyOvertimeRounding al múltiplo de 30 más cercano', () => {
  assert.strictEqual(applyOvertimeRounding(14, 'NEAREST_30'), 0);
  assert.strictEqual(applyOvertimeRounding(16, 'NEAREST_30'), 30);
  assert.strictEqual(applyOvertimeRounding(44, 'NEAREST_30'), 30);
  assert.strictEqual(applyOvertimeRounding(46, 'NEAREST_30'), 60);
});
