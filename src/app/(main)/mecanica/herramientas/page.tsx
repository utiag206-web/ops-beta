import { ToolsView } from '@/components/mecanica/tools-view'
import { getUserSession } from '@/lib/auth'
import { getToolRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Control de Herramientas | Mecánica Inthaly OPS',
  description: 'Control de herramientas y seguimiento de su estado en taller.',
}

export default async function HerramientasPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getToolRecords()

  return (
    <ToolsView
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
