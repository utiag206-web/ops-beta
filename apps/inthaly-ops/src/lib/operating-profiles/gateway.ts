/**
 * INTHALY OPS — Operating Profiles Architecture
 * FASE 3: Capability Gateway & Adaptive Navigation Mapping
 * 
 * Capa central responsable de gobernar la disponibilidad y acceso a módulos:
 *  DECISIÓN CONCEPTUAL:
 *  ACCESS = COMPANY_CAPABILITY && USER_PERMISSION
 * 
 * Regla de Oro:
 *  - La capacidad habilita la funcionalidad para la empresa.
 *  - El RBAC determina qué puede hacer el usuario dentro de ella.
 *  - Una empresa existente en Legacy Mode nunca pierde módulos existentes.
 */

import {
  CapabilityKey,
  CapabilityStatus,
  IndustryCode
} from './types'
import {
  CAPABILITIES_CATALOG,
  isCoreCapability
} from './capabilities'
import {
  resolveCapabilities,
  resolveCapabilityStatus
} from './resolver'
import { hasPermission } from '@/lib/permissions'

// ============================================================================
// 1. MAPEO RUTA → CAPACIDAD (CANONICAL ROUTE TO CAPABILITY MAP)
// ============================================================================

/**
 * Mapeo centralizado de prefijos de ruta hacia su CapabilityKey correspondiente.
 * Permite que el Gateway determine qué capacidad protege una URL sin dispersar
 * strings arbitrarios por el código.
 */
export const ROUTE_CAPABILITY_MAP: Record<string, CapabilityKey> = {
  // Verticales Operativas y Minería
  '/operaciones/produccion': 'operaciones_mina',
  '/operaciones/planta': 'planta_mineral',
  '/operaciones/maderas': 'maderas',
  '/operaciones/campo': 'campo_lotes',
  '/operaciones/produccion-agricola': 'produccion_agricola',
  '/operaciones/avance-obra': 'avance_obra',
  '/operaciones/telemetria': 'telemetria_gps',
  // Servicios al Personal
  '/servicios/salud-ocupacional': 'salud_ocupacional',
  '/servicios/bienestar-social': 'bienestar_social',
  // Verticales Mecánicas y Logísticas
  '/mecanica/mantenimiento-vehiculos': 'mecanica_vehiculos',
  '/mecanica/generador-combustible': 'combustible',
  '/mecanica/compresora-combustible': 'combustible',
  '/mecanica/checklists': 'checklists',
  '/mecanica/herramientas': 'herramientas',
  '/mecanica': 'mecanica',
  '/movements': 'logistica_rutas',
  '/transport': 'logistica_rutas',
  // Core Universal Inmutable
  '/workers': 'workers',
  '/attendance': 'attendance',
  '/tareo': 'tareo',
  '/inventory': 'inventory',
  '/requerimientos': 'requerimientos',
  '/caja-chica': 'caja-chica',
  '/soma': 'soma',
  '/incidencias': 'soma',
  '/documents': 'documents',
  '/bonuses': 'bonuses',
  '/assets': 'assets',
  '/reports': 'reports',
  '/users': 'users',
  '/company': 'company',
  '/profile': 'profile'
}

/**
 * Obtiene la CapabilityKey asociada a una ruta o URL pathname.
 */
export function getCapabilityForRoute(pathname: string): CapabilityKey | null {
  if (!pathname) return null
  const cleanPath = pathname.split('?')[0].toLowerCase()

  // 1. Búsqueda exacta primero
  if (ROUTE_CAPABILITY_MAP[cleanPath]) {
    return ROUTE_CAPABILITY_MAP[cleanPath]
  }

  // 2. Búsqueda por prefijo más específico (de mayor longitud a menor)
  const sortedPrefixes = Object.keys(ROUTE_CAPABILITY_MAP).sort((a, b) => b.length - a.length)
  for (const prefix of sortedPrefixes) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return ROUTE_CAPABILITY_MAP[prefix]
    }
  }

  return null
}

// ============================================================================
// 2. MAPEO MÓDULO RBAC → CAPACIDAD
// ============================================================================

export const MODULE_TO_CAPABILITY_MAP: Record<string, CapabilityKey> = {
  workers: 'workers',
  attendance: 'attendance',
  tareo: 'tareo',
  inventory: 'inventory',
  requerimientos: 'requerimientos',
  'caja-chica': 'caja-chica',
  soma: 'soma',
  'soma-capacitaciones': 'soma',
  'soma-charlas': 'soma',
  'soma-hsec': 'soma',
  incidencias: 'soma',
  documents: 'documents',
  ppe: 'soma',
  bonuses: 'bonuses',
  assets: 'assets',
  reports: 'reports',
  users: 'users',
  company: 'company',
  profile: 'profile',
  mecanica: 'mecanica',
  produccion: 'operaciones_mina',
  planta: 'planta_mineral',
  maderas: 'maderas',
  movements: 'logistica_rutas',
  transport: 'logistica_rutas',
  'produccion-agricola': 'produccion_agricola',
  'salud-ocupacional': 'salud_ocupacional',
  'bienestar-social': 'bienestar_social',
  'avance-obra': 'avance_obra',
  telemetria: 'telemetria_gps'
}

export function getCapabilityForModule(moduleName: string): CapabilityKey | null {
  if (!moduleName) return null
  return MODULE_TO_CAPABILITY_MAP[moduleName.toLowerCase()] || null
}

// ============================================================================
// 3. ESTRATEGIA DE COMPATIBILIDAD LEGACY
// ============================================================================

/**
 * Resuelve las capacidades aplicando la estrategia de compatibilidad LEGACY:
 * 
 * Regla de Oro:
 *  - Si la empresa tiene una industria conocida (ej: Transporte, Minería, Construcción),
 *    adopta el preset correspondiente a su arquetipo.
 *  - Si la empresa no tiene industria configurada (legacy/indefinida) o está en modo legacy:
 *    TODAS las capacidades del Core Universal son 'ACTIVE', y todos los módulos
 *    existentes del sistema permanecen disponibles en modo compatibilidad ('ACTIVE')
 *    para que ningún cliente existente sufra pérdida de pantallas.
 *  - Los overrides explícitos de la empresa siempre tienen la máxima prioridad.
 */
export function resolveCapabilitiesWithLegacyStrategy(
  rawIndustry: string | null | undefined,
  companyOverrides?: Partial<Record<CapabilityKey, CapabilityStatus>> | null
): Record<CapabilityKey, CapabilityStatus> {
  const hasSpecificIndustry = Boolean(
    rawIndustry &&
    typeof rawIndustry === 'string' &&
    rawIndustry.trim().length > 0 &&
    rawIndustry.trim().toLowerCase() !== 'otro sector' &&
    rawIndustry.trim().toLowerCase() !== 'otro'
  )

  if (hasSpecificIndustry) {
    // Si la industria está especificada, resolvemos según su arquetipo
    return resolveCapabilities(rawIndustry, companyOverrides)
  }

  // MODO LEGACY COMPATIBILITY (Empresa sin industria explícita o no configurada)
  // Mantiene activos todos los módulos existentes previamente en la plataforma
  const legacyCaps: Record<CapabilityKey, CapabilityStatus> = {
    // Core Universal
    workers: 'ACTIVE',
    attendance: 'ACTIVE',
    tareo: 'ACTIVE',
    inventory: 'ACTIVE',
    requerimientos: 'ACTIVE',
    'caja-chica': 'ACTIVE',
    soma: 'ACTIVE',
    documents: 'ACTIVE',
    bonuses: 'ACTIVE',
    assets: 'ACTIVE',
    reports: 'ACTIVE',
    users: 'ACTIVE',
    company: 'ACTIVE',
    profile: 'ACTIVE',
    // Módulos legacy existentes en la plataforma (preservación total)
    mecanica: 'ACTIVE',
    mecanica_vehiculos: 'ACTIVE',
    combustible: 'ACTIVE',
    checklists: 'ACTIVE',
    herramientas: 'ACTIVE',
    operaciones_mina: 'ACTIVE',
    planta_mineral: 'ACTIVE',
    maderas: 'ACTIVE',
    logistica_rutas: 'BETA',
    campo_lotes: 'PROTOTYPE',
    produccion_agricola: 'COMING_SOON',
    salud_ocupacional: 'COMING_SOON',
    bienestar_social: 'COMING_SOON',
    avance_obra: 'COMING_SOON',
    telemetria_gps: 'COMING_SOON'
  }

  // Si hay overrides explícitos, se aplican sobre el mapa legacy
  if (companyOverrides) {
    for (const [k, status] of Object.entries(companyOverrides)) {
      const key = k as CapabilityKey
      if (status) {
        legacyCaps[key] = status
      }
    }
  }

  return legacyCaps
}

// ============================================================================
// 4. CAPABILITY GATEWAY API
// ============================================================================

export interface CapabilityGatewayOptions {
  capabilities?: Record<CapabilityKey, CapabilityStatus> | null
  industry?: string | IndustryCode | null
  companyOverrides?: Partial<Record<CapabilityKey, CapabilityStatus>> | null
}

/**
 * Resuelve el mapa de capacidades efectivo para las opciones dadas.
 */
function getEffectiveCapabilities(options?: CapabilityGatewayOptions): Record<CapabilityKey, CapabilityStatus> {
  if (options?.capabilities) {
    return options.capabilities
  }
  return resolveCapabilitiesWithLegacyStrategy(options?.industry, options?.companyOverrides)
}

/**
 * Obtiene el estado de ciclo de vida de una capacidad para la empresa.
 */
export function getCapabilityState(
  key: CapabilityKey,
  options?: CapabilityGatewayOptions
): CapabilityStatus {
  const caps = getEffectiveCapabilities(options)
  return resolveCapabilityStatus(key, caps)
}

/**
 * Determina si una capacidad está en estado 'ACTIVE' (productiva y validada).
 */
export function isCapabilityActive(
  key: CapabilityKey,
  options?: CapabilityGatewayOptions
): boolean {
  return getCapabilityState(key, options) === 'ACTIVE'
}

/**
 * Determina si una capacidad está disponible para navegación y operación ('ACTIVE' o 'BETA').
 * Los módulos en 'PROTOTYPE', 'COMING_SOON' o 'DISABLED' no están disponibles para navegación regular.
 */
export function isCapabilityAvailable(
  key: CapabilityKey,
  options?: CapabilityGatewayOptions
): boolean {
  const state = getCapabilityState(key, options)
  return state === 'ACTIVE' || state === 'BETA'
}

/**
 * Determina si una capacidad debe ser visible en el Mapa Operativo (Sidebar).
 * Retorna true para ACTIVE, BETA, PROTOTYPE y COMING_SOON.
 * Retorna false exclusivamente para DISABLED.
 */
export function isCapabilityVisibleInSidebar(
  key: CapabilityKey,
  options?: CapabilityGatewayOptions
): boolean {
  const state = getCapabilityState(key, options)
  return state !== 'DISABLED'
}

/**
 * Alias canónico de isCapabilityAvailable.
 */
export const hasCapability = isCapabilityAvailable

/**
 * Mapeo canónico de CapabilityKey a su permiso RBAC equivalente.
 * Permite que el Gateway evalúe el permiso del usuario sin desacoplar la nomenclatura de Fase 1.
 */
export const CAPABILITY_TO_PERMISSION_MAP: Partial<Record<CapabilityKey, string>> = {
  workers: 'workers',
  attendance: 'attendance',
  tareo: 'tareo',
  inventory: 'inventory',
  requerimientos: 'requerimientos',
  'caja-chica': 'caja-chica',
  soma: 'soma',
  documents: 'documents',
  bonuses: 'bonuses',
  assets: 'assets',
  reports: 'reports',
  users: 'users',
  company: 'company',
  profile: 'profile',
  mecanica: 'mecanica',
  mecanica_vehiculos: 'mecanica',
  combustible: 'mecanica',
  checklists: 'mecanica',
  herramientas: 'mecanica',
  operaciones_mina: 'operaciones',
  planta_mineral: 'planta',
  maderas: 'maderas',
  logistica_rutas: 'movements',
  campo_lotes: 'operaciones',
  produccion_agricola: 'operaciones',
  salud_ocupacional: 'documents',
  bienestar_social: 'documents',
  avance_obra: 'operaciones',
  telemetria_gps: 'movements'
}

/**
 * DECISIÓN CENTRAL DE ACCESO:
 * ACCESS = COMPANY_CAPABILITY && USER_PERMISSION
 * 
 * Evalúa las dos dimensiones independientes:
 * 1. ¿La empresa tiene la capacidad disponible (ACTIVE o BETA, o PROTOTYPE si allowPrototype es true)?
 * 2. ¿El usuario tiene permiso en RBAC según su rol y área?
 */
export function canAccessCapability(
  capabilityKey: CapabilityKey,
  userRole: string,
  options?: {
    capabilities?: Record<CapabilityKey, CapabilityStatus> | null
    industry?: string | IndustryCode | null
    userArea?: string | null
    requiredPermission?: string
    allowPrototype?: boolean
  }
): boolean {
  // 1. Verificación de dimensión Empresa
  const state = getCapabilityState(capabilityKey, {
    capabilities: options?.capabilities,
    industry: options?.industry
  })

  const isCompanyEnabled = options?.allowPrototype
    ? (state === 'ACTIVE' || state === 'BETA' || state === 'PROTOTYPE')
    : (state === 'ACTIVE' || state === 'BETA')

  if (!isCompanyEnabled) {
    return false
  }

  // 2. Verificación de dimensión Usuario: ¿Tiene permiso RBAC?
  if (!userRole) return false
  const normRole = userRole.toLowerCase()
  if (normRole === 'super_admin' || normRole === 'superadmin') return true

  const permissionToCheck = options?.requiredPermission || CAPABILITY_TO_PERMISSION_MAP[capabilityKey] || capabilityKey
  return hasPermission(normRole, permissionToCheck, options?.userArea)
}

/**
 * Evalúa si una ruta específica está permitida para una combinación
 * de empresa (capacidad) y usuario (rol y área).
 */
export function canAccessRoute(
  pathname: string,
  userRole: string,
  options?: {
    capabilities?: Record<CapabilityKey, CapabilityStatus> | null
    industry?: string | IndustryCode | null
    userArea?: string | null
    requiredPermission?: string
    allowPrototype?: boolean
  }
): boolean {
  const capabilityKey = getCapabilityForRoute(pathname)
  if (!capabilityKey) {
    // Si la ruta no está atada a una capacidad gobernada (ej: /dashboard, /profile),
    // el acceso se delega exclusivamente a los guards existentes
    return true
  }

  const moduleSegment = pathname.split('?')[0].split('/').filter(Boolean)[0] || ''
  const requiredPermission = options?.requiredPermission || moduleSegment || CAPABILITY_TO_PERMISSION_MAP[capabilityKey]

  return canAccessCapability(capabilityKey, userRole, {
    allowPrototype: true,
    ...options,
    requiredPermission
  })
}

