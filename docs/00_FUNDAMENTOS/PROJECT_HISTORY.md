# ⏳ Historia y Evolución del Proyecto (Project History) — INTHALY

> **Estado del Documento:** `VERIFICADO HISTÓRICAMENTE`  
> **Fuentes de Evidencia:** Git Log, 34 Migraciones PostgreSQL en `supabase/migrations/`, `package.json` y auditorías previas.

---

## 1. Origen y Necesidad Fundacional (2024)

El proyecto comenzó en **abril de 2024** bajo el nombre técnico provisional `inthaly-workers` (con el primer esquema documentado en `20240404_inventory_total_rebuild.sql`). 

La necesidad surgió de la experiencia directa en operaciones de pequeña y mediana minería en el Perú (zonas de Nazca, Chala, Pataz y La Rinconada), donde los fundadores identificaron que los sistemas ERP tradicionales (SAP, Oracle, ERPs locales de escritorio) eran completamente inviables para las cuadrillas de campo por tres motivos fundamentales:
1. Requerían conectividad de alta velocidad constante que no existe en bocaminas o plantas remotas.
2. Poseían interfaces de escritorio sobrecargadas, imposibles de operar ágilmente en teléfonos móviles de campo.
3. No contemplaban las particularidades operativas del sector: turnos mineros 14x7, leyes de cabeza/relave, recepción de mineral por balanza y checklists pre-uso de compresoras y generadores diésel.

---

## 2. Línea de Tiempo y Etapas de Maduración Técnica

### Etapa 1: Gestión de Personal, Asistencia e Inventarios (Abril - Mayo 2026)
* **Migraciones clave:** `20260410_rbac_system.sql` a `20260514_fix_incidencias_fk.sql`.
* **Hitos:**
  - Implementación del modelo inicial de trabajadores (`workers`), contratos, asistencias y tareo manual.
  - Creación del subsistema de caja chica (`petty_cash_transactions`) y bonificaciones a destajo.
  - Primer módulo de seguridad industrial (SOMA / HSEC): registro de charlas de 5 minutos, capacitaciones y reporte de incidentes.
  - Implementación del rol `super_admin` (`20260504_super_admin_role.sql`) para administración global del sistema.

### Etapa 2: Mapeo de Operaciones y Módulos de Campo (Mayo - Junio 2026)
* **Migraciones clave:** `20260520_operations_tables.sql` a `20260615_petty_cash_transfer_rpc.sql`.
* **Hitos:**
  - Creación de la arquitectura de mapeo operativo (`operations_mapping`) para permitir que la plataforma soporte distintas actividades: labores mineras subterráneas, canteras a cielo abierto y aserraderos de madera.
  - Lanzamiento del **Portal del Trabajador** (`20260522_workers_portal_base.sql`), permitiendo que el trabajador marque su asistencia mediante código QR o reconozca sus recibos y bonos desde su propio smartphone.
  - Incorporación del módulo de Activos Fijos (`assets`) y transferencias entre cajas chicas mediante Procedimiento Almacenado RPC en PostgreSQL (`petty_cash_transfer_rpc`).

### Etapa 3: Resiliencia en Tiempo Real y Trazabilidad Satelital (Agosto 2026)
* **Migraciones clave:** `20260809_add_gps_columns.sql`, `20260809143301_add_realtime_publications.sql`, `20260825204150_create_global_settings.sql` y `20260830_create_export_audit_logs.sql`.
* **Hitos:**
  - Integración de georreferenciación GPS en marcaciones de asistencia y logs de transporte de personal.
  - Publicación de canales Supabase Realtime para actualización automática de cuadrillas y pizarras de tareo.
  - Módulo de auditoría y exportación de datos con tracking estricto de quién descarga información corporativa (`export_audit_logs`).

### Etapa 4: Especialización Industrial y Consolidación Offline-First (Septiembre - Octubre 2026)
* **Migraciones clave:** `20260920_company_operating_profiles.sql`, `20260925_rbac_granular_v1_core.sql`, `20260926_mecanica_persistence_core.sql` y `20260927_planta_mineral_core.sql`.
* **Hitos:**
  - **Perfiles Operativos por Empresa:** Capacidad de activar/desactivar módulos dinámicamente según la industria de la empresa (minera, agrícola, maderera, logística).
  - **Módulo de Mecánica Pesada:** Checklists diarios pre-uso, bitácoras de mantenimiento preventivo y correctivo, consumo de combustible en galones y horómetros para generadores y compresoras.
  - **Módulo de Planta y Recepción de Mineral:** Control de lotes de mineral, pesaje en balanza, leyes estimadas de Au/Ag/Cu y subida de evidencias fotográficas (`planta_evidences`).
  - **Arquitectura Offline-First v1:** Implementación de Service Worker (`public/sw.js`) con estrategia híbrida Cache-First para estáticos y Network-First con fallback a IndexedDB (`idb`) para operaciones locales.

### Etapa 5: Evolución de Experiencia, Rendimiento y Movimiento (Noviembre 2026)
* **Versiones:** `v1.3.5` → `v1.4.0` → `v1.4.1`.
* **Hitos:**
  - **Apertura Limpia:** Retiro del splash web artificial redundante, sincronizando la pantalla con el WebAPK nativo de Android (`#06122e`).
  - **Lenguaje de Movimiento Empresarial:** Incorporación de animaciones elásticas aceleradas por GPU inspiradas en Framer Motion Dashboard V2 (subida elástica de 36px en 580ms, cascada rítmica con retardo de 140ms por tarjeta y hover float de -6px).
  - **Optimización de Caché en Servidor:** Implementación de `sessionMemoryCache` (30s) y `dashboardStatsCache` (20s) en Server Actions de Next.js, reduciendo los tiempos de respuesta online a menos de 15ms.
  - **Hotfix de Resiliencia Offline (v1.4.1):** Precacheo profundo de chunks JS de `/offline`, eliminación de pantallas blancas sin estilos mediante fallback de emergencia corporativo autocontenido y reordenamiento prioritario de rutas operativas diarias.

---

## 3. Matriz de Versiones Históricas Conocidas

| Versión Git | Fecha Verificada | Enfoque Principal | Estado |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | Mayo 2026 | Primer baseline estable de personal y asistencia. | Histórico |
| `v1.1.0-SaaS` | Junio 2026 | Arquitectura multiempresa y portal QR. | Histórico |
| `v1.3.0` | Septiembre 2026 | Módulos de Mecánica y Planta de Mineral. | Histórico |
| `v1.3.4` | Octubre 2026 | Saneamiento de Cache-API y guardas offline en Sidebar. | Reemplazado |
| `v1.4.0` | Noviembre 2026 | Evolución de apertura, movimiento TikTok V2, docs y caché de stats. | Estable |
| **`v1.4.1`** | **14 Noviembre 2026** | **Hotfix de resiliencia offline, deep precache /offline y prioridad de rutas.** | **ACTUAL EN PRODUCCIÓN** |
