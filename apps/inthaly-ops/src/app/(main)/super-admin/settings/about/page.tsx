import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AboutClient } from './about-client'

export const dynamic = 'force-dynamic'

export default async function AboutSettingsPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  return <AboutClient />
}
