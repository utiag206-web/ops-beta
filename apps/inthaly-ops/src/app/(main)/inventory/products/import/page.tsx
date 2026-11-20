import { ProductImport } from '@/components/inventory/product-import'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProductImportPage() {
 const { extendedUser } = await getUserSession()
 const canManage = ['admin', 'operaciones', 'super_admin', 'superadmin'].includes(extendedUser?.role_id || '')

 if (!canManage) {
 redirect('/inventory/products')
 }

 return <ProductImport />
}
