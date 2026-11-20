import { createAdminClient } from '@/lib/supabase/server'

const timezoneMap: Record<string, string> = {
 'UTC-5': 'America/Lima',
 'UTC-4': 'America/Santiago',
 'UTC-3': 'America/Argentina/Buenos_Aires',
}

const timezoneCache = new Map<string, { tz: string; expires: number }>()

export async function getCompanyTimezone(companyId: string): Promise<string> {
 if (!companyId) return 'America/Lima'
 const cached = timezoneCache.get(companyId)
 if (cached && cached.expires > Date.now()) {
   return cached.tz
 }

 try {
   const supabase = await createAdminClient()
   const { data, error } = await supabase
     .from('companies')
     .select('timezone')
     .eq('id', companyId)
     .maybeSingle()

   if (error || !data) {
     return 'America/Lima'
   }

   const tz = data.timezone || 'UTC-5'
   const resolved = timezoneMap[tz] || 'America/Lima'
   timezoneCache.set(companyId, { tz: resolved, expires: Date.now() + 10 * 60 * 1000 })
   return resolved
 } catch (err) {
   console.error('[DATE_UTILS] Error getting company timezone:', err)
   return 'America/Lima'
 }
}

export function getCompanyLocalTime(ianaTimezone: string) {
 const now = new Date()
 const date = now.toLocaleDateString('sv-SE', { timeZone: ianaTimezone })
 const time = now.toLocaleTimeString('en-GB', { timeZone: ianaTimezone })
 return { date, time }
}
