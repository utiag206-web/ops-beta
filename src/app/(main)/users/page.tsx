import { getUsers, getAvailableWorkers } from './actions'
import { UsersClientWrapper } from '@/components/users/users-client-wrapper'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  try {
    const sessionResult = await import('@/lib/auth').then(m => m.getUserSession())
    const extendedUser = sessionResult?.extendedUser

    const [users, workers] = await Promise.all([
      getUsers().catch(e => { console.error(e); return [] }),
      getAvailableWorkers().catch(e => { console.error(e); return [] })
    ])

    return (
      <div className="max-w-6xl mx-auto">
        <UsersClientWrapper 
          initialUsers={Array.isArray(users) ? users : []} 
          availableWorkers={Array.isArray(workers) ? workers : []} 
          currentUserRole={extendedUser?.role_id || ''}
        />
      </div>
    )
  } catch (err) {
    console.error('Error loading Users page:', err)
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <h2 className="text-lg font-bold">Error al cargar el módulo</h2>
        <p>Hubo un problema al obtener los datos. Por favor, intenta recargar la página.</p>
      </div>
    )
  }
}
