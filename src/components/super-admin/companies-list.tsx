'use client'

import { useState } from 'react'
import { 
  Building2, ExternalLink, Shield, ShieldOff, 
  Search, MapPin, Briefcase, Calendar, MoreVertical
} from 'lucide-react'
import { 
  toggleCompanyStatus, 
  impersonateCompany,
  deleteCompany,
  toggleTestStatus 
} from '@/app/(main)/super-admin/actions'
import { useRouter } from 'next/navigation'
import { Trash2, FlaskConical, Globe2 } from 'lucide-react'
import { CompanyDetailsModal } from './company-details-modal'

export function CompaniesList({ companies }: { companies: any[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'real' | 'test'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null)


  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'all') return matchesSearch
    if (filter === 'real') return matchesSearch && !c.is_test
    if (filter === 'test') return matchesSearch && c.is_test
    return matchesSearch
  })

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!confirm(`¿Estás seguro de que deseas ${currentStatus === 'active' ? 'suspender' : 'activar'} esta empresa?`)) return
    
    setLoadingId(id)
    const res = await toggleCompanyStatus(id, currentStatus)
    setLoadingId(null)
    
    if (res?.error) alert(res.error)
    else router.refresh()
  }

  const handleImpersonate = async (id: string) => {
    setLoadingId(id)
    const res = await impersonateCompany(id)
    if (res.success) {
      window.location.href = '/dashboard'
    } else {
      setLoadingId(null)
      alert('Error al entrar como empresa')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción eliminará permanentemente la empresa "${name}" y todos sus datos. Esta acción no se puede deshacer.`)) return
    
    const confirmName = prompt(`Escribe el nombre de la empresa "${name}" para confirmar la eliminación:`)
    if (confirmName !== name) {
      alert('El nombre no coincide. Eliminación cancelada.')
      return
    }

    setLoadingId(id)
    try {
      const res = await deleteCompany(id)
      if (res.success) {
        router.refresh()
      } else {
        alert('Error al eliminar empresa')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleToggleTest = async (id: string, currentIsTest: boolean) => {
    setLoadingId(id)
    const res = await toggleTestStatus(id, !currentIsTest)
    setLoadingId(null)
    if (res?.error) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Empresas del Ecosistema</h2>
          <p className="text-slate-400 text-sm font-medium">Gestión de infraestructura multi-empresa</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Tabs Filtro */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter('real')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                filter === 'real' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe2 size={14} />
              Reales
            </button>
            <button 
              onClick={() => setFilter('test')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                filter === 'test' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FlaskConical size={14} />
              Prueba
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Información</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCompanies.map((company) => (
              <tr key={company.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-900/10">
                      {company.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{company.name}</span>
                        {company.is_test && (
                          <span className="bg-purple-100 text-purple-700 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center gap-1">
                            <FlaskConical size={10} />
                            Prueba
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase">{company.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <Briefcase size={14} className="text-slate-300" />
                      <span>{company.business_type || 'No especificado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <MapPin size={14} className="text-slate-300" />
                      <span>{company.country || 'Global'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    company.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {company.status === 'active' ? 'Activa' : 'Suspendida'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleToggleStatus(company.id, company.status)}
                      disabled={loadingId === company.id}
                      className={`p-2 rounded-xl border transition-all ${
                        company.status === 'active'
                        ? 'border-rose-100 text-rose-600 bg-white hover:bg-rose-600 hover:text-white shadow-sm'
                        : 'border-emerald-100 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white shadow-sm'
                      }`}
                      title={company.status === 'active' ? 'Suspender Empresa' : 'Activar Empresa'}
                    >
                      {company.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                    </button>
                    
                    <button 
                      onClick={() => setSelectedDetailsId(company.id)}
                      className="p-2 border border-slate-100 text-slate-400 bg-white hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                      title="Ver Detalles"
                    >
                      <ExternalLink size={18} />
                    </button>

                    <button 
                      onClick={() => handleImpersonate(company.id)}
                      disabled={loadingId === company.id}
                      className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
                      title="Entrar como empresa (Impersonar)"
                    >
                      <Building2 size={18} />
                      <span className="text-[10px] font-black uppercase hidden lg:inline">
                        {loadingId === company.id ? 'Entrando...' : 'Entrar'}
                      </span>
                    </button>

                    <button 
                      onClick={() => handleToggleTest(company.id, company.is_test)}
                      disabled={loadingId === company.id}
                      className={`p-2 rounded-xl border transition-all ${
                        company.is_test
                        ? 'border-purple-100 text-purple-600 bg-white hover:bg-purple-600 hover:text-white shadow-sm'
                        : 'border-slate-100 text-slate-400 bg-white hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                      }`}
                      title={company.is_test ? 'Quitar marca de Prueba' : 'Marcar como Empresa de Prueba'}
                    >
                      <FlaskConical size={18} />
                    </button>

                    {company.is_test && (
                      <button 
                        onClick={() => handleDelete(company.id, company.name)}
                        disabled={loadingId === company.id}
                        className="p-2 border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        title="Eliminar Empresa de Prueba"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CompanyDetailsModal 
        isOpen={!!selectedDetailsId} 
        onClose={() => setSelectedDetailsId(null)} 
        companyId={selectedDetailsId} 
      />
    </div>
  )
}
