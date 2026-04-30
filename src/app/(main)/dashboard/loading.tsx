
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-800">Cargando Dashboard...</h2>
        <p className="text-slate-500 font-medium">Estamos preparando tu información personal</p>
      </div>
    </div>
  )
}
