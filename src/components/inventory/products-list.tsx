'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Filter, Hash, Box, 
  Trash2, Pencil, Package, AlertTriangle, 
  Tag, Activity, LayoutGrid, Eye
} from 'lucide-react'
import { ProductForm } from './product-form'
import { useUserRole } from '@/components/providers/rbac-provider'
import { deleteProduct } from '@/app/(main)/inventory/actions'

interface Product {
  id: string
  code: string
  name: string
  category: string
  unit: string
  type: string
  has_expiry: boolean
  expiry_date?: string
  equivalence?: string
  min_stock: number
  total_stock: number
  created_at: string
}

export function ProductsList({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const { role_id, isAdmin } = useUserRole()
  const isAlmacen = role_id === 'almacen'
  const isLogistica = role_id === 'logistica'
  const isOperaciones = role_id === 'operaciones'
  const isAdministracion = role_id === 'administracion'
  const isGerente = role_id === 'gerente'
  const canModifyProducts = isAdmin || isLogistica || isAlmacen || isOperaciones || isAdministracion || isGerente

  const [products, setProducts] = useState<Product[]>(initialProducts)

  // Sync internal state when props change (Reactive Sync)
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return
    
    setIsDeleting(id)
    try {
      const result = await deleteProduct(id)
      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Error inesperado al eliminar.')
    } finally {
      setIsDeleting(null)
    }
  }

  const categories = [...new Set(initialProducts.map(p => p.category || 'VARIOS'))].sort()

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'todos' || (p.category || 'VARIOS') === categoryFilter
    const matchesType = typeFilter === 'todos' || p.type === typeFilter
    
    return matchesSearch && matchesCategory && matchesType
  })

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setViewMode(false)
    setIsModalOpen(true)
  }

  const handleView = (product: Product) => {
    setEditingProduct(product)
    setViewMode(true)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingProduct(null)
    setViewMode(false)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Box className="text-indigo-600" size={24} />
            </div>
            Catálogo de Productos
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Maestro de insumos e inventario base.</p>
        </div>
        {canModifyProducts && (
          <button 
            onClick={handleNew}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, descripción o SKU..."
            className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white border-2 border-slate-100 focus-within:border-indigo-500 rounded-2xl flex items-center px-4 transition-all shadow-sm h-[54px]">
            <select 
              className="bg-transparent w-full outline-none text-[11px] font-black uppercase tracking-tighter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="todos">Todos los Rubros</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 bg-white border-2 border-slate-100 focus-within:border-indigo-500 rounded-2xl flex items-center px-4 transition-all shadow-sm h-[54px]">
            <select 
              className="bg-transparent w-full outline-none text-[11px] font-black uppercase tracking-tighter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="todos">Todos los Tipos</option>
              <option value="activo">Activo</option>
              <option value="consumible">Consumible</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rubro</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Descripción del Producto</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Unidad</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Actual</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Mín</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Vence</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-white transition-colors shrink-0">
                        <Tag className="text-indigo-400" size={14} />
                      </div>
                      <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                        {product.code || 'S/N'}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-[10px] font-black text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-tight whitespace-nowrap">
                      {product.category || 'VARIOS'}
                    </span>
                  </td>
                  <td className="py-5 px-6 min-w-[200px]">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">
                      {product.name}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      {product.unit}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                      product.type === 'consumible' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {product.type}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex justify-center">
                      <div className="px-4 py-1.5 bg-indigo-50/50 text-indigo-700 rounded-xl font-black text-sm border border-indigo-100 min-w-[70px] shadow-sm">
                        {['UND', 'UNIDAD', 'PAR', 'CAJA'].includes((product.unit || '').toUpperCase()) ? Math.round(product.total_stock ?? 0) : (product.total_stock ?? 0)}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-xs font-black text-slate-800 underline decoration-indigo-200 decoration-2 underline-offset-4">
                      {product.min_stock}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    {product.has_expiry ? (
                      <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2.5 py-1.5 rounded-md uppercase border border-rose-100">
                        {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'SÍ'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">—</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button 
                        onClick={() => handleView(product)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      {canModifyProducts && (
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting === product.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className={isDeleting === product.id ? 'animate-pulse' : ''} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <LayoutGrid size={40} />
                    </div>
                    <p className="text-slate-500 font-black text-lg">No hay productos en el catálogo</p>
                    <p className="text-slate-400 text-sm font-medium mt-1">Comienza registrando los insumos base de la empresa.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => router.refresh()}
        editingProduct={editingProduct}
        isViewOnly={viewMode}
      />
    </div>
  )
}
