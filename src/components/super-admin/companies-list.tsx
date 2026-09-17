'use client'

import { useState } from 'react'
import { 
  Building2, ExternalLink, Shield, ShieldOff, 
  Search, MapPin, Briefcase, Calendar, MoreVertical,
  Check, X, Phone, MessageSquare, Clock, Copy, CheckCircle2,
  Trash2, FlaskConical, Globe2, AlertCircle, Sparkles,
  Users, BadgeCheck, Mail, User
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
import { getPublicAppOrigin } from '@/lib/site-url'

export function CompaniesList({ companies, users = [] }: { companies: any[]; users?: any[] }) {
  const router = useRouter()
  const [masterView, setMasterView] = useState<'companies' | 'users'>('companies')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'test'>('all')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'operador'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null)
  
  // Modal de activación segura con enlace de acceso
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean
    companyName: string
    contactName: string
    phone: string
    actionLink: string | null
  }>({ isOpen: false, companyName: '', contactName: '', phone: '', actionLink: null })
  const [copied, setCopied] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)

  const parseLeadDetails = (wh: string | null) => {
    if (!wh) return null
    try {
      const parsed = typeof wh === 'string' ? JSON.parse(wh) : wh
      const isRealRequest = !!(parsed?.demo_request || parsed?.registration_request)
      return {
        ...(parsed?.lead_details || parsed?.demo_request || parsed?.registration_request || {}),
        approval_status: parsed?.approval_status || (isRealRequest ? 'pending' : null),
        request_type: parsed?.request_type || (parsed?.demo_request ? 'demo' : (parsed?.registration_request ? 'register' : null)),
        rejection_reason: parsed?.rejection_reason || null,
        is_real_request: isRealRequest
      }
    } catch {
      return null
    }
  }

  const isPending = (c: any) => {
    const status = (c.status || '').toLowerCase()
    const lead = parseLeadDetails(c.working_hours)
    return status === 'pending' || (status === 'inactive' && lead?.approval_status === 'pending' && lead?.is_real_request)
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

  const filteredUsers = (users || []).filter(u => {
    const term = userSearchTerm.toLowerCase().trim()
    const name = (u.full_name || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const comp = (u.companies?.name || '').toLowerCase()
    const role = (u.role_id || '').toLowerCase()
    const matches = !term || name.includes(term) || email.includes(term) || comp.includes(term) || role.includes(term)
    if (!matches) return false

    if (userRoleFilter === 'all') return true
    if (userRoleFilter === 'super_admin') return role === 'super_admin' || role === 'superadmin'
    if (userRoleFilter === 'admin') return role === 'admin' || role === 'administrador'
    if (userRoleFilter === 'operador') return role !== 'super_admin' && role !== 'superadmin' && role !== 'admin' && role !== 'administrador'
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

  const handleApprove = async (company: any) => {
    const rawLeadName = company.contact_name || company.registered_by_name || ''
    const contactName = rawLeadName && !rawLeadName.toLowerCase().includes('no especificado') && rawLeadName.trim().length > 0 ? rawLeadName.trim() : 'estimado(a) cliente'
    const phone = company.phone || ''
    if (!confirm(`¿Aprobar y activar la empresa "${company.name}"?\n\nEsta acción activará la cuenta, inicializará los datos base del sistema y generará el enlace seguro de primer acceso.`)) return

    setLoadingId(company.id)
    try {
      const res = await approveCompanyRequest(company.id)
      if (res.success) {
        setApprovalModal({
          isOpen: true,
          companyName: res.companyName || company.name,
          contactName,
          phone,
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
    <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Master View Switcher */}
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50/50">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/70 rounded-lg w-fit text-xs font-bold">
          <button
            onClick={() => setMasterView('companies')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              masterView === 'companies'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={13} />
            <span>Empresas del Ecosistema</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
              masterView === 'companies' ? 'bg-slate-900 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {companies.length}
            </span>
          </button>

          <button
            onClick={() => setMasterView('users')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              masterView === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={13} />
            <span>Accesos y Usuarios Globales</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
              masterView === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {users.length}
            </span>
          </button>
        </div>

        <div className="text-[10.5px] text-slate-400 font-medium">
          {masterView === 'companies' 
            ? `${filteredCompanies.length} empresas visibles` 
            : `${filteredUsers.length} usuarios registrados`}
        </div>
      </div>

      {masterView === 'companies' ? (
        <>
          {/* Subheader Filtros Empresas */}
          <div className="px-3 py-2 sm:px-3.5 sm:py-2 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">Filtrar por estado:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Tabs Filtro */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg overflow-x-auto text-[10px] font-bold">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todas ({companies.length})
                </button>
                <button 
                  onClick={() => setFilter('active')}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    filter === 'active' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Globe2 size={10} />
                  Activas
                </button>
                <button 
                  onClick={() => setFilter('pending')}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    filter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Clock size={10} />
                  Solicitudes
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[7.5px] font-black">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setFilter('suspended')}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    filter === 'suspended' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Suspendidas
                </button>
                <button 
                  onClick={() => setFilter('test')}
                  className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    filter === 'test' ? 'bg-white text-purple-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FlaskConical size={10} />
                  Prueba
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input 
                  type="text" 
                  placeholder="Buscar empresa, RUC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 pr-2.5 py-1 bg-slate-50 border-none rounded-md text-[11px] font-semibold focus:ring-2 focus:ring-slate-200 outline-none w-full sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Empresas Full Width */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Empresa / RUC</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Contacto & Rubro</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-400 font-medium text-xs">
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
                    const companyAdmin = users.find((u: any) => u.company_id === company.id && (u.role_id === 'admin' || u.role === 'admin')) || users.find((u: any) => u.company_id === company.id)
                    const rawContactName = companyAdmin?.name || leadDetails?.contact_name || leadDetails?.registered_by_name || company.contact_name || ''
                    const isValidContact = rawContactName && !rawContactName.toLowerCase().includes('no especificado') && rawContactName.trim().length > 0
                    const resolvedContactName = isValidContact ? rawContactName.trim() : ''
                    const displayContactName = resolvedContactName || 'No especificado'
                    const contactSalutation = resolvedContactName || 'estimado(a) cliente'
                    const contactPosition = leadDetails?.contact_position || (companyAdmin ? 'Administrador' : '')
                    const rawPhone = company.phone || leadDetails?.phone || ''
                    const cleanPhone = rawPhone.replace(/\D/g, '')
                    const waPhone = cleanPhone.startsWith('51') ? cleanPhone : (cleanPhone ? `51${cleanPhone}` : '')
                    const waText = pending
                      ? encodeURIComponent(`Hola ${contactSalutation}, te saludamos del equipo de INTHALY OPS respecto a tu solicitud de demostración para la empresa ${company.name}. ¿Tienes disponibilidad para coordinar una breve presentación técnica?`)
                      : encodeURIComponent(`Hola, *${contactSalutation}*.\n\nTe saludamos del equipo de *INTHALY OPS*.\nEl acceso de tu empresa *${company.name}* se encuentra activo.\n\n🌐 Puedes ingresar al sistema desde:\n${getPublicAppOrigin()}/login\n(Inicia sesión con tu correo electrónico y tu contraseña registrada).\n\nSi necesitas asistencia técnica, puedes responder este mensaje.`)

                    return (
                      <tr key={company.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10.5px] font-black shadow-2xs shrink-0 ${
                              pending
                                ? 'bg-amber-500 text-white shadow-amber-500/20'
                                : active
                                ? 'bg-slate-900 text-white shadow-slate-900/10'
                                : 'bg-slate-400 text-white shadow-slate-400/10'
                            }`}>
                              {company.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate" title={company.id}>{company.name}</span>
                                {company.is_test && (
                                  <span className="bg-purple-100 text-purple-700 text-[7.5px] px-1 py-0.2 rounded font-bold tracking-normal flex items-center gap-0.5 shrink-0">
                                    <FlaskConical size={7.5} />
                                    Prueba
                                  </span>
                                )}
                                {pending && (
                                  <span className="bg-amber-100 text-amber-800 text-[7.5px] px-1 py-0.2 rounded font-bold tracking-normal flex items-center gap-0.5 shrink-0">
                                    <Clock size={7.5} />
                                    Solicitud
                                  </span>
                                )}
                              </div>
                              {company.tax_id && (
                                <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                                  RUC: <strong className="text-slate-600 font-semibold">{company.tax_id}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex flex-col justify-center min-w-0 max-w-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-800 truncate">{displayContactName}</span>
                              {contactPosition && (
                                <span className="text-slate-400 font-normal text-[10px] truncate hidden sm:inline">
                                  ({contactPosition})
                                </span>
                              )}
                              {leadDetails?.estimated_workers && (
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded text-[7.5px] font-bold shrink-0">
                                  {leadDetails.estimated_workers} trab.
                                </span>
                              )}
                              {leadDetails?.notes && (
                                <span 
                                  className="bg-blue-50 text-blue-700 border border-blue-100 px-1 py-0.2 rounded text-[7.5px] font-bold shrink-0 cursor-help"
                                  title={`Requerimientos del cliente:\n"${leadDetails.notes}"`}
                                >
                                  Nota
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 truncate">
                              {company.contact_email && (
                                <span className="truncate text-slate-500 font-mono">{company.contact_email}</span>
                              )}
                              {company.contact_email && <span className="text-slate-300">•</span>}
                              <span className="flex items-center gap-1 truncate text-slate-500">
                                <Briefcase size={9} className="text-slate-400 shrink-0" />
                                {company.industry || company.business_type || 'Servicios'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${
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

                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Acciones para empresas PENDIENTES */}
                            {pending && (
                              <>
                                <button 
                                  onClick={() => handleApprove(company)}
                                  disabled={loadingId === company.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                  title="Aprobar Solicitud y Activar Empresa"
                                >
                                  <Check size={12} />
                                  <span>{loadingId === company.id ? '...' : 'Aprobar'}</span>
                                </button>

                                <button 
                                  onClick={() => handleReject(company.id, company.name)}
                                  disabled={loadingId === company.id}
                                  className="p-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                                  title="Rechazar Solicitud"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            )}

                            {/* Botón WhatsApp si tiene teléfono */}
                            {waPhone && (
                              <a 
                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title={pending ? `Coordinar demo por WhatsApp (+${waPhone})` : `Enviar acceso regular por WhatsApp (+${waPhone})`}
                              >
                                <MessageSquare size={12} />
                              </a>
                            )}

                            {/* Toggle de suspensión / activación */}
                            {!pending && (
                              <button 
                                onClick={() => handleToggleStatus(company.id, company.status)}
                                disabled={loadingId === company.id}
                                className={`p-1 rounded-md border transition-all cursor-pointer ${
                                  active
                                    ? 'border-rose-100 text-rose-600 bg-white hover:bg-rose-600 hover:text-white shadow-2xs'
                                    : 'border-emerald-100 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white shadow-2xs'
                                }`}
                                title={active ? 'Suspender Empresa' : 'Activar Empresa'}
                              >
                                {active ? <ShieldOff size={12} /> : <Shield size={12} />}
                              </button>
                            )}

                            {/* Ver Detalles */}
                            <button 
                              onClick={() => setSelectedDetailsId(company.id)}
                              className="p-1 border border-slate-200 text-slate-500 bg-white hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all shadow-2xs cursor-pointer"
                              title="Ver Ficha y Estadísticas"
                            >
                              <ExternalLink size={12} />
                            </button>

                            {/* Entrar como empresa (Solo para activas) */}
                            {active && (
                              <button 
                                onClick={() => handleImpersonate(company.id)}
                                disabled={loadingId === company.id}
                                className="px-2 py-0.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-all shadow-2xs flex items-center gap-1 disabled:opacity-50 text-[10px] font-bold cursor-pointer"
                                title="Entrar como empresa (Auditoría)"
                              >
                                <span className="hidden sm:inline">Entrar</span>
                                <ExternalLink size={11} />
                              </button>
                            )}

                            {/* Marca de prueba */}
                            <button 
                              onClick={() => handleToggleTest(company.id, company.is_test)}
                              disabled={loadingId === company.id}
                              className={`p-1 rounded-md border transition-all cursor-pointer ${
                                company.is_test
                                  ? 'border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white shadow-2xs'
                                  : 'border-slate-200 text-slate-400 bg-white hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                              }`}
                              title={company.is_test ? 'Quitar marca de Prueba' : 'Marcar como Empresa de Prueba'}
                            >
                              <FlaskConical size={12} />
                            </button>

                            {company.is_test && (
                              <button 
                                onClick={() => handleDelete(company.id, company.name)}
                                disabled={loadingId === company.id}
                                className="p-1 border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                                title="Eliminar Empresa de Prueba"
                              >
                                <Trash2 size={12} />
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
        </>
      ) : (
        <>
          {/* Subheader Filtros Usuarios */}
          <div className="px-3 py-2 sm:px-3.5 sm:py-2 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">Filtrar por rol:</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Role filter buttons */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg overflow-x-auto text-[10px] font-bold">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-2.5 py-0.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    userRoleFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('super_admin')}
                  className={`px-2.5 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    userRoleFilter === 'super_admin' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Shield size={10} />
                  Super Admins
                </button>
                <button
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-2.5 py-0.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    userRoleFilter === 'admin' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BadgeCheck size={10} />
                  Admins Empresa
                </button>
                <button
                  onClick={() => setUserRoleFilter('operador')}
                  className={`px-2.5 py-0.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    userRoleFilter === 'operador' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Operadores
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  type="text"
                  placeholder="Buscar usuario, email, rol..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-7 pr-2.5 py-1 bg-slate-50 border-none rounded-md text-[11px] font-semibold focus:ring-2 focus:ring-slate-200 outline-none w-full sm:w-52"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios Full Width */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Usuario / Email</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Rol en Sistema</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Empresa Asignada</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-3 py-2 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-right">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400 font-medium text-xs">
                      No se encontraron usuarios con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const role = (u.role_id || '').toLowerCase()
                    const isSuper = role === 'super_admin' || role === 'superadmin'
                    const isAdmin = role === 'admin' || role === 'administrador'
                    const displayName = u.full_name || u.email?.split('@')[0] || 'Usuario'
                    const companyName = u.companies?.name || (isSuper ? 'Acceso Global Ecosistema' : 'Sin Empresa Asignada')
                    const isInactive = u.status === 'inactive'

                    return (
                      <tr key={u.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black shadow-2xs shrink-0 ${
                              isSuper 
                                ? 'bg-purple-900 text-purple-200' 
                                : isAdmin 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-700 text-white'
                            }`}>
                              {displayName.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-slate-900 truncate">{displayName}</span>
                              <span className="text-[10px] text-slate-400 font-mono truncate">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                              <Shield size={9} />
                              Super Admin
                            </span>
                          ) : isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              <BadgeCheck size={9} />
                              Administrador
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <User size={9} />
                              {u.role_id || 'Operativo'}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            {isSuper ? (
                              <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                                <Globe2 size={11} className="text-purple-600 shrink-0" />
                                {companyName}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-800 flex items-center gap-1 truncate">
                                <Building2 size={11} className="text-slate-400 shrink-0" />
                                {companyName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                            isInactive
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {isInactive ? 'Inactivo' : 'Activo'}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-right whitespace-nowrap text-[10.5px] text-slate-400 font-medium">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CompanyDetailsModal 
        isOpen={!!selectedDetailsId} 
        onClose={() => setSelectedDetailsId(null)} 
        companyId={selectedDetailsId} 
      />

      {/* Modal de Aprobación Segura con Enlace Criptográfico */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span className="text-[11px] font-black text-emerald-600 tracking-wider">APROBACIÓN COMPLETADA</span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{approvalModal.companyName}</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La empresa ha sido transicionada a <strong>ACTIVA</strong> y sus datos base (almacenes, movimientos, configuraciones operativas) han sido inicializados exitosamente.
            </p>

            {approvalModal.actionLink ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-black text-slate-400 tracking-tight block mb-1">
                    ENLACE SEGURO DE PRIMER ACCESO (SUPABASE AUTH)
                  </label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 break-all select-all max-h-20 overflow-y-auto">
                    {approvalModal.actionLink}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => copyToClipboard(approvalModal.actionLink!)}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        ¡Enlace copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copiar Enlace
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const origin = getPublicAppOrigin()
                      const rawModalName = approvalModal.contactName || ''
                      const contactName = rawModalName && !rawModalName.toLowerCase().includes('no especificado') && rawModalName.trim().length > 0 ? rawModalName.trim() : 'estimado(a) cliente'
                      const msg = `Hola, *${contactName}*.\n\nTu acceso a *INTHALY OPS* ya está listo.\n\nPara ingresar por primera vez, debes establecer tu contraseña desde el siguiente enlace:\n\n👉 *Activar mi acceso a INTHALY OPS:*\n${approvalModal.actionLink}\n\nDespués de establecer tu contraseña, podrás ingresar desde:\n\n👉 *Ingresar a INTHALY OPS:*\n${origin}/login\n\nSi necesitas ayuda, puedes responder este mensaje.`
                      navigator.clipboard.writeText(msg)
                      setCopiedMsg(true)
                      setTimeout(() => setCopiedMsg(false), 2500)
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedMsg ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        ¡Mensaje copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copiar Mensaje
                      </>
                    )}
                  </button>
                </div>

                {approvalModal.phone && (
                  <a
                    href={`https://wa.me/${approvalModal.phone.replace(/\D/g, '').startsWith('51') ? approvalModal.phone.replace(/\D/g, '') : '51' + approvalModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      (() => {
                        const rawModalName = approvalModal.contactName || ''
                        const cName = rawModalName && !rawModalName.toLowerCase().includes('no especificado') && rawModalName.trim().length > 0 ? rawModalName.trim() : 'estimado(a) cliente'
                        return `Hola, *${cName}*.\n\nTu acceso a *INTHALY OPS* ya está listo.\n\nPara ingresar por primera vez, debes establecer tu contraseña desde el siguiente enlace:\n\n👉 *Activar mi acceso a INTHALY OPS:*\n${approvalModal.actionLink}\n\nDespués de establecer tu contraseña, podrás ingresar desde:\n\n👉 *Ingresar a INTHALY OPS:*\n${getPublicAppOrigin()}/login\n\nSi necesitas ayuda, puedes responder este mensaje.`
                      })()
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    Enviar Acceso Oficial por WhatsApp
                  </a>
                )}

                <p className="text-[10px] text-slate-400 text-center leading-tight">
                  El cliente utilizará el enlace criptográfico de un solo uso para establecer su propia contraseña. No se envían contraseñas en texto plano.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-blue-700 font-medium">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>
                  La cuenta fue activada exitosamente. El usuario ya cuenta con credenciales activas y puede iniciar sesión directamente en la plataforma.
                </span>
              </div>
            )}

            <button
              onClick={() => setApprovalModal({ isOpen: false, companyName: '', contactName: '', phone: '', actionLink: null })}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
