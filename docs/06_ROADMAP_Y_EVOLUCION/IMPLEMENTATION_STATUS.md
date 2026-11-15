# 📊 Matriz Maestra del Estado de Implementación — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Auditoría de Madurez de Funcionalidades  
> **Última Auditoría en Repositorio:** 15 de Noviembre de 2026

---

## 1. Convención de Clasificación de Estados

Para mantener la veracidad documental y evitar presentar planes futuros como funcionalidades operativas, todo componente en este documento se clasifica estrictamente en una de seis categorías:

- `[IMPLEMENTADO]`: Existe en el código, compila sin errores y ha sido comprobado en el sistema en producción.
- `[PARCIAL]`: Existe en el repositorio o en plataformas satélites, pero presenta limitaciones de integración o alcance.
- `[PENDIENTE]`: Aprobado formalmente en el roadmap de arquitectura, pero aún no codificado.
- `[PROPUESTO]`: Alternativa en evaluación técnica o de negocio, pendiente de aprobación por el propietario.
- `[DEPRECADO]`: Código o patrón obsoleto que ya no debe utilizarse y será retirado.
- `[DESCONOCIDO / NO VERIFICADO]`: No existe evidencia suficiente en el repositorio para validar su operatividad.

---

## 2. Matriz de Estado por Dominio y Funcionalidad

### 2.1. Núcleo Operativo (InthalyOps v1.4.1)
| Módulo / Funcionalidad | Estado | Evidencia en Repositorio | Observaciones y Límites |
| :--- | :---: | :--- | :--- |
| **Padrón de Personal (`/workers`)** | `[IMPLEMENTADO]` | `src/app/(main)/workers/` | Registro, edición, datos bancarios y cargos. |
| **Control de Asistencia (`/attendance`)** | `[IMPLEMENTADO]` | `src/app/(main)/attendance/` | Geolocalización lat/lng y marcas offline. |
| **Tareo Operativo Diario (`/tareo`)** | `[IMPLEMENTADO]` | `src/app/(main)/tareo/` | Horas hombre por cuadrilla, labor y turno. |
| **Órdenes de Mantenimiento (`/mecanica`)** | `[IMPLEMENTADO]` | `src/app/(main)/mecanica/mantenimiento/` | Preventivo, correctivo y repuestos. |
| **Control de Combustible Diésel** | `[IMPLEMENTADO]` | `src/app/(main)/mecanica/combustible/` | Despacho por máquina, horómetros y ratios. |
| **Checklists Pre-Uso de Maquinaria** | `[IMPLEMENTADO]` | `src/app/(main)/mecanica/checklists/` | Respuestas dinámicas en JSONB e inspección 360°. |
| **Inventario de Herramientas** | `[IMPLEMENTADO]` | `src/app/(main)/mecanica/herramientas/` | Custodia y calibración de herramientas. |
| **Kardex y Stock Multialmacén** | `[IMPLEMENTADO]` | `src/app/(main)/inventory/` | Movimientos de entrada, salida y ajustes. |
| **Requerimientos Internos de Compra** | `[IMPLEMENTADO]` | `src/app/(main)/requerimientos/` | Solicitudes de campamento a oficina central. |
| **Seguridad y Charlas SOMA (`/soma`)** | `[IMPLEMENTADO]` | `src/app/(main)/soma/` | Charlas 5 min y listas de asistencia. |
| **Control de Dotación de EPPs (`/ppe`)** | `[IMPLEMENTADO]` | `src/app/(main)/ppe/` | Entregas y vencimientos por trabajador. |
| **Registro de Incidencias Ocupacionales** | `[IMPLEMENTADO]` | `src/app/(main)/incidencias/` | Reporte de novedades y accidentes. |
| **Recepción de Mineral en Planta** | `[IMPLEMENTADO]` | `src/app/(main)/operaciones/` | Balanza, pesajes, tara y leyes estimadas. |
| **Evidencias Fotográficas de Planta** | `[IMPLEMENTADO]` | `src/app/(main)/operaciones/evidencias/` | Almacenamiento de fotos de tolva y tickets. |
| **Libro de Caja Chica (`/caja-chica`)** | `[IMPLEMENTADO]` | `src/app/(main)/caja-chica/` | Egresos, comprobantes y rendición contable. |
| **Portal Móvil de Trabajadores** | `[IMPLEMENTADO]` | `src/app/w/[companySlug]/` | Consulta con DNI de boletas, asistencia y EPPs. |
| **Panel de Super Administrador** | `[IMPLEMENTADO]` | `src/app/(main)/super-admin/` | Gestión de empresas e impersonación segura. |
| **Módulo de Diagnóstico (`/diag`)** | `[IMPLEMENTADO]` | `src/app/(main)/diag/` | Pruebas de conectividad, batería y SW. |

### 2.2. Arquitectura de Datos y Motor Offline
| Componente | Estado | Evidencia en Repositorio | Observaciones |
| :--- | :---: | :--- | :--- |
| **Base de Datos PostgreSQL en Supabase** | `[IMPLEMENTADO]` | 34 migraciones en `supabase/migrations/` | Esquema relacional auditado y normalizado. |
| **Row Level Security (RLS)** | `[IMPLEMENTADO]` | Migración `20260502_hardened_multi_company_rls.sql` | Aislamiento multi-tenant inviolable. |
| **RBAC Granular V1 (Overrides)** | `[IMPLEMENTADO]` | Migración `20260925_rbac_granular_v1_core.sql` | Tabla `user_permissions`. |
| **Service Worker Offline Cache** | `[IMPLEMENTADO]` | `public/sw.js`, `@ducanh2912/next-pwa` | Intercepción de estáticos y navegación offline. |
| **Cola de Mutaciones en IndexedDB** | `[IMPLEMENTADO]` | `src/lib/offline/`, `idb` | Almacenamiento local de tareo y checklists. |
| **Recuperación Dinámica de Chunks** | `[IMPLEMENTADO]` | `src/app/(main)/template.tsx` | Mitigación automática de `ChunkLoadError`. |
| **Tokens de Animación CSS Nativos** | `[IMPLEMENTADO]` | `src/app/globals.css` | Motion UI optimizado para 60 FPS en Android. |

### 2.3. Academia Digital (Inthaly Academy)
| Componente | Estado | Evidencia | Observaciones |
| :--- | :---: | :--- | :--- |
| **Plataforma LMS Standalone** | `[IMPLEMENTADO]` | `D:\INTHALY\DOCUMENTACION.md` | Operativa en `app.inthaly.com` (Laravel 12). |
| **Pasarela de Cobro MercadoPago** | `[IMPLEMENTADO]` | Laravel LMS codebase | Cobro de cursos individuales B2C. |
| **Certificados PDF con Código QR** | `[IMPLEMENTADO]` | Laravel LMS codebase | Generación de diplomas de aprobación. |
| **Single Sign-On (SSO) con InthalyOps** | `[PENDIENTE]` | Planificado Fase 2 | Federación de identidad por JWT compartido. |
| **Webhooks de Acreditación Automática** | `[PENDIENTE]` | Planificado Fase 2 | Envío de certificados a módulo SOMA. |

### 2.4. Integraciones y Ecosistema Futuro
| Módulo / Integración | Estado | Evidencia | Observaciones |
| :--- | :---: | :--- | :--- |
| **Facturación Electrónica SUNAT** | `[PARCIAL]` | `D:\3. API FACTURACION SUNAT...` | Colección Postman auditada; pendiente enlace directo. |
| **Guía de Remisión Electrónica (GRE)** | `[PENDIENTE]` | Planificado Fase 3 | UBL 2.1 GRE Transportista/Remitente. |
| **Telemetría GPS de Maquinaria Pesada** | `[PENDIENTE]` | Planificado Fase 3 | Protocolos Traccar / Wialon. |
| **Comunidad Inthaly (Red Técnica)** | `[PENDIENTE]` | Planificado Fase 3 | Foros técnicos y feed sectorial. |
| **Inthaly Transport (Match de Fletes)** | `[PENDIENTE]` | Planificado Fase 3 | Eliminación de falso flete y alquiler de activos. |
| **Identidad Universal Soberana** | `[PENDIENTE]` | Planificado Fase 4 | Desacoplamiento persona vs empresa. |
| **Inthaly Jobs (Empleabilidad Verificada)** | `[PENDIENTE]` | Planificado Fase 4 | CV respaldado por horas reales de tareo. |
| **Inthaly Marketplace B2B** | `[PENDIENTE]` | Planificado Fase 5 | Catálogo homologado y RFQ de compras. |
| **Portal de Inversionistas y Capital** | `[PROPUESTO]` | Planificado Fase 6 | Evaluación de crédito basada en historial. |
