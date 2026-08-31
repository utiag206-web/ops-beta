'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface GlobalSettingsData {
  ecosystem_name: string
  ecosystem_logo?: string
  ecosystem_favicon?: string
  brand_color?: string
  ecosystem_commercial_name?: string
  ecosystem_description?: string
  default_language: string
  default_timezone: string
  default_currency: string
  default_date_format: string
  default_number_format: string
}

const getSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore if called from a Server Component
          }
        },
      },
    }
  )
}

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Obtiene la configuración global del ecosistema (Memoizado por ciclo de request)
 */
export const getGlobalSettings = cache(async function getGlobalSettings(): Promise<GlobalSettingsData | null> {
  try {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('singleton_key', 1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return data as GlobalSettingsData
  } catch (err) {
    return null
  }
})

/**
 * Actualiza la configuración global del ecosistema
 */
export async function updateGlobalSettings(settings: GlobalSettingsData): Promise<{ success: boolean; error?: string }> {
  // Verificar permisos: Sólo SUPER_ADMIN
  const { extendedUser } = await getUserSession()
  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { success: false, error: 'No tienes permisos para modificar la configuración global' }
  }

  const supabase = await getSupabaseClient()

  // Actualizar configuración (la política RLS también validará el rol por seguridad)
  const { error } = await supabase
    .from('global_settings')
    .update({
      ecosystem_name: settings.ecosystem_name,
      ecosystem_logo: settings.ecosystem_logo,
      ecosystem_favicon: settings.ecosystem_favicon,
      brand_color: settings.brand_color,
      ecosystem_commercial_name: settings.ecosystem_commercial_name,
      ecosystem_description: settings.ecosystem_description,
      default_language: settings.default_language,
      default_timezone: settings.default_timezone,
      default_currency: settings.default_currency,
      default_date_format: settings.default_date_format,
      default_number_format: settings.default_number_format
    })
    .eq('singleton_key', 1)

  if (error) {
    console.error("Error updating global settings:", error)
    return { success: false, error: error.message }
  }

  // Refresca completamente el layout maestro para que los Server Components (como el layout) 
  // vuelvan a hacer fetch de la configuracin global y actualicen el frontend.
  revalidatePath('/', 'layout')

  return { success: true }
}

/**
 * Sube un asset (logo/favicon) directamente a la base de datos para evitar errores de Storage
 */
export async function uploadEcosystemAsset(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const { extendedUser } = await getUserSession()
  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { success: false, error: 'No tienes permisos para modificar assets globales' }
  }

  const id = formData.get('id') as string
  const file = formData.get('file') as File

  if (!id || !file) {
    return { success: false, error: 'Faltan datos para subir el archivo' }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64Data = buffer.toString('base64')

  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('ecosystem_assets')
    .upsert({
      id,
      mime_type: file.type,
      base64_data: base64Data,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error("Error uploading asset to DB:", error)
    return { success: false, error: error.message }
  }

  // Generar la URL dinámica apuntando a nuestra propia API
  const url = `/api/assets/${id}?t=${Date.now()}`
  return { success: true, url }
}
