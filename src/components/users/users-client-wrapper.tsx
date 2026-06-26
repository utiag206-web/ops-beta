'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/shared/error-boundary'

// Aquí sí está permitido ssr: false porque este archivo es 'use client'
const UsersList = dynamic(() => import('./users-list').then(mod => mod.UsersList), { 
 ssr: false,
 loading: () => (
 <div className="p-20 text-center">
 <div className="animate-pulse flex flex-col items-center gap-4">
 <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
 <div className="text-slate-400 font-bold tracking-tight text-xs">Cargando gestión de equipo...</div>
 </div>
 </div>
 )
})

export function UsersClientWrapper(props: any) {
 return (
 <ErrorBoundary>
 <UsersList {...props} />
 </ErrorBoundary>
 )
}
