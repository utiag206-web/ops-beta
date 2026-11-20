import { StockImport } from '@/components/inventory/stock-import'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function StockImportPage() {
 const { extendedUser } = await getUserSession()
 const canManage = ['admin', 'operaciones', 'super_admin', 'superadmin'].includes(extendedUser?.role_id || '')

 if (!canManage) {
 redirect('/inventory/stock')
 }

 return <StockImport />
}
