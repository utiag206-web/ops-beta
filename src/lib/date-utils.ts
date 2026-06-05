import { createAdminClient } from '@/lib/supabase/server'

const timezoneMap: Record<string, string> = {
  'UTC-5': 'America/Lima',
  'UTC-4': 'America/Santiago',
  'UTC-3': 'America/Argentina/Buenos_Aires',
}

export async function getCompanyTimezone(companyId: string): Promise<string> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('companies')
      .select('timezone')
      .eq('id', companyId)
      .single()

    if (error || !data) {
      return 'America/Lima'
    }

    const tz = data.timezone || 'UTC-5'
    return timezoneMap[tz] || 'America/Lima'
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
