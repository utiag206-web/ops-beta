'use client'

import { useState } from 'react'
import { 
  Building2, ExternalLink, Shield, ShieldOff, 
  Search, MapPin, Briefcase, Calendar, MoreVertical,
  Check, X, Phone, MessageSquare, Clock, Copy, CheckCircle2,
  Trash2, FlaskConical, Globe2, AlertCircle, Sparkles
} from 'lucide-react'
import { 
  toggleCompanyStatus, 
  impersonateCompany, 
  deleteCompany, 
  toggleTestStatus,
  approveCompanyRequest,
  rejectCompanyRequest
} from '@/app/(main)/super-admin/actions'
import { useRouter } from 'next/navigation'
import { CompanyDetailsModal } from './company-details-modal'

export function CompaniesList({ companies }: { companies: any[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'test'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null)
  
  // Modal de activación segura con enlace de acceso
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean
    companyName: string
    actionLink: string | null
  }>({ isOpen: false, companyName: '', actionLink: null })
  const [copied, setCopied] = useState(false)

  const parseLeadDetails = (wh: string | null) => {
    if (!wh) return null
    try {
      const parsed = JSON.parse(wh)
      return {
        ...(parsed?.demo_request || parsed?.registration_request || {}),
        approval_status: parsed?.approval_status || (parsed?.demo_request || parsed?.registration_request ? 'pending' : null),
        request_type: parsed?.request_type || (parsed?.demo_request ? 'demo' : (parsed?.registration_request ? 'register' : null)),
        rejection_reason: parsed?.rejection_reason || null
      }
    } catch {
      return null
    }
  }

  const isPending = (c: any) => {
    const status = (c.status || '').toLowerCase()
    const lead = parseLeadDetails(c.working_hours)
    return status === 'pending' || (status === 'inactive' && lead?.approval_status === 'pending') || (status === 'inactive' && !!lead?.contact_name && lead?.approval_status !== 'rejected')
  }

  const isRejected = (c: any) => {
    const status = (c.status || '').toLowerCase()
    const lead = parseLeadDetails(c.working_hours)
    return status === 'rejected' || (status === 'inactive' && lead?.approval_status === 'rejected')
  }

  const isSuspended = (c: any) => {
    const status = (c.status || '').toLowerCase()
    return status === 'inactive' && !isPending(c) && !isRejected(c)
  }

  const isActive = (c: any) => {
    const status = (c.status || '').toLowerCase()
    return status === 'active'
  }

  // Contadores
  const pendingCount = companies.filter(isPending).length

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.tax_id && c.tax_id.includes(searchTerm)) ||
                          (c.contact_email && c.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (!matchesSearch) return false

    if (filter === 'all') return true
    if (filter === 'active') return isActive(c) && !c.is_test
    if (filter === 'pending') return isPending(c)
    if (filter === 'suspended') return isSuspended(c) || isRejected(c)
    if (filter === 'test') return c.is_test
    return true
  })

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!confirm(`¿Estás seguro de que deseas ${currentStatus === 'active' ? 'suspender' : 'activar'} esta empresa?`)) return
    
    setLoadingId(id)
    const res = await toggleCompanyStatus(id, currentStatus)
    setLoadingId(null)
    
    if (res?.error) alert(res.error)
    else router.refresh()
  }

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`¿Aprobar y activar la empresa "${name}"?\n\nEsta acción activará la cuenta, inicializará los datos base del sistema y generará el enlace seguro de acceso.`)) return

    setLoadingId(id)
    try {
      const res = await approveCompanyRequest(id)
      if (res.success) {
        setApprovalModal({
          isOpen: true,
          companyName: res.companyName || name,
          actionLink: res.actionLink || null
        })
        router.refresh()
      } else {
        alert(res.error || 'Error al aprobar la empresa.')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`Rechazar solicitud de "${name}".\nIngresa el motivo del rechazo (opcional):`, 'No cumple con los requisitos comerciales')
    if (reason === null) return // cancelado por el usuario

    setLoadingId(id)
    try {
      const res = await rejectCompanyRequest(id, reason)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Error al rechazar la empresa.')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Empresas del Ecosistema</h2>
          <p className="text-slate-400 text-xs font-medium">Gestión de infraestructura multi-empresa y solicitudes de demostración</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Tabs Filtro */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg overflow-x-auto text-xs font-bold">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas ({companies.length})
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${
                filter === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe2 size={12} />
              Activas
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${
                filter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock size={12} />
              Solicitudes
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setFilter('suspended')}
              className={`px-3 py-1 rounded-md transition-all whitespace-nowrap ${
                filter === 'suspended' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Suspendidas
            </button>
            <button 
              onClick={() => setFilter('test')}
              className={`px-3 py-1 rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${
                filter === 'test' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FlaskConical size={12} />
              Prueba
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="Buscar empresa, RUC, correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs font-semibold focus:ring-2 focus:ring-slate-200 outline-none w-full md:w-56"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa / RUC</th>
              <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contacto / Rubro</th>
              <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
              <th className="px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium text-xs">
                  No se encontraron empresas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => {
                const pending = isPending(company)
                const rejected = isRejected(company)
                const active = isActive(company)
                const suspended = isSuspended(company)
                const leadDetails = parseLeadDetails(company.working_hours)
                const contactName = leadDetails?.contact_name || leadDetails?.registered_by_name || 'No especificado'
                const rawPhone = company.phone || leadDetails?.phone || ''
                const cleanPhone = rawPhone.replace(/\D/g, '')
                const waPhone = cleanPhone.startsWith('51') ? cleanPhone : (cleanPhone ? `51${cleanPhone}` : '')
                const waText = encodeURIComponent(`Hola ${contactName}, te contactamos del equipo de INTHALY OPS respecto a tu solicitud para la empresa ${company.name}.`)

                return (
                  <tr key={company.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 sm:px-5 py-2.5 sm:py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shadow-xs shrink-0 ${
                          pending
                            ? 'bg-amber-500 text-white shadow-amber-500/20'
                            : active
                            ? 'bg-slate-900 text-white shadow-slate-900/10'
                            : 'bg-slate-400 text-white shadow-slate-400/10'
                        }`}>
                          {company.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{company.name}</span>
                            {company.is_test && (
                              <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.2 rounded font-bold tracking-normal flex items-center gap-1">
                                <FlaskConical size={9} />
                                Prueba
                              </span>
                            )}
                            {pending && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold tracking-normal flex items-center gap-1">
                                <Clock size={9} />
                                Solicitud
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {company.tax_id && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                                RUC: {company.tax_id}
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-slate-400 tracking-tighter">{company.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-2.5 sm:py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                          <span>{contactName}</span>
                          {company.contact_email && (
                            <span className="text-slate-400 font-normal text-[11px]">({company.contact_email})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-normal">
                          <span className="flex items-center gap-1">
                            <Briefcase size={11} className="text-slate-400" />
                            {company.industry || company.business_type || 'Servicios'}
                          </span>
                          {leadDetails?.estimated_workers && (
                            <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[9px] font-bold">
                              {leadDetails.estimated_workers} trab.
                            </span>
                          )}
                        </div>
                        {leadDetails?.notes && (
                          <p className="text-[10px] text-slate-500 italic max-w-xs truncate">
                            "{leadDetails.notes}"
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        active 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : pending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : rejected
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {active && <Globe2 size={9} />}
                        {pending && <Clock size={9} />}
                        {active ? 'Activa' : pending ? 'Pendiente' : rejected ? 'Rechazada' : 'Suspendida'}
                      </span>
                    </td>

                    <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Acciones para empresas PENDIENTES */}
                        {pending && (
                          <>
                            <button 
                              onClick={() => handleApprove(company.id, company.name)}
                              disabled={loadingId === company.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                              title="Aprobar Solicitud y Activar Empresa"
                            >
                              <Check size={13} />
                              <span>{loadingId === company.id ? '...' : 'Aprobar'}</span>
                            </button>

                            <button 
                              onClick={() => handleReject(company.id, company.name)}
                              disabled={loadingId === company.id}
                              className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-xs disabled:opacity-50"
                              title="Rechazar Solicitud"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}

                        {/* Botón WhatsApp si tiene teléfono */}
                        {waPhone && (
                          <a 
                            href={`https://wa.me/${waPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-xs flex items-center gap-1"
                            title={`Contactar por WhatsApp (+${waPhone})`}
                          >
                            <MessageSquare size={14} />
                          </a>
                        )}

                        {/* Toggle de suspensión / activación para empresas que NO están pendientes */}
                        {!pending && (
                          <button 
                            onClick={() => handleToggleStatus(company.id, company.status)}
                            disabled={loadingId === company.id}
                            className={`p-1.5 rounded-lg border transition-all ${
                              active
                                ? 'border-rose-100 text-rose-600 bg-white hover:bg-rose-600 hover:text-white shadow-xs'
                                : 'border-emerald-100 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white shadow-xs'
                            }`}
                            title={active ? 'Suspender Empresa' : 'Activar Empresa'}
                          >
                            {active ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                        )}

                        {/* Ver Detalles */}
                        <button 
                          onClick={() => setSelectedDetailsId(company.id)}
                          className="p-1.5 border border-slate-100 text-slate-400 bg-white hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all shadow-xs"
                          title="Ver Ficha y Estadísticas"
                        >
                          <ExternalLink size={14} />
                        </button>

                        {/* Entrar como empresa (Solo para activas) */}
                        {active && (
                          <button 
                            onClick={() => handleImpersonate(company.id)}
                            disabled={loadingId === company.id}
                            className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                            title="Entrar como empresa (Impersonar)"
                          >
                            <Building2 size={14} />
                            <span className="text-[10px] font-bold hidden xl:inline">
                              {loadingId === company.id ? '...' : 'Entrar'}
                            </span>
                          </button>
                        )}

                        {/* Marca de prueba */}
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
                          <FlaskConical size={16} />
                        </button>

                        {company.is_test && (
                          <button 
                            onClick={() => handleDelete(company.id, company.name)}
                            disabled={loadingId === company.id}
                            className="p-2 border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
                            title="Eliminar Empresa de Prueba"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <CompanyDetailsModal 
        isOpen={!!selectedDetailsId} 
        onClose={() => setSelectedDetailsId(null)} 
        companyId={selectedDetailsId} 
      />

      {/* Modal de Aprobación Segura con Enlace Criptográfico */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="text-[11px] font-black text-emerald-600 tracking-wider">APROBACIÓN COMPLETADA</span>
                <h3 className="text-xl font-black text-slate-900">{approvalModal.companyName}</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              La empresa ha sido transicionada a <strong>ACTIVA</strong> y sus datos base (almacenes, movimientos, configuraciones operativas) han sido inicializados exitosamente.
            </p>

            {approvalModal.actionLink ? (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-tight">
                  ENLACE SEGURO DE ACCESO / CONFIGURACIÓN (SUPABASE AUTH)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 break-all select-all max-h-24 overflow-y-auto">
                  {approvalModal.actionLink}
                </div>
                <button
                  onClick={() => copyToClipboard(approvalModal.actionLink!)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      ¡Enlace copiado al portapapeles!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copiar Enlace de Acceso Seguro
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Comparte este enlace con el administrador de la empresa para que defina su contraseña de forma encriptada. No se envían contraseñas en texto plano.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-blue-700 font-medium">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>
                  La cuenta fue activada. Si el usuario ya contaba con contraseña registrada, ahora puede iniciar sesión directamente en la plataforma.
                </span>
              </div>
            )}

            <button
              onClick={() => setApprovalModal({ isOpen: false, companyName: '', actionLink: null })}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
