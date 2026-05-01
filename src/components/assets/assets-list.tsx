'use client'

import { useState } from 'react'
import { 
  Package, Plus, Search, Filter, 
  MoreVertical, Hammer, Truck, Activity, 
  MapPin, Hash, Trash2, Pencil, ExternalLink
} from 'lucide-react'
import { AssetForm } from './asset-form'
import { deleteAsset } from '@/app/(main)/assets/actions'
import { useUserRole } from '@/components/providers/rbac-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Asset {
  id: string
  code: string
  name: string
  type: string
  status: string
  location: string
  created_at: string
}

export function AssetsList({ initialAssets }: { initialAssets: Asset[] }) {
  const router = useRouter()
  const { isAdmin } = useUserRole()
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingAsset, setEditingAsset] = useState<any>(null)

  // Sync state with props when router.refresh() updates the server component
  useEffect(() => {
    setAssets(initialAssets)
  }, [initialAssets])

  const handleEdit = (asset: any) => {
    setEditingAsset(asset)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este activo?')) return
    setIsDeleting(id)
    try {
      const result = await deleteAsset(id)
      if (result.error) alert(`Error: ${result.error}`)
      else router.refresh()
    } catch (e) {
      alert('Error inesperado')
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredAssets = assets.filter(asset => {
    const nameMatch = (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const codeMatch = (asset.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    return nameMatch || codeMatch
  })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'operativo': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'en mantenimiento': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'fuera de servicio': return 'bg-rose-50 text-rose-700 border-rose-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Package className="text-blue-600" size={24} />
            </div>
            Gestión de Activos
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Equipos y herramientas de alto valor.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Registrar Activo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o código..."
            className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-white border-2 border-slate-100 hover:bg-slate-50 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 transition-all shadow-sm">
            <Filter size={18} />
            Filtrar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Activo / Equipo</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo / Categoría</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Ubicación</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAssets.length > 0 ? filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                        <Hash className="text-slate-400" size={14} />
                      </div>
                      <span className="text-[11px] font-black text-blue-600 tracking-widest uppercase">{asset.code}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{asset.name}</p>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      {asset.type === 'equipo' ? (
                        <Truck className="text-blue-500" size={16} />
                      ) : (
                        <Hammer className="text-amber-500" size={16} />
                      )}
                      <span className="text-xs font-bold text-slate-600 capitalize">{asset.type}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${getStatusStyle(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold text-sm">
                      <MapPin size={14} className="text-slate-400" />
                      {asset.location}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => handleEdit(asset)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          disabled={isDeleting === asset.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        >
                          <Trash2 size={18} className={isDeleting === asset.id ? 'animate-pulse' : ''} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <Package size={40} />
                    </div>
                    <p className="text-slate-500 font-black text-lg">No hay activos registrados</p>
                    <p className="text-slate-400 text-sm font-medium mt-1">Registra tu primer equipo o herramienta para comenzar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetForm 
        isOpen={isModalOpen} 
        editingAsset={editingAsset}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAsset(null)
        }} 
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
