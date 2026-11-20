import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GeneralSettingsClient } from './general-client'
import { getGlobalSettings } from './actions'

export const dynamic = 'force-dynamic'

export default async function GeneralSettingsPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  const initialSettings = await getGlobalSettings()

  return <GeneralSettingsClient initialData={initialSettings} />
}
