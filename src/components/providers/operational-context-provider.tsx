'use client'

/**
 * INTHALY OPS — Operating Profiles Architecture
 * FASE 2: OperationalContextProvider & React Hooks
 * 
 * Puente de consumo frontend entre el motor semántico de Fase 1 y React.
 * 
 * REGLA DE ORO:
 * Fallback no intrusivo hacia el CORE UNIVERSAL NEUTRAL.
 * Si no hay contexto configurado, NUNCA asume Minería.
 * Nunca lanza errores ni devuelve undefined si se usa fuera del provider.
 */

import React, { createContext, useContext, useMemo } from 'react'
import {
  IndustryCode,
  IndustryArchetype,
  SemanticToken,
  TerminologyDictionary,
  CapabilityKey,
  CapabilityStatus,
  CompanyOperatingProfile,
  OperationalContext
} from '@/lib/operating-profiles/types'
import {
  resolveArchetype,
  resolveTerminology,
  resolveFullDictionary,
  resolveCapabilityStatus,
  isCapabilityEnabled
} from '@/lib/operating-profiles/resolver'
import {
  resolveCapabilitiesWithLegacyStrategy,
  isCapabilityAvailable,
  isCapabilityVisibleInSidebar
} from '@/lib/operating-profiles/gateway'
import { CORE_TERMINOLOGY_DICTIONARY } from '@/lib/operating-profiles/dictionaries'

// ============================================================================
// CONTRATO DEL CONTEXTO OPERATIVO EN REACT
// ============================================================================

export interface OperationalContextValue {
  // Identificación de Empresa e Industria
  companyId: string | null
  industryKey: IndustryCode
  industryLabel: string

  // Arquetipo y Contexto Operacional
  archetype: IndustryArchetype
  operationalContext: OperationalContext

  // Capacidades y Módulos
  capabilities: Record<CapabilityKey, CapabilityStatus>
  isCapabilityEnabled: (key: CapabilityKey) => boolean
  isCapabilityAvailable: (key: CapabilityKey) => boolean
  isCapabilityVisibleInSidebar: (key: CapabilityKey) => boolean
  hasCapability: (key: CapabilityKey) => boolean
  getCapabilityStatus: (key: CapabilityKey) => CapabilityStatus

  // Terminología y Lenguaje
  terminologyOverrides: Partial<TerminologyDictionary>
  term: (token: SemanticToken, fallbackText?: string) => string
  hasTerm: (token: SemanticToken) => boolean
  dictionary: TerminologyDictionary
}

// ============================================================================
// VALOR POR DEFECTO (FALLBACK NEUTRAL ABSOLUTO - SIN PROVIDER)
// ============================================================================

const DEFAULT_ARCHETYPE = resolveArchetype(null) // Resuelve OTRO_SECTOR (Core Neutral)
const DEFAULT_CAPABILITIES = resolveCapabilitiesWithLegacyStrategy(null)

const DEFAULT_OPERATIONAL_CONTEXT: OperationalContextValue = {
  companyId: null,
  industryKey: DEFAULT_ARCHETYPE.industry_code,
  industryLabel: DEFAULT_ARCHETYPE.industry_label,
  archetype: DEFAULT_ARCHETYPE,
  operationalContext: DEFAULT_ARCHETYPE.default_context,
  capabilities: DEFAULT_CAPABILITIES,
  isCapabilityEnabled: (key: CapabilityKey) => isCapabilityAvailable(key, { capabilities: DEFAULT_CAPABILITIES }),
  isCapabilityAvailable: (key: CapabilityKey) => isCapabilityAvailable(key, { capabilities: DEFAULT_CAPABILITIES }),
  isCapabilityVisibleInSidebar: (key: CapabilityKey) => isCapabilityVisibleInSidebar(key, { capabilities: DEFAULT_CAPABILITIES }),
  hasCapability: (key: CapabilityKey) => isCapabilityAvailable(key, { capabilities: DEFAULT_CAPABILITIES }),
  getCapabilityStatus: (key: CapabilityKey) => resolveCapabilityStatus(key, DEFAULT_CAPABILITIES),
  terminologyOverrides: {},
  term: (token: SemanticToken, fallbackText?: string) =>
    resolveTerminology(token, { industry: null, fallbackText }),
  hasTerm: (token: SemanticToken) => token in CORE_TERMINOLOGY_DICTIONARY,
  dictionary: CORE_TERMINOLOGY_DICTIONARY
}

const OperationalContextReact = createContext<OperationalContextValue>(DEFAULT_OPERATIONAL_CONTEXT)

// ============================================================================
// PROPS DEL PROVIDER
// ============================================================================

export interface OperationalContextProviderProps {
  children: React.ReactNode
  companyId?: string | null
  industry?: string | IndustryCode | null
  initialProfile?: Partial<CompanyOperatingProfile> | null
  overrides?: Partial<TerminologyDictionary> | null
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function OperationalContextProvider({
  children,
  companyId = null,
  industry = null,
  initialProfile = null,
  overrides = null
}: OperationalContextProviderProps) {
  const value = useMemo<OperationalContextValue>(() => {
    // 1. Determinar la clave de industria efectiva y si opera en LEGACY_MODE
    const rawIndustry = initialProfile?.industry_key || industry || null
    const isLegacy = initialProfile?.is_legacy_mode !== undefined
      ? initialProfile.is_legacy_mode
      : (!rawIndustry || rawIndustry === 'OTRO_SECTOR')

    const archetype = resolveArchetype(rawIndustry)

    // 2. Fusionar overrides de terminología (persistencia + props)
    const effectiveOverrides: Partial<TerminologyDictionary> = {
      ...(initialProfile?.terminology_overrides || {}),
      ...(initialProfile?.custom_terminology || {}),
      ...(overrides || {})
    }

    // 3. Pre-calcular el diccionario semántico completo
    const fullDictionary = resolveFullDictionary(archetype.industry_code, effectiveOverrides)

    // 4. Resolver el mapa de capacidades con Estrategia Legacy / Persistente
    const customCaps = initialProfile?.custom_capabilities || initialProfile?.capabilities
    const capabilities = isLegacy
      ? resolveCapabilitiesWithLegacyStrategy(null, customCaps)
      : resolveCapabilitiesWithLegacyStrategy(rawIndustry, customCaps)

    // 5. Contexto operacional
    const operationalContext: OperationalContext = {
      ...archetype.default_context,
      ...(initialProfile?.operational_context || {})
    }

    const checkAvailable = (key: CapabilityKey) => isCapabilityAvailable(key, { capabilities })
    const checkVisible = (key: CapabilityKey) => isCapabilityVisibleInSidebar(key, { capabilities })

    return {
      companyId: companyId || initialProfile?.company_id || null,
      industryKey: archetype.industry_code,
      industryLabel: archetype.industry_label,
      archetype,
      operationalContext,
      capabilities,
      isCapabilityEnabled: checkAvailable,
      isCapabilityAvailable: checkAvailable,
      isCapabilityVisibleInSidebar: checkVisible,
      hasCapability: checkAvailable,
      getCapabilityStatus: (key: CapabilityKey) => resolveCapabilityStatus(key, capabilities),
      terminologyOverrides: effectiveOverrides,
      term: (token: SemanticToken, fallbackText?: string) =>
        resolveTerminology(token, {
          industry: archetype.industry_code,
          overrides: effectiveOverrides,
          fallbackText
        }),
      hasTerm: (token: SemanticToken) =>
        Boolean(effectiveOverrides[token] || archetype.terminology[token] || CORE_TERMINOLOGY_DICTIONARY[token]),
      dictionary: fullDictionary
    }
  }, [companyId, industry, initialProfile, overrides])

  return (
    <OperationalContextReact.Provider value={value}>
      {children}
    </OperationalContextReact.Provider>
  )
}

// ============================================================================
// HOOKS DE CONSUMO FRONTEND
// ============================================================================

/**
 * useOperationalContext()
 * 
 * Permite a cualquier componente consultar el contexto operativo global.
 * Si se usa fuera del provider, devuelve de forma segura el contexto Core Neutral
 * sin lanzar ninguna excepción ni romper el renderizado.
 */
export function useOperationalContext(): OperationalContextValue {
  try {
    const context = useContext(OperationalContextReact)
    return context || DEFAULT_OPERATIONAL_CONTEXT
  } catch {
    // Si se invoca fuera del render de React (ej: script o SSR desfasado), retorna el Core Neutral seguro
    return DEFAULT_OPERATIONAL_CONTEXT
  }
}

/**
 * useTerminology()
 * 
 * Punto de entrada frontend principal hacia el motor semántico de INTHALY OPS.
 * Resuelve tokens semánticos respetando la jerarquía:
 *  1. Override de Empresa
 *  2. Arquetipo de Industria
 *  3. CORE Neutral Universal
 * 
 * @example
 * const { term, t } = useTerminology()
 * <h2>{t('asset.primary.plural', 'Equipos')}</h2>
 */
export function useTerminology() {
  const context = useOperationalContext()

  return {
    term: context.term,
    t: context.term, // Alias ergonómico
    hasTerm: context.hasTerm,
    dictionary: context.dictionary,
    industryKey: context.industryKey,
    industryLabel: context.industryLabel
  }
}
