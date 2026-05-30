'use client'

import { useEffect, useState } from 'react'
import { 
  Building2, X, User, Mail, Shield, CheckCircle2, 
  Loader2, Copy, Users, FileText, Package, ShoppingCart, 
  Calendar, Briefcase, Info, AlertTriangle, Key
} from 'lucide-react'
import { getCompanyDetails } from '@/app/(main)/super-admin/actions'

interface CompanyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string | null
}

export function CompanyDetailsModal({ isOpen, onClose, companyId }: CompanyDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !companyId) {
      setData(null)
      setError(null)
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getCompanyDetails(companyId)
        if (res.success) {
          setData(res.data)
        } else {
          setError(res.error || 'Error al obtener los detalles de la empresa')
        }
      } catch (err: any) {
        setError(err.message || 'Error inesperado al cargar la información')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, companyId])

  if (!isOpen) return null

  const handleCopyId = () => {
    if (!companyId) return
    navigator.clipboard.writeText(companyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-50 w-full max-w-4xl h-screen overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-950/20 shrink-0">
              {data?.company?.name?.substring(0, 1).toUpperCase() || <Building2 size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {loading ? 'Cargando...' : (data?.company?.name || 'Detalles de Empresa')}
                </h2>
                {!loading && data?.company && (
                  <>
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      data.company.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {data.company.status === 'active' ? 'Activa' : 'Suspendida'}
                    </span>
                    {data.company.is_test && (
                      <span className="bg-purple-50 text-purple-600 border border-purple-100 text-[10px] px-3 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Entorno de Prueba
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {companyId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400 select-all uppercase tracking-tighter">
                    UUID: {companyId}
                  </span>
                  <button 
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                    title="Copiar UUID"
                  >
                    {copied ? (
                      <span className="text-[9px] font-black text-emerald-600 uppercase">Copiado</span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="animate-spin text-slate-900" size={40} />
              <p className="text-slate-500 font-bold text-sm">Consultando infraestructura del tenant...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-[2rem] text-sm font-bold flex items-start gap-4">
              <AlertTriangle size={24} className="shrink-0 text-rose-500" />
              <div>
                <h4 className="font-black text-rose-900 text-base mb-1">Error de Carga</h4>
                <p>{error}</p>
                <button 
                  onClick={onClose}
                  className="mt-4 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors"
                >
                  Cerrar Panel
                </button>
              </div>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Contextual Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Usuarios</span>
                    <span className="text-2xl font-black text-slate-900">{data.users?.length || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Trabajadores</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.workers || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Documentos</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.documents || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inventario</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.products || 0}</span>
                  </div>
                </div>
              </div>

              {/* Main Admin Highlight Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Administrador Principal</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Contacto Soporte</span>
                </div>
                
                <div className="p-6">
                  {data.mainAdmin ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                          <User size={28} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-snug">{data.mainAdmin.name}</h4>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Mail size={12} className="text-slate-300" />
                              {data.mainAdmin.email}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                              Área: {data.mainAdmin.area || 'Administración'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          data.mainAdmin.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          Cuenta: {data.mainAdmin.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                        
                        <a 
                          href={`mailto:${data.mainAdmin.email}`}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-slate-900/10 shrink-0"
                        >
                          <Mail size={14} />
                          Contactar
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-amber-600 p-2 bg-amber-50/50 rounded-xl border border-amber-100">
                      <Info size={16} />
                      <span className="text-xs font-bold">No se detectó un administrador explícito para esta empresa.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Users Table */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Usuarios del Tenant</h3>
                    <p className="text-slate-400 text-xs font-medium">Accesos operativos y roles autorizados</p>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-bold">
                    {data.users?.length || 0} Registrados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Roles Activos</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(data.users || []).map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {u.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm leading-none mb-1">{u.name}</span>
                                <span className="text-xs text-slate-400 font-mono select-all">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">
                            {u.area || 'Sin Área'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {u.roles?.map((roleName: string) => (
                                <span key={roleName} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  ['admin', 'super_admin'].includes(roleName?.toLowerCase())
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                  {roleName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                            }`}>
                              {u.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!data.users || data.users.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold">
                            No se encontraron usuarios asignados a esta empresa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Contextual Support/Audit Info */}
              <div className="bg-slate-100/50 p-6 rounded-[2rem] border border-slate-200/60 flex items-start gap-4">
                <Info className="text-slate-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Información de Soporte y Auditoría</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Esta vista consolidada permite a los superadministradores auditar el estado del tenant sin impersonar. La información de los usuarios se obtiene de forma unificada mediante mapeo dinámico de roles de base de datos (`user_roles`) y roles históricos directos. Las métricas contextuales se actualizan en tiempo real basándose en los registros transaccionales activos.
                  </p>
                  {data.company.created_at && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-bold">
                      <Calendar size={14} className="text-slate-300" />
                      <span>Registrado en el ecosistema el: {new Date(data.company.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-inner">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consola de Soporte Inthaly</span>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-slate-900/10"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  )
}
