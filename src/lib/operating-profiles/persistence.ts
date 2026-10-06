/**
 * INTHALY OPS — Operating Profiles Architecture
 * FASE 4: Persistencia del Perfil Operativo en Supabase
 * 
 * Capa de acceso a datos para `public.company_operating_profiles`.
 * Actúa como la fuente de verdad persistente de la empresa, garantizando:
 *  1. Lectura robusta con degradación suave (fallback graceful) si la tabla no existe aún.
 *  2. Caché de sesión en memoria para evitar consultas repetidas por render.
 *  3. Preservación estricta de LEGACY_MODE para empresas sin industria o no configuradas.
 *  4. Compatibilidad 100% pura con las Fases 1, 2 y 3.
 */

import {
  CompanyOperatingProfile,
  IndustryCode,
  CapabilityKey,
  CapabilityStatus,
  TerminologyDictionary,
  OperationalContext
} from './types'
import { normalizeIndustryCode } from './industries'
import { resolveArchetype } from './resolver'
import { resolveCapabilitiesWithLegacyStrategy } from './gateway'

// ============================================================================
// 1. CONTRATO DE BASE DE DATOS (ROW TYPE)
// ============================================================================

export interface CompanyOperatingProfileRow {
  id: string
  company_id: string
  industry_code: string
  archetype_code: string
  is_legacy_mode: boolean
  custom_capabilities: Partial<Record<CapabilityKey, CapabilityStatus>>
  custom_terminology: Partial<TerminologyDictionary>
  operational_context: OperationalContext
  metadata: Record<string, any>
  created_at?: string
  updated_at?: string
}

// ============================================================================
// 2. CACHÉ EN MEMORIA (OPTIMIZACIÓN DE LECTURA)
// ============================================================================

interface CacheEntry {
  profile: CompanyOperatingProfile
  cachedAt: number
}

const PROFILE_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 1000 * 60 * 5 // 5 minutos de TTL en memoria

/**
 * Invalida el caché de perfil para una empresa (útil tras actualizaciones).
 */
export function invalidateProfileCache(companyId: string): void {
  if (companyId) {
    PROFILE_CACHE.delete(companyId)
  }
}

/**
 * Guarda o actualiza un perfil en el caché en memoria de forma inmediata.
 */
export function setProfileCache(companyId: string, profile: CompanyOperatingProfile): void {
  if (companyId && profile) {
    PROFILE_CACHE.set(companyId, { profile, cachedAt: Date.now() })
  }
}

/**
 * Limpia todo el caché de perfiles en memoria.
 */
export function clearProfileCache(): void {
  PROFILE_CACHE.clear()
}

// ============================================================================
// 3. TRANSFORMADOR Y GENERADOR DE PERFIL
// ============================================================================

/**
 * Transforma una fila de Supabase en un CompanyOperatingProfile completamente
 * resuelto con capacidades, terminología y contexto acordes a la arquitectura.
 */
export function rowToOperatingProfile(row: CompanyOperatingProfileRow): CompanyOperatingProfile {
  const industryKey: IndustryCode = normalizeIndustryCode(row.industry_code)
  const archetype = resolveArchetype(industryKey)

  // Si is_legacy_mode está activo, aplicamos la estrategia legacy que preserva
  // todos los módulos existentes de la plataforma como ACTIVE.
  const effectiveCapabilities = row.is_legacy_mode
    ? resolveCapabilitiesWithLegacyStrategy(null, row.custom_capabilities)
    : resolveCapabilitiesWithLegacyStrategy(row.industry_code, row.custom_capabilities)

  const effectiveContext: OperationalContext = {
    ...archetype.default_context,
    ...(row.operational_context || {})
  }

  return {
    id: row.id,
    company_id: row.company_id,
    industry_key: industryKey,
    archetype_code: row.archetype_code || industryKey,
    is_legacy_mode: Boolean(row.is_legacy_mode),
    operational_context: effectiveContext,
    capabilities: effectiveCapabilities,
    custom_capabilities: row.custom_capabilities || {},
    terminology_overrides: row.custom_terminology || {},
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

/**
 * Genera un CompanyOperatingProfile por defecto seguro y neutral.
 * Utilizado como fallback si la empresa aún no cuenta con registro en Supabase.
 */
export function buildDefaultOperatingProfile(
  companyId: string,
  rawIndustry?: string | null,
  forceLegacy?: boolean
): CompanyOperatingProfile {
  const hasSpecificIndustry = Boolean(
    rawIndustry &&
    typeof rawIndustry === 'string' &&
    rawIndustry.trim().length > 0 &&
    rawIndustry.trim().toLowerCase() !== 'otro sector' &&
    rawIndustry.trim().toLowerCase() !== 'otro'
  )

  const isLegacy = forceLegacy !== undefined ? forceLegacy : !hasSpecificIndustry
  const industryKey = hasSpecificIndustry ? normalizeIndustryCode(rawIndustry) : 'OTRO_SECTOR'
  const archetype = resolveArchetype(industryKey)

  const capabilities = isLegacy
    ? resolveCapabilitiesWithLegacyStrategy(null)
    : resolveCapabilitiesWithLegacyStrategy(rawIndustry)

  return {
    company_id: companyId,
    industry_key: industryKey,
    archetype_code: industryKey,
    is_legacy_mode: isLegacy,
    operational_context: { ...archetype.default_context },
    capabilities,
    custom_capabilities: {},
    terminology_overrides: {},
    metadata: { source: 'default_fallback', generated_at: new Date().toISOString() }
  }
}

// ============================================================================
// 4. FETCH DESDE SUPABASE CON DEGRADACIÓN SEGURA
// ============================================================================

/**
 * Obtiene el perfil operativo persistido de una empresa desde Supabase.
 * Si la tabla no existe (ej: antes de correr migraciones), o el registro no existe,
 * retorna un perfil por defecto seguro sin romper la ejecución de la aplicación.
 */
export async function fetchCompanyOperatingProfile(
  companyId: string,
  supabaseClient?: any,
  fallbackIndustry?: string | null
): Promise<CompanyOperatingProfile> {
  if (!companyId) {
    return buildDefaultOperatingProfile('unknown', fallbackIndustry)
  }

  // 1. Verificar caché en memoria
  const cached = PROFILE_CACHE.get(companyId)
  const now = Date.now()
  if (cached && (now - cached.cachedAt) < CACHE_TTL_MS) {
    return cached.profile
  }

  // 2. Si no hay cliente Supabase provisto, retornar perfil por defecto
  if (!supabaseClient) {
    const defaultProfile = buildDefaultOperatingProfile(companyId, fallbackIndustry)
    PROFILE_CACHE.set(companyId, { profile: defaultProfile, cachedAt: now })
    return defaultProfile
  }

  try {
    const { data, error } = await supabaseClient
      .from('company_operating_profiles')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) {
      // Código de tabla no encontrada o permiso denegado: degradación suave sin crash
      console.warn(`[OPERATING_PROFILES] Note: company_operating_profiles query for company ${companyId} returned: ${error.message}. Using safe fallback.`)
      const fallback = buildDefaultOperatingProfile(companyId, fallbackIndustry)
      PROFILE_CACHE.set(companyId, { profile: fallback, cachedAt: now })
      return fallback
    }

    if (!data) {
      // Empresa existente sin perfil aún: Modo Legacy / Fallback seguro
      const defaultProfile = buildDefaultOperatingProfile(companyId, fallbackIndustry)
      PROFILE_CACHE.set(companyId, { profile: defaultProfile, cachedAt: now })
      return defaultProfile
    }

    const resolvedProfile = rowToOperatingProfile(data as CompanyOperatingProfileRow)
    PROFILE_CACHE.set(companyId, { profile: resolvedProfile, cachedAt: now })
    return resolvedProfile

  } catch (err: any) {
    console.warn(`[OPERATING_PROFILES] Unexpected exception reading operating profile for ${companyId}:`, err?.message || err)
    const fallback = buildDefaultOperatingProfile(companyId, fallbackIndustry)
    PROFILE_CACHE.set(companyId, { profile: fallback, cachedAt: now })
    return fallback
  }
}
