'use server'

/**
 * INTHALY OPS — Global Console: Administración de Industrias, Arquetipos y Capacidades
 * FASE 5: Server Actions
 * 
 * Permite al Super Administrador:
 * 1. Consultar el estado consolidado de empresas, perfiles, industrias y capacidades.
 * 2. Actualizar perfiles operativos de empresas (industria, arquetipo, modo legacy, overrides).
 * 3. Invalidar el caché en memoria para sincronización inmediata con la sesión.
 */

import { getUserSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import {
  ALL_INDUSTRIES,
  INDUSTRIES_METADATA,
  normalizeIndustryCode
} from '@/lib/operating-profiles/industries'
import {
  CAPABILITIES_CATALOG,
  ALL_CAPABILITY_KEYS
} from '@/lib/operating-profiles/capabilities'
import {
  INDUSTRY_ARCHETYPES
} from '@/lib/operating-profiles/archetypes'
import {
  rowToOperatingProfile,
  buildDefaultOperatingProfile,
  invalidateProfileCache,
  setProfileCache,
  CompanyOperatingProfileRow
} from '@/lib/operating-profiles/persistence'
import {
  CompanyOperatingProfile,
  IndustryCode,
  CapabilityKey,
  CapabilityStatus,
  TerminologyDictionary,
  OperationalContext
} from '@/lib/operating-profiles/types'
import { revalidatePath } from 'next/cache'

// ============================================================================
// CONTRATOS DE DATOS PARA LA VISTA ADMINISTRATIVA
// ============================================================================

export interface CompanyWithProfileAdmin {
  id: string
  name: string
  status: string
  industry: string | null
  logo_url: string | null
  is_test: boolean
  created_at: string
  profile: CompanyOperatingProfile
}

export interface CapabilitiesAdminData {
  industries: typeof ALL_INDUSTRIES
  archetypes: Record<IndustryCode, any>
  capabilitiesCatalog: typeof CAPABILITIES_CATALOG
  capabilityKeys: readonly CapabilityKey[]
  companies: CompanyWithProfileAdmin[]
}

// ============================================================================
// 1. OBTENCIÓN CONSOLIDADA DE DATOS PARA SUPER ADMIN
// ============================================================================

export async function getOperatingProfilesAdminData(): Promise<CapabilitiesAdminData> {
  const { extendedUser } = await getUserSession()
  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    throw new Error('Acceso no autorizado a la consola global de capacidades')
  }

  const adminSupabase = await createAdminClient()

  // 1. Obtener listado de empresas
  const { data: companiesData, error: companiesError } = await adminSupabase
    .from('companies')
    .select('id, name, status, industry, logo_url, is_test, created_at')
    .order('name', { ascending: true })

  if (companiesError) {
    console.error('[CAPABILITIES_ADMIN] Error al consultar empresas:', companiesError.message)
    throw new Error('Error al cargar listado de empresas')
  }

  // 2. Intentar obtener perfiles de company_operating_profiles (degradación suave si la tabla aún no existe)
  let profilesByCompany: Record<string, CompanyOperatingProfileRow> = {}
  try {
    const { data: profilesData, error: profilesError } = await adminSupabase
      .from('company_operating_profiles')
      .select('*')

    if (!profilesError && profilesData) {
      for (const p of profilesData) {
        profilesByCompany[p.company_id] = p as CompanyOperatingProfileRow
      }
    }
  } catch (err: any) {
    console.warn('[CAPABILITIES_ADMIN] Nota: company_operating_profiles no disponible aún:', err?.message)
  }

  // 3. Cruzar empresas con sus perfiles resueltos
  const mergedCompanies: CompanyWithProfileAdmin[] = (companiesData || []).map((comp: any) => {
    const existingRow = profilesByCompany[comp.id]
    let resolvedProfile: CompanyOperatingProfile

    if (existingRow) {
      resolvedProfile = rowToOperatingProfile(existingRow)
    } else {
      resolvedProfile = buildDefaultOperatingProfile(comp.id, comp.industry)
    }

    return {
      id: comp.id,
      name: comp.name,
      status: comp.status,
      industry: comp.industry,
      logo_url: comp.logo_url,
      is_test: comp.is_test,
      created_at: comp.created_at,
      profile: resolvedProfile
    }
  })

  return {
    industries: ALL_INDUSTRIES,
    archetypes: INDUSTRY_ARCHETYPES,
    capabilitiesCatalog: CAPABILITIES_CATALOG,
    capabilityKeys: ALL_CAPABILITY_KEYS,
    companies: mergedCompanies
  }
}

// ============================================================================
// 2. ACTUALIZACIÓN DE PERFIL OPERATIVO DE EMPRESA
// ============================================================================

export interface UpdateCompanyProfilePayload {
  companyId: string
  industryCode: IndustryCode
  archetypeCode?: string
  isLegacyMode: boolean
  customCapabilities: Partial<Record<CapabilityKey, CapabilityStatus>>
  customTerminology: Partial<TerminologyDictionary>
  operationalContext?: OperationalContext
}

export async function updateCompanyOperatingProfileAdmin(
  payload: UpdateCompanyProfilePayload
): Promise<{ success: boolean; error?: string; warning?: string; profile?: CompanyOperatingProfile }> {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') {
      return { success: false, error: 'Acceso Denegado: Se requiere rol Super Administrador' }
    }

    if (!payload.companyId) {
      return { success: false, error: 'Identificador de empresa inválido' }
    }

    const adminSupabase = await createAdminClient()
    const meta = INDUSTRIES_METADATA[payload.industryCode] || INDUSTRIES_METADATA.OTRO_SECTOR

    // 1. Sincronizar companies.industry con la etiqueta oficial para coherencia histórica
    const { error: compUpdateError } = await adminSupabase
      .from('companies')
      .update({
        industry: meta.officialLabel,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.companyId)

    if (compUpdateError) {
      console.warn('[CAPABILITIES_ADMIN] Advertencia al sincronizar companies.industry:', compUpdateError.message)
    }

    // 2. Preparar datos para upsert en company_operating_profiles
    const profileRow = {
      company_id: payload.companyId,
      industry_code: payload.industryCode,
      archetype_code: payload.archetypeCode || payload.industryCode,
      is_legacy_mode: Boolean(payload.isLegacyMode),
      custom_capabilities: payload.customCapabilities || {},
      custom_terminology: payload.customTerminology || {},
      operational_context: payload.operationalContext || {},
      metadata: {
        updated_by: extendedUser.email,
        updated_at: new Date().toISOString(),
        version: 'phase_5_console'
      },
      updated_at: new Date().toISOString()
    }

    let resolved: CompanyOperatingProfile
    let dbWarning: string | undefined

    try {
      const { data: upsertData, error: upsertError } = await adminSupabase
        .from('company_operating_profiles')
        .upsert(profileRow, { onConflict: 'company_id' })
        .select('*')
        .single()

      if (upsertError) {
        console.warn('[CAPABILITIES_ADMIN] Tabla company_operating_profiles no disponible aún:', upsertError.message)
        dbWarning = 'Sector sincronizado. La tabla satélite aún no está creada en Supabase; los cambios se aplican de forma inmediata en memoria.'
        const baseDefault = buildDefaultOperatingProfile(payload.companyId, meta.officialLabel, payload.isLegacyMode)
        resolved = {
          ...baseDefault,
          industry_key: payload.industryCode,
          archetype_code: payload.archetypeCode || payload.industryCode,
          is_legacy_mode: Boolean(payload.isLegacyMode),
          custom_capabilities: payload.customCapabilities || {},
          terminology_overrides: payload.customTerminology || {},
          operational_context: {
            ...baseDefault.operational_context,
            ...(payload.operationalContext || {})
          }
        }
      } else {
        resolved = rowToOperatingProfile(upsertData as CompanyOperatingProfileRow)
      }
    } catch (err: any) {
      console.warn('[CAPABILITIES_ADMIN] Excepción al interactuar con company_operating_profiles:', err?.message)
      const baseDefault = buildDefaultOperatingProfile(payload.companyId, meta.officialLabel, payload.isLegacyMode)
      resolved = {
        ...baseDefault,
        industry_key: payload.industryCode,
        archetype_code: payload.archetypeCode || payload.industryCode,
        is_legacy_mode: Boolean(payload.isLegacyMode),
        custom_capabilities: payload.customCapabilities || {},
        terminology_overrides: payload.customTerminology || {},
        operational_context: {
          ...baseDefault.operational_context,
          ...(payload.operationalContext || {})
        }
      }
    }

    // 3. Guardar en memoria de inmediato para reflejo instantáneo en la sesión
    setProfileCache(payload.companyId, resolved)

    // 4. Revalidar rutas Next.js relevantes
    revalidatePath('/super-admin/settings/capabilities')
    revalidatePath('/super-admin')
    revalidatePath('/dashboard')

    return { success: true, profile: resolved, warning: dbWarning }

  } catch (err: any) {
    console.error('[CAPABILITIES_ADMIN] Excepción en updateCompanyOperatingProfileAdmin:', err)
    return { success: false, error: err?.message || 'Error inesperado al actualizar perfil operativo' }
  }
}

// ============================================================================
// 3. ALTERNADOR RÁPIDO DE MODO LEGACY
// ============================================================================

export async function toggleCompanyLegacyMode(
  companyId: string,
  isLegacy: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') {
      return { success: false, error: 'Acceso denegado' }
    }

    const adminSupabase = await createAdminClient()

    try {
      const { error } = await adminSupabase
        .from('company_operating_profiles')
        .update({
          is_legacy_mode: isLegacy,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId)

      if (error) {
        console.warn('[CAPABILITIES_ADMIN] Nota: update legacy mode en BD retornó:', error.message)
      }
    } catch (err: any) {
      console.warn('[CAPABILITIES_ADMIN] Nota: update legacy mode en BD falló:', err?.message)
    }

    invalidateProfileCache(companyId)
    revalidatePath('/super-admin/settings/capabilities')
    revalidatePath('/dashboard')
    return { success: true }

  } catch (err: any) {
    console.error('[CAPABILITIES_ADMIN] Excepción en toggleCompanyLegacyMode:', err)
    return { success: false, error: err?.message || 'Error inesperado al cambiar modo legacy' }
  }
}
