import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CampoClient from './campo-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Lotes y Cultivos (Prototipo) | Inthaly OPS',
  description: 'Control y seguimiento operativo de lotes, cultivos y labores agrícolas de campo.',
}

export default async function CampoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <CampoClient 
      companyName={extendedUser.company_name || 'Empresa'}
      userRole={extendedUser.role_id}
    />
  )
}
