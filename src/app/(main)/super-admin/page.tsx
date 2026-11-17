import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  getAllCompanies, 
  getAllUsers, 
  getSystemStats,
  getEcosystemStatsAction,
  getAllIdentitiesAdminAction
} from './actions'
import EcosystemConsoleClient from '@/components/super-admin/ecosystem-console-client'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  let companies: any[] = []
  let users: any[] = []
  let stats: any = { 
    totalCompanies: 0, 
    realCompanies: 0, 
    testCompanies: 0, 
    suspendedCompanies: 0, 
    pendingCompanies: 0, 
    totalUsers: 0 
  }
  let ecosystemStats: any = {
    totalIdentities: 0,
    verifiedIdentities: 0,
    activeSessions: 0,
    totalSecurityEvents: 0,
    connectedAppsCount: 0,
    communityUsersCount: 0,
    inthalyOpsCompaniesCount: 0,
    academySyncStatus: 'prepared_contract',
    communityStatus: 'unavailable',
    inthalyOpsStatus: 'unavailable',
    academyStatus: 'prepared_contract',
    identityPersistenceStatus: 'in_memory_transitional'
  }
  let identities: any[] = []

  try {
    const [companiesRes, usersRes, statsRes, ecoStatsRes, identitiesRes] = await Promise.all([
      getAllCompanies(),
      getAllUsers(),
      getSystemStats(),
      getEcosystemStatsAction(),
      getAllIdentitiesAdminAction()
    ])
    companies = companiesRes
    users = usersRes
    stats = statsRes
    ecosystemStats = ecoStatsRes
    identities = identitiesRes
  } catch (error: any) {
    console.error("[SUPER_ADMIN_PAGE_CRITICAL] Failed to load global data:", error.message)
  }

  return (
    <EcosystemConsoleClient 
      companies={companies}
      users={users}
      stats={stats}
      ecosystemStats={ecosystemStats}
      identities={identities}
    />
  )
}
