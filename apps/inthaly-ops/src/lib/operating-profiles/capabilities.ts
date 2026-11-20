/**
 * INTHALY OPS — Operating Profiles Architecture
 * Central Capabilities Registry
 */

import { CapabilityDefinition, CapabilityKey, CapabilityStatus } from './types'

export const CAPABILITIES_CATALOG: Record<CapabilityKey, CapabilityDefinition> = {
  // ==========================================================================
  // CORE UNIVERSAL (Compartido por toda empresa, base inmutable)
  // ==========================================================================
  workers: {
    key: 'workers',
    name: 'Personal y Colaboradores',
    description: 'Gestión integral del personal, fichas de colaboradores, legajo digital y contratos.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/workers'
  },
  attendance: {
    key: 'attendance',
    name: 'Control de Asistencia',
    description: 'Registro de marcaciones, GPS, control de retardos, permisos y descansos médicos.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/attendance'
  },
  tareo: {
    key: 'tareo',
    name: 'Tareo Operativo',
    description: 'Tareo diario, turnos de trabajo, asignación a áreas y cálculo de horas hombre.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/tareo'
  },
  inventory: {
    key: 'inventory',
    name: 'Almacenes y Stock',
    description: 'Catálogo de productos, stock en tiempo real, trazabilidad Kardex e historial de movimientos.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/inventory/stock'
  },
  requerimientos: {
    key: 'requerimientos',
    name: 'Requerimientos de Almacén',
    description: 'Solicitudes de materiales, aprobación por jefatura y despacho de insumos.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/requerimientos'
  },
  'caja-chica': {
    key: 'caja-chica',
    name: 'Caja Chica y Finanzas Operativas',
    description: 'Control de ingresos, gastos menores en campo, rendiciones y balance financiero.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/caja-chica'
  },
  soma: {
    key: 'soma',
    name: 'Seguridad y Salud (HSEC/SOMA)',
    description: 'Charlas diarias, capacitaciones obligatorias, entrega de EPPs e inspecciones preventivas.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/soma/capacitaciones'
  },
  documents: {
    key: 'documents',
    name: 'Gestión Documental',
    description: 'Repositorio de documentos laborales, certificados médicos, antecedentes y constancias.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/documents'
  },
  bonuses: {
    key: 'bonuses',
    name: 'Bonificaciones y Pagos',
    description: 'Asignación de incentivos, bonos de producción y control de pagos extraordinarios.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/bonuses'
  },
  assets: {
    key: 'assets',
    name: 'Control de Activos',
    description: 'Registro patrimonial de activos fijos, números de serie y asignación a custodios.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/assets'
  },
  reports: {
    key: 'reports',
    name: 'Reportes y Analítica',
    description: 'Centro de exportaciones Excel/PDF, auditoría de descargas e indicadores de gestión.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/reports/export-center'
  },
  users: {
    key: 'users',
    name: 'Usuarios y Accesos',
    description: 'Administración de cuentas, asignación de roles y permisos del tenant.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/users'
  },
  company: {
    key: 'company',
    name: 'Datos de Empresa y Parametrización',
    description: 'Configuración general, horarios laborales, políticas de contraseña y asistencia.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/company'
  },
  profile: {
    key: 'profile',
    name: 'Mi Cuenta',
    description: 'Perfil del usuario activo, cambio de contraseña y preferencias personales.',
    category: 'CORE',
    isCore: true,
    defaultStatus: 'ACTIVE',
    route: '/profile'
  },

  // ==========================================================================
  // CAPACIDADES VERTICALES / ESPECIALIZADAS
  // ==========================================================================
  mecanica: {
    key: 'mecanica',
    name: 'Módulo de Mantenimiento y Mecánica',
    description: 'Gestión integral del taller, mantenimiento preventivo/correctivo de unidades y maquinaria.',
    category: 'LOGISTICA_MECANICA',
    isCore: false,
    defaultStatus: 'ACTIVE',
    route: '/mecanica'
  },
  mecanica_vehiculos: {
    key: 'mecanica_vehiculos',
    name: 'Mantenimiento de Vehículos y Flota',
    description: 'Órdenes de trabajo, cambios de aceite, repuestos mecánicos y kilometraje.',
    category: 'LOGISTICA_MECANICA',
    isCore: false,
    defaultStatus: 'ACTIVE',
    route: '/mecanica/mantenimiento-vehiculos'
  },
  combustible: {
    key: 'combustible',
    name: 'Control de Combustible',
    description: 'Registro de abastecimientos de diésel/gasolina, horómetros, kilometraje y rendimiento.',
    category: 'LOGISTICA_MECANICA',
    isCore: false,
    defaultStatus: 'ACTIVE',
    route: '/mecanica/generador-combustible'
  },
  checklists: {
    key: 'checklists',
    name: 'Checklists Pre-operacionales',
    description: 'Inspección diaria de unidades, maquinaria y equipos antes de iniciar operaciones.',
    category: 'LOGISTICA_MECANICA',
    isCore: false,
    defaultStatus: 'ACTIVE',
    route: '/mecanica/checklists'
  },
  herramientas: {
    key: 'herramientas',
    name: 'Control de Herramientas de Taller',
    description: 'Préstamo, custodia y devolución de herramientas especializadas.',
    category: 'LOGISTICA_MECANICA',
    isCore: false,
    defaultStatus: 'ACTIVE',
    route: '/mecanica/herramientas'
  },
  operaciones_mina: {
    key: 'operaciones_mina',
    name: 'Operaciones de Mina y Extracción',
    description: 'Frentes de avance, extracción de mineral en socavón y rendimientos operativos.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'DISABLED',
    route: '/operaciones/produccion'
  },
  planta_mineral: {
    key: 'planta_mineral',
    name: 'Control de Planta y Mineral',
    description: 'Recepción de mineral, molienda, tolvas y despacho de concentrado.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'DISABLED',
    route: '/operaciones/planta'
  },
  maderas: {
    key: 'maderas',
    name: 'Control de Maderas para Sostenimiento',
    description: 'Ingreso, cubicación y consumo de cuadros de madera en labores subterráneas.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'DISABLED',
    route: '/operaciones/maderas'
  },
  logistica_rutas: {
    key: 'logistica_rutas',
    name: 'Rutas, Servicios y Despachos',
    description: 'Programación de itinerarios, hojas de ruta, guía de remisión y control de viajes.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'BETA',
    route: '/movements'
  },
  campo_lotes: {
    key: 'campo_lotes',
    name: 'Control de Lotes y Cosecha Agrícola',
    description: 'Seguimiento de labores por cuartel/lote, rendimiento de kilos y avance de cosecha.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'PROTOTYPE',
    route: '/operaciones/campo'
  },
  produccion_agricola: {
    key: 'produccion_agricola',
    name: 'Producción y Cosecha Agrícola',
    description: 'Registro de rendimientos por hectárea, pesaje de cosecha, control de mermas y despacho de frutos.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'COMING_SOON',
    route: '/operaciones/produccion-agricola'
  },
  salud_ocupacional: {
    key: 'salud_ocupacional',
    name: 'Clínica y Salud Ocupacional',
    description: 'Exámenes médicos periódicos, atenciones en tópico, descansos médicos y vigilancia médica ocupacional.',
    category: 'SERVICIOS_PERSONAL',
    isCore: false,
    defaultStatus: 'COMING_SOON',
    route: '/servicios/salud-ocupacional'
  },
  bienestar_social: {
    key: 'bienestar_social',
    name: 'Bienestar Social y Servicios al Personal',
    description: 'Asistencia social, gestión de campamento y habitabilidad, subsidios, recreación y soporte al colaborador.',
    category: 'SERVICIOS_PERSONAL',
    isCore: false,
    defaultStatus: 'COMING_SOON',
    route: '/servicios/bienestar-social'
  },
  avance_obra: {
    key: 'avance_obra',
    name: 'Control de Frentes y Avance de Obra',
    description: 'Seguimiento de partidas de construcción, metrados ejecutados, hitos contractuales y curvas de avance de obra.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'COMING_SOON',
    route: '/operaciones/avance-obra'
  },
  telemetria_gps: {
    key: 'telemetria_gps',
    name: 'Telemetría y Rastreo de Flota GPS',
    description: 'Monitoreo en tiempo real de unidades de transporte, geocercas, velocidad, alertas y paradas no programadas.',
    category: 'OPERACIONES',
    isCore: false,
    defaultStatus: 'COMING_SOON',
    route: '/operaciones/telemetria'
  }
}

export const ALL_CAPABILITY_KEYS: readonly CapabilityKey[] = Object.keys(CAPABILITIES_CATALOG) as CapabilityKey[]

/**
 * Determina si una capacidad pertenece al Core Universal inmutable.
 */
export function isCoreCapability(key: CapabilityKey): boolean {
  return CAPABILITIES_CATALOG[key]?.isCore ?? false
}

/**
 * Retorna las capacidades obligatorias del Core Universal con estado ACTIVE.
 */
export function getDefaultCoreCapabilities(): Record<CapabilityKey, CapabilityStatus> {
  const defaults: Partial<Record<CapabilityKey, CapabilityStatus>> = {}
  for (const [k, def] of Object.entries(CAPABILITIES_CATALOG)) {
    const key = k as CapabilityKey
    if (def.isCore) {
      defaults[key] = 'ACTIVE'
    } else {
      defaults[key] = def.defaultStatus
    }
  }
  return defaults as Record<CapabilityKey, CapabilityStatus>
}
