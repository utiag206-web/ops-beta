import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CapabilitiesAdminClient } from './capabilities-client'
import { getOperatingProfilesAdminData } from './actions'

export const dynamic = 'force-dynamic'

export default async function CapabilitiesAdminPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  const adminData = await getOperatingProfilesAdminData()

  return <CapabilitiesAdminClient initialData={adminData} />
}
