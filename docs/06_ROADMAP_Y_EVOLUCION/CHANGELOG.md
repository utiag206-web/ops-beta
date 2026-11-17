# 📜 Registro Cronológico de Versiones (Changelog) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Trazabilidad de Versiones del Software  
> **Última Actualización:** 15 de Noviembre de 2026

Todas las modificaciones notables realizadas en la plataforma están documentadas en este archivo según el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.6.0-infra-comunidad] - 2026-11-17 — Infraestructura Autogestionada, Inthaly ID y Evolución de Comunidad Profesional

### Añadido
- **Infraestructura Propia Autogestionada (`infra/`):**
  - Orquestación Docker Compose (`infra/docker/docker-compose.yml`) con PostgreSQL 16 (SCRAM-SHA-256), PgBouncer 1.22 con pool de conexiones y métricas administrativas, Redis 7 Alpine para caché de tokens/sesiones, Caddy Server para TLS inverso automático y servicio de backup programado.
  - DDLs y esquemas relacionales independientes: `inthaly_id` (`01_inthaly_id_schema.sql`) e `inthaly_community` (`02_inthaly_community_schema.sql`) con segregación estricta de privilegios de base de datos.
  - Script automatizado de backups con hash SHA-256 y rotación de 30 días (`infra/backup/backup.sh`).
  - Suite de verificación automatizada de infraestructura (`tests/infra/infra.test.js`) con 6 pruebas pasando al 100%.
  - Documentación técnica completa de operaciones, guías de despliegue en VPS y planes de contingencia (`infra/docs/01_ARQUITECTURA_GENERAL.md` a `05_SEGURIDAD_HARDENING.md`).
- **Navegación Superior Persistente en Comunidad (`CommunityNavbar`):**
  - Accesos directos permanentes en cabecera: Feed Principal (Inicio), Grupos & Foros, y Mi Perfil con indicador activo en tiempo real (`usePathname`).
  - Campo de búsqueda integrado y acceso rápido a InthalyOps.
- **Modal de Información de Perfil Estilo Facebook Web (`CommunityProfileClient`):**
  - Distribución en 2 columnas con navegación lateral: Detalles, Datos personales, Información de contacto, Enlaces & Colegiatura, Empleo & Experiencia, Formación académica, Fotos de perfil y portada, e Información de privacidad.
  - Adición y eliminación dinámica de cargos y estudios con persistencia inmediata en almacenamiento local y sincronización con servidor.

### Modificado y Corregido
- **Rediseño Profesional de Comunidad Inthaly:**
  - Erradicación de elementos estilo entretenimiento o TikTok; adopción de iconografía profesional propia (`Layers` para exploración industrial, `Home`, `Users`, `Building2`).
  - Grupos y Foros en estructura estricta de 2 columnas (`CommunitySidebar` en columna izquierda y foros con filtros en columna derecha).
  - Alineación de cabecera de perfil profesional sin superposiciones entre avatar y nombre.
  - Consolidación simétrica de las tarjetas de productos en la Consola Global del Ecosistema (`/super-admin`).

---

## [1.5.0-arch] - 2026-11-15 — Profesionalización Integral y Modularidad de Arquitectura

### Añadido
- **Capa Canónica de Contratos de Datos (`src/types/`):**
  - `common.types.ts`, `workers.types.ts`, `tareo.types.ts`, `inventory.types.ts`, `mechanics.types.ts` e `index.ts`.
  - Normalización estricta de interfaces sin uso de `any`, unificando contratos de cliente y servidor.
- **Capa Canónica de Hooks Desacoplados (`src/hooks/`):**
  - `useTerminology.ts`, `useOperationalContext.ts`, `useSidebar.ts`, `useRbac.ts`, `useOffline.ts`, `useGlobalSettings.ts` e `index.ts`.
- **Capa Canónica de Servicios de Negocio (`src/services/`):**
  - `workers.service.ts`, `tareo.service.ts`, `inventory.service.ts` e `index.ts`.
  - Desacoplamiento de las consultas a Supabase y mutaciones de datos respecto a las Server Actions de Next.js, manteniendo aislamiento multiempresa y blindajes de seguridad.
- **Infraestructura de Pruebas Automatizadas (`tests/`):**
  - Implementación de suite de pruebas unitarias e integrales usando el ejecutor nativo de Node.js (`node:test` y `node:assert`).
  - Pruebas unitarias de aislamiento multiempresa (`tests/unit/isolation-security.test.js`).
  - Pruebas unitarias del motor de cálculo de tareo (`tests/unit/tareo-engine.test.js`).
  - Pruebas de integración de la estructura de capas canónicas (`tests/integration/services-structure.test.js`).
  - Mock de cliente Supabase reusable (`tests/mocks/supabase.mock.js`).
  - Guía técnica de testing en `tests/README.md`.
  - Comando `npm test` integrado en `package.json`.
- **Herramientas de Mantenimiento y Verificación (`scripts/`):**
  - Script de Smoke Test rápido (`scripts/smoke-test.js`).
  - Catálogo maestro de scripts operativos y mantenimiento histórico (`scripts/README.md`).
- **Archivo Seguro de Artefactos de Raíz (`.archive/`):**
  - Reubicación de archivos no esenciales de compilación y auditorías históricas en `.archive/` e ignorados en `.gitignore`.

### Modificado y Refactorizado
- **Eliminación Quirúrgica de Código Duplicado:**
  - Reducción neta de más de 100 líneas de definiciones redundantes de interfaces (`Worker`, `Movement`, `StockItem`) y consultas dispersas en `workers-list.tsx`, `tareo-client.tsx`, `inventory-stock-list.tsx`, `movements-list.tsx`, `workers/actions.ts`, `tareo/actions.ts` e `inventory/actions.ts`.
- **Optimización de Configuración ESLint (`eslint.config.mjs`):**
  - Exclusión explícita de artefactos de despliegue y directorios no-código fuente, reduciendo el tiempo de escaneo de ESLint de tiempo infinito a 15 segundos.

---

## [1.4.1] - 2026-11-14 — Hotfix de Resiliencia y Navegación Offline (PRODUCCIÓN ACTIVA)

### Corregido
- **Precacheo Profundo de `/offline` en Service Worker (`public/sw.js`):**
  - Descarga y extracción automática de los scripts JS (`page-*.js`) y estilos CSS de `/offline` en el evento `install` dentro de `STATIC_CACHE`.
  - Erradica el error `ChunkLoadError: Loading chunk failed` al navegar desconectado a pantallas no sincronizadas.
- **Erradicación de Pantalla Blanca:**
  - Sustitución de la respuesta HTML en texto plano por un **Fallback de Emergencia Corporativo Autocontenido** con diseño completo, fondo `#06122e`, logotipo de InthalyOps y botón de retorno al Dashboard sin dependencias externas de red.
- **Autonomía Total de `src/app/offline/page.tsx`:**
  - Sustitución de iconos de `lucide-react` por gráficos vectoriales SVG en línea para garantizar que no dependa de paquetes externos en frío.
- **Manejo Preciso de Errores Desconectados (`src/app/error.tsx`):**
  - Detección reactiva de desconexión (`isEffectiveOffline`) que prioriza "Modo sin conexión" y ubica **"Ir al Dashboard"** como botón primario en lugar del mensaje de desarrollo de recompilación.
- **Prioridad de Precalentamiento de Módulos Diarios (`src/lib/prewarm-routes.ts`):**
  - Reorganizada la lista `APP_ROUTES` para descargar de forma inmediata en los primeros 2-3 segundos los módulos operativos críticos (Tareo, Asistencia, Personal, Producción, Planta, Mecánica, Caja Chica y la ruta `/offline`).

---

## [1.4.0] - 2026-11-14 — Versión Estable Congelada (Evolución Integral)

### Añadido y Calibrado
- **Apertura Limpia y Rápida (Fase 1):**
  - Retiro definitivo del splash web redundante (`src/app/loading.tsx`), eliminando la sobrecubierta que interfería con el splash nativo de Android WebAPK.
  - Transición inmediata y sin parpadeos desde el splash corporativo de Android (`#06122e`) hacia la interfaz operativa.
- **Lenguaje de Movimiento Empresarial (Fase 2 — Inspiración: TikTok Dashboard V2 @paulcodes4):**
  - Cadencia de cascada rítmica con escalonamiento de 140ms por tarjeta.
  - Ascenso elástico suave de 36px con curva `cubic-bezier(0.2, 0.8, 0.2, 1)`.
  - Efecto Hover Float en tarjetas (elevación de -6px con sombra 3D multicapa).
  - Selectores universales `.grid > *:nth-child(n)` en las 60 rutas operativas.
  - Bypass de rendimiento: exclusión estricta de tablas de datos masivas para preservar 60 FPS estables.
- **Optimización de Rendimiento Online (Fase 3):**
  - Caché en memoria en servidor (`dashboardStatsCache`) con TTL de 20s para `getDashboardStats()`, reduciendo tiempos de respuesta a < 15ms.
  - Caché de sesión SSR (`sessionMemoryCache`) con TTL de 30s.
  - Micro-indicador de progreso instantáneo (0ms) en navegación superior.
- **Documentación Técnica Maestra (Fase 4):**
  - Reorganización y creación de la suite documental maestra en `/docs/`.

---

## [1.3.4] - 2026-10-25
- Saneamiento y validación de coincidencia de rutas offline en Service Worker (`public/sw.js`).
- Corrección de guardas de navegación offline en la barra lateral (`sidebar.tsx`).
- Soporte para precalentamiento universal de chunks JS y CSS en `prewarm-routes.ts`.

---

## [1.3.0] - 2026-09-30
- Implementación de evidencias fotográficas en módulo de planta (`plant_mineral_evidences`).
- Infraestructura de persistencia para el módulo de mecánica (`mechanics_maintenance`, `mechanics_fuel`, `mechanics_checklists`, `mechanics_tools`).
- RBAC Granular V1: Overrides de permisos por usuario y módulo (`public.user_permissions`).

---

## [1.2.0] - 2026-05-22
- Portal ligero de autoservicio para trabajadores en `/w/[companySlug]`.
- Refuerzo de aislamiento multiempresa en políticas RLS (`20260502_hardened_multi_company_rls.sql`).
- Implementación del rol SuperAdmin e infraestructura de impersonación multi-tenant.

---

## [1.0.0] - 2024-04-04
- Reconstrucción completa del núcleo de inventario, stock por almacén y trazabilidad kardex.
- Autenticación con Supabase Auth SSR y control de acceso base por roles.
