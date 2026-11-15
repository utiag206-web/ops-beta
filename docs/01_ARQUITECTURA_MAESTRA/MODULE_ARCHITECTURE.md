# 📦 Arquitectura de Módulos (Module Architecture) — INTHALY

> **Estado del Documento:** `VIGENTE / AUDITADO`  
> **Ámbito:** InthalyOps y Dominios del Ecosistema

---

## 1. Principio de Modularidad y Dominios

InthalyOps está diseñado como un **Monolito Modular** donde cada módulo representa un subdominio de negocio bien delimitado. Cada dominio posee:
1. **Rutas Dedicadas en App Router:** Ubicadas dentro de `src/app/(main)/[dominio]/`.
2. **Acciones de Servidor (`actions.ts`):** Lógica de negocio encapsulada y tipada que interactúa con la base de datos bajo aislamiento multiempresa.
3. **Componentes Visuales de Dominio:** Ubicados en `src/components/[dominio]/`.
4. **Mapeo a Capability Gateway:** Capacidad de activarse o desactivarse según el perfil operativo de la empresa (`company_operating_profiles`).

---

## 2. Mapa de Dominios Modulares de InthalyOps

```
src/app/(main)/
├── dashboard/               # Dominio: Centro de Control Ejecutivo y Métricas
├── workers/                 # Dominio: Capital Humano, Legajos y Fichas
├── attendance/              # Dominio: Marcaciones Diarias y Control Biométrico/GPS
├── tareo/                   # Dominio: Cálculo de Jornadas, Horas Extras y Faltas
├── operaciones/             # Dominio: Producción Minera, Campo y Maderas
│   ├── produccion/          # Subdominio: Avance de Labores y Extracción Subterránea
│   ├── planta/              # Subdominio: Recepción de Mineral, Balanza y Muestreo
│   ├── maderas/             # Subdominio: Habilitación de Madera Rolliza y Cuadros
│   └── campo/               # Subdominio: Parcelas Agrícolas y Lotes
├── mecanica/                # Dominio: Mantenimiento Pesado y Maquinarias
│   ├── checklists/          # Subdominio: Inspecciones Pre-Uso Digitales
│   ├── equipos-mina/        # Subdominio: Flota de Equipos y Horómetros
│   ├── generador-*/         # Subdominio: Grupos Electrógenos y Diésel
│   ├── compresora-*/        # Subdominio: Compresoras Neumáticas
│   └── herramientas/        # Subdominio: Custodia de Herramientas de Taller
├── inventory/               # Dominio: Logística, Almacenes y Kardex Físico
│   ├── products/            # Subdominio: Catálogo Maestro de Bienes
│   ├── stock/               # Subdominio: Saldos por Almacén / Bodega
│   └── kardex/              # Subdominio: Movimientos de Entrada, Salida y Traslado
├── caja-chica/              # Dominio: Tesorería de Campo, Rendiciones y Fondos
├── requerimientos/          # Dominio: Solicitudes de Compra y Aprobaciones
├── soma/                    # Dominio: Seguridad, Salud Ocupacional y Medio Ambiente
│   ├── charlas/             # Subdominio: Inducciones de 5 Minutos
│   ├── capacitaciones/      # Subdominio: Registro de Horas Hombre Capacitadas
│   └── hsec/                # Subdominio: Reporte e Investigación de Incidentes
└── super-admin/             # Dominio: Gobernanza Global y Configuración SaaS
```

---

## 3. Estado de Implementación por Módulo

| Módulo / Dominio | Estado | Capacidad Offline | Tablas de Persistencia Clave |
| :--- | :---: | :---: | :--- |
| **Dashboard y KPIs** | `[IMPLEMENTADO]` | Solo lectura en caché | `users`, `workers`, `petty_cash_transactions`, etc. |
| **Personal (`/workers`)** | `[IMPLEMENTADO]` | Solo lectura | `workers`, `worker_movements`, `worker_documents` |
| **Asistencia (`/attendance`)** | `[IMPLEMENTADO]` | **Completa** | `attendance`, `attendance_logs` |
| **Tareo (`/tareo`)** | `[IMPLEMENTADO]` | **Completa** | `attendance`, `company_attendance_settings` |
| **Planta de Mineral (`/operaciones/planta`)** | `[IMPLEMENTADO]` | **Completa** | `planta_receptions`, `planta_lots`, `planta_evidences` |
| **Mecánica Checklists (`/mecanica/checklists`)** | `[IMPLEMENTADO]` | **Completa** | `mecanica_checklists`, `mecanica_machines` |
| **Mantenimiento Pesado (`/mecanica/*`)** | `[IMPLEMENTADO]` | **Completa** | `mecanica_maintenance_logs`, `mecanica_fuel_logs` |
| **Inventario y Stock (`/inventory/*`)** | `[IMPLEMENTADO]` | Lectura y cola | `products`, `inventory_stock`, `inventory_movements` |
| **Caja Chica (`/caja-chica`)** | `[IMPLEMENTADO]` | Parcial | `petty_cash_transactions`, `petty_cash_transfers` |
| **Requerimientos (`/requerimientos`)** | `[IMPLEMENTADO]` | Lectura y cola | `requirements` |
| **Seguridad SOMA (`/soma/*`)** | `[IMPLEMENTADO]` | **Completa** | `soma_talks`, `soma_trainings`, `soma_hsec_incidents` |
| **Comunidad Inthaly** | `[PLANIFICADO]` | No aplica | *Por definir en Fase 3* |
| **Transporte de Carga** | `[PLANIFICADO]` | No aplica | *Por definir en Fase 4* |
| **Bolsa de Empleo** | `[PLANIFICADO]` | No aplica | *Por definir en Fase 5* |
| **Marketplace Industrial** | `[PLANIFICADO]` | No aplica | *Por definir en Fase 6* |

---

## 4. Comunicación entre Dominios

1. **Sin Acoplamiento Directo en Cliente:** Un componente del módulo de Mecánica no importa componentes internos del módulo de Tareo. La integración se produce a nivel de datos (ej. un trabajador registrado en el módulo de personal es seleccionado en un checklist de mecánico).
2. **Procedimientos Atómicos RPC:** Operaciones críticas que involucran múltiples dominios (como la transferencia de fondos entre cajas chicas) se ejecutan mediante funciones PostgreSQL ACID (`petty_cash_transfer_rpc`), garantizando que no existan estados intermedios inconsistentes.
