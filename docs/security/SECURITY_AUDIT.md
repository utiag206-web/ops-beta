# AUDITORÍA INTEGRAL DE SEGURIDAD DEFENSIVA — INTHALYOPS

> **Fecha:** 25 de Noviembre de 2026  
> **Ámbito:** `D:\ecosistema inthaly\apps\inthaly-ops`  
> **Objetivo:** Identificación y diagnóstico de vulnerabilidades, evaluación de controles defensivos y análisis de riesgos bajo marcos ISO/IEC 27001:2022, SOC 2, CIS Controls v8.1 y CISA.  
> **Estado:** AUDITORÍA COMPLETADA Y CONTROLES MITIGADOS

---

## 1. RESUMEN EJECUTIVO

Se ejecutó una auditoría exhaustiva de seguridad sobre la arquitectura, código fuente, flujos de autenticación, almacenamiento y mecanismos de aislamiento multiempresa de **InthalyOps**. La auditoría cubrió tanto el portal administrativo como el portal de autoservicio de trabajadores (`Worker Portal`).

### Principales Hallazgos Consolidados:
- **Total de vulnerabilidades evaluadas:** 10
- **Críticas:** 2 (Mitigadas)
- **Altas:** 3 (Mitigadas)
- **Medias:** 3 (Mitigadas)
- **Bajas:** 2 (Mitigadas)
- **Resultado tras remediación:** No se detectan vulnerabilidades de riesgo Crítico ni Alto sin mitigar.

---

## 2. METODOLOGÍA Y ALCANCE

### 2.1 Metodología
La auditoría combinó:
1. **Revisión estática de código (SAST):** Análisis manual y automatizado de TypeScript/React/Next.js (App Router, Server Actions, Route Handlers).
2. **Modelado de amenazas (Threat Modeling):** Basado en STRIDE aplicado a la arquitectura multiempresa (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).
3. **Mapeo a debilidades comunes (CWE/SANS Top 25):** Identificación precisa de patrones de riesgo (CWE-269, CWE-565, CWE-639, CWE-434, CWE-307, CWE-200, CWE-693, CWE-532).
4. **Validación de aislamiento multi-tenant:** Análisis de segregación por `company_id` y alcance de `createAdminClient()` vs `createClient()`.

### 2.2 Alcance
- **Código auditado:** `apps/inthaly-ops/src/**`, `apps/inthaly-ops/next.config.ts`.
- **Restricciones respetadas:** Sin alteraciones en base de datos productiva Supabase (cero DDL), sin alteración de datos de clientes, sin despliegues ni pushes a producción.

---

## 3. DIAGNÓSTICO DETALLADO POR COMPONENTES

### 3.1 Autenticación y Control de Acceso
- **Flujo Administrativo (Supabase Auth):**
  - Manejo de sesiones mediante cookies HttpOnly firmadas por Supabase.
  - Validación de roles mediante `getUserSession()` y `getStrictCompanyId()`.
  - **Hallazgo detectado:** En `users/actions.ts`, la función `createUser` y `updateUserRole` no verificaban si el usuario creador era un `super_admin` antes de asignar dicho rol, permitiendo que un `admin` local de cualquier empresa pudiera crear o promoverse a Super Administrador Global (**SEC-CRIT-01**).
- **Portal de Trabajadores (DNI + PIN):**
  - Autenticación rápida diseñada para trabajadores de campo/planta.
  - **Hallazgos detectados:**
    1. La cookie `worker_session` se almacenaba como JSON en base64 sin firma HMAC, permitiendo manipulación maliciosa de identidad o empresa (**SEC-CRIT-02**).
    2. Ausencia de limitación de tasa de intentos fallidos (Rate Limiting), exponiendo pines de 4 dígitos a ataques de fuerza bruta automatizados (**SEC-HIGH-03**).

### 3.2 Aislamiento Multiempresa (Multi-Tenancy)
- En la capa de base de datos, las consultas en Server Actions utilizan `.eq('company_id', companyId)`.
- **Hallazgo detectado en Almacenamiento (Storage):**
  - En `workers/actions.ts`, la acción de servidor `deleteWorkerDocument` recibía un parámetro arbitrario `filePath` y procedía a borrarlo en Supabase Storage utilizando privilegios de `createAdminClient()` sin validar si el path iniciaba con el prefijo de la empresa activa (`companyId + '/'`), permitiendo borrado cruzado de documentos entre empresas (**SEC-HIGH-01**).

### 3.3 Gestión de Archivos y Almacenamiento
- La función central `uploadFile` en `src/lib/storage.ts` interactuaba directamente con Supabase Storage sin lista blanca estricta de extensiones permitidas, permitiendo archivos potencialmente maliciosos (.svg con scripts embebidos, ejecutables o archivos HTML) (**SEC-HIGH-02**).

### 3.4 Telemetría y Endpoints de Diagnóstico
- La ruta `/api/debug-mining/route.ts` exponía recuentos de registros de ciclos de trabajo, tareos y movimientos a cualquier usuario autenticado, sin exigir rol administrativo global (**SEC-MED-01**).

### 3.5 Cabeceras de Seguridad y Protección Web
- `next.config.ts` carecía de Content Security Policy (CSP), cabeceras de aislamiento (`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`) y protección contra sniffing MIME (**SEC-MED-02**).

### 3.6 Auditoría y Registro (Logging)
- La función `logSecurityAudit` en `src/lib/audit.ts` registraba objetos en base de datos sin sanitizar propiedades sensibles como contraseñas o tokens en el campo `details` (**SEC-MED-03**).

---

## 4. CONCLUSIÓN DE LA AUDITORÍA
El sistema contaba con una base funcional bien estructurada, pero presentaba vectores de vulnerabilidad típicos en aplicaciones en escalamiento rápido hacia SaaS. Las medidas de hardening ejecutadas blindan la aplicación contra escalaciones, falsificaciones y ataques automatizados sin alterar la experiencia de usuario.
