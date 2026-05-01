import { getUsers, getAvailableWorkers } from './actions'
import { UsersList } from '@/components/users/users-list'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  try {
    const [users, workers, { extendedUser }] = await Promise.all([
      getUsers(),
      getAvailableWorkers(),
      import('@/lib/auth').then(m => m.getUserSession())
    ])

    return (
      <div className="max-w-6xl mx-auto">
        <UsersList 
          initialUsers={users} 
          availableWorkers={workers} 
          currentUserRole={extendedUser?.role_id}
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
