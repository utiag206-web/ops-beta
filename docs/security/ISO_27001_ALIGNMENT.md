# MATRIZ DE ALINEACIÓN CON ISO/IEC 27001:2022 (ANEXO A)

> **Plataforma:** InthalyOps  
> **Propósito:** Mapeo de controles técnicos implementados respecto al estándar internacional ISO/IEC 27001:2022.  
> **Nota de Cumplimiento:** Este documento describe la alineación técnica de los controles implementados y no constituye por sí mismo un certificado de conformidad formal, el cual requiere una auditoría externa por un organismo acreditado.

---

## 1. CONTROLES TECNOLÓGICOS (CLÁUSULA 8)

| Control ISO 27001:2022 | Nombre del Control | Estado en InthalyOps | Evidencia Técnica de Implementación |
|---|---|---|---|
| **A.8.2** | Privilegios de acceso privilegiado | **Implementado** | En `users/actions.ts`, la creación y asignación del rol `super_admin` está restringida a superadministradores existentes. |
| **A.8.3** | Restricción de acceso a información | **Implementado** | El aislamiento multiempresa se garantiza mediante validación obligatoria de `company_id` en cada Server Action. |
| **A.8.4** | Acceso al código fuente | **Implementado** | Monorepo seguro con ramas protegidas (`main`, `archive/v1.4.1-standalone`), sin llaves maestras en repositorio. |
| **A.8.7** | Protección contra malware | **Implementado** | En `src/lib/storage.ts`, se bloquean extensiones ejecutables (`.exe`, `.sh`, `.php`) y archivos SVG con potencial de script embebido. |
| **A.8.8** | Gestión de vulnerabilidades técnicas | **Implementado** | Auditoría y remediación de las 10 vulnerabilidades identificadas en el Security Risk Register. |
| **A.8.9** | Gestión de configuración | **Implementado** | Configuración centralizada de seguridad HTTP (CSP, X-Frame-Options, HSTS) en `next.config.ts`. |
| **A.8.10** | Eliminación de información | **Implementado** | En `workers/actions.ts`, la eliminación de documentos verifica pertenencia al tenant antes de interactuar con el bucket de Storage. |
| **A.8.11** | Enmascaramiento de datos | **Implementado** | En `src/lib/audit.ts`, la función `sanitizeAuditDetails` ofusca recursivamente contraseñas, pines y tokens (`[REDACTED_SECURITY]`). |
| **A.8.12** | Prevención de fuga de datos (DLP) | **Implementado** | Restricción del endpoint `/api/debug-mining` para impedir divulgación de métricas de base de datos a terceros. |
| **A.8.15** | Registro de eventos (Logging) | **Implementado** | Módulo de auditoría registra eventos de seguridad con marcas de tiempo, usuario y acción, con datos sensibles sanitizados. |
| **A.8.20** | Seguridad en redes | **Implementado** | Forzado de HTTPS, HSTS estricto y SameSite cookies en todas las conexiones del aplicativo. |
| **A.8.24** | Uso de criptografía | **Implementado** | Sesiones de trabajadores firmadas con HMAC-SHA256 y verificadas mediante comparación en tiempo constante (`crypto.timingSafeEqual`). |
| **A.8.26** | Requisitos de seguridad de aplicaciones | **Implementado** | Suite automatizada de pruebas de seguridad (`test-security-hardening.js`) integrada al flujo de desarrollo. |
| **A.8.28** | Codificación segura (Secure Coding) | **Implementado** | Prácticas de validación de entrada, principio de menor privilegio y defensas contra inyección y manipulación de parámetros. |

---

## 2. CONTROLES ORGANIZACIONALES (CLÁUSULA 5)

| Control ISO 27001:2022 | Nombre del Control | Estado | Mecanismo Operativo |
|---|---|---|---|
| **A.5.15** | Control de acceso | **Implementado** | Modelo RBAC estructurado con roles diferenciados: `super_admin`, `admin`, `operaciones`, `gerente`, `administracion`. |
| **A.5.16** | Gestión de identidades | **Implementado** | Separación entre cuentas de usuario corporativo (Supabase Auth) e identidades de trabajadores operativos (Worker Portal). |
| **A.5.17** | Información de autenticación | **Implementado** | Protección anti-fuerza bruta (Rate Limiting de 15 minutos tras 5 intentos) para salvaguardar credenciales PIN. |
| **A.5.28** | Gestión de incidentes de seguridad | **Procedimentado** | Definición de niveles de severidad y runbooks operativos en `SECURITY_OPERATIONS_GUIDE.md`. |
