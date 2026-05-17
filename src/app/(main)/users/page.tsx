import { getUsers, getAvailableWorkers } from './actions'
import { UsersList } from '@/components/users/users-list'

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
        <UsersList 
          initialUsers={Array.isArray(users) ? users : []} 
          availableWorkers={Array.isArray(workers) ? workers : []} 
          currentUserRole={extendedUser?.role_id || ''}
        />
      </div>
    )
  } catch (err: any) {
    if (
      err.digest?.startsWith('NEXT_REDIRECT') || 
      err.message?.includes('NEXT_REDIRECT') ||
      err.digest === 'DYNAMIC_SERVER_USAGE' ||
      err.message?.includes('DYNAMIC_SERVER_USAGE') ||
      err.message?.includes('Dynamic server usage')
    ) {
      throw err
    }
    console.error('Error loading Users page:', err)
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <h2 className="text-lg font-bold">Error al cargar el módulo</h2>
        <p>Hubo un problema al obtener los datos. Por favor, intenta recargar la página.</p>
      </div>
    )
  }
}
