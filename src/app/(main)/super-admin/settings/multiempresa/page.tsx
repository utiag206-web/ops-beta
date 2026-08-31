import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MultiempresaClient } from './multiempresa-client'

export const dynamic = 'force-dynamic'

export default async function MultiempresaSettingsPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  return <MultiempresaClient />
}
