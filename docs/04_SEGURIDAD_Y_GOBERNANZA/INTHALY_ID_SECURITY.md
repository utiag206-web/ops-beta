# SEGURIDAD, CRIPTOGRAFÍA Y GOBERNANZA DE INTHALY ID
## Estándares de Protección, Gestión de Credenciales y Auditoría Soberana

---

### 1. ESTÁNDARES CRIPTOGRÁFICOS NATIVOS

Inthaly ID implementa las directrices de seguridad más exigentes utilizando la biblioteca criptográfica nativa de Node.js (`node:crypto`), evitando dependencias en paquetes binarios externos o librerías de terceros susceptibles a vulnerabilidades de cadena de suministro (Supply Chain Attacks).

#### A. Función de Derivación de Claves (KDF): Scrypt
- **Parámetros:**
  - Costo de CPU/Memoria ($N$): $16384$ ($2^{14}$)
  - Tamaño de Bloque ($r$): $8$
  - Factor de Paralelización ($p$): $1$
  - Longitud de Salida: $64$ bytes ($512$ bits)
  - Salt Criptográfica: $16$ bytes de entropía generados con generador de números pseudoaleatorios criptográficamente seguros (`crypto.randomBytes(16)`).
- **Formato Canónico de Almacenamiento:**
  ```text
  scrypt$16384$8$1$<salt_hex>$<derived_key_hex>
  ```
- **Resistencia:** El consumo deliberado de memoria de Scrypt neutraliza ataques de fuerza bruta basados en aceleración por hardware (GPUs, FPGAs y ASICs).

#### B. Prevención de Ataques de Temporización (Timing Attacks)
- Toda comparación de firmas de tokens, secretos de clientes o hashes de contraseña se realiza obligatoriamente mediante:
  ```typescript
  crypto.timingSafeEqual(bufferA, bufferB)
  ```
  Esto garantiza que el tiempo de respuesta sea constante e independiente de la posición del byte donde ocurra una discrepancia, anulando ataques de canal lateral (Side-channel attacks).

---

### 2. GOBERNANZA DE SESIONES Y TOKENS

#### A. Almacenamiento Ciego de Refresh Tokens
Para mitigar la exposición de tokens en caso de filtraciones o volcados de bases de datos (SQL Dumps):
- El cliente recibe el token en texto plano (`rt_<entropy>`).
- El servidor **nunca** guarda el refresh token en claro. En su lugar, calcula y persiste el hash unidireccional SHA-256 (`crypto.createHash('sha256').update(token).digest('hex')`).
- Al solicitar rotación, el servidor vuelve a aplicar SHA-256 al token presentado y busca la coincidencia.

#### B. Rotación Estricta de Refresh Tokens
- Cada vez que un Refresh Token es utilizado para renovar un Access Token, el Refresh Token anterior se invalida de inmediato (`is_active = false`) y se emite uno nuevo.
- Si un Refresh Token ya revocado es presentado nuevamente, el sistema asume compromiso de credenciales (Replay Attack) e invalida automáticamente **todas** las sesiones activas de esa identidad en todos los dispositivos.

#### C. Tiempos de Vida y Expiración
| Tipo de Token | Vigencia | Almacenamiento Cliente | Renovación |
| :--- | :--- | :--- | :--- |
| **Access Token (JWT)** | 1 hora (3600s) | Memoria / HttpOnly Cookie | Mediante Refresh Token |
| **Refresh Token** | 30 días | HttpOnly Secure SameSite=Lax Cookie | Con rotación en cada uso |
| **Authorization Code** | 5 minutos (300s) | Parámetro URL (un solo uso) | Expiración estricta |
| **Password Reset Token** | 1 hora (3600s) | Email / Magic Link | Un solo uso |
| **Delegated Admin Ticket**| 2 minutos (120s) | Parámetro URL temporal | Un solo uso / Auditoría total |

---

### 3. PROTECCIÓN CONTRA ATAQUES COMUNES

#### A. Ataques de Fuerza Bruta y Credential Stuffing
- Seguimiento de `failed_login_attempts` a nivel de cuenta e IP.
- Tras 5 intentos fallidos consecutivos, la cuenta entra en bloqueo temporal exponencial (`lockout_until = now() + 15 minutos`).
- Registro del incidente con severidad `warning` en `inthaly_id.security_logs`.

#### B. Open Redirectors en OIDC
- Validación estricta y canónica de URLs en el parámetro `redirect_uri`.
- Inthaly ID coteja la URL exacta contra la lista autorizada en `inthaly_id.oidc_clients.redirect_uris`.
- No se permiten caracteres comodín (`*`) ni subdominios dinámicos abiertos.

#### C. Cross-Site Request Forgery (CSRF)
- En el flujo OIDC es obligatorio el uso del parámetro `state` criptográfico generado por el cliente.
- Las cookies de sesión se emiten con banderas obligatorias:
  ```http
  Set-Cookie: session_id=...; HttpOnly; Secure; SameSite=Lax; Path=/
  ```

---

### 4. PRIVACIDAD SOBERANA Y SALVAGUARDA DE DATOS

1. **Aislamiento Laboral-Comunitario:**
   Los registros de identidad comunitaria, foros y conexiones no son accesibles por las empresas donde el usuario labora a través de InthalyOps.
2. **Desvinculación Multinivel:**
   - **Nivel 1 (Pausa):** Oculta el perfil social manteniendo la identidad Inthaly ID.
   - **Nivel 2 (Desconexión de Empresa):** Elimina cualquier vinculación sugerida con empleadores pasados.
   - **Nivel 3 (Olvido Soberano):** Purga irreversible del perfil social, preservando de manera totalmente independiente el historial laboral y tributario formal exigido por ley en InthalyOps/SUNAT.
