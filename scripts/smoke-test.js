#!/usr/bin/env node
/**
 * Script de Smoke Test Operativo — INTHALY
 * Valida la integridad del entorno, presencia de capas canónicas y salud del repositorio.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('       INTHALY — REPOSITORY SMOKE TEST SUITE        ');
console.log('====================================================');

let failures = 0;

function check(name, fn) {
  process.stdout.write(`[*] Verificando: ${name}... `);
  try {
    fn();
    console.log('OK');
  } catch (err) {
    console.log('FALLO');
    console.error(`    Detalle: ${err.message}`);
    failures++;
  }
}

// 1. Directorios canónicos
check('Estructura canónica de directorios', () => {
  const requiredDirs = [
    'src/app',
    'src/components',
    'src/types',
    'src/hooks',
    'src/services',
    'src/lib',
    'docs',
    'tests'
  ];

  for (const d of requiredDirs) {
    if (!fs.existsSync(path.join(process.cwd(), d))) {
      throw new Error(`Directorio requerido no encontrado: ${d}`);
    }
  }
});

// 2. Archivos de configuración vitales
check('Archivos de configuración fundamentales', () => {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'eslint.config.mjs',
    '.gitignore'
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), f))) {
      throw new Error(`Archivo de configuración no encontrado: ${f}`);
    }
  }
});

// 3. Suite de pruebas unitarias
check('Ejecución de pruebas unitarias integradas', () => {
  try {
    execSync('node --test tests/**/*.test.js', { stdio: 'pipe' });
  } catch (err) {
    throw new Error('Al menos una prueba unitaria falló');
  }
});

console.log('====================================================');
if (failures === 0) {
  console.log('RESULTADO: Todos los chequeos de integridad pasaron (0 fallos).');
  process.exit(0);
} else {
  console.error(`RESULTADO: Se detectaron ${failures} fallos.`);
  process.exit(1);
}
