import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MultiempresaClient } from './multiempresa-client'
import { getMultiCompanySettings } from './actions'

export const dynamic = 'force-dynamic'

export default async function MultiempresaSettingsPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  const initialData = await getMultiCompanySettings()

  return (
    <MultiempresaClient 
      initialSettings={initialData.settings} 
      initialLastSynced={initialData.lastSynced}
      companyStats={{
        total: initialData.totalCompanies,
        active: initialData.activeCompanies,
        suspended: initialData.suspendedCompanies
      }}
    />
  )
}
