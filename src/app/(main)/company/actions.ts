'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getCompanyProfile() {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    if (!companyId) return null

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching company profile:', error)
      return null
    }

    return data
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT') || error.message?.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('[COMPANY_ACTIONS] Error in getCompanyProfile:', error)
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
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const isAdmin = extendedUser?.role_id === 'admin' || extendedUser?.role_id === 'gerente' || extendedUser?.role_id === 'super_admin'
  
  if (!companyId || !isAdmin) {
    return { success: false, error: 'No autorizado para editar el perfil de la empresa.' }
  }

  const supabase = await createClient()
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

  revalidatePath('/', 'layout')
  return { success: true }
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

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { publicUrl } = await uploadFile(file, 'worker_documents', storagePath)

    // Actualizar la URL en la tabla de compañías
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', companyId)

    if (updateError) throw updateError

    revalidatePath('/', 'layout')
    revalidatePath('/company')
    return { success: true, url: publicUrl }
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('[LOGO_UPLOAD_ERROR]', err)
    return { success: false, error: err.message }
  }
}

export async function isCompanyProfileComplete() {
  const profile = await getCompanyProfile()
  if (!profile) return false
  
  // Hard requirement: Name, Address, Phone and Email
  return !!(profile.name && profile.address && profile.phone && profile.contact_email)
}
