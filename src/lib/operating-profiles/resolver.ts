/**
 * INTHALY OPS — Operating Profiles Architecture
 * Pure Resolution Functions & Semantic Engine
 * 
 * Funciones puras, deterministas y testeables.
 * Cero dependencias con Supabase, React, Cookies o estado mutable.
 */

import {
  IndustryCode,
  SemanticToken,
  TerminologyDictionary,
  CapabilityKey,
  CapabilityStatus,
  IndustryArchetype,
  CompanyOperatingProfile,
  OperationalContext
} from './types'
import { normalizeIndustryCode } from './industries'
import { CORE_TERMINOLOGY_DICTIONARY } from './dictionaries'
import { getIndustryArchetype } from './archetypes'
import { CAPABILITIES_CATALOG, isCoreCapability } from './capabilities'

// ============================================================================
// 1. RESOLUCIÓN DE ARQUETIPO
// ============================================================================

/**
 * Resuelve el arquetipo aplicable a partir de cualquier entrada de industria
 * (código estandarizado, string de base de datos o valor nulo).
 * 
 * Garantía: Si la entrada es null, undefined o desconocida, devuelve el arquetipo
 * neutral OTRO_SECTOR basado 100% en el Core Universal.
 */
export function resolveArchetype(rawIndustry: string | null | undefined): IndustryArchetype {
  const code = normalizeIndustryCode(rawIndustry)
  return getIndustryArchetype(code)
}

// ============================================================================
// 2. RESOLUCIÓN DE TERMINOLOGÍA (JERARQUÍA ESTRICTA)
// ============================================================================

export interface TerminologyResolutionOptions {
  industry?: string | IndustryCode | null
  overrides?: Partial<TerminologyDictionary> | null
  fallbackText?: string
}

/**
 * Resuelve el texto final para un token semántico aplicando la jerarquía estricta:
 * 
 *  1. Override específico de empresa (Prioridad Máxima)
 *  2. Diccionario del Arquetipo de Industria (Preset Sectorial)
 *  3. Diccionario CORE Universal (Fallback Neutral Canónico)
 *  4. Fallback contextual provisto por el llamador
 *  5. Clave del token (Garantía absoluta de no retornar undefined)
 */
export function resolveTerminology(
  token: SemanticToken,
  options?: TerminologyResolutionOptions
): string {
  // 1. Override específico de empresa
  if (options?.overrides) {
    const overrideVal = options.overrides[token]
    if (typeof overrideVal === 'string' && overrideVal.trim().length > 0) {
      return overrideVal.trim()
    }
  }

  // 2. Diccionario del arquetipo de la industria
  if (options?.industry) {
    const archetype = resolveArchetype(options.industry)
    const sectorVal = archetype.terminology[token]
    if (typeof sectorVal === 'string' && sectorVal.trim().length > 0) {
      return sectorVal.trim()
    }
  }

  // 3. Diccionario CORE Universal Neutral
  const coreVal = CORE_TERMINOLOGY_DICTIONARY[token]
  if (typeof coreVal === 'string' && coreVal.trim().length > 0) {
    return coreVal.trim()
  }

  // 4. Fallback provisto en llamada
  if (typeof options?.fallbackText === 'string' && options.fallbackText.trim().length > 0) {
    return options.fallbackText.trim()
  }

  // 5. Garantía anti-crash: siempre retorna un string
  return token
}

/**
 * Genera el diccionario completo resuelto para un contexto dado,
 * pre-calculando todos los tokens semánticos para optimizar el rendimiento.
 */
export function resolveFullDictionary(
  industry?: string | IndustryCode | null,
  overrides?: Partial<TerminologyDictionary> | null
): TerminologyDictionary {
  const archetype = resolveArchetype(industry)
  const resolved = { ...CORE_TERMINOLOGY_DICTIONARY }

  // Aplicar arquetipo sectorial
  for (const [key, val] of Object.entries(archetype.terminology)) {
    if (typeof val === 'string' && val.trim().length > 0) {
      resolved[key as SemanticToken] = val.trim()
    }
  }

  // Aplicar overrides de empresa
  if (overrides) {
    for (const [key, val] of Object.entries(overrides)) {
      if (typeof val === 'string' && val.trim().length > 0) {
        resolved[key as SemanticToken] = val.trim()
      }
    }
  }

  return resolved
}

// ============================================================================
// 3. RESOLUCIÓN DE CAPACIDADES Y MÓDULOS
// ============================================================================

/**
 * Resuelve el mapa completo de capacidades para una empresa a partir
 * de su industria y eventuales personalizaciones individuales.
 * 
 * Regla de protección: Las capacidades del Core Universal ('isCore: true')
 * siempre permanecen 'ACTIVE', garantizando que ningún módulo crítico sea desactivado.
 */
export function resolveCapabilities(
  rawIndustry: string | null | undefined,
  customOverrides?: Partial<Record<CapabilityKey, CapabilityStatus>> | null
): Record<CapabilityKey, CapabilityStatus> {
  const archetype = resolveArchetype(rawIndustry)
  const resolved = { ...archetype.recommended_capabilities }

  // Fusionar personalizaciones explícitas de la empresa
  if (customOverrides) {
    for (const [k, status] of Object.entries(customOverrides)) {
      const key = k as CapabilityKey
      if (status) {
        resolved[key] = status
      }
    }
  }

  // Salvaguarda: Forzar que las capacidades Core esenciales nunca queden DISABLED
  for (const [k, def] of Object.entries(CAPABILITIES_CATALOG)) {
    const key = k as CapabilityKey
    if (def.isCore && resolved[key] === 'DISABLED') {
      resolved[key] = 'ACTIVE'
    }
  }

  return resolved
}

/**
 * Obtiene el estado explícito de una capacidad dada una matriz resuelta.
 */
export function resolveCapabilityStatus(
  key: CapabilityKey,
  capabilitiesMap: Record<CapabilityKey, CapabilityStatus>
): CapabilityStatus {
  return capabilitiesMap[key] || CAPABILITIES_CATALOG[key]?.defaultStatus || 'DISABLED'
}

/**
 * Determina si una capacidad está habilitada para ser operada por los usuarios.
 * 
 * Criterio de habilitación:
 * - 'ACTIVE': Totalmente habilitada.
 * - 'BETA': Habilitada para validación / prueba controlada.
 * - 'PROTOTYPE', 'COMING_SOON', 'DISABLED': No habilitada para operación estándar.
 */
export function isCapabilityEnabled(
  key: CapabilityKey,
  capabilitiesMap: Record<CapabilityKey, CapabilityStatus>
): boolean {
  const status = resolveCapabilityStatus(key, capabilitiesMap)
  return status === 'ACTIVE' || status === 'BETA'
}

/**
 * Filtra y retorna únicamente las capacidades que están en un estado determinado.
 */
export function filterCapabilitiesByStatus(
  capabilitiesMap: Record<CapabilityKey, CapabilityStatus>,
  targetStatus: CapabilityStatus
): CapabilityKey[] {
  return (Object.keys(capabilitiesMap) as CapabilityKey[]).filter(
    key => capabilitiesMap[key] === targetStatus
  )
}

// ============================================================================
// 4. FACTORY DE PERFIL OPERATIVO (EN MEMORIA / SIN BD)
// ============================================================================

/**
 * Crea un objeto CompanyOperatingProfile en memoria a partir de una empresa
 * y una industria opcional, aplicando el arquetipo recomendado y el Core universal.
 * 
 * Esta función es fundamental para proporcionar compatibilidad transparente
 * a empresas que aún no cuenten con un perfil persistido en base de datos.
 */
export function createDefaultOperatingProfile(
  companyId: string,
  rawIndustry?: string | null,
  contextOverrides?: Partial<OperationalContext>
): CompanyOperatingProfile {
  const archetype = resolveArchetype(rawIndustry)
  const capabilities = resolveCapabilities(rawIndustry)

  return {
    company_id: companyId,
    industry_key: archetype.industry_code,
    operational_context: {
      ...archetype.default_context,
      ...(contextOverrides || {})
    },
    capabilities: capabilities,
    terminology_overrides: {}
  }
}
