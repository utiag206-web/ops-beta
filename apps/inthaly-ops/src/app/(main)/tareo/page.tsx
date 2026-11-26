import { getWorkCycles, getTareoDashboardData } from './actions'
import { getWorkersShort } from '../workers/actions'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import TareoClient from './tareo-client'

export const dynamic = 'force-dynamic'

export default async function TareoPage() {
 const now = new Date()
 const year = now.getFullYear()
 const month = now.getMonth()
 const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`
 const startDate = `${currentMonthStr}-01`
 const lastDay = new Date(year, month + 1, 0).getDate()
 const endDate = `${currentMonthStr}-${String(lastDay).padStart(2, '0')}`

 const [initialCycles, workers, { extendedUser }, companyId, initialDashboardData] = await Promise.all([
 getWorkCycles(),
 getWorkersShort(),
 getUserSession(),
 getStrictCompanyId(),
 getTareoDashboardData(currentMonthStr, startDate, endDate)
 ])

 return (
 <TareoClient 
 initialCycles={initialCycles} 
 workers={workers} 
 userRole={extendedUser?.role_id || 'worker'} 
 companyId={companyId}
 initialDashboardData={{ ...initialDashboardData, monthStr: currentMonthStr }}
 />
 )
}
