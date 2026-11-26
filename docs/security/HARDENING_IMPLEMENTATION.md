# IMPLEMENTACIÓN TÉCNICA DE HARDENING Y DEFENSAS — INTHALYOPS

> **Fecha:** 25 de Noviembre de 2026  
> **Proyecto:** InthalyOps (`apps/inthaly-ops`)  
> **Branch de Integración:** `deploy/prepare-monorepo-integration`  
> **Estado:** IMPLEMENTADO Y COMPILADO EXITOSAMENTE

---

## 1. VISIÓN GENERAL

Este documento describe con exactitud cada una de las modificaciones de código y configuración realizadas para remediar los hallazgos de seguridad identificados durante la auditoría. Todos los cambios se apegan estrictamente al principio de **Mínimo Privilegio, Defensa en Profundidad y Seguridad por Diseño (Secure-by-Design)**.

---

## 2. DETALLE DE IMPLEMENTACIÓN POR COMPONENTE

### 2.1 Cabeceras de Seguridad HTTP y Content Security Policy
- **Archivo modificado:** [next.config.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/next.config.ts)
- **Defensas implementadas:**
  - `Content-Security-Policy` (CSP): Restringe la carga de scripts, estilos, marcos y conexiones a orígenes de confianza (Supabase, Vercel, fuentes locales).
  - `X-Frame-Options: SAMEORIGIN`: Previene ataques de Clickjacking.
  - `X-Content-Type-Options: nosniff`: Impide la interpretación errónea de tipos MIME.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Protege la privacidad de URLs internas.
  - `Permissions-Policy: camera=(self), microphone=(), geolocation=()`: Restringe APIs de hardware innecesarias.
  - `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-site`: Evita fugas de memoria y ataques de canal lateral tipo Spectre.

### 2.2 Validación Estricta de Almacenamiento (Anti-RCE / Anti-Stored XSS)
- **Archivo modificado:** [storage.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/lib/storage.ts)
- **Defensas implementadas:**
  - Creación de función preventiva `validateUploadFile(path, sizeBytes, mimeType)`.
  - Lista blanca estricta de extensiones: `jpg`, `jpeg`, `png`, `webp`, `pdf`, `xlsx`, `xls`, `csv`, `doc`, `docx`.
  - Bloqueo explícito de formatos peligrosos: `.svg`, `.html`, `.exe`, `.sh`, `.php`, `.js`.
  - Límite de tamaño forzado a nivel servidor: Máximo 15 MB por archivo.
  - Detección y bloqueo de secuencias de escape de directorio (Path Traversal: `..`, barras inversas).

### 2.3 Prevención de Escalación de Privilegios (Anti-Privilege Escalation)
- **Archivo modificado:** [users/actions.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/app/(main)/users/actions.ts)
- **Defensas implementadas:**
  - En `createUser`: Se verifica que si el rol solicitado es `super_admin`, la sesión del usuario ejecutor posea obligatoriamente `role_id === 'super_admin'`. Si no es así, la solicitud se rechaza con error `403 Forbidden`.
  - En `updateUserRole`: Misma salvaguarda estricta antes de actualizar roles en la base de datos.
  - Se mantiene la protección previa que impide despojar de rol de administrador al último administrador activo de una empresa.

### 2.4 Blindaje Anti-IDOR en Eliminación de Documentos
- **Archivo modificado:** [workers/actions.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/app/(main)/workers/actions.ts)
- **Defensas implementadas:**
  - En `deleteWorkerDocument`: Validación matemática de que la ruta `filePath` inicie obligatoriamente con el prefijo del tenant: `filePath.startsWith(companyId + '/')`.
  - Validación de existencia previa en base de datos: Se realiza una consulta con `.eq('id', id).eq('worker_id', workerId).eq('company_id', companyId)`. Si no coincide, la acción se bloquea inmediatamente antes de invocar la API de Storage.

### 2.5 Protección de Información Sensible en Diagnóstico
- **Archivo modificado:** [debug-mining/route.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/app/api/debug-mining/route.ts)
- **Defensas implementadas:**
  - Validación de rol: Se exige que `extendedUser.role_id === 'super_admin'`.
  - Usuarios no autorizados reciben respuesta `403 Forbidden` estandarizada en JSON.

### 2.6 Sanitización Automática de Registros de Auditoría
- **Archivo modificado:** [audit.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/lib/audit.ts)
- **Defensas implementadas:**
  - Función recursiva `sanitizeAuditDetails(data)`.
  - Lista de claves sensibles: `password`, `pin`, `token`, `secret`, `authorization`, `api_key`, `credential`, `session`.
  - Reemplazo automático del valor por la constante `[REDACTED_SECURITY]` antes de guardar en la tabla `security_audit_logs`.

### 2.7 Criptografía Fuerte y Rate Limiting en Portal de Trabajadores
- **Archivo modificado:** [worker-auth.ts](file:///D:/ecosistema%20inthaly/apps/inthaly-ops/src/app/actions/worker-auth.ts)
- **Defensas implementadas:**
  - **Firma HMAC-SHA256:** Cada token de sesión emitido en la cookie `worker_session` se firma criptográficamente (`base64UrlPayload.hmacSignature`).
  - **Verificación segura en tiempo constante:** Para mitigar ataques de temporización (Timing Attacks), la comprobación de firmas utiliza `crypto.timingSafeEqual()`. Cualquier modificación al payload invalida la sesión de inmediato.
  - **Rate Limiting en Memoria:** Control de intentos fallidos por clave combinada `(companySlug:identifier)`. Tras 5 intentos fallidos consecutivos, la cuenta se bloquea por 15 minutos, mitigando ataques de diccionario o fuerza bruta sobre los PINs de 4 dígitos.


---

## 3. MEJORAS DE LA SEGUNDA REVISIÓN TÉCNICA INDEPENDIENTE

Durante la segunda revisión técnica independiente se detectaron y corrigieron las siguientes brechas operativas:
1. **Conexión Activa de Rate Limiting:** Se conectaron las llamadas `checkRateLimit(rateLimitKey)`, `recordFailedLogin(rateLimitKey)` y `clearFailedLogins(rateLimitKey)` dentro del flujo principal de `loginWorker`.
2. **Eliminación del Fallback Inseguro en Sesiones:** Se eliminó la rama de código en `getWorkerSession` que permitía parsear cookies en texto plano sin firma HMAC si la verificación fallaba. Ahora cualquier cookie sin firma válida es rechazada de inmediato.
3. **Fail-Closed en Secreto de Firma:** En producción (`NODE_ENV === 'production'`), el sistema exige obligatoriamente `WORKER_SESSION_SECRET` o `SUPABASE_SERVICE_ROLE_KEY`. Si faltan, el sistema no inicia con clave por defecto predecible.
4. **Verificación de Magic Bytes en Storage:** Se añadió comprobación a nivel de buffer binario para verificar que archivos con extensión `.pdf` comiencen con `%PDF`, `.png` comiencen con cabecera PNG (`0x89 0x50 0x4E 0x47`) y `.jpg/.jpeg` con cabecera JPEG (`0xFF 0xD8 0xFF`), impidiendo el camuflaje de scripts maliciosos.
