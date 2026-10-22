'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { CompanyAuthSettings, packWorkingHoursWithAuthSettings } from '@/lib/company-auth-settings'
import { CompanyHrSettings, packWorkingHoursWithHrSettings } from '@/lib/company-hr-settings'

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

    // Buscar si existe un usuario administrador asignado a esta empresa para fallback de nombre
    const { data: adminUser } = await supabase
      .from('users')
      .select('name, email')
      .eq('company_id', companyId)
      .or('role_id.eq.admin,role.eq.admin,role_id.eq.gerente,role.eq.gerente')
      .limit(1)
      .maybeSingle()

    let parsedWh: any = {}
    try {
      parsedWh = typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : (data.working_hours || {})
    } catch {
      parsedWh = {}
    }

    const lead = parsedWh.lead_details || parsedWh.demo_request || parsedWh.registration_request || {}

    return {
      ...data,
      contact_name: lead.contact_name || adminUser?.name || '',
      contact_position: lead.contact_position || (adminUser ? 'Administrador' : ''),
      estimated_workers: lead.estimated_workers || '',
      notes: lead.notes || ''
    }
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
  contact_name?: string
  contact_position?: string
  estimated_workers?: string
  notes?: string
  auth_settings?: CompanyAuthSettings
  hr_settings?: CompanyHrSettings
}) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const isAdmin = extendedUser?.role_id === 'admin' || extendedUser?.role_id === 'gerente' || extendedUser?.role_id === 'super_admin'
    
    if (!companyId || !isAdmin) {
      return { success: false, error: 'No autorizado para editar el perfil de la empresa.' }
    }

    const supabase = await createAdminClient()

    // 1. Obtener registro actual para preservar configuraciones y no sobreescribir settings
    const { data: currentComp } = await supabase
      .from('companies')
      .select('working_hours')
      .eq('id', companyId)
      .single()

    let currentWh: any = {}
    try {
      currentWh = typeof currentComp?.working_hours === 'string' 
        ? JSON.parse(currentComp.working_hours) 
        : (currentComp?.working_hours || {})
    } catch {
      currentWh = {}
    }

    // 2. Fusionar lead_details con los campos estándar corporativos
    currentWh.lead_details = {
      ...(currentWh.lead_details || {}),
      contact_name: formData.contact_name?.trim() || '',
      contact_position: formData.contact_position?.trim() || '',
      estimated_workers: formData.estimated_workers || '',
      notes: formData.notes?.trim() || '',
      email: formData.contact_email?.trim() || '',
      phone: formData.phone?.trim() || '',
      tax_id: formData.tax_id?.trim() || '',
      industry: formData.industry || ''
    }

    if (currentWh.demo_request) {
      currentWh.demo_request = {
        ...currentWh.demo_request,
        contact_name: formData.contact_name?.trim() || currentWh.demo_request.contact_name,
        contact_position: formData.contact_position?.trim() || currentWh.demo_request.contact_position,
        estimated_workers: formData.estimated_workers || currentWh.demo_request.estimated_workers,
        notes: formData.notes?.trim() || '',
        email: formData.contact_email?.trim() || currentWh.demo_request.email,
        phone: formData.phone?.trim() || currentWh.demo_request.phone,
        tax_id: formData.tax_id?.trim() || currentWh.demo_request.tax_id,
        industry: formData.industry || currentWh.demo_request.industry
      }
    }

    // 3. Sincronizar hr_settings y auth_settings si vienen definidos
    if (formData.hr_settings) {
      currentWh.hr_settings = formData.hr_settings
    }
    if (formData.auth_settings) {
      currentWh.auth_settings = formData.auth_settings
    }
    if (formData.working_hours) {
      currentWh.raw_hours = formData.working_hours
    }

    const packedWorkingHours = JSON.stringify(currentWh)

    const updatePayload: any = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      contact_email: formData.contact_email,
      tax_id: formData.tax_id,
      industry: formData.industry,
      timezone: formData.timezone,
      working_hours: packedWorkingHours,
      logo_url: formData.logo_url
    }

    if (formData.auth_settings) {
      updatePayload.auth_settings = formData.auth_settings
    }
    if (formData.hr_settings) {
      updatePayload.hr_settings = formData.hr_settings
    }

    const { error } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', companyId)

    if (error) {
      if (error.code === '42703' || (error.message && (error.message.includes('auth_settings') || error.message.includes('hr_settings')))) {
        delete updatePayload.auth_settings
        delete updatePayload.hr_settings
        const { error: retryErr } = await supabase
          .from('companies')
          .update(updatePayload)
          .eq('id', companyId)

        if (retryErr) return { success: false, error: retryErr.message }
      } else {
        console.error('Error updating company profile:', error)
        return { success: false, error: error.message }
      }
    }

    // Sincronizar nombre de contacto con el usuario administrador si se modificó
    if (formData.contact_name?.trim()) {
      try {
        await supabase
          .from('users')
          .update({ name: formData.contact_name.trim() })
          .eq('company_id', companyId)
          .or('role_id.eq.admin,role.eq.admin,role_id.eq.gerente,role.eq.gerente')
      } catch (e) {
        console.warn('[SYNC_ADMIN_NAME_WARNING]', e)
      }
    }

    revalidatePath('/company')
    revalidatePath('/super-admin')
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
