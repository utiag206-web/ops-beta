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
    const [companiesRes, usersRes, ecoStatsRes, identitiesRes] = await Promise.all([
      getAllCompanies(),
      getAllUsers(),
      getEcosystemStatsAction(),
      getAllIdentitiesAdminAction()
    ])
    companies = companiesRes || []
    users = usersRes || []
    ecosystemStats = ecoStatsRes
    identities = identitiesRes

    // Compute system stats directly in memory from companiesRes and usersRes
    // Avoids 2 duplicate round-trips to Supabase (companies + users count)
    let realCompanies = 0
    let testCompanies = 0
    let activeCompanies = 0
    let suspendedCompanies = 0
    let pendingCompanies = 0

    for (const c of companies) {
      if (c.is_test) testCompanies++
      else realCompanies++

      if (c.status === 'active') {
        activeCompanies++
      } else {
        let parsed: any = {}
        try {
          parsed = JSON.parse(c.working_hours || '{}')
        } catch (_) {}

        const isPending = (parsed?.demo_request || parsed?.registration_request) && parsed?.approval_status !== 'rejected'
        if (isPending) pendingCompanies++
        else suspendedCompanies++
      }
    }

    stats = {
      totalCompanies: companies.length,
      realCompanies,
      testCompanies,
      activeCompanies,
      suspendedCompanies,
      pendingCompanies,
      totalUsers: users.length
    }
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
