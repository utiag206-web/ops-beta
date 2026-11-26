# LISTA DE VERIFICACIÓN PREVIA AL DESPLIEGUE EN PRODUCCIÓN (GO / NO-GO CHECKLIST)

> **Plataforma:** InthalyOps  
> **Objetivo:** Asegurar que todos los prerrequisitos de seguridad y configuración estén validados antes de autorizar un despliegue en producción en Vercel.

---

## 1. CRITERIOS TÉCNICOS OBLIGATORIOS (GO / NO-GO)

| Control | Criterio de Verificación | Estado |
|---|---|:---:|
| **1. Variables de Entorno** | Ningún secreto productivo expuesto en el código fuente ni en git. | **APROBADO (GO)** |
| **2. Cabeceras HTTP** | Content-Security-Policy, HSTS, X-Frame-Options y nosniff activadas en `next.config.ts`. | **APROBADO (GO)** |
| **3. Aislamiento Multi-Tenant** | Todas las consultas y borrados en Storage verifican obligatoriamente el `company_id`. | **APROBADO (GO)** |
| **4. Protección Criptográfica** | Cookie `worker_session` firmada con HMAC-SHA256 y comparación en tiempo constante. | **APROBADO (GO)** |
| **5. Anti-Fuerza Bruta** | Bloqueo temporal tras 5 intentos fallidos implementado en login de trabajadores. | **APROBADO (GO)** |
| **6. Filtro de Archivos** | Whitelist estricta de extensiones en subidas a Storage (máx 15MB, sin SVG ni executables). | **APROBADO (GO)** |
| **7. Higiene de Auditoría** | Logs de seguridad ofuscan contraseñas, pines y tokens (`[REDACTED_SECURITY]`). | **APROBADO (GO)** |
| **8. Prevención de Escalación** | Solo un `super_admin` puede crear o promover a otros superadministradores. | **APROBADO (GO)** |
| **9. Respaldo de Recuperación** | Ramas de respaldo creadas en GitHub (`archive/v1.4.1-standalone`) y localmente. | **APROBADO (GO)** |
| **10. Suite de Pruebas** | 75/75 tests del ecosistema y 11/11 tests de seguridad aprobados al 100%. | **APROBADO (GO)** |

---

## 2. REGLA INNEGOCIABLE DE CONTROL
- **NO REALIZAR `git push` NI DESPLIEGUE EN VERCEL** hasta contar con la autorización explícita y final del usuario.
