# 📜 Registro de Cambios (Changelog) — InthalyOps

Todas las modificaciones notables realizadas en este proyecto están documentadas en este archivo. El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.4.0] - 2026-11-14 — Versión Estable Congelada (Evolución Integral)

### Resumen de Versión Estable
Consolidación, calibración y congelación de las 4 fases de evolución de InthalyOps: simplificación y aceleración de apertura móvil, sistema de movimiento rítmico inspirado en Framer Motion Dashboard UI V2, optimización del rendimiento en línea y suite completa de documentación técnica.

### Fase 1: Apertura Limpia y Rápida
- **Retiro definitivo del splash web redundante:** Se neutralizó `src/app/loading.tsx` para eliminar la sobrecubierta de pantalla completa con barra de progreso que interfería con el splash nativo de Android WebAPK.
- **Transición inmediata a la interfaz:** La aplicación transita sin parpadeos ni pantallas vacías desde el splash corporativo de Android (`#06122e`) hacia la interfaz operativa.
- **Esqueletos limpios en Dashboard:** Eliminado el banner invasivo de sincronización en `src/app/(main)/dashboard/loading.tsx`, desplegando directamente el esqueleto visual de tarjetas mientras cargan los datos.

### Fase 2: Lenguaje de Movimiento Empresarial (Referencia: TikTok Dashboard V2 @paulcodes4)
- **Cadencia de cascada rítmica (Stagger de 140ms):**
  - Tarjeta 1: `80ms` delay
  - Tarjeta 2: `220ms` delay (+140ms)
  - Tarjeta 3: `360ms` delay (+140ms)
  - Tarjeta 4: `500ms` delay (+140ms)
  - Tarjeta 5: `640ms` delay (+140ms)
  - Tarjetas 6+: `780ms` delay (+140ms)
- **Física de resorte (Spring Physics):** Ascenso suave de `36px` con escala elástica `0.94 -> 1.0` durante `580ms` con curva `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Efecto Hover Float en tarjetas:** Elevación vertical suave de `-6px` con sombra tridimensional multicapa al interactuar con las tarjetas de métricas.
- **Selectores universales (.grid > *:nth-child(n)):** Garantiza la sincronización rítmica en todos los módulos (Dashboard, Tareo, Mina, Producción, Finanzas).
- **Cobertura total:** Activo en las 60 rutas operativas (`src/app/(main)/*`) y en los accesos de autenticación (`/login`, `/register`).
- **Bypass de rendimiento:** Exclusión estricta de tablas de datos masivas para preservar 60 fps constantes sin caída de frames.

### Fase 3: Optimización de Rendimiento Online
- **Caché en memoria de estadísticas (`dashboardStatsCache`):** Almacenamiento en memoria en servidor con TTL de 20s para `getDashboardStats()`, eliminando 16 consultas SQL concurrentes en visitas frecuentes y reduciendo el tiempo de respuesta a < 15ms.
- **Caché de sesión SSR (`sessionMemoryCache`):** Almacenamiento en memoria de 30s en servidor que previene round-trips repetitivos a Supabase en cada navegación de la barra lateral.
- **Micro-indicador de progreso instantáneo (0ms):** Barra superior de 2.5px que otorga feedback visual al usuario al instante del clic.
- **Atenuación háptica de salida:** Desvanecimiento suave al 55% de opacidad y repliegue de 4px al hacer clic en un enlace de navegación.
- **Preservación estricta:** Cero modificaciones a las políticas RLS de Supabase, integridad multiempresa intacta y cola de sincronización offline 100% operativa.

### Fase 4: Suite de Documentación Técnica
- 11 manuales técnicos exhaustivos en el directorio `/docs/` y portal `README.md` estructurados para incorporación inmediata de desarrolladores externos.
- Service Worker actualizado a versión de caché `v1.4.0` para purga y renovación automática en clientes móviles.

---

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

