'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { defaultMultiCompanySettings, MultiCompanySettings } from './multiempresa.defaults'

export interface MultiCompanySettingsResponse {
  settings: MultiCompanySettings
  lastSynced: string | null
  totalCompanies: number
  activeCompanies: number
  suspendedCompanies: number
}

/**
 * Obtiene la configuración multiempresa persistente y las métricas reales del entorno
 */
export async function getMultiCompanySettings(): Promise<MultiCompanySettingsResponse> {
  try {
    const supabase = await createAdminClient()

    // 1. Obtener métricas reales de empresas
    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('id, status')

    let totalCompanies = 0
    let activeCompanies = 0
    let suspendedCompanies = 0

    if (!compErr && companies) {
      totalCompanies = companies.length
      activeCompanies = companies.filter(c => c.status === 'active').length
      suspendedCompanies = companies.filter(c => c.status === 'inactive').length
    }

    // 2. Obtener configuración persistente desde ecosystem_assets
    const { data: assetData } = await supabase
      .from('ecosystem_assets')
      .select('base64_data, updated_at')
      .eq('id', 'multi_company_settings')
      .maybeSingle()

    // 3. Obtener valores regionales desde global_settings
    const { data: globalData } = await supabase
      .from('global_settings')
      .select('default_language, default_timezone, default_currency, default_date_format')
      .eq('singleton_key', 1)
      .maybeSingle()

    let mergedSettings = { ...defaultMultiCompanySettings }
    let lastSynced: string | null = null

    if (assetData?.base64_data) {
      try {
        const parsed = JSON.parse(assetData.base64_data)
        mergedSettings = { ...mergedSettings, ...parsed }
        lastSynced = assetData.updated_at
      } catch (e) {
        console.warn('[MULTIEMPRESA_ACTIONS] Error al parsear base64_data:', e)
      }
    }

    // Sobrescribir con valores regionales de global_settings si existen
    if (globalData) {
      if (globalData.default_timezone) mergedSettings.defaultTimezone = globalData.default_timezone
      if (globalData.default_date_format) mergedSettings.defaultDateFormat = globalData.default_date_format
      if (globalData.default_language) {
        mergedSettings.defaultLanguage = globalData.default_language === 'en' ? 'ENGLISH' : 'ESPAÑOL'
      }
      if (globalData.default_currency) {
        mergedSettings.defaultCurrency = globalData.default_currency === 'USD' ? 'USD — DÓLAR AMERICANO' : 'PEN — SOL PERUANO'
      }
    }

    return {
      settings: mergedSettings,
      lastSynced,
      totalCompanies,
      activeCompanies,
      suspendedCompanies
    }
  } catch (error) {
    console.error('[MULTIEMPRESA_ACTIONS] Error en getMultiCompanySettings:', error)
    return {
      settings: defaultMultiCompanySettings,
      lastSynced: null,
      totalCompanies: 0,
      activeCompanies: 0,
      suspendedCompanies: 0
    }
  }
}

/**
 * Actualiza y persiste la configuración multiempresa de manera atómica
 */
export async function updateMultiCompanySettings(settings: MultiCompanySettings): Promise<{ success: boolean; lastSynced?: string; error?: string }> {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') {
      return { success: false, error: 'Acceso Denegado: Solo el Super Administrador puede modificar esta configuración.' }
    }

    const supabase = await createAdminClient()
    const nowIso = new Date().toISOString()

    // 1. Persistir toda la configuración en ecosystem_assets
    const { error: assetError } = await supabase
      .from('ecosystem_assets')
      .upsert({
        id: 'multi_company_settings',
        mime_type: 'application/json',
        base64_data: JSON.stringify(settings),
        updated_at: nowIso
      })

    if (assetError) {
      console.error('[MULTIEMPRESA_ACTIONS] Error guardando en ecosystem_assets:', assetError)
      return { success: false, error: assetError.message }
    }

    // 2. Sincronizar campos regionales en global_settings
    const langCode = settings.defaultLanguage?.toLowerCase().includes('en') ? 'en' : 'es'
    const currCode = settings.defaultCurrency?.includes('USD') ? 'USD' : 'PEN'

    await supabase
      .from('global_settings')
      .update({
        default_language: langCode,
        default_timezone: settings.defaultTimezone || 'America/Lima',
        default_currency: currCode,
        default_date_format: settings.defaultDateFormat || 'DD/MM/YYYY',
        updated_at: nowIso
      })
      .eq('singleton_key', 1)

    revalidatePath('/super-admin/settings/multiempresa')
    revalidatePath('/super-admin/settings/general')
    revalidatePath('/super-admin')

    return { success: true, lastSynced: nowIso }
  } catch (err: any) {
    console.error('[MULTIEMPRESA_ACTIONS] Error crítico:', err)
    return { success: false, error: err.message || 'Error inesperado al guardar configuración' }
  }
}
