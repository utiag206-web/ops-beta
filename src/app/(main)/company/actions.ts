'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getCompanyProfile() {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    if (!companyId) return null

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) {
      console.error('Error fetching company profile:', error)
      return null
    }

    return data
  } catch (err: any) {
    console.error('[COMPANY_GET_PROFILE_ERROR]', err.message)
    return null
  }
}

export async function updateCompanyProfile(formData: {
  name: string
  address: string
  phone: string
  contact_email: string
  tax_id?: string
  industry?: string
  timezone?: string
  working_hours?: string
  logo_url?: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const isAdmin = extendedUser?.role_id === 'admin' || extendedUser?.role_id === 'gerente' || extendedUser?.role_id === 'super_admin'
    
    if (!companyId || !isAdmin) {
      return { success: false, error: 'No autorizado para editar el perfil de la empresa.' }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('companies')
      .update({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        contact_email: formData.contact_email,
        tax_id: formData.tax_id,
        industry: formData.industry,
        timezone: formData.timezone,
        working_hours: formData.working_hours,
        logo_url: formData.logo_url
      })
      .eq('id', companyId)

    if (error) {
      console.error('Error updating company profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[COMPANY_UPDATE_PROFILE_ERROR]', err.message)
    return { success: false, error: err.message }
  }
}

export async function uploadCompanyLogo(formData: FormData) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    if (!companyId) return { success: false, error: 'No autorizado' }

    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No se envió ningún archivo' }

    const { uploadFile } = await import('@/lib/storage')
    const fileExt = file.name.split('.').pop()
    const fileName = `logo-${Date.now()}.${fileExt}`
    const storagePath = `${companyId}/${fileName}`

    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    const { publicUrl } = await uploadFile(file, 'worker_documents', storagePath)

    // Actualizar la URL en la tabla de compañías
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', companyId)

    if (updateError) throw updateError

    return { success: true, url: publicUrl }
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('[LOGO_UPLOAD_ERROR]', err)
    return { success: false, error: err.message }
  }
}

export async function isCompanyProfileComplete() {
  try {
    const profile = await getCompanyProfile()
    if (!profile) return false
    
    // Hard requirement: Name, Address, Phone and Email
    return !!(profile.name && profile.address && profile.phone && profile.contact_email)
  } catch {
    return false
  }
}
