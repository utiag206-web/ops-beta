# 🗺️ Índice Exhaustivo del Proyecto — InthalyOps

Este documento lista la totalidad de rutas, módulos, subcomponentes clave y Server Actions que integran **InthalyOps**.

---

## 1. Módulos y Rutas de la Aplicación

### A. Centro de Control & Administración
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Panel principal con estadísticas ejecutivas por rol | `src/app/(main)/dashboard/page.tsx`<br>`src/components/dashboard/dashboard-shell.tsx` | `src/app/(main)/dashboard/actions.ts` (`getDashboardStats`) |
| `/profile` | Perfil del usuario autenticado | `src/app/(main)/profile/page.tsx` | `src/app/(main)/profile/actions.ts` |
| `/company` | Datos, RUC, logo y configuración de la empresa | `src/app/(main)/company/page.tsx` | `src/app/(main)/company/actions.ts` |
| `/users` | Gestión de usuarios internos y asignación de roles | `src/app/(main)/users/page.tsx` | `src/app/(main)/users/actions.ts` |

### B. Personal, Asistencia y Tareo
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/workers` | Directorio maestro de trabajadores | `src/app/(main)/workers/page.tsx`<br>`src/components/workers/workers-list.tsx` | `src/app/(main)/workers/actions.ts` (`getWorkers`, `saveWorker`) |
| `/workers/[id]` | Ficha completa del trabajador (documentos, historial) | `src/app/(main)/workers/[id]/page.tsx` | `src/app/(main)/workers/actions.ts` |
| `/workers/import` | Importador masivo de trabajadores vía Excel | `src/app/(main)/workers/import/page.tsx` | `src/app/(main)/workers/import/actions.ts` |
| `/attendance` | Control de asistencia y marcas de entrada/salida | `src/app/(main)/attendance/page.tsx` | `src/app/(main)/attendance/actions.ts` |
| `/tareo` | Tareo operativo diario por frente/área/actividad | `src/app/(main)/tareo/page.tsx` | `src/app/(main)/tareo/actions.ts` |
| `/documents` | Repositorio documental de trabajadores (DNI, contratos) | `src/app/(main)/documents/page.tsx` | `src/app/(main)/documents/actions.ts` |
| `/bonuses` | Bonificaciones y conceptos salariales extraordinarios | `src/app/(main)/bonuses/page.tsx` | `src/app/(main)/bonuses/actions.ts` |
| `/transport` | Pagos y rendiciones de transporte de personal | `src/app/(main)/transport/page.tsx` | `src/app/(main)/transport/actions.ts` |
| `/movements` | Logística y movimientos de personal entre sedes | `src/app/(main)/movements/page.tsx` | `src/app/(main)/movements/actions.ts` |

### C. Operaciones por Industria
| Ruta | Industria / Capacidad | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/operaciones/campo` | Agrícola / Lotes y Cultivos | `src/app/(main)/operaciones/campo/page.tsx`<br>`campo-client.tsx` | `src/app/(main)/operaciones/campo/actions.ts` |
| `/operaciones/planta` | Minería / Planta y Mineral | `src/app/(main)/operaciones/planta/page.tsx` | `src/app/(main)/operaciones/planta/actions.ts` |
| `/operaciones/produccion` | Minería / Control de Producción | `src/app/(main)/operaciones/produccion/page.tsx` | `src/app/(main)/operaciones/produccion/actions.ts` |
| `/operaciones/maderas` | Forestal / Control de Maderas | `src/app/(main)/operaciones/maderas/page.tsx` | `src/app/(main)/operaciones/maderas/actions.ts` |
| `/assets` | Transversal / Control de Activos y Equipos | `src/app/(main)/assets/page.tsx` | `src/app/(main)/assets/actions.ts` |
| `/requerimientos` | Transversal / Requerimientos de Compra | `src/app/(main)/requerimientos/page.tsx` | `src/app/(main)/requerimientos/actions.ts` |
| `/caja-chica` | Finanzas / Control de Caja Chica Operativa | `src/app/(main)/caja-chica/page.tsx` | `src/app/(main)/caja-chica/actions.ts` |
| `/incidencias` | Transversal / Bitácora de Incidencias | `src/app/(main)/incidencias/page.tsx` | `src/app/(main)/incidencias/actions.ts` |
| `/camp` | Logística / Gestión de Campamentos y Habitaciones | `src/app/(main)/camp/page.tsx` | `src/app/(main)/camp/actions.ts` |
| `/ppe` | Seguridad / Entregas de EPP a Trabajadores | `src/app/(main)/ppe/page.tsx` | `src/app/(main)/ppe/actions.ts` |

### D. Área de Mecánica y Mantenimiento
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/mecanica` | Resumen y panel del área de mecánica | `src/app/(main)/mecanica/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/mantenimiento-vehiculos` | Órdenes de trabajo preventivo y correctivo | `src/app/(main)/mecanica/mantenimiento-vehiculos/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/checklists` | Checklists pre-uso de maquinaria | `src/app/(main)/mecanica/checklists/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/equipos-mina` | Maquinaria pesada y equipos de línea amarilla | `src/app/(main)/mecanica/equipos-mina/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/herramientas` | Inventario, calibración y custodia de herramientas | `src/app/(main)/mecanica/herramientas/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/generador-combustible` | Abastecimiento y horómetro de generadores | `src/app/(main)/mecanica/generador-combustible/page.tsx` | `src/app/(main)/mecanica/actions.ts` |
| `/mecanica/compresora-combustible` | Abastecimiento y horómetro de compresoras | `src/app/(main)/mecanica/compresora-combustible/page.tsx` | `src/app/(main)/mecanica/actions.ts` |

### E. Centro Logístico e Inventario
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/inventory/products` | Catálogo maestro de productos y repuestos | `src/app/(main)/inventory/products/page.tsx` | `src/app/(main)/inventory/products/actions.ts` |
| `/inventory/stock` | Existencias actuales por almacén | `src/app/(main)/inventory/stock/page.tsx` | `src/app/(main)/inventory/stock/actions.ts` |
| `/inventory/kardex` | Trazabilidad de entradas, salidas y transferencias | `src/app/(main)/inventory/kardex/page.tsx` | `src/app/(main)/inventory/kardex/actions.ts` |
| `/inventory/history` | Histórico general de movimientos de inventario | `src/app/(main)/inventory/history/page.tsx` | `src/app/(main)/inventory/history/actions.ts` |
| `/inventory/reports` | Reportes de rotación, stock mínimo y valorización | `src/app/(main)/inventory/reports/page.tsx` | `src/app/(main)/inventory/reports/actions.ts` |
| `/configuracion/warehouses` | Administración de sedes y almacenes | `src/app/(main)/configuracion/warehouses/page.tsx` | `src/app/(main)/configuracion/warehouses/actions.ts` |

### F. Seguridad, Salud Ocupacional y Medio Ambiente (SOMA)
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/soma/hsec` | Matriz y panel general de seguridad HSEC | `src/app/(main)/soma/hsec/page.tsx` | `src/app/(main)/soma/actions.ts` |
| `/soma/capacitaciones` | Registro de capacitaciones y vencimientos | `src/app/(main)/soma/capacitaciones/page.tsx` | `src/app/(main)/soma/actions.ts` |
| `/soma/charlas` | Registro de charlas diarias de 5 minutos | `src/app/(main)/soma/charlas/page.tsx` | `src/app/(main)/soma/actions.ts` |

### G. Centro Corporativo (Super Admin)
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/super-admin` | Panel corporativo multiempresa y monitoreo global | `src/app/(main)/super-admin/page.tsx` | `src/app/(main)/super-admin/actions.ts` |
| `/super-admin/companies` | Alta, aprobación y suspensión de empresas | `src/app/(main)/super-admin/companies/page.tsx` | `src/app/(main)/super-admin/actions.ts` |
| `/super-admin/users` | Visión global de usuarios en todas las empresas | `src/app/(main)/super-admin/users/page.tsx` | `src/app/(main)/super-admin/actions.ts` |
| `/super-admin/settings/*` | Ajustes globales, capacidades, seguridad y auditoría | `src/app/(main)/super-admin/settings/...` | `settings/general/actions.ts`, etc. |

### H. Portal para Trabajadores (Acceso Liviano)
| Ruta | Descripción | Archivos Principales | Server Actions |
| :--- | :--- | :--- | :--- |
| `/w/[companySlug]` | Portal de consulta de boletas, asistencia y EPPs | `src/app/w/[companySlug]/page.tsx`<br>`WorkerPortalClient.tsx` | `src/app/actions/worker-portal.ts` |

