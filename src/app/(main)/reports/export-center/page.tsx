import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ExportHubView } from '@/components/export-center/export-hub-view'
import { getExportAuxiliaryData } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Centro de Reportes y Exportaciones | Inthaly OPS',
  description: 'Descarga centralizada de reportes oficiales de RRHH, Mina, Logística, Finanzas y SOMA.',
}

export default async function ExportCenterPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const auxData = await getExportAuxiliaryData()

  return <ExportHubView auxData={auxData} />
}
