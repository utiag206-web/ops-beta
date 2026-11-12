# 📜 Registro de Cambios (Changelog) — InthalyOps

Todas las modificaciones notables realizadas en este proyecto están documentadas en este archivo. El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.3.5] - 2026-11-12 — Etapa de Evolución: Apertura, Movimiento, Rendimiento y Documentación

### Agregado
- **Sistema de Diseño de Movimiento Empresarial (`globals.css`):**
  - Clases utilitarias de animación aceleradas por GPU: `.nth-page-enter`, `.nth-header-enter`, `.nth-card-enter`, `.nth-modal-enter` y `.nth-panel-enter`.
  - Escalonamiento en micro-lotes para tarjetas de métricas (`.nth-stagger-1` a `.nth-stagger-6`).
  - Respuesta táctil háptica en botones y enlaces (`button:active:not(:disabled)`).
  - Regla estricta de accesibilidad para `@media (prefers-reduced-motion: reduce)`.
- **Plantilla de Navegación de App Router (`src/app/(main)/template.tsx`):**
  - Entrada suave (220ms slide-up + fade-in) en todas las transiciones internas entre módulos conservando el App Shell (`Sidebar` y `Header`).
- **Indicador de Navegación en Tiempo Real (`NavigationProgressBar.tsx`):**
  - Micro-barra de progreso visual fija (2.5px degradado corporativo cielo/azul) con respuesta instantánea (0 ms) en eventos de navegación interna.
- **Caché de Sesión en Memoria de Servidor (`src/lib/auth.ts`):**
  - Estructura `sessionMemoryCache` con TTL de 30 segundos indexada por usuario y empresa activa, reduciendo de 5-6 a 0 las consultas a Supabase en cada navegación entre módulos.
- **Suite Completa de Documentación Técnica para Desarrolladores (`/docs/`):**
  - `README.md` renovado como portal ejecutivo del proyecto.
  - `README_FOR_DEVELOPERS.md`: Guía de onboarding local.
  - `PROJECT_ARCHITECTURE.md`: Arquitectura, componentes y diagramas de flujo.
  - `PROJECT_INDEX.md`: Mapeo exhaustivo de las 44+ rutas y Server Actions.
  - `DATABASE_GUIDE.md`: Esquema de Supabase, tablas maestras y las 34 migraciones.
  - `AUTH_AND_PERMISSIONS.md`: Autenticación SSR y matriz de roles RBAC.
  - `MULTITENANT_SECURITY.md`: Aislamiento por `company_id`, anti-IDOR e impersonación.
  - `ONLINE_OFFLINE_GUIDE.md`: Service Worker, IndexedDB y cola de sincronización.
  - `DEPLOYMENT_GUIDE.md`: Empaquetado `standalone` y arranque de producción.
  - `DEVELOPMENT_CONVENTIONS.md`: Directrices de código, Server Actions y UI.
  - `KNOWN_ISSUES.md`: Limitaciones conocidas y advertencias operativas.
  - `CHANGELOG.md`: Registro histórico de versiones.

### Modificado
- **Apertura de la Aplicación:**
  - Se retiró el splash web artificial (`AppSplashOverlay`) con su retardo inducido de 1.6 segundos y su barra animada.
  - El arranque ahora transita inmediatamente desde el splash nativo de Android/WebAPK (`#06122e`) hacia el App Shell con esqueletos Suspense sin pantallas en blanco.
- **Precalentamiento de Rutas en Segundo Plano (`warmApplicationRoutes`):**
  - Desacoplado del arranque inmediato; ahora se ejecuta de forma cortés mediante `requestIdleCallback` o temporizador de reposo (2.5s).
  - Se eliminaron las peticiones duplicadas a `?_rsc=prewarm` y se incrementó la pausa entre lotes a 600 ms, liberando el ancho de banda para la navegación del usuario.
- **Tiempos de Compilación:**
  - El tiempo de build de producción se redujo de **7.0 minutos a 79 segundos** (~5.3x más rápido).

---

## [1.3.4] - 2026-10-25
- Saneamiento y validación de coincidencia de rutas offline en Service Worker (`public/sw.js`).
- Corrección de guardas de navegación offline en la barra lateral (`sidebar.tsx`).
- Soporte para precalentamiento universal de chunks JS y CSS en `prewarm-routes.ts`.

## [1.3.0] - 2026-09-30
- Implementación de evidencias fotográficas en módulo de planta (`plant_mineral_evidences`).
- Infraestructura de persistencia para el módulo de mecánica (`mechanics_maintenance`, `mechanics_fuel`, `mechanics_checklists`, `mechanics_tools`).
- RBAC Granular V1: Overrides de permisos por usuario y módulo (`public.user_permissions`).

## [1.2.0] - 2026-05-22
- Portal ligero de autoservicio para trabajadores en `/w/[companySlug]`.
- Refuerzo de aislamiento multiempresa en políticas RLS (`20260502_hardened_multi_company_rls.sql`).
- Implementación del rol SuperAdmin e infraestructura de impersonación multi-tenant.

## [1.0.0] - 2024-04-04
- Reconstrucción completa del núcleo de inventario, stock por almacén y trazabilidad kardex.
- Autenticación con Supabase Auth SSR y control de acceso base por roles.

