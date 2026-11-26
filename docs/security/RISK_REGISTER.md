# REGISTRO DE RIESGOS DE SEGURIDAD (SECURITY RISK REGISTER)

> **Plataforma:** InthalyOps  
> **Última revisión:** 25 de Noviembre de 2026  
> **Estándar:** Basado en CVSS v3.1 y directrices ISO 31000 / ISO/IEC 27005

---

## 1. TABLA CONSOLIDADA DE RIESGOS

| ID | Vulnerabilidad / Amenaza | CWE | Severidad Inicial (CVSS) | Estado | Severidad Residual | Control de Mitigación |
|---|---|---|---|---|---|---|
| **SEC-CRIT-01** | Escalación de privilegios de Admin de Empresa a Super Administrador Global | CWE-269 | **CRÍTICA (8.8)** | **MITIGADO** | **0.0 (Nula)** | Validación estricta a nivel servidor en `createUser` y `updateUserRole`. |
| **SEC-CRIT-02** | Falsificación y alteración de identidad en cookie de sesión del trabajador | CWE-565 | **CRÍTICA (8.1)** | **MITIGADO** | **0.0 (Nula)** | Firma criptográfica HMAC-SHA256 con verificación `crypto.timingSafeEqual`. |
| **SEC-HIGH-01** | Borrado arbitrario de archivos entre empresas (IDOR en Supabase Storage) | CWE-639 | **ALTA (7.5)** | **MITIGADO** | **0.0 (Nula)** | Validación de prefijo obligatorio `companyId + '/'` y comprobación DB de tenant. |
| **SEC-HIGH-02** | Carga no restringida de archivos peligrosos en Storage (SVG Stored XSS / RCE) | CWE-434 | **ALTA (7.2)** | **MITIGADO** | **0.0 (Nula)** | Whitelist estricta de extensiones seguras y límite de 15MB en servidor. |
| **SEC-HIGH-03** | Fuerza bruta de PINs de 4 dígitos en Portal de Trabajadores | CWE-307 | **ALTA (7.3)** | **MITIGADO** | **1.5 (Mínima)** | Rate limiting dinámico: bloqueo de 15 minutos tras 5 intentos fallidos. |
| **SEC-MED-01** | Divulgación de telemetría interna en endpoint `/api/debug-mining` | CWE-200 | **MEDIA (5.3)** | **MITIGADO** | **0.0 (Nula)** | Restricción estricta con HTTP 403 para usuarios sin rol `super_admin`. |
| **SEC-MED-02** | Ausencia de Content-Security-Policy y cabeceras de aislamiento perimetral | CWE-693 | **MEDIA (5.4)** | **MITIGADO** | **0.0 (Nula)** | Configuración en `next.config.ts` de CSP estricta, HSTS, X-Frame-Options y COOP/CORP. |
| **SEC-MED-03** | Registro de credenciales y claves en texto claro en logs de auditoría | CWE-532 | **MEDIA (5.1)** | **MITIGADO** | **0.0 (Nula)** | Sanitizador recursivo de claves sensibles antes de inserción en base de datos. |
| **SEC-LOW-01** | Sesiones de trabajador persistentes sin rotación activa de clave | CWE-613 | **BAJA (3.7)** | **MITIGADO** | **1.2 (Baja)** | Clave derivada de secreto de entorno del servidor y expiración controlada en cookie. |
| **SEC-LOW-02** | Riesgo de Path Traversal por caracteres especiales en nombres de archivo | CWE-22 | **BAJA (3.3)** | **MITIGADO** | **0.0 (Nula)** | Validación de `..`, `/` y `\\` en la función central de almacenamiento. |

---

## 2. EVALUACIÓN DE IMPACTO POST-REMEDIACIÓN

Todas las vulnerabilidades identificadas de nivel Crítico y Alto han sido neutralizadas mediante controles técnicos a nivel de aplicación (Application Layer Defenses). El riesgo residual es bajo y aceptable para la fase de puesta en producción con monitoreo continuo.
