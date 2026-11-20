'use client'

import { useEffect, useState } from 'react'
import { 
  Building2, X, User, Mail, Shield, CheckCircle2, 
  Loader2, Copy, Users, FileText, Package, ShoppingCart, 
  Calendar, Briefcase, Info, AlertTriangle, Key, Phone,
  MessageSquare, Send, Check, Link as LinkIcon, Sparkles, ExternalLink,
  Edit3, Save, RotateCcw
} from 'lucide-react'
import { getCompanyDetails, generateClientAccessLink, updateCompanyCorporateDetails } from '@/app/(main)/super-admin/actions'
import { getPublicAppOrigin } from '@/lib/site-url'

interface CompanyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string | null
}

const INDUSTRIES = [
  'Minería y Metalurgia',
  'Construcción e Infraestructura',
  'Transporte y Logística',
  'Manufactura e Industria',
  'Servicios Generales y Contratistas',
  'Agroindustria y Alimentos',
  'Seguridad y Vigilancia',
  'Otro Sector',
]

const WORKER_RANGES = [
  '1 a 15 trabajadores',
  '16 a 50 trabajadores',
  '51 a 200 trabajadores',
  'Más de 200 trabajadores',
]

export function CompanyDetailsModal({ isOpen, onClose, companyId }: CompanyDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [accessLink, setAccessLink] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)

  // Estado de edición de los 9 datos corporativos estándar
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    taxId: '',
    contactEmail: '',
    phone: '',
    industry: 'Minería y Metalurgia',
    contactName: '',
    contactPosition: 'Gerente de Operaciones',
    estimatedWorkers: '16 a 50 trabajadores',
    notes: '',
  })

  useEffect(() => {
    if (!isOpen || !companyId) {
      setData(null)
      setError(null)
      setAccessLink(null)
      setIsEditing(false)
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      setAccessLink(null)
      setIsEditing(false)
      try {
        const res = await getCompanyDetails(companyId)
        if (res.success && res.data) {
          setData(res.data)
          setEditForm({
            name: res.data.company?.name || '',
            taxId: res.data.company?.tax_id || res.data.leadDetails?.tax_id || '',
            contactEmail: res.data.company?.contact_email || res.data.leadDetails?.email || '',
            phone: res.data.company?.phone || res.data.leadDetails?.phone || '',
            industry: res.data.company?.industry || 'Minería y Metalurgia',
            contactName: res.data.leadDetails?.contact_name || res.data.mainAdmin?.name || '',
            contactPosition: res.data.leadDetails?.contact_position || '',
            estimatedWorkers: res.data.leadDetails?.estimated_workers || '16 a 50 trabajadores',
            notes: res.data.leadDetails?.notes || '',
          })
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

  const handleSaveCorporateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return
    setIsSaving(true)
    try {
      const res = await updateCompanyCorporateDetails({
        companyId,
        ...editForm
      })
      if (res.success) {
        setIsEditing(false)
        const refreshed = await getCompanyDetails(companyId)
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data)
        }
      } else {
        alert(res.error || 'Error al actualizar los datos corporativos')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const handleCopyId = () => {
    if (!companyId) return
    navigator.clipboard.writeText(companyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyText = (text: string, type: 'login' | 'link' | 'msg') => {
    navigator.clipboard.writeText(text)
    if (type === 'login') {
      setCopiedLogin(true)
      setTimeout(() => setCopiedLogin(false), 2000)
    } else if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else if (type === 'msg') {
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    }
  }

  const handleGenerateLink = async () => {
    if (!companyId) return
    setIsGeneratingLink(true)
    try {
      const res = await generateClientAccessLink(companyId)
      if (res.success && res.actionLink) {
        setAccessLink(res.actionLink)
      } else {
        alert(res.error || 'No se pudo generar el enlace de primer acceso.')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const ensureAccessLink = async (): Promise<string | null> => {
    if (accessLink) return accessLink
    if (!companyId) return null
    setIsGeneratingLink(true)
    try {
      const res = await generateClientAccessLink(companyId)
      if (res.success && res.actionLink) {
        setAccessLink(res.actionLink)
        return res.actionLink
      } else {
        alert(res.error || 'No se pudo generar el enlace de primer acceso.')
        return null
      }
    } catch (err: any) {
      alert(err.message || 'Error al generar enlace.')
      return null
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const getCleanTargetName = () => {
    const raw = data?.leadDetails?.contact_name || data?.mainAdmin?.name || data?.company?.contact_name || ''
    if (raw && !raw.toLowerCase().includes('no especificado') && raw.trim().length > 0) {
      return raw.trim()
    }
    return 'estimado(a) cliente'
  }

  const buildAccessMessage = (link: string | null) => {
    const targetName = getCleanTargetName()
    const origin = getPublicAppOrigin()
    const loginUrl = `${origin}/login`

    if (link) {
      return `Hola, *${targetName}*.\n\nTu acceso a *INTHALY OPS* ya está listo.\n\nPara ingresar por primera vez, debes establecer tu contraseña desde el siguiente enlace:\n\n👉 *Activar mi acceso a INTHALY OPS:*\n${link}\n\nDespués de establecer tu contraseña, podrás ingresar desde:\n\n👉 *Ingresar a INTHALY OPS:*\n${loginUrl}\n\nSi necesitas ayuda, puedes responder este mensaje.`
    } else {
      return `Hola, *${targetName}*.\n\nTu acceso a *INTHALY OPS* ya está listo.\n\nPuedes ingresar a la plataforma desde:\n\n👉 *Ingresar a INTHALY OPS:*\n${loginUrl}\n(Inicia sesión con tu correo electrónico y tu contraseña registrada).\n\nSi necesitas ayuda, puedes responder este mensaje.`
    }
  }

  const handleCopyAccessMessage = async () => {
    let link = accessLink
    if (!link) {
      link = await ensureAccessLink()
    }
    const msg = buildAccessMessage(link)
    copyText(msg, 'msg')
  }

  const handleSendWhatsApp = async () => {
    const phone = data?.company?.phone || data?.leadDetails?.phone
    if (!phone) {
      alert('Esta empresa no tiene un número de teléfono o WhatsApp registrado.')
      return
    }

    // Abrir ventana inmediatamente en el evento de clic directo para evitar bloqueo de popups en el navegador
    const waWindow = window.open('about:blank', '_blank')

    try {
      let link = accessLink
      if (!link) {
        link = await ensureAccessLink()
      }
      const msg = buildAccessMessage(link)
      const clean = phone.replace(/\D/g, '')
      const waPhone = clean.startsWith('51') ? clean : (clean ? `51${clean}` : '')
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`

      if (waWindow) {
        waWindow.location.href = waUrl
      } else {
        window.location.href = waUrl
      }
    } catch (err: any) {
      if (waWindow) waWindow.close()
      alert('Error al preparar el envío por WhatsApp: ' + (err?.message || err))
    }
  }

  const handlePrepareEmail = async () => {
    const email = data?.company?.contact_email
    if (!email) {
      alert('Esta empresa no tiene un correo de contacto registrado.')
      return
    }
    let link = accessLink
    if (!link) {
      link = await ensureAccessLink()
    }
    const targetName = getCleanTargetName()
    const origin = getPublicAppOrigin()
    const loginUrl = `${origin}/login`
    const companyName = data?.company?.name || 'su empresa'
    const subject = `Acceso Corporativo a INTHALY OPS — ${companyName}`
    const body = link
      ? `Hola, ${targetName}.\n\nTu acceso a INTHALY OPS ya está listo.\n\nPara ingresar por primera vez, debes establecer tu contraseña desde el siguiente enlace:\n\n👉 Activar mi acceso a INTHALY OPS:\n${link}\n\nDespués de establecer tu contraseña, podrás ingresar desde:\n\n👉 Ingresar a INTHALY OPS:\n${loginUrl}\n\nSi necesitas ayuda, puedes responder a este correo.`
      : `Hola, ${targetName}.\n\nTu acceso a INTHALY OPS ya está listo.\n\nPuedes ingresar a la plataforma desde:\n\n👉 Ingresar a INTHALY OPS:\n${loginUrl}\n(Inicia sesión con tu correo electrónico y tu contraseña registrada).\n\nSi necesitas ayuda, puedes responder a este correo.`

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
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
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {loading ? 'Cargando...' : (data?.company?.name || 'Detalles de Empresa')}
                </h2>
                {!loading && data?.company && (
                  <>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                      data.company.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {data.company.status === 'active' ? 'Activa' : 'Suspendida'}
                    </span>
                    {data.company.is_test && (
                      <span className="bg-purple-50 text-purple-600 border border-purple-100 text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-normal">
                        Entorno de Prueba
                      </span>
                    )}
                    {data.company.tax_id && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        RUC: {data.company.tax_id}
                      </span>
                    )}
                    {data.company.industry && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        {data.company.industry}
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {companyId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400 select-all tracking-tighter">
                    UUID: {companyId}
                  </span>
                  <button 
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Copiar UUID"
                  >
                    {copied ? (
                      <span className="text-[9px] font-black text-emerald-600">Copiado</span>
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
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
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
                  className="mt-4 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Cerrar Panel
                </button>
              </div>
            </div>
          )}

          {!loading && data && (
            <>
              {/* SECCIÓN CLAVE: Acceso del Cliente e Invitación */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-blue-400" />
                    <span className="text-xs font-bold tracking-tight">Acceso del Cliente y Credenciales</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Autenticación Oficial</span>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* 1. Enlace General de Login */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                        <LinkIcon size={12} className="text-blue-600" />
                        Enlace de Acceso Normal / Login
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Cuentas con credenciales activas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${getPublicAppOrigin()}/login`}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-700 select-all outline-none"
                      />
                      <button
                        onClick={() => copyText(`${getPublicAppOrigin()}/login`, 'login')}
                        className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLogin ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar Enlace</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Enlace Seguro de Primer Acceso / Invitación */}
                  <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-tight flex items-center gap-1.5">
                        <Shield size={12} className="text-blue-600" />
                        Enlace de Primer Acceso / Invitación (Criptográfico)
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">Un solo uso • Expira en 24h</span>
                    </div>

                    {accessLink ? (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white border border-blue-200 rounded-lg font-mono text-[11px] text-slate-700 break-all select-all max-h-20 overflow-y-auto">
                          {accessLink}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => copyText(accessLink, 'link')}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            {copiedLink ? (
                              <>
                                <Check size={12} />
                                <span>¡Enlace copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copiar Enlace de Invitación</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleGenerateLink}
                            disabled={isGeneratingLink}
                            className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                          >
                            {isGeneratingLink ? 'Generando...' : 'Regenerar Enlace'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                          Genera un enlace criptográfico seguro para que el cliente configure su propia contraseña al ingresar por primera vez.
                        </p>
                        <button
                          onClick={handleGenerateLink}
                          disabled={isGeneratingLink}
                          className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {isGeneratingLink ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Generando enlace...</span>
                            </>
                          ) : (
                            <>
                              <Key size={12} />
                              <span>Generar Enlace de Primer Acceso</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Despacho Oficial por WhatsApp y Correo */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleCopyAccessMessage}
                        disabled={isGeneratingLink}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Copiar mensaje con instrucciones y enlace de primer acceso"
                      >
                        {copiedMsg ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">¡Mensaje copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar Mensaje de Acceso</span>
                          </>
                        )}
                      </button>

                      {(data.company.phone || data.leadDetails?.phone) && (
                        <button
                          onClick={handleSendWhatsApp}
                          disabled={isGeneratingLink}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Enviar por WhatsApp (incluye enlace para crear contraseña)"
                        >
                          {isGeneratingLink && !accessLink ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <MessageSquare size={12} />
                          )}
                          <span>Enviar por WhatsApp</span>
                        </button>
                      )}
                    </div>

                    {data.company.contact_email && (
                      <button
                        onClick={handlePrepareEmail}
                        disabled={isGeneratingLink}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Preparar correo de bienvenida con enlace de acceso"
                      >
                        <Mail size={12} />
                        <span>Preparar Correo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN UNIVERSAL: Ficha Corporativa y Datos de Contacto (9 Datos Estándar) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Ficha Corporativa y Datos de Contacto
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      9 Campos Estándar
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 size={12} />
                        <span>Editar Datos</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveCorporateDetails} className="p-4 sm:p-5 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* 1. Contacto */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          required
                          type="text"
                          value={editForm.contactName}
                          onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* 2. Cargo */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Cargo en la Empresa *
                        </label>
                        <input
                          required
                          type="text"
                          value={editForm.contactPosition}
                          onChange={(e) => setEditForm({ ...editForm, contactPosition: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* 3. Correo */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Correo Corporativo *
                        </label>
                        <input
                          required
                          type="email"
                          value={editForm.contactEmail}
                          onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* 4. Teléfono */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Teléfono / WhatsApp *
                        </label>
                        <input
                          required
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* 5. Nombre Empresa */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Nombre de la Empresa *
                        </label>
                        <input
                          required
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* 6. RUC */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          RUC / Identificación Fiscal *
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={11}
                          value={editForm.taxId}
                          onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value.replace(/\D/g, '') })}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none font-mono"
                        />
                      </div>

                      {/* 7. Rubro */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Rubro / Sector Operativo
                        </label>
                        <select
                          value={editForm.industry}
                          onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          {INDUSTRIES.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      {/* 8. Personal Aproximado */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Personal Aproximado
                        </label>
                        <select
                          value={editForm.estimatedWorkers}
                          onChange={(e) => setEditForm({ ...editForm, estimatedWorkers: e.target.value })}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          {WORKER_RANGES.map(rng => (
                            <option key={rng} value={rng}>{rng}</option>
                          ))}
                        </select>
                      </div>

                      {/* 9. Mensaje / Notas */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                          Requerimientos Específicos o Mensaje
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save size={12} />
                            <span>Guardar Cambios</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Nombre Empresa</span>
                      <span className="font-bold text-slate-900">{data.company?.name || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">RUC / ID Fiscal</span>
                      <span className="font-mono font-bold text-slate-900">{data.company?.tax_id || data.leadDetails?.tax_id || 'No registrado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Rubro / Sector</span>
                      <span className="font-bold text-slate-900">{data.company?.industry || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Personal Aproximado</span>
                      <span className="font-bold text-slate-800">{data.leadDetails?.estimated_workers || 'Por configurar'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Contacto Principal</span>
                      <span className="font-bold text-slate-800">{data.leadDetails?.contact_name || data.mainAdmin?.name || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Cargo en la Empresa</span>
                      <span className="font-bold text-slate-800">{data.leadDetails?.contact_position || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Correo Corporativo</span>
                      <span className="font-mono text-slate-800 truncate block">{data.company?.contact_email || data.leadDetails?.email || 'No registrado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Teléfono / WhatsApp</span>
                      <span className="font-mono font-bold text-slate-800">{data.company?.phone || data.leadDetails?.phone || 'No registrado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Estado Operativo</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${
                        data.company?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {data.company?.status === 'active' ? 'Activa en Ecosistema' : 'Suspendida / Pendiente'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                        Requerimientos Específicos o Mensaje
                      </span>
                      <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 italic text-xs leading-relaxed">
                        "{data.leadDetails?.notes || 'Sin requerimientos especiales registrados.'}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contextual Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 tracking-tight block">Usuarios</span>
                    <span className="text-2xl font-black text-slate-900">{data.users?.length || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 tracking-tight block">Trabajadores</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.workers || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 tracking-tight block">Documentos</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.documents || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 tracking-tight block">Inventario</span>
                    <span className="text-2xl font-black text-slate-900">{data.stats?.products || 0}</span>
                  </div>
                </div>
              </div>

              {/* Main Admin Highlight Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-indigo-400" />
                    <span className="text-xs font-black tracking-tight">Administrador Principal</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Contacto Soporte</span>
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
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              Área: {data.mainAdmin.area || 'Administración'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black tracking-wider ${
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
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 tracking-tight">Colaborador</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 tracking-tight">Área</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 tracking-tight text-center">Roles Activos</th>
                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 tracking-tight text-center">Estado</th>
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
                                <span key={roleName} className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
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
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
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
                  <h4 className="text-xs font-black text-slate-900 tracking-tight">Información de Soporte y Auditoría</h4>
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
          <span className="text-[10px] font-black text-slate-400 tracking-tight">Consola de Soporte Inthaly</span>
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
