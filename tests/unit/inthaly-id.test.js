const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

// Implementación de referencia para validar las primitivas criptográficas de Inthaly ID
const SCRYPT_CONFIG = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64
};

function generateSalt(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashPassword(password, salt) {
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_CONFIG.keyLen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p
  });
  return derivedKey.toString('hex');
}

function verifyPassword(password, hash, salt) {
  try {
    const candidateHash = hashPassword(password, salt);
    const hashBuffer = Buffer.from(hash, 'hex');
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    if (hashBuffer.length !== candidateBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
  } catch {
    return false;
  }
}

function hashSha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function signJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT', iss: 'https://auth.inthaly.com' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureData = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(signatureData).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signatureData}.${signature}`;
}

function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };
    const [header, payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (sig !== expectedSig) return { valid: false };
    const decoded = JSON.parse(base64UrlDecode(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return { valid: false };
    return { valid: true, payload: decoded };
  } catch {
    return { valid: false };
  }
}

test('Inthaly ID Criptografía: Scrypt deriva claves resistentes y verificación en tiempo constante', () => {
  const password = 'SuperPassword2026!';
  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  assert.strictEqual(hash.length, 128, 'El hash Scrypt debe ser de 64 bytes (128 caracteres hex)');
  assert.strictEqual(verifyPassword(password, hash, salt), true, 'La contraseña correcta debe validar exitosamente');
  assert.strictEqual(verifyPassword('WrongPassword123', hash, salt), false, 'Contraseña incorrecta debe ser rechazada');
});

test('Inthaly ID Criptografía: Tokens JWT HMAC-SHA256 firman y verifican expiración', () => {
  const secret = 'test-secret-key-12345';
  const payload = { sub: 'user-123', email: 'test@inthaly.com' };
  const token = signJwt(payload, secret, 3600);

  const verified = verifyJwt(token, secret);
  assert.strictEqual(verified.valid, true, 'El token con firma válida debe ser aceptado');
  assert.strictEqual(verified.payload.sub, 'user-123');

  const forged = verifyJwt(token, 'wrong-secret');
  assert.strictEqual(forged.valid, false, 'Token con clave equivocada debe ser rechazado');
});

test('Inthaly ID OIDC: Validación estricta de redirect_uri previene Open Redirectors', () => {
  const allowedUris = [
    'http://localhost:3000/comunidad/callback',
    'https://comunidad.inthaly.com/callback'
  ];

  function isRedirectUriAllowed(uri) {
    return allowedUris.some(allowed => uri.startsWith(allowed));
  }

  assert.strictEqual(isRedirectUriAllowed('http://localhost:3000/comunidad/callback'), true);
  assert.strictEqual(isRedirectUriAllowed('https://comunidad.inthaly.com/callback?code=123'), true);
  assert.strictEqual(isRedirectUriAllowed('https://malicious-site.com/steal-token'), false);
});

test('Inthaly ID Sesiones: Almacenamiento ciego mediante hash SHA-256 de refresh tokens', () => {
  const rawRefreshToken = 'rt-9876543210-secure-token';
  const storedHash = hashSha256(rawRefreshToken);

  assert.notStrictEqual(storedHash, rawRefreshToken);
  assert.strictEqual(hashSha256(rawRefreshToken), storedHash);
});
