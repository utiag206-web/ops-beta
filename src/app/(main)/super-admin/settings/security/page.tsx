import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SecuritySettingsClient } from './security-client'
import { getSecurityUsers } from './actions'

export const dynamic = 'force-dynamic'

export default async function SecuritySettingsPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  const initialUsers = await getSecurityUsers()

  return <SecuritySettingsClient initialUsers={initialUsers} />
}
