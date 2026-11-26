# ALINEACIÓN CON CIS CRITICAL SECURITY CONTROLS v8.1

> **Plataforma:** InthalyOps  
> **Grupo de Implementación Prioritario:** IG1 (Higiene Básica de Ciberseguridad) e IG2 (Defensa Empresarial)

---

## 1. EVALUACIÓN POR CONTROLES CIS v8.1

### Control 03: Protección de Datos (Data Protection)
- **CIS 3.3:** *Configurar listas de control de acceso a datos.*  
  **Estado:** Implementado. Aislamiento estricto multiempresa en base de datos y Storage (`workers/actions.ts`).
- **CIS 3.4:** *Imponer retención y eliminación segura.*  
  **Estado:** Implementado. Borrado de archivos en Storage validando pertenencia exclusiva de la empresa activa.
- **CIS 3.10:** *Cifrar datos sensibles en tránsito.*  
  **Estado:** Implementado. HSTS forzado y certificados TLS en toda la comunicación web.
- **CIS 3.11:** *Cifrado de datos en reposo.*  
  **Estado:** Implementado mediante cifrado nativo de Supabase Storage y PostgreSQL (AES-256).

### Control 04: Configuración Segura de Software (Secure Configuration)
- **CIS 4.1:** *Establecer y mantener una configuración segura.*  
  **Estado:** Implementado en `next.config.ts` con cabeceras HTTP de hardening (CSP, nosniff, SAMEORIGIN, CORP/COOP).

### Control 05: Gestión de Cuentas (Account Management)
- **CIS 5.1:** *Inventario de cuentas.*  
  **Estado:** Gestionado en módulo `/users` y tabla de trabajadores vinculados.
- **CIS 5.3:** *Deshabilitar cuentas inactivas.*  
  **Estado:** Soportado en panel de usuarios mediante cambio de estado a inactivo.
- **CIS 5.4:** *Restringir privilegios de administrador.*  
  **Estado:** Implementado con la separación explícita entre `admin` y `super_admin`.

### Control 06: Gestión del Control de Acceso (Access Control Management)
- **CIS 6.1:** *Proceso de revocación de accesos.*  
  **Estado:** Revocación inmediata al desactivar usuario o cambiar rol.
- **CIS 6.3:** *Exigir autenticación para acceso a datos.*  
  **Estado:** Todas las APIs y páginas internas requieren sesión autenticada.
- **CIS 6.5:** *Control de acceso basado en roles (RBAC).*  
  **Estado:** RBAC estricto en Server Actions de tareo, kardex, usuarios y campamento.

### Control 08: Gestión de Registros de Auditoría (Audit Log Management)
- **CIS 8.2:** *Recopilar registros de auditoría.*  
  **Estado:** Implementado en `src/lib/audit.ts` registrando acciones críticas con usuario, IP y timestamp.
- **CIS 8.5:** *Detalles en registros de auditoría sin exponer datos confidenciales.*  
  **Estado:** Sanitizador recursivo (`sanitizeAuditDetails`) ofusca automáticamente credenciales y tokens.

### Control 10: Defensas contra Malware (Malware Defenses)
- **CIS 10.4:** *Bloquear archivos ejecutables o potencialmente maliciosos en la capa web.*  
  **Estado:** `src/lib/storage.ts` rechaza extensiones `.exe`, `.sh`, `.php`, `.svg`, `.html`.

### Control 16: Seguridad del Software de Aplicación (Application Software Security)
- **CIS 16.1:** *Diseño seguro de aplicaciones (Secure-by-Design).*  
  **Estado:** Flujos de validación en servidor sin confiar en validaciones puras del navegador.
- **CIS 16.7:** *Defensas contra ataques de manipulación de parámetros y CSRF/IDOR.*  
  **Estado:** Next.js Server Actions con protección CSRF integrada y chequeo de `company_id`.
- **CIS 16.10:** *Pruebas de seguridad de software.*  
  **Estado:** Suite de pruebas automatizadas `scratch/test-security-hardening.js` y pruebas de regresión.
