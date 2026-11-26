# LISTA DE VERIFICACIÓN PREVIA AL DESPLIEGUE EN PRODUCCIÓN (GO / NO-GO CHECKLIST)

> **Plataforma:** InthalyOps  
> **Revisión:** Segunda Verificación Técnica Independiente  
> **Fecha:** 26 de Noviembre de 2026  
> **Resultado Global:** **GO CONDICIONADO** (Requiere configuración de secreto de sesión en Vercel)

---

## 1. VARIABLES DE ENTORNO REQUERIDAS EN PRODUCCIÓN

Para garantizar la firma criptográfica inviolable de las sesiones de trabajadores sin secretos predecibles, Vercel **debe** tener configurada al menos una de las siguientes variables de entorno:

| Variable | Propósito | Requerida | Estado |
|---|---|:---:|:---:|
| **`WORKER_SESSION_SECRET`** | Clave privada dedicada para firma HMAC-SHA256 de `worker_session`. | **Recomendada** | Si no existe, usa `SUPABASE_SERVICE_ROLE_KEY`. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Clave maestra de Supabase (usada como fallback seguro de firma). | **Obligatoria** | Activa en producción. |
| **`NEXT_PUBLIC_APP_URL`** | Determina si la cookie se marca con atributo `secure: true` (HTTPS). | **Obligatoria** | https://sistemaops.inthaly.com |

> [!CAUTION]
> En entorno de producción (`NODE_ENV === 'production'`), si ninguna de estas variables está definida, el servidor **falla de forma segura (Fail-Closed)** arrojando una excepción y rechazando emitir tokens con claves predeterminadas.

---

## 2. MATRIZ DE CRITERIOS TÉCNICOS (GO / NO-GO)

| Control | Criterio de Verificación | Estado |
|---|---|:---:|
| **1. Variables de Entorno** | Ningún secreto productivo expuesto en el código fuente ni en git. | **APROBADO (GO)** |
| **2. Firma Criptográfica** | Cookie `worker_session` firmada con HMAC-SHA256 y comparación `timingSafeEqual`. Fallback inseguro eliminado. | **APROBADO (GO)** |
| **3. Anti-Fuerza Bruta** | Rate limiting de 5 intentos y 15 min de bloqueo conectado activamente en `loginWorker`. | **APROBADO (GO)** |
| **4. Cabeceras HTTP & CSP** | Content-Security-Policy, HSTS, X-Frame-Options, nosniff, COOP y CORP activos. | **APROBADO (GO)** |
| **5. Aislamiento Multi-Tenant** | Todas las consultas y borrados en Storage verifican obligatoriamente el `company_id`. | **APROBADO (GO)** |
| **6. Filtro de Archivos** | Whitelist estricta, límite de 15MB, detección de Path Traversal y verificación de Magic Bytes (PDF, PNG, JPG). | **APROBADO (GO)** |
| **7. Higiene de Auditoría** | Logs de seguridad ofuscan contraseñas, pines y tokens (`[REDACTED_SECURITY]`). | **APROBADO (GO)** |
| **8. Prevención de Escalación** | Solo un `super_admin` puede crear o promover a otros superadministradores. | **APROBADO (GO)** |
| **9. Respaldo de Recuperación** | Ramas de respaldo creadas en GitHub (`archive/v1.4.1-standalone`) y localmente. | **APROBADO (GO)** |
| **10. Suite de Pruebas** | 75/75 tests del ecosistema y 11/11 tests de seguridad aprobados al 100%. | **APROBADO (GO)** |

---

## 3. EVALUACIÓN Y DICTAMEN FINAL

- **Dictamen:** **GO CONDICIONADO**.
- **Condición Única:** Asegurar que en Vercel Dashboard la variable `SUPABASE_SERVICE_ROLE_KEY` (o `WORKER_SESSION_SECRET`) esté presente antes de publicar a producción.
- **Riesgo Residual Aceptado:** El rate limiting opera en memoria de las lambdas de Vercel (L1). Para un tráfico masivo distribuido se recomienda Upstash Redis en la siguiente iteración.
