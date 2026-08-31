'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, BellRing, Info, Save, Radio, Mail, Smartphone, Globe, CalendarClock, Settings2, Activity } from 'lucide-react'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'
import { defaultNotificationSettings, NotificationSettings } from './notifications.defaults'

export function NotificationsClient() {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings)

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMessage('')
    
    // Simulación de guardado asíncrono
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // TODO (Backend): Inyectar persistencia
    
    setIsSaving(false)
    setSuccessMessage('CAMBIOS GUARDADOS (SIMULACIÓN LOCAL)')
    
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const inputClasses = "h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
  const labelClasses = "text-xs font-bold text-slate-500 mb-2 block tracking-tight uppercase"

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
      {/* Banner de Modo Simulación */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex gap-3">
        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-800 tracking-tight uppercase">MODO SIMULACIÓN</h3>
          <p className="text-xs font-medium text-amber-700/80 mt-1">
            Las configuraciones mostradas son locales y preparan la futura integración con los servicios reales de notificación.
          </p>
        </div>
      </div>

      {/* Encabezado y Navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex-1">
          <Link 
            href="/super-admin/settings"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 uppercase tracking-tight"
          >
            <ArrowLeft size={16} />
            CONFIGURACIÓN
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">NOTIFICACIONES</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">ADMINISTRA LOS CANALES Y POLÍTICAS DE NOTIFICACIÓN DEL ECOSISTEMA INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Bell size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto justify-center uppercase tracking-tight"
        >
          <Save size={18} />
          {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 uppercase tracking-tight">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {successMessage}
        </div>
      )}

      {/* 1. CANALES DISPONIBLES */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CANALES DISPONIBLES</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">ACTIVA O DESACTIVA LOS CANALES DE COMUNICACIÓN A NIVEL GLOBAL.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Correo Electrónico</span>
            <Toggle checked={settings.channelEmail} onChange={v => setSettings({...settings, channelEmail: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Plataforma (In-App)</span>
            <Toggle checked={settings.channelInApp} onChange={v => setSettings({...settings, channelInApp: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700 uppercase">Notificaciones Push</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500">PRÓXIMAMENTE</span>
            </div>
            <Toggle checked={settings.channelPush} onChange={v => setSettings({...settings, channelPush: v})} disabled />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700 uppercase">SMS</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500">PRÓXIMAMENTE</span>
            </div>
            <Toggle checked={settings.channelSms} onChange={v => setSettings({...settings, channelSms: v})} disabled />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700 uppercase">WhatsApp Business</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500">PRÓXIMAMENTE</span>
            </div>
            <Toggle checked={settings.channelWhatsapp} onChange={v => setSettings({...settings, channelWhatsapp: v})} disabled />
          </div>
        </div>
      </div>

      {/* 2. EVENTOS DEL SISTEMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">EVENTOS QUE GENERAN NOTIFICACIONES</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE QUÉ ACCIONES DISPARAN UNA ALERTA EN EL ECOSISTEMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">NUEVO USUARIO REGISTRADO</span>
            <Toggle checked={settings.eventNewUser} onChange={v => setSettings({...settings, eventNewUser: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">NUEVA EMPRESA CREADA</span>
            <Toggle checked={settings.eventNewCompany} onChange={v => setSettings({...settings, eventNewCompany: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">CAMBIO DE CONTRASEÑA</span>
            <Toggle checked={settings.eventPasswordChange} onChange={v => setSettings({...settings, eventPasswordChange: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">RESTABLECIMIENTO DE CONTRASEÑA</span>
            <Toggle checked={settings.eventPasswordReset} onChange={v => setSettings({...settings, eventPasswordReset: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">SUSPENSIÓN DE EMPRESA</span>
            <Toggle checked={settings.eventCompanySuspend} onChange={v => setSettings({...settings, eventCompanySuspend: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">REACTIVACIÓN DE EMPRESA</span>
            <Toggle checked={settings.eventCompanyReactivate} onChange={v => setSettings({...settings, eventCompanyReactivate: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">ERROR CRÍTICO DEL SISTEMA</span>
            <Toggle checked={settings.eventCriticalError} onChange={v => setSettings({...settings, eventCriticalError: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">NUEVA ACTUALIZACIÓN DISPONIBLE</span>
            <Toggle checked={settings.eventSystemUpdate} onChange={v => setSettings({...settings, eventSystemUpdate: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">CAMBIO DE CONFIGURACIÓN GLOBAL</span>
            <Toggle checked={settings.eventGlobalSettingsChange} onChange={v => setSettings({...settings, eventGlobalSettingsChange: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">ACCIONES DEL SUPER ADMIN</span>
            <Toggle checked={settings.eventSuperAdminAction} onChange={v => setSettings({...settings, eventSuperAdminAction: v})} />
          </div>
        </div>
      </div>

      {/* 3. RECORDATORIOS AUTOMÁTICOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <CalendarClock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">RECORDATORIOS AUTOMÁTICOS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">PROGRAMA AVISOS RECURRENTES PARA TAREAS Y EVENTOS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          {[
            { label: 'Tareas pendientes', toggleField: 'reminderTasks', freqField: 'reminderTasksFreq' },
            { label: 'Documentos por vencer', toggleField: 'reminderDocuments', freqField: 'reminderDocumentsFreq' },
            { label: 'Asistencia', toggleField: 'reminderAttendance', freqField: 'reminderAttendanceFreq' },
            { label: 'Vacaciones', toggleField: 'reminderVacations', freqField: 'reminderVacationsFreq' },
            { label: 'Vencimiento de licencias', toggleField: 'reminderLicenses', freqField: 'reminderLicensesFreq' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 uppercase">{item.label}</span>
                <Toggle 
                  checked={settings[item.toggleField as keyof NotificationSettings] as boolean} 
                  onChange={v => setSettings({...settings, [item.toggleField]: v})} 
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Frecuencia:</span>
                <select 
                  className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 outline-none focus:border-blue-500 bg-slate-50"
                  value={settings[item.freqField as keyof NotificationSettings] as string}
                  onChange={e => setSettings({...settings, [item.freqField]: e.target.value})}
                  disabled={!(settings[item.toggleField as keyof NotificationSettings] as boolean)}
                >
                  <option value="Diario">DIARIO</option>
                  <option value="Semanal">SEMANAL</option>
                  <option value="Mensual">MENSUAL</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CORREOS AUTOMÁTICOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CORREOS AUTOMÁTICOS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">PLANTILLAS Y TRANSACCIONALES ENVIADOS POR EL SISTEMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-slate-50/30">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase">Bienvenida a nuevos usuarios</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase">Recuperación de contraseña</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase">Confirmación de creación de empresa</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase">Confirmación de cambio de contraseña</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase">Alertas administrativas</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">BACKEND PENDIENTE — NO SE ENVIARÁN CORREOS REALES</span>
          </div>
        </div>
      </div>

      {/* 5. PREFERENCIAS GENERALES */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">PREFERENCIAS GENERALES</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">AJUSTES TRANSVERSALES PARA EL ENVÍO DE NOTIFICACIONES.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <label className={labelClasses}>IDIOMA DE LAS NOTIFICACIONES</label>
            <select 
              className={inputClasses}
              value={settings.prefLanguage}
              onChange={e => setSettings({...settings, prefLanguage: e.target.value})}
            >
              <option value="Español">ESPAÑOL</option>
              <option value="Inglés">INGLÉS</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>ZONA HORARIA UTILIZADA</label>
            <select 
              className={inputClasses}
              value={settings.prefTimezone}
              onChange={e => setSettings({...settings, prefTimezone: e.target.value})}
            >
              <option value="America/Lima">AMERICA/LIMA</option>
              <option value="America/Bogota">AMERICA/BOGOTA</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>HORARIO PERMITIDO PARA ENVÍOS</label>
            <select 
              className={inputClasses}
              value={settings.prefTimeRange}
              onChange={e => setSettings({...settings, prefTimeRange: e.target.value})}
            >
              <option value="08:00 - 18:00">08:00 - 18:00</option>
              <option value="24/7">24 HORAS (SIN RESTRICCIÓN)</option>
            </select>
          </div>

          <div className="flex flex-col justify-center gap-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">AGRUPAR NOTIFICACIONES SIMILARES</span>
              <Toggle checked={settings.prefGroupSimilar} onChange={v => setSettings({...settings, prefGroupSimilar: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">ENVIAR RESUMEN DIARIO</span>
              <Toggle checked={settings.prefDailySummary} onChange={v => setSettings({...settings, prefDailySummary: v})} />
            </div>
          </div>
        </div>
      </div>

      {/* 6. ESTADO DE LOS SERVICIOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">ESTADO DE LOS SERVICIOS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DISPONIBILIDAD DE LOS PROVEEDORES DE MENSAJERÍA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          <StatusIndicator label="SERVICIO DE CORREO" status="PREPARADO" />
          <StatusIndicator label="PUSH NOTIFICATIONS" status="PREPARADO" />
          <StatusIndicator label="WHATSAPP" status="PREPARADO" />
          <StatusIndicator label="SMS" status="PREPARADO" />
          <StatusIndicator label="WEBHOOKS" status="PREPARADO" />
        </div>
      </div>

    </div>
  )
}
