'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function getAssets() {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 
 if (!extendedUser || !companyId) return { error: 'Acceso denegado.' }

 const supabase = await createAdminClient()

 const { data, error } = await applyIsolation(
 supabase.from('assets').select('*'),
 companyId,
 extendedUser.role_id
 )
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error fetching assets:', error)
 return { error: error.message }
 }

 return { data: data || [] }
 } catch (err: any) {
 console.error('Unexpected error in getAssets:', err)
 return { error: err.message || 'Error inesperado al obtener los activos.' }
 }
}

export async function createAsset(payload: {
 code: string
 name: string
 type: string
 status: string
 location: string
 camp_name?: string
}) {
 try {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser?.id || !companyId) {
 return { error: 'Sesión inválida o sin contexto de empresa.' }
 }

 const { data, error } = await supabase
 .from('assets')
 .insert([{
 ...payload,
 company_id: companyId
 }])
 .select()

 if (error) {
 console.error('CREATE_ASSET_ERROR:', error)
 return { error: `Error Supabase: ${error.message}` }
 }

 revalidatePath('/assets')
 revalidatePath('/dashboard')
 return { success: true, data }
 } catch (err: any) {
 console.error('Unexpected error in createAsset:', err)
 return { error: err.message || 'Error inesperado al crear activo.' }
 }
}

export async function updateAsset(id: string, payload: any) {
 try {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 if (!extendedUser || !companyId) return { error: 'No autorizado' }

 const { data, error } = await applyIsolation(
 supabase.from('assets').update(payload),
 companyId,
 extendedUser.role_id
 )
 .eq('id', id)
 .select()

 if (error) throw error

 revalidatePath('/assets')
 return { success: true, data }
 } catch (error: any) {
 console.error('UPDATE_ASSET_ERROR:', error)
 return { error: error.message }
 }
}

export async function deleteAsset(id: string) {
 try {
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 if (!extendedUser || !companyId) return { error: 'No autorizado' }

 const { error } = await applyIsolation(
 supabase.from('assets').delete(),
 companyId,
 extendedUser.role_id
 ).eq('id', id)

 if (error) throw error

 revalidatePath('/assets')
 return { success: true }
 } catch (error: any) {
 console.error('DELETE_ASSET_ERROR:', error)
 return { error: error.message }
 }
}

export async function checkExistingAssetCodes(codes: string[]) {
 try {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 if (!codes || codes.length === 0) return { data: [] }

 const { data, error } = await supabase
 .from('assets')
 .select('code')
 .eq('company_id', companyId)
 .in('code', codes)

 if (error) return { error: error.message }
 return { data: data.map((p: any) => p.code) }
 } catch (error: any) {
 return { error: error.message }
 }
}

export async function importAssets(assetsData: any[]) {
 try {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 if (!extendedUser || !companyId) return { success: false, error: 'Acceso denegado.' }

 // Retrieve existing assets to perform programmatic upsert
 const { data: existingAssets, error: fetchError } = await supabase
 .from('assets')
 .select('id, code')
 .eq('company_id', companyId)

 if (fetchError) {
 console.error('Error fetching existing assets for import:', fetchError)
 return { success: false, error: fetchError.message }
 }

 const assetMap = new Map<string, string>()
 existingAssets?.forEach(a => {
 if (a.code) {
 assetMap.set(a.code.toUpperCase().trim(), a.id)
 }
 })

 const results = []

 for (const asset of assetsData) {
 const code = asset.code?.toString().trim().toUpperCase()
 if (!code || !asset.name) continue

 let fullName = asset.name?.toString().trim().toUpperCase() || ''
 const brand = asset.brand?.toString().trim().toUpperCase() || ''
 const model = asset.model?.toString().trim().toUpperCase() || ''
 if (brand || model) {
 fullName = `${fullName} ${brand} ${model}`.trim().replace(/\s+/g, ' ')
 }

 const rawCategory = (asset.category || 'equipo').toString().toLowerCase().trim()
 let type = 'equipo'
 if (rawCategory.includes('herramienta') || rawCategory.includes('menor') || rawCategory.includes('tool')) {
 type = 'herramienta'
 }

 const rawStatus = (asset.status || 'operativo').toString().toLowerCase().trim()
 let status = 'operativo'
 if (rawStatus.includes('mantenimiento') || rawStatus.includes('taller')) {
 status = 'en mantenimiento'
 } else if (rawStatus.includes('baja') || rawStatus.includes('fuera') || rawStatus.includes('servicio') || rawStatus.includes('dañado')) {
 status = 'fuera de servicio'
 }

 const rawAcquisitionDate = asset.fecha_adquisicion || asset.acquisition_date
 let acquisitionDate: string | null = null
 if (rawAcquisitionDate) {
 if (typeof rawAcquisitionDate === 'number') {
 const dateObj = new Date((rawAcquisitionDate - 25569) * 86400 * 1000)
 acquisitionDate = dateObj.toISOString().split('T')[0]
 } else {
 const parsedDate = new Date(rawAcquisitionDate)
 if (!isNaN(parsedDate.getTime())) {
 acquisitionDate = parsedDate.toISOString().split('T')[0]
 }
 }
 }

 const assetPayload = {
 company_id: companyId,
 code,
 name: fullName,
 type,
 status,
 location: (asset.location || 'ALMACEN CENTRAL').toString().toUpperCase().trim(),
 acquisition_date: acquisitionDate,
 observations: (asset.observaciones || asset.observations || '').toString().trim() || null
 }

 const existingId = assetMap.get(code)
 if (existingId) {
 const { data: updated, error: updateErr } = await supabase
 .from('assets')
 .update(assetPayload)
 .eq('id', existingId)
 .select()
 .maybeSingle()

 if (updateErr) {
 console.error('Update asset error during import:', updateErr)
 continue
 }
 if (updated) results.push(updated)
 } else {
 const { data: inserted, error: insertErr } = await supabase
 .from('assets')
 .insert([assetPayload])
 .select()
 .maybeSingle()

 if (insertErr) {
 console.error('Insert asset error during import:', insertErr)
 continue
 }
 if (inserted) results.push(inserted)
 }
 }

 revalidatePath('/assets')
 revalidatePath('/dashboard')
 return { success: true, count: results.length }
 } catch (err: any) {
 console.error('importAssets error:', err)
 return { success: false, error: err.message }
 }
}
