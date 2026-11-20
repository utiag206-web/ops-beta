import { createClient } from '@/lib/supabase/client'

export async function uploadBase64Photo(base64: string, companyId: string, prefix: string): Promise<string | null> {
  if (!base64) return null
  if (base64.startsWith('http://') || base64.startsWith('https://')) return base64
  if (!base64.startsWith('data:image')) return null

  try {
    const res = await fetch(base64)
    const blob = await res.blob()

    const ext = base64.includes('image/png') ? 'png' : 'jpg'
    const fileName = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

    const dateStr = new Date().toISOString().split('T')[0]
    const safeCompanyId = companyId && companyId !== 'unknown' && companyId !== 'pending' ? companyId : 'general'
    const path = `${safeCompanyId}/operaciones/${prefix}/${dateStr}/${fileName}`

    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('soma')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[STORAGE_ERROR] uploadBase64Photo error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('soma')
      .getPublicUrl(path)

    return publicUrl
  } catch (error) {
    console.error('[STORAGE_ERROR] uploadBase64Photo exception:', error)
    return null
  }
}
