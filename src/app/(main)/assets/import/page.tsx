import { AssetImport } from '@/components/assets/asset-import'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AssetImportPage() {
 const { extendedUser } = await getUserSession()
 const canManage = ['admin', 'operaciones', 'super_admin', 'superadmin'].includes(extendedUser?.role_id || '')

 if (!canManage) {
 redirect('/assets')
 }

 return <AssetImport />
}
