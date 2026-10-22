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
 supabase.from('assets').select('id, code, name, type, status, location, acquisition_date, observations, created_at'),
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
 if (!assetsData || assetsData.length === 0) return { success: false, error: 'No se encontraron datos para importar.' }

 // 1. Pre-validar y normalizar registros
 const validItems: any[] = []
 for (const asset of assetsData) {
   const code = asset.code?.toString().trim().toUpperCase()
   const name = asset.name?.toString().trim().toUpperCase()
   if (!code || !name) continue

   let fullName = name
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

   validItems.push({
     company_id: companyId,
     code,
     name: fullName,
     type,
     status,
     location: (asset.location || 'ALMACEN CENTRAL').toString().toUpperCase().trim(),
     acquisition_date: acquisitionDate,
     observations: (asset.observaciones || asset.observations || '').toString().trim() || null
   })
 }

 if (validItems.length === 0) {
   return { success: false, error: 'Ningún registro cumplió con los campos obligatorios (Código y Nombre).' }
 }

 // 2. Consulta selectiva indexada: buscar únicamente los códigos del archivo
 const incomingCodes = Array.from(new Set(validItems.map(i => i.code)))
 const { data: existingAssets, error: fetchError } = await supabase
   .from('assets')
   .select('id, code')
   .eq('company_id', companyId)
   .in('code', incomingCodes)

 if (fetchError) {
   console.error('[IMPORT_ASSETS] Error querying existing codes:', fetchError)
   return { success: false, error: fetchError.message }
 }

 const existingMap = new Map<string, string>()
 existingAssets?.forEach(a => {
   if (a.code) existingMap.set(a.code.toUpperCase().trim(), a.id)
 })

 // 3. Separar en altas masivas (insert) y actualizaciones (update)
 const toInsert: any[] = []
 const toUpdate: { id: string; payload: any }[] = []
 const seenNewCodes = new Set<string>()

 for (const item of validItems) {
   const existingId = existingMap.get(item.code)
   if (existingId) {
     toUpdate.push({ id: existingId, payload: item })
   } else {
     // Evitar duplicados dentro del mismo archivo excel
     if (!seenNewCodes.has(item.code)) {
       seenNewCodes.add(item.code)
       toInsert.push(item)
     }
   }
 }

 let insertedCount = 0
 let updatedCount = 0
 const errors: string[] = []

 // 4. Inserción masiva por lotes de 50 (Batch Insert)
 const INSERT_BATCH_SIZE = 50
 for (let i = 0; i < toInsert.length; i += INSERT_BATCH_SIZE) {
   const batch = toInsert.slice(i, i + INSERT_BATCH_SIZE)
   const { error: insErr } = await supabase.from('assets').insert(batch)
   if (insErr) {
     console.warn('[IMPORT_ASSETS] Batch insert notice, falling back to safe item-by-item:', insErr.message)
     for (const singleItem of batch) {
       const { error: sErr } = await supabase.from('assets').insert([singleItem])
       if (!sErr) insertedCount++
       else errors.push(`Activo ${singleItem.code}: ${sErr.message}`)
     }
   } else {
     insertedCount += batch.length
   }
 }

 // 5. Actualización concurrente en paralelo (Chuncked Promise.all)
 const UPDATE_CHUNK_SIZE = 10
 for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK_SIZE) {
   const chunk = toUpdate.slice(i, i + UPDATE_CHUNK_SIZE)
   await Promise.all(chunk.map(async item => {
     const { error: upErr } = await supabase
       .from('assets')
       .update(item.payload)
       .eq('id', item.id)
     if (!upErr) updatedCount++
     else errors.push(`Activo ${item.payload.code}: ${upErr.message}`)
   }))
 }

 revalidatePath('/assets')
 revalidatePath('/dashboard')

 return { 
   success: true, 
   count: insertedCount + updatedCount, 
   insertedCount, 
   updatedCount, 
   errors: errors.slice(0, 5) 
 }
 } catch (err: any) {
 console.error('[IMPORT_ASSETS_EXCEPTION]:', err)
 return { success: false, error: err.message || 'Error inesperado al importar activos.' }
 }
}