'use client'

import { useState, useEffect } from 'react'
import { 
  getWarehouses, 
  deleteWarehouse 
} from '@/app/(main)/inventory/actions'
import { WarehouseForm } from '@/components/inventory/warehouse-form'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Factory, 
  Loader2,
  AlertCircle,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { useUserRole } from '@/components/providers/rbac-provider'

export default function WarehousesPage() {
  const { role_id, isAdmin } = useUserRole()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getWarehouses()
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setWarehouses(res.data)
      }
    } catch (err: any) {
      toast.error('Error al conectar con el servidor de inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      toast.error('No tienes permisos para eliminar almacenes')
      return
    }

    if (!confirm(`¿Estás seguro de eliminar el almacén "${name}"?`)) return

    try {
      const res = await deleteWarehouse(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Almacén eliminado correctamente')
        loadData()
      }
    } catch (err: any) {
      toast.error('Error al eliminar almacén')
    }
  }

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (w.code && w.code.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
            <Factory size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Almacenes</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Configuración Maestra / ERP</p>
            </div>
          </div>
        </div>

        {['admin', 'gerente', 'almacen', 'logistica', 'operaciones', 'administracion'].includes(role_id || '') && (
          <button 
            onClick={() => {
              setEditingWarehouse(null)
              setIsModalOpen(true)
            }}
            className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={20} className="stroke-[3px]" />
            <span className="uppercase tracking-widest text-xs">Nuevo Almacén</span>
          </button>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="relative group max-w-xl">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Buscar por nombre o código de almacén..."
          className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid de Almacenes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando ubicaciones...</p>
        </div>
      ) : filteredWarehouses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((w) => (
            <div key={w.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all hover:border-indigo-200">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <MapPin size={24} />
                </div>
                {['admin', 'gerente', 'almacen', 'logistica', 'operaciones', 'administracion'].includes(role_id || '') && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingWarehouse(w)
                        setIsModalOpen(true)
                      }}
                      className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    {(isAdmin || role_id === 'gerente') && (
                      <button 
                        onClick={() => handleDelete(w.id, w.name)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight line-clamp-1">{w.name}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  {w.code || 'SIN CÓDIGO'}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                  ID: {w.id.slice(0, 8)}...
                </span>
                <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
                  Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-slate-50 p-6 rounded-full text-slate-300">
            <AlertCircle size={48} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">No se encontraron almacenes</h3>
            <p className="text-slate-500 text-sm font-medium">Prueba con otra búsqueda o crea una nueva ubicación.</p>
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      <WarehouseForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingWarehouse={editingWarehouse}
        onSuccess={() => loadData()}
      />
    </div>
  )
}
