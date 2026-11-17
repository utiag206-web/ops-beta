# GUÍA DE INTEGRACIÓN DE INTHALY ID
## Especificación de Protocolos, Endpoints y Contratos para Clientes del Ecosistema

---

### 1. INTRODUCCIÓN

Inthaly ID actúa como el Proveedor de Identidad (IdP) OpenID Connect (OIDC) y OAuth 2.0 para todas las aplicaciones del ecosistema. Esta guía documenta los contratos de integración para:
1. **Comunidad Inthaly** (Next.js App Router).
2. **Inthaly Academy** (Laravel 12 / MySQL satélite en `app.inthaly.com`).
3. **Consola Global Inthaly** (Next.js App Router).
4. **Futuros Productos Satélite** (Inthaly Transporte, Marketplace).

---

### 2. CLIENTES REGISTRADOS EN EL SISTEMA

| Client ID | Nombre de Producto | Tipo | Redirect URIs Autorizadas | Scopes Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `inthaly-community-web` | Comunidad Inthaly | Público / SPA | `http://localhost:3000/comunidad/callback`<br>`https://inthaly.com/comunidad/callback` | `openid`, `profile`, `email` |
| `inthaly-global-console` | Consola Global Inthaly | Confidencial | `http://localhost:3000/super-admin/callback`<br>`https://admin.inthaly.com/callback` | `openid`, `profile`, `email`, `admin` |
| `inthaly-academy-satellite`| Inthaly Academy (Laravel 12) | Confidencial | `http://localhost:8000/auth/inthaly-id/callback`<br>`https://app.inthaly.com/auth/inthaly-id/callback` | `openid`, `profile`, `email`, `academy:enroll` |

---

### 3. FLUJO DE INTEGRACIÓN PASO A PASO (OIDC AUTHORIZATION CODE)

#### Paso 1: Redirección al Portal de Inthaly ID
La aplicación cliente redirige al usuario a la URL de autorización:
```http
GET /id/login?client_id=inthaly-community-web&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcomunidad%2Fcallback&response_type=code&scope=openid%20profile%20email&state=xyz123SecureRandomState
```

#### Paso 2: Autenticación y Emisión de Código
El usuario ingresa credenciales o selecciona una sesión existente. Inthaly ID genera un `authorization_code` criptográfico de un solo uso con 5 minutos de validez y redirige al cliente:
```http
HTTP/302 Found
Location: http://localhost:3000/comunidad/callback?code=authcode_7a8b9c...&state=xyz123SecureRandomState
```

#### Paso 3: Intercambio de Código por Tokens (Server-to-Server)
El backend del cliente realiza una petición POST para canjear el código:
```http
POST /api/id/oauth/token HTTP/1.1
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "inthaly-community-web",
  "client_secret": "sec_...", // Requerido para clientes confidenciales
  "code": "authcode_7a8b9c...",
  "redirect_uri": "http://localhost:3000/comunidad/callback"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_8f9a2b...",
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "carlos.mendoza@ejemplo.com",
    "full_name": "Carlos Mendoza",
    "display_name": "Ing. Carlos Mendoza",
    "avatar_url": null,
    "email_verified": true
  }
}
```

---

### 4. ESPECIFICACIÓN DE INTHALY ACADEMY (LARAVEL 12 SATELLITE)

Inthaly Academy reside de forma autónoma en `app.inthaly.com` sobre Laravel 12 y MySQL. Su integración se realiza mediante dos mecanismos limpios:

#### A. OIDC Socialite Provider en Laravel
En el repositorio de Laravel 12 (`config/services.php`):
```php
'inthaly_id' => [
    'client_id' => env('INTHALY_ID_CLIENT_ID', 'inthaly-academy-satellite'),
    'client_secret' => env('INTHALY_ID_CLIENT_SECRET'),
    'redirect' => env('INTHALY_ID_REDIRECT_URI', 'https://app.inthaly.com/auth/inthaly-id/callback'),
    'base_url' => env('INTHALY_ID_URL', 'https://auth.inthaly.com'),
],
```

Al recibir el token, Laravel busca al estudiante por `inthaly_identity_id`. Si no existe, lo aprovisiona automáticamente (JIT - Just In Time Provisioning) sincronizando nombre y correo sin solicitar contraseñas.

#### B. Webhook de Certificados Criptográficos
Cuando un estudiante completa una certificación en Academy, Laravel envía un webhook firmado con HMAC-SHA256 a Inthaly ID / Comunidad para reflejar la insignia en su perfil profesional:
```http
POST /api/webhooks/academy/certificate-issued HTTP/1.1
X-Inthaly-Signature: sha256=d41d8cd98f00b204e9800998ecf8427e...
Content-Type: application/json

{
  "event": "certificate.issued",
  "identity_id": "11111111-1111-1111-1111-111111111111",
  "course_slug": "seguridad-minera-iperc-continuo",
  "certificate_code": "INTH-ACAD-2026-9941",
  "issued_at": "2026-11-16T18:00:00Z"
}
```

---

### 5. ACCESO ADMINISTRATIVO DELEGADO (TICKETS DE UN SOLO USO)

Para que el Super Admin desde la Consola Global pueda auditar o moderar Comunidad o Academia con un solo clic:
1. La Consola Global solicita un ticket de delegación:
   ```typescript
   const ticket = await generateDelegatedTicketAction(targetProductId, adminIdentityId);
   ```
2. El ticket es un JWT firmado con vigencia de 120 segundos conteniendo `claim: "delegated_admin"`.
3. El Super Admin es redirigido a `https://inthaly.com/comunidad?admin_ticket=<jwt>`.
4. La aplicación receptora valida la firma del ticket y eleva temporalmente la sesión a privilegios de moderación global sin requerir credenciales de usuario.
