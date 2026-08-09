'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, Save, MapPin, Phone, Upload, CheckCircle2, 
  AlertTriangle, ShieldAlert, KeyRound, Users, Lock, 
  ShieldCheck, UserCheck, Hash, Clock, FileCheck, 
  ChevronDown, ChevronUp, Calendar, BadgeDollarSign, Bell, Layers
} from 'lucide-react'
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from './actions'
import { CompanyAuthSettings, DEFAULT_AUTH_SETTINGS, getCompanyAuthSettings, extractPlainWorkingHours } from '@/lib/company-auth-settings'
import { CompanyHrSettings, DEFAULT_HR_SETTINGS, getCompanyHrSettings, formatWorkerCode } from '@/lib/company-hr-settings'
import { FormField, FormInput, FormSelect, FormToggleCard, FormSectionHeader } from '@/components/shared/form-controls'

export default function CompanyProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    contact_email: '',
    tax_id: '',
    industry: '',
    timezone: 'UTC-5',
    working_hours: '',
    logo_url: ''
  })
  const [authSettings, setAuthSettings] = useState<CompanyAuthSettings>(DEFAULT_AUTH_SETTINGS)
  const [hrSettings, setHrSettings] = useState<CompanyHrSettings>(DEFAULT_HR_SETTINGS)

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    general: true,
    hr: true,
    portal: false,
    tareo: true,
    operation: false,
    cajaChica: false,
    notifications: false
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    async function loadData() {
      const profile = await getCompanyProfile()
      if (profile) {
        const settings = getCompanyAuthSettings(profile)
        const hrSet = getCompanyHrSettings(profile)
        const plainHours = extractPlainWorkingHours(profile.working_hours)
        setFormData(prev => ({
          ...prev,
          name: profile.name || '',
          address: profile.address || '',
          phone: profile.phone || '',
          contact_email: profile.contact_email || '',
          tax_id: profile.tax_id || '',
          industry: profile.industry || '',
          timezone: profile.timezone || 'UTC-5',
          working_hours: plainHours,
          logo_url: profile.logo_url || ''
        }))
        setAuthSettings(settings)
        setHrSettings(hrSet)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateCompanyProfile({
      ...formData,
      auth_settings: authSettings,
      hr_settings: hrSettings
    })
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Configuración de empresa actualizada correctamente.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans antialiased px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Centro de Parametrización</h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Configuración centralizada, tareo, asistencia GPS y políticas multiempresa.</p>
        </div>
        <div className="bg-blue-50/80 px-3.5 py-1.5 rounded-xl border border-blue-100/80 flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-blue-700 font-extrabold text-[11px] tracking-wider uppercase">Configuración Activa</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Accordion Sections */}
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3.5 animate-in fade-in slide-in-from-top-4 duration-300 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className={`p-1.5 rounded-lg shrink-0 ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              </div>
              <p className="text-xs font-bold leading-snug">{message.text}</p>
            </div>
          )}

          {/* ▼ ACCORDION 1: DETALLES OPERATIVOS E INFORMACIÓN GENERAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('general')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200 shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Detalles Operativos e Información General</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Razón social, RUC, dirección, correo y teléfono principal.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.general ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.general && (
              <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField label="Razón Social" required>
                    <FormInput
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Corporación Inthaly S.A.C."
                      accentColor="blue"
                    />
                  </FormField>

                  <FormField label="ID Fiscal / RUC">
                    <FormInput
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="Ej. 20123456789"
                      accentColor="blue"
                    />
                  </FormField>
                </div>

                <FormField label="Dirección Matriz" required>
                  <div className="relative w-full">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <FormInput
                      required
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Av. Javier Prado Este 1234, San Isidro, Lima"
                      className="pl-10"
                      accentColor="blue"
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField label="E-mail Corporativo" required>
                    <FormInput
                      required
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="contacto@empresa.com"
                      accentColor="blue"
                    />
                  </FormField>

                  <FormField label="Teléfono de Contacto">
                    <div className="relative w-full">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <FormInput
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+51 987 654 321"
                        className="pl-10"
                        accentColor="blue"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Logo Uploader */}
                <div className="pt-2">
                  <FormField label="Logo de la Empresa (PNG/JPG)">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      {formData.logo_url ? (
                        <div className="w-16 h-16 rounded-lg bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0">
                          <img src={formData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Building2 size={24} />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm">
                            <Upload size={14} />
                            Subir Logo
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setSaving(true)
                                  const fd = new FormData()
                                  fd.append('file', file)
                                  const res = await uploadCompanyLogo(fd)
                                  if (res.success && res.url) {
                                    setFormData(prev => ({ ...prev, logo_url: res.url }))
                                    setMessage({ type: 'success', text: 'Logo actualizado correctamente.' })
                                    router.refresh()
                                  } else {
                                    setMessage({ type: 'error', text: res.error || 'Error al subir.' })
                                  }
                                  setSaving(false)
                                }
                              }}
                            />
                          </label>
                          {formData.logo_url && (
                            <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Recomendado: Imagen cuadrada de al menos 400x400 px.</p>
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 2: RECURSOS HUMANOS Y CÓDIGOS AUTOMÁTICOS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('hr')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200 shrink-0">
                  <UserCheck size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Recursos Humanos y Códigos de Trabajadores</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Parametrización de códigos automáticos y controles de personal.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.hr ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.hr && (
              <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 border-t border-slate-100">
                {/* Header Preview Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Hash size={16} className="text-blue-600 shrink-0" />
                      Generación Automática de Código de Trabajador
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Formateo correlativo automático al registrar e importar personal.</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">VISTA PREVIA:</span>
                    <span className="px-3 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg shadow-sm tracking-wider">
                      {formatWorkerCode(hrSettings.code_settings)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Prefijo de Código" required>
                    <FormInput
                      type="text"
                      value={hrSettings.code_settings.code_prefix}
                      onChange={(e) => setHrSettings(prev => ({
                        ...prev,
                        code_settings: { ...prev.code_settings, code_prefix: e.target.value.toUpperCase() }
                      }))}
                      placeholder="Ej. EMP, TRB, MIN"
                      className="uppercase"
                      accentColor="blue"
                    />
                  </FormField>

                  <FormField label="Longitud de Número" required>
                    <FormSelect
                      value={hrSettings.code_settings.code_length}
                      onChange={(e) => setHrSettings(prev => ({
                        ...prev,
                        code_settings: { ...prev.code_settings, code_length: Number(e.target.value) }
                      }))}
                      accentColor="blue"
                    >
                      <option value={4}>4 dígitos (ej: 0001)</option>
                      <option value={5}>5 dígitos (ej: 00001)</option>
                      <option value={6}>6 dígitos (ej: 000001)</option>
                      <option value={8}>8 dígitos (ej: 00000001)</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Número Inicial Correlativo" required>
                    <FormInput
                      type="number"
                      min={1}
                      value={hrSettings.code_settings.initial_number}
                      onChange={(e) => setHrSettings(prev => ({
                        ...prev,
                        code_settings: { ...prev.code_settings, initial_number: Math.max(1, Number(e.target.value)) }
                      }))}
                      accentColor="blue"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormToggleCard
                    label="Generación Automática"
                    description="Asigna código al crear personal"
                    checked={hrSettings.code_settings.auto_generate_code}
                    onChange={(checked) => setHrSettings(prev => ({
                      ...prev,
                      code_settings: { ...prev.code_settings, auto_generate_code: checked }
                    }))}
                    accentColor="blue"
                  />

                  <FormToggleCard
                    label="Rellenar con Ceros"
                    description="Agrega ceros a la izquierda"
                    checked={hrSettings.code_settings.pad_with_zeros}
                    onChange={(checked) => setHrSettings(prev => ({
                      ...prev,
                      code_settings: { ...prev.code_settings, pad_with_zeros: checked }
                    }))}
                    accentColor="blue"
                  />

                  <FormToggleCard
                    label="Incremento Correlativo"
                    description="Incrementa +1 automáticamente"
                    checked={hrSettings.code_settings.auto_increment}
                    onChange={(checked) => setHrSettings(prev => ({
                      ...prev,
                      code_settings: { ...prev.code_settings, auto_increment: checked }
                    }))}
                    accentColor="blue"
                  />
                </div>

                {/* Sub-block 2: HR Active Modules */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <FormSectionHeader
                    icon={<FileCheck size={16} />}
                    title="Módulos y Controles de RRHH Activos"
                    description="Activa o desactiva las herramientas habilitadas para esta empresa."
                    accentColor="blue"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'enable_vacations', label: 'Control de Vacaciones' },
                      { key: 'enable_permissions', label: 'Permisos y Licencias' },
                      { key: 'enable_medical_leave', label: 'Descansos Médicos' },
                      { key: 'enable_contracts', label: 'Gestión de Contratos' },
                      { key: 'enable_renewals', label: 'Alertas de Renovación' },
                      { key: 'enable_document_control', label: 'Control Documental' }
                    ].map(mod => (
                      <FormToggleCard
                        key={mod.key}
                        label={mod.label}
                        checked={(hrSettings.modules_settings as any)[mod.key]}
                        onChange={(checked) => setHrSettings(prev => ({
                          ...prev,
                          modules_settings: { ...prev.modules_settings, [mod.key]: checked }
                        }))}
                        accentColor="blue"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 3: CONFIGURACIÓN DE TAREO Y ASISTENCIA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('tareo')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200 shrink-0">
                  <Clock size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Configuración de Tareo y Asistencia</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Jornada laboral, horas extras, tolerancias, margen de tardanza y marcación GPS.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.tareo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.tareo && (
              <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-200 border-t border-slate-100">
                {/* 1. JORNADA LABORAL */}
                <div className="space-y-4">
                  <FormSectionHeader
                    icon={<Calendar size={16} />}
                    title="Jornada Laboral y Días de Trabajo"
                    description="Especifica los horarios de referencia y la carga diaria reglamentaria."
                    accentColor="indigo"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField label="Horas por Día" required>
                      <FormInput
                        type="number"
                        step="0.25"
                        min={1}
                        max={24}
                        value={hrSettings.attendance_settings.daily_hours || 8}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, daily_hours: Number(e.target.value) }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>

                    <FormField label="Hora de Ingreso" required>
                      <FormInput
                        type="time"
                        value={hrSettings.attendance_settings.entry_time || '08:30'}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, entry_time: e.target.value }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>

                    <FormField label="Hora de Salida" required>
                      <FormInput
                        type="time"
                        value={hrSettings.attendance_settings.exit_time || '18:00'}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, exit_time: e.target.value }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>

                    <FormField label="Refrigerio (Min)" required>
                      <FormInput
                        type="number"
                        min={0}
                        value={hrSettings.attendance_settings.break_time_minutes || 60}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, break_time_minutes: Number(e.target.value) }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>
                  </div>

                  {/* Días laborables */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Días Laborables Habituales
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                        const isSelected = (hrSettings.attendance_settings.working_days || []).includes(day)
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              const current = hrSettings.attendance_settings.working_days || []
                              const updated = isSelected ? current.filter(d => d !== day) : [...current, day]
                              setHrSettings(prev => ({
                                ...prev,
                                attendance_settings: { ...prev.attendance_settings, working_days: updated }
                              }))
                            }}
                            className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center leading-none ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. HORAS EXTRAS */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <FormSectionHeader
                    icon={<Clock size={16} />}
                    title="Parámetros de Horas Extras"
                    description="Configuración del cálculo automático de tiempo adicional."
                    accentColor="indigo"
                    action={
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hrSettings.attendance_settings.allow_overtime}
                          onChange={(e) => setHrSettings(prev => ({
                            ...prev,
                            attendance_settings: { ...prev.attendance_settings, allow_overtime: e.target.checked }
                          }))}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">Activar Horas Extras</span>
                      </label>
                    }
                  />

                  {hrSettings.attendance_settings.allow_overtime && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                      <FormField label="Margen de Inicio (Min)" helpText="Minutos tras salida para cómputo">
                        <FormInput
                          type="number"
                          min={0}
                          value={hrSettings.attendance_settings.overtime_start_after_minutes || 0}
                          onChange={(e) => setHrSettings(prev => ({
                            ...prev,
                            attendance_settings: { ...prev.attendance_settings, overtime_start_after_minutes: Number(e.target.value) }
                          }))}
                          placeholder="Ej. 0 o 15"
                          accentColor="indigo"
                        />
                      </FormField>

                      <FormField label="Mínimo a Computar (Min)" helpText="Permanencia mínima requerida">
                        <FormInput
                          type="number"
                          min={0}
                          value={hrSettings.attendance_settings.min_overtime_minutes || 30}
                          onChange={(e) => setHrSettings(prev => ({
                            ...prev,
                            attendance_settings: { ...prev.attendance_settings, min_overtime_minutes: Number(e.target.value) }
                          }))}
                          placeholder="Ej. 30"
                          accentColor="indigo"
                        />
                      </FormField>

                      <FormField label="Redondeo de HE" helpText="Ajuste automático de minutos">
                        <FormSelect
                          value={hrSettings.attendance_settings.rounding_mode || 'NONE'}
                          onChange={(e) => setHrSettings(prev => ({
                            ...prev,
                            attendance_settings: { ...prev.attendance_settings, rounding_mode: e.target.value as any }
                          }))}
                          accentColor="indigo"
                        >
                          <option value="NONE">Sin Redondeo (Exacto)</option>
                          <option value="NEAREST_15">Redondeo a 15 Minutos</option>
                          <option value="NEAREST_30">Redondeo a 30 Minutos</option>
                        </FormSelect>
                      </FormField>
                    </div>
                  )}
                </div>

                {/* 3. TOLERANCIAS Y GRACIA */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <FormSectionHeader
                    icon={<Clock size={16} />}
                    title="Tolerancias y Margen de Tardanza"
                    description="Límites máximos de impuntualidad sin penalización."
                    accentColor="indigo"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Tolerancia Ingreso (Min)">
                      <FormInput
                        type="number"
                        min={0}
                        value={hrSettings.attendance_settings.late_tolerance_minutes || 15}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, late_tolerance_minutes: Number(e.target.value) }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>

                    <FormField label="Tolerancia Salida (Min)">
                      <FormInput
                        type="number"
                        min={0}
                        value={hrSettings.attendance_settings.late_tolerance_exit_minutes || 15}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, late_tolerance_exit_minutes: Number(e.target.value) }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>

                    <FormField label="Margen de Gracia (Min)">
                      <FormInput
                        type="number"
                        min={0}
                        value={hrSettings.attendance_settings.tardiness_grace_period_minutes || 5}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, tardiness_grace_period_minutes: Number(e.target.value) }
                        }))}
                        accentColor="indigo"
                      />
                    </FormField>
                  </div>
                </div>

                {/* 4. ASISTENCIA MEDIANTE GPS */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <MapPin size={16} className="text-indigo-600 shrink-0" />
                        Asistencia mediante Coordenadas GPS
                      </h4>
                      <p className="text-[11px] text-indigo-800 font-medium leading-normal">
                        Captura automáticamente la ubicación (Lat/Lng) del trabajador desde el navegador o móvil al marcar ingreso/salida.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto">
                      <input
                        type="checkbox"
                        checked={hrSettings.attendance_settings.enable_gps_tracking !== false}
                        onChange={(e) => setHrSettings(prev => ({
                          ...prev,
                          attendance_settings: { ...prev.attendance_settings, enable_gps_tracking: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-indigo-950">Rastreo GPS Activo</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 4: PORTAL DE TRABAJADORES - AUTENTICACIÓN Y ACCESO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('portal')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200 shrink-0">
                  <KeyRound size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Portal de Trabajadores - Autenticación y Acceso</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Métodos de identificación, PIN por defecto y primer acceso de colaboradores.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.portal ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.portal && (
              <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField label="Método de Identificación" required helpText="Identificador exigido al iniciar sesión">
                    <FormSelect
                      value={authSettings.login_mode}
                      onChange={(e) => setAuthSettings(prev => ({ ...prev, login_mode: e.target.value as any }))}
                      accentColor="emerald"
                    >
                      <option value="DNI_OR_COD">DNI o Código de Trabajador (Híbrido)</option>
                      <option value="DNI_ONLY">Únicamente DNI (8 dígitos)</option>
                      <option value="COD_ONLY">Únicamente Código de Trabajador</option>
                      <option value="EMAIL">Correo Electrónico Corporativo</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Contraseña Inicial / PIN" required helpText="Clave asignada automáticamente por defecto">
                    <FormSelect
                      value={authSettings.secret_mode}
                      onChange={(e) => setAuthSettings(prev => ({ ...prev, secret_mode: e.target.value as any }))}
                      accentColor="emerald"
                    >
                      <option value="DNI_DEFAULT">DNI del Trabajador (Predeterminado)</option>
                      <option value="BIRTHDATE">Fecha de Nacimiento (DDMMAAAA)</option>
                      <option value="CUSTOM_PIN">PIN Asignado (4-6 dígitos)</option>
                      <option value="PASSWORD">Contraseña Personalizada</option>
                    </FormSelect>
                  </FormField>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <FormSectionHeader
                    icon={<ShieldCheck size={16} />}
                    title="Políticas de Primer Ingreso y Seguridad"
                    description="Reglas para el establecimiento de contraseñas."
                    accentColor="emerald"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormToggleCard
                      label="Obligar cambio de contraseña"
                      description="Exige clave personal en el primer inicio"
                      checked={authSettings.require_pin_change_on_first_login}
                      onChange={(checked) => setAuthSettings(prev => ({ ...prev, require_pin_change_on_first_login: checked }))}
                      accentColor="emerald"
                    />

                    <FormToggleCard
                      label="Permitir mantener contraseña inicial"
                      description="El trabajador puede conservar su clave por defecto"
                      checked={authSettings.allow_keep_initial_password}
                      onChange={(checked) => setAuthSettings(prev => ({ ...prev, allow_keep_initial_password: checked }))}
                      accentColor="emerald"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 5: PARÁMETROS DE OPERACIÓN E INDUSTRIA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('operation')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-slate-700 p-2.5 rounded-xl text-white shadow-md shadow-slate-200 shrink-0">
                  <Layers size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Parámetros de Operación e Industria</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Sector corporativo, zona horaria y horario general sugerido.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.operation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.operation && (
              <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <FormField label="Sector / Industria">
                    <FormSelect
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      accentColor="blue"
                    >
                      <option value="">Seleccionar sector...</option>
                      <option value="Minera">Minería y Energía</option>
                      <option value="Construcción">Construcción</option>
                      <option value="Servicios">Servicios Generales</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Transporte">Transporte y Logística</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Zona Horaria">
                    <FormSelect
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      accentColor="blue"
                    >
                      <option value="UTC-5">Perú, Colombia (UTC-5)</option>
                      <option value="UTC-4">Chile, Bolivia (UTC-4)</option>
                      <option value="UTC-3">Argentina, Brasil (UTC-3)</option>
                    </FormSelect>
                  </FormField>
                </div>

                <FormField label="Horario Laboral Sugerido">
                  <FormInput
                    type="text"
                    value={formData.working_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, working_hours: e.target.value }))}
                    placeholder="Ej. Lunes a Viernes 08:30 - 18:00"
                    accentColor="blue"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 6: CAJA CHICA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('cajaChica')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200 shrink-0">
                  <BadgeDollarSign size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Caja Chica y Control Financiero</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Exportación contable en Excel, topes por área y autorizaciones.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.cajaChica ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.cajaChica && (
              <div className="p-5 sm:p-6 animate-in fade-in duration-200 border-t border-slate-100">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">Exportación a Excel Profesional Activa</h4>
                    <p className="text-[11px] text-emerald-800 font-medium">El módulo de Caja Chica cuenta con reporte institucional contable y cálculo de saldos en tiempo real.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ▼ ACCORDION 7: NOTIFICACIONES Y ALERTAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection('notifications')}
              className="w-full p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-md shadow-amber-200 shrink-0">
                  <Bell size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">Notificaciones y Alertas Automáticas</h3>
                  <p className="text-xs font-medium text-slate-500 truncate">Alertas de tardanzas, vencimientos de contrato e inspecciones SOMA.</p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 shrink-0 ml-2">
                {openSections.notifications ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {openSections.notifications && (
              <div className="p-5 sm:p-6 animate-in fade-in duration-200 border-t border-slate-100">
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center gap-3">
                  <Bell className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950">Sistema de Alertas en Tiempo Real</h4>
                    <p className="text-[11px] text-amber-800 font-medium">Notificaciones push e historial de marcaciones configurados para la empresa.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Tips (Mobile drops below cleanly, Desktop sticky) */}
        <div className="space-y-6 lg:col-span-1 order-last lg:order-none w-full">
          <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80 lg:sticky lg:top-8 space-y-6">
            <div>
              <h4 className="text-lg font-extrabold text-slate-800">Guardar Cambios</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Asegúrate de confirmar la información antes de aplicar los cambios a la empresa.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 text-white h-12 rounded-xl font-extrabold transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2.5 group cursor-pointer text-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-b-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Save size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Confirmar y Guardar</span>
                </>
              )}
            </button>

            <div className="space-y-3 pt-5 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={12} />
                </div>
                <p className="text-xs font-medium text-slate-600 leading-normal">
                  Los parámetros de Tareo alimentan automáticamente la Matriz de Asistencia.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert size={12} />
                </div>
                <p className="text-xs font-medium text-slate-600 leading-normal">
                  Campos con (<span className="text-rose-500 font-bold">*</span>) son obligatorios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
