import { ChecklistView } from '@/components/mecanica/checklist-view'
import { getUserSession } from '@/lib/auth'
import { getChecklistRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Checklists de Verificación | Mecánica Inthaly OPS',
  description: 'Check List de verificación pre-operacional de equipos y vehículos.',
}

export default async function ChecklistsPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getChecklistRecords()

  return (
    <ChecklistView
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
