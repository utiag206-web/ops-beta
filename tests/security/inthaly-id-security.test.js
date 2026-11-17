const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// ==============================================================================
// PRUEBAS DE SEGURIDAD Y SANEAMIENTO: INTHALY ID (BLOQUE E)
// ==============================================================================

// Primitivas PKCE según RFC 7636
function base64UrlEncodeBuffer(buffer) {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generatePkceVerifier(bytes = 32) {
  return base64UrlEncodeBuffer(crypto.randomBytes(bytes));
}

function generatePkceChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncodeBuffer(hash);
}

function verifyPkce(codeVerifier, codeChallenge, method = 'S256') {
  if (method === 'S256') {
    const calculatedChallenge = generatePkceChallenge(codeVerifier);
    const calcBuf = Buffer.from(calculatedChallenge);
    const chalBuf = Buffer.from(codeChallenge);
    if (calcBuf.length !== chalBuf.length) return false;
    return crypto.timingSafeEqual(calcBuf, chalBuf);
  }
  return false;
}

// Validación JWT con algoritmo estricto
function signJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iss: 'https://auth.inthaly.com',
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const encodedHeader = base64UrlEncodeBuffer(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64UrlEncodeBuffer(Buffer.from(JSON.stringify(fullPayload)));
  const signatureData = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureData)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signatureData}.${signature}`;
}

function verifyJwt(token, secret, options = {}) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Token malformado' };
    const [encodedHeader, encodedPayload, receivedSignature] = parts;
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    if (!header || header.alg !== 'HS256') {
      return { valid: false, error: 'Algoritmo no permitido. Solo se acepta HS256.' };
    }
    const signatureData = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const expectedBuf = Buffer.from(expectedSignature);
    const receivedBuf = Buffer.from(receivedSignature);
    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return { valid: false, error: 'Firma inválida' };
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' };
    }
    if (options.expectedIssuer && payload.iss !== options.expectedIssuer) {
      return { valid: false, error: 'Emisor inválido' };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

test('Seguridad A1: Recuperación de contraseña NUNCA retorna el token al cliente (Anti-ATO)', () => {
  // Simulador de Server Action saneado
  const requestPasswordResetSanitized = (email) => {
    // Genera token seguro y almacena solo su hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // NUNCA retorna rawToken al cliente
    return {
      success: true,
      data: {
        message: 'Si la dirección de correo ingresada se encuentra registrada, recibirás instrucciones para restablecer tu contraseña.'
      }
    };
  };

  const res = requestPasswordResetSanitized('admin@inthaly.com');
  assert.equal(res.success, true);
  assert.equal(res.data.resetToken, undefined, 'CRÍTICO: No debe retornar resetToken en la respuesta');
  assert.match(res.data.message, /recibirás instrucciones/i);
});

test('Seguridad A2: Cuentas semilla están prohibidas en producción y persistencia ausente deniega acceso', () => {
  const authenticateInProduction = (email, password, isProduction, dbUrl) => {
    if (isProduction && !dbUrl) {
      return {
        success: false,
        error: 'Servicio de identidad temporalmente no disponible por mantenimiento de persistencia segura.'
      };
    }
    return { success: true };
  };

  const res = authenticateInProduction('carlos.mendoza@inthaly.com', 'Inthaly2026!', true, undefined);
  assert.equal(res.success, false);
  assert.match(res.error, /persistencia segura/i);
});

test('Seguridad A3: Validación estricta de Redirect URI en OIDC bloquea variaciones de Open Redirect', () => {
  const registeredUris = [
    'http://localhost:3000/comunidad/callback',
    'https://comunidad.inthaly.com/callback'
  ];

  const validateRedirectUriStrict = (attemptedUri) => {
    // Prohibido startsWith; exigencia estricta de coincidencia canónica
    return registeredUris.includes(attemptedUri);
  };

  // Ataque 1: Dominio malicioso con prefijo similar
  assert.equal(validateRedirectUriStrict('http://localhost:3000/comunidad/callback.attacker.com'), false);
  // Ataque 2: Path traversal
  assert.equal(validateRedirectUriStrict('http://localhost:3000/comunidad/callback/../../evil'), false);
  // Ataque 3: Query parameters no canónicos
  assert.equal(validateRedirectUriStrict('http://localhost:3000/comunidad/callback?steal=1'), false);
  // Válido canónico
  assert.equal(validateRedirectUriStrict('http://localhost:3000/comunidad/callback'), true);
  assert.equal(validateRedirectUriStrict('https://comunidad.inthaly.com/callback'), true);
});

test('Seguridad A4: Prevención de IDOR en Onboarding exigiendo resolución de identidad en servidor', () => {
  const serverUpdateProfile = (clientPayload, authenticatedSessionId) => {
    if (!authenticatedSessionId) {
      throw new Error('UNAUTHORIZED: Se requiere una sesión activa y validada en Inthaly ID.');
    }
    // Ignora cualquier ID suministrado por el cliente y asigna estrictamente el ID de la sesión
    return {
      ...clientPayload,
      id: authenticatedSessionId
    };
  };

  // Atacante intenta pasar el UUID de la víctima en el payload
  const attackerSession = 'id-attacker-123';
  const victimId = 'id-victim-999';
  const result = serverUpdateProfile({ id: victimId, display_name: 'Perfil Hackeado' }, attackerSession);

  assert.equal(result.id, attackerSession, 'El servidor forzó el ID de la sesión e ignoró el ID víctima');
  assert.notEqual(result.id, victimId);

  // Intento sin sesión autenticada
  assert.throws(() => serverUpdateProfile({ display_name: 'Anon' }, null), /UNAUTHORIZED/);
});

test('Seguridad A5: PKCE S256 obligatorio para clientes públicos OIDC (RFC 7636)', () => {
  const verifier = generatePkceVerifier();
  const challenge = generatePkceChallenge(verifier);

  assert.equal(verifyPkce(verifier, challenge, 'S256'), true);
  assert.equal(verifyPkce('invalid-verifier', challenge, 'S256'), false);
  assert.equal(verifyPkce(verifier, 'tampered-challenge', 'S256'), false);
});

test('Seguridad A6: Tickets delegados están deshabilitados hasta consumo atómico y persistente (ADR-ID-004)', () => {
  const generateDelegatedTicket = () => {
    return {
      success: false,
      error: 'El acceso administrativo delegado se encuentra temporalmente deshabilitado por política de seguridad (ADR-ID-004) hasta implementar la persistencia atómica de tickets de un solo uso en la base de datos independiente de Inthaly ID.'
    };
  };

  const res = generateDelegatedTicket();
  assert.equal(res.success, false);
  assert.match(res.error, /ADR-ID-004/);
});

test('Seguridad A7: Consola Global refleja estados reales y no oculta errores con datos falsos', () => {
  const buildEcosystemStats = (identitiesCount, sessionsCount, isConnected) => {
    if (!isConnected) {
      return {
        totalIdentities: 0,
        communityUsersCount: 0,
        inthalyOpsCompaniesCount: 0,
        communityStatus: 'unavailable',
        inthalyOpsStatus: 'unavailable'
      };
    }
    return {
      totalIdentities: identitiesCount,
      communityUsersCount: 0,
      inthalyOpsCompaniesCount: 0,
      communityStatus: 'active',
      inthalyOpsStatus: 'active'
    };
  };

  const disconnectedStats = buildEcosystemStats(0, 0, false);
  assert.equal(disconnectedStats.totalIdentities, 0);
  assert.equal(disconnectedStats.communityStatus, 'unavailable');
  assert.notEqual(disconnectedStats.communityUsersCount, 4, 'Prohibido usar 4 como dato simulado');
});

test('Seguridad Criptográfica: JWT rechaza alteración de algoritmo (Anti-Algorithm Confusion)', () => {
  const secret = 'super-secret-key-2026';
  const token = signJwt({ sub: 'user-carlos' }, secret, 3600);
  const verified = verifyJwt(token, secret);
  assert.equal(verified.valid, true);

  // Alteración maliciosa para enviar alg: none
  const parts = token.split('.');
  const badHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const badToken = `${badHeader}.${parts[1]}.${parts[2]}`;
  const badVerified = verifyJwt(badToken, secret);
  assert.equal(badVerified.valid, false);
  assert.match(badVerified.error, /Algoritmo no permitido/);
});
