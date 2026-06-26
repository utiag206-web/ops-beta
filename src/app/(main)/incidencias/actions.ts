'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function getIncidencias(filters?: { status?: string, category?: string }) {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser || !companyId) return { error: 'No autorizado' }

 let query = applyIsolation(
 supabase.from('incidencias').select('*'),
 companyId,
 extendedUser.role_id
 )
 .order('created_at', { ascending: false })

 if (filters?.status) {
 query = query.eq('status', filters.status)
 }

 if (filters?.category) {
 if (filters.category === 'soma') {
 query = query.in('incident_category', ['soma', 'personal', 'ambiental', 'material'])
 } else {
 query = query.eq('incident_category', filters.category)
 }
 }

 const { data: rawData, error } = await query

 if (error) {
 console.error('SERVER_GET_INCIDENCIAS_ERROR:', JSON.stringify(error, null, 2))
 return { error: `Database Error: ${error.message} (${error.code})` }
 }

 if (!rawData || rawData.length === 0) return { data: [] }

 // Manual Join Fallback for reporter names
 const reporterIds = Array.from(new Set(rawData.map((i: any) => i.reported_by))).filter((id: any) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
 
 const { data: reporters } = reporterIds.length > 0
 ? await supabase.from('users').select('id, name').in('id', reporterIds)
 : { data: [] }
 
 const reporterMap = new Map((reporters || []).map((r: any) => [r.id, r.name]))

 const data = rawData.map((i: any) => ({
 ...i,
 photo_urls: Array.isArray(i.photo_urls) ? i.photo_urls : [],
 reporter: {
 name: reporterMap.get(i.reported_by) || 'Sistema'
 }
 }))

 return { data }
}

export async function createIncidencia(payload: {
 area_location: string
 description: string
 severity: string
 event_date?: string
 incident_category?: string
 corrective_actions?: string
 photo_urls?: string[]
}) {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser?.id || !companyId) {
 return { error: 'Sesión inválida o sin contexto de empresa.' }
 }

 const { data, error } = await supabase
 .from('incidencias')
 .insert([{
 area_location: payload.area_location,
 description: payload.description,
 severity: payload.severity,
 event_date: payload.event_date || new Date().toISOString().split('T')[0],
 incident_category: payload.incident_category,
 corrective_actions: payload.corrective_actions,
 photo_urls: payload.photo_urls || [],
 company_id: companyId,
 reported_by: extendedUser.id,
 status: 'abierta'
 }])
 .select()

 if (error) {
 console.error('CREATE_INCIDENCIA_ERROR:', error)
 return { error: `Error Supabase: ${error.message}` }
 }

 revalidatePath('/dashboard')
 revalidatePath('/incidencias')
 return { success: true, data }
}

export async function updateIncidencia(id: string, payload: {
 area_location: string
 description: string
 severity: string
 event_date?: string
 incident_category?: string
 corrective_actions?: string
 status: 'abierta' | 'cerrada'
 photo_urls?: string[]
}) {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser?.id || !companyId) {
 return { error: 'Sesión inválida.' }
 }

 const { error } = await applyIsolation(
 supabase.from('incidencias').update({
 area_location: payload.area_location,
 description: payload.description,
 severity: payload.severity,
 event_date: payload.event_date,
 incident_category: payload.incident_category,
 corrective_actions: payload.corrective_actions,
 status: payload.status,
 photo_urls: payload.photo_urls || []
 }),
 companyId,
 extendedUser.role_id
 ).eq('id', id)

 if (error) return { error: error.message }

 revalidatePath('/dashboard')
 revalidatePath('/incidencias')
 return { success: true }
}

export async function deleteIncidencia(id: string) {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser?.id || !companyId) {
 return { error: 'Sesión inválida.' }
 }

 const { error } = await applyIsolation(
 supabase.from('incidencias').delete(),
 companyId,
 extendedUser.role_id
 ).eq('id', id)

 if (error) return { error: error.message }

 revalidatePath('/dashboard')
 revalidatePath('/incidencias')
 return { success: true }
}
