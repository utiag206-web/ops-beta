# 🚀 GO_LIVE_CHECKLIST.md — INTHALY OPS
**Control Final Pre-Deploy & Auditoría de Integridad**
**Fecha:** 8 de Octubre, 2026
**Sistema:** INTHALY OPS (`https://sistemaops.inthaly.com`)
**Entorno Preparado:** `next-prod-boilerplate` (tracking: `utiag206-web/ops-beta.git` rama `main`)

---

## 1. ESTADO DEL REPOSITORIO Y RAMAS

### Repositorio Local de Desarrollo (`D:\Sistema de gestión de trabajadores`)
* **Rama Activa:** `fase-3-mejoras`
* **Estado de Git:** Archivos modificados por la corrección más historial previo preservado sin alteraciones accidentales.
* **Integridad:** No se han ejecutado commits ni pushes forzados.

### Paquete de Despliegue de Producción (`D:\Sistema de gestión de trabajadores\next-prod-boilerplate`)
* **Rama Activa:** `main`
* **Estado de Git:**
  ```text
   M public/sw.js
   M src/app/(main)/mecanica/equipos-mina/page.tsx
   M src/app/(main)/operaciones/planta/actions.ts
   M src/components/planta/mineral-reception-modal.tsx
   M src/components/providers/offline-provider.tsx
   M src/lib/offline-sync.ts
  ?? OFFLINE_FIRST_INCIDENT_REPORT.md
  ?? GO_LIVE_CHECKLIST.md
  ```
* **Paridad SHA-256 entre Desarrollo y Producción:** **100% IDÉNTICA**
  * `public/sw.js`: SHA-256 coincide (`d4a2643b63...`)
  * `src/app/(main)/mecanica/equipos-mina/page.tsx`: SHA-256 coincide (`6e5525da51...`)
  * `src/app/(main)/operaciones/planta/actions.ts`: SHA-256 coincide (`91278ab43a...`)
  * `src/components/planta/mineral-reception-modal.tsx`: SHA-256 coincide (`9da6029886...`)
  * `src/components/providers/offline-provider.tsx`: SHA-256 coincide (`1418a72021...`)
  * `src/lib/offline-sync.ts`: SHA-256 coincide (`d20760fec3...`)

---

## 2. RESULTADOS DE VALIDACIÓN TÉCNICA (COMPILACIÓN Y TIPOS)

Ambas suites fueron ejecutadas directamente sobre el paquete de despliegue (`next-prod-boilerplate`):

| Validación | Comando | Resultado | Código de Salida |
| :--- | :--- | :--- | :--- |
| **Comprobación Estricta de Tipos** | `npx tsc --noEmit` | **0 Errores de Tipos** | `0` (Éxito) |
| **Compilación de Producción** | `npm run build` | **31/31 Rutas Optimizadas** | `0` (Éxito) |

---

## 3. ESTADO DE SEGURIDAD Y CREDENCIALES (SERVICE ROLE KEY)

* **Informe Evaluado:** `VERIFICACION_EXPOSICION_SERVICE_ROLE_KEY.md`
* **Conclusión Forense:** **NO HAY EVIDENCIA DE EXPOSICIÓN REMOTA**.
  * La clave solo existió históricamente en el commit local `bf8e582` en la máquina del usuario.
  * La clave **NUNCA fue enviada a GitHub** (`utiag206-web/ops-beta.git`), confirmado mediante búsqueda de entropía y blobs en los 90 commits remotos.
  * Los archivos residuales (`audit.mjs`, `seed_ops.mjs`) están eliminados y protegidos activamente en `.gitignore`.
  * Ningún archivo del frontend ni rutas públicas consumen ni exponen la `SERVICE_ROLE_KEY`.

---

## 4. MATRIZ DE VALIDACIÓN FUNCIONAL OFFLINE-FIRST

| Módulo / Flujo | Estado | Evidencia Técnica |
| :--- | :--- | :--- |
| **Navegación Offline** | **VERIFICADO EN CÓDIGO & BUILD** | Corrección de Service Worker con coincidencia de RSC (`ignoreSearch: true`, `ignoreVary: true`), calentamiento progresivo de documentos HTML en `PAGES_CACHE` y eliminación del corte forzado a `/offline`. |
| **Control de Planta (Tonelaje)** | **VERIFICADO EN CÓDIGO & BUILD** | Inputs en `mineral-reception-modal` migrados a `string` con soporte para coma/punto decimal sin cursor jumping; salvaguarda en Server Action para cálculo de `net_weight` (`gross - tare`); persistencia de lotes completos en caché local. |
| **Sincronización ("4 Pendientes")** | **VERIFICADO EN CÓDIGO & BUILD** | Despachador en `OfflineProvider` desacoplado del closure obsoleto (`navigator.onLine` directo); sincronización automática al montar/`F5`, tras evento `online` (500ms) y sondeo activo (10s); botón manual interactivo de sync. |
| **Mecánica (Equipos de Mina)** | **VERIFICADO EN CÓDIGO & BUILD** | Eliminación completa de cadenas hardcodeadas (`Scooptram Wagner 1.5 yd`, `SCP-01`); campos vacíos por defecto con placeholders limpios. |
| **Aislamiento Multiempresa & RBAC** | **VERIFICADO Y PRESERVADO** | `company_id` estricto en IndexedDB (`InthalyDB`), Server Actions (`requireAction`), RLS y sesión offline protegida (`OfflineSessionProvider`). |

### Pruebas Pendientes (Post-Despliegue en Vivo)
* Verificación en vivo en `https://sistemaops.inthaly.com` tras actualización del Service Worker en navegadores reales de clientes (requiere despliegue autorizado).

---

## 5. RIESGOS QUE IMPIDEN DESPLEGAR
* **Ninguno a nivel de código ni base de datos.**
* No hay dependencias alteradas.
* No hay cambios de esquema Supabase.
* No hay migraciones DDL pendientes.

---

## 6. RESULTADO FINAL

# 🟢 GO CON OBSERVACIONES — LISTO PARA AUTORIZAR DESPLIEGUE

### Observaciones Documentadas (No Bloqueantes):
1. **Activación del nuevo Service Worker en clientes:** Al desplegar a producción, los usuarios que ya tengan la PWA abierta recibirán el nuevo Service Worker en segundo plano. La sincronización y navegación mejorada entrarán en vigor automáticamente tan pronto como la nueva versión tome el control de los clientes (o al cerrar y reabrir la app).
2. **Validación en vivo final:** Una vez que el usuario autorice el push a producción, se recomienda ejecutar una prueba final controlada en `https://sistemaops.inthaly.com` para certificar que el entorno de Vercel complete el ciclo.
