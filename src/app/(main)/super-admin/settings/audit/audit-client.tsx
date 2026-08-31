'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Info, Save, Settings2, History, ListChecks, Download, ShieldCheck, Database, TableProperties } from 'lucide-react'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'
import { defaultAuditSettings, AuditSettings, mockAuditLogs } from './audit.defaults'

export function AuditClient() {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<AuditSettings>(defaultAuditSettings)

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMessage('')
    
    // Simulación de guardado asíncrono
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // TODO (Backend): Inyectar persistencia de configuración
    
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
            Los registros mostrados y configuraciones son únicamente de demostración. No se guardarán eventos de auditoría en la base de datos durante esta fase.
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
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">AUDITORÍA</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">SUPERVISA LA ACTIVIDAD ADMINISTRATIVA Y LOS EVENTOS RELEVANTES DEL ECOSISTEMA INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Activity size={12} className="text-blue-600" />
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

      {/* 1. CONFIGURACIÓN DE AUDITORÍA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CONFIGURACIÓN</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE QUÉ ACCIONES SE REGISTRARÁN EN EL LOG DEL SISTEMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Registrar acciones administrativas</span>
            <Toggle checked={settings.logAdministrativeActions} onChange={v => setSettings({...settings, logAdministrativeActions: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Registrar cambios de configuración</span>
            <Toggle checked={settings.logConfigurationChanges} onChange={v => setSettings({...settings, logConfigurationChanges: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Registrar cambios de roles</span>
            <Toggle checked={settings.logRoleChanges} onChange={v => setSettings({...settings, logRoleChanges: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Registrar eventos críticos</span>
            <Toggle checked={settings.logCriticalEvents} onChange={v => setSettings({...settings, logCriticalEvents: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">Registrar accesos de Super Admin</span>
            <Toggle checked={settings.logSuperAdminAccess} onChange={v => setSettings({...settings, logSuperAdminAccess: v})} />
          </div>
        </div>
      </div>

      {/* 2. RETENCIÓN DE REGISTROS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">RETENCIÓN</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">TIEMPO DE ALMACENAMIENTO DEL HISTORIAL DE AUDITORÍA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <label className={labelClasses}>PERÍODO DE RETENCIÓN DE REGISTROS</label>
            <select 
              className={inputClasses}
              value={settings.retentionPeriodDays}
              onChange={e => setSettings({...settings, retentionPeriodDays: parseInt(e.target.value)})}
            >
              <option value={30}>30 DÍAS</option>
              <option value={90}>90 DÍAS</option>
              <option value={180}>180 DÍAS</option>
              <option value={365}>365 DÍAS</option>
            </select>
          </div>

          <div className="flex flex-col justify-center gap-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">ELIMINACIÓN AUTOMÁTICA</span>
              <Toggle checked={settings.autoDeleteEnabled} onChange={v => setSettings({...settings, autoDeleteEnabled: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">PERMITIR EXPORTACIÓN</span>
              <Toggle checked={settings.exportAllowed} onChange={v => setSettings({...settings, exportAllowed: v})} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. EVENTOS AUDITADOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
            <ListChecks size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">EVENTOS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CLASIFICACIÓN Y FILTRO POR CATEGORÍAS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30">
          {/* Administración */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-tight uppercase text-slate-400 border-b border-slate-200 pb-2">ADMINISTRACIÓN</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Inicio de sesión Super Admin</span>
              <Toggle checked={settings.eventAdminLogin} onChange={v => setSettings({...settings, eventAdminLogin: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Cierre de sesión</span>
              <Toggle checked={settings.eventAdminLogout} onChange={v => setSettings({...settings, eventAdminLogout: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Cambio de configuración</span>
              <Toggle checked={settings.eventConfigChange} onChange={v => setSettings({...settings, eventConfigChange: v})} />
            </div>
          </div>

          {/* Empresas */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-tight uppercase text-slate-400 border-b border-slate-200 pb-2">EMPRESAS</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Creación</span>
              <Toggle checked={settings.eventCompanyCreate} onChange={v => setSettings({...settings, eventCompanyCreate: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Suspensión</span>
              <Toggle checked={settings.eventCompanySuspend} onChange={v => setSettings({...settings, eventCompanySuspend: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Reactivación</span>
              <Toggle checked={settings.eventCompanyReactivate} onChange={v => setSettings({...settings, eventCompanyReactivate: v})} />
            </div>
          </div>

          {/* Usuarios */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-tight uppercase text-slate-400 border-b border-slate-200 pb-2">USUARIOS</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Alta</span>
              <Toggle checked={settings.eventUserCreate} onChange={v => setSettings({...settings, eventUserCreate: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Baja / Suspensión</span>
              <Toggle checked={settings.eventUserSuspend} onChange={v => setSettings({...settings, eventUserSuspend: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Cambio de roles</span>
              <Toggle checked={settings.eventUserRoleChange} onChange={v => setSettings({...settings, eventUserRoleChange: v})} />
            </div>
          </div>

          {/* Seguridad */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-tight uppercase text-slate-400 border-b border-slate-200 pb-2">SEGURIDAD</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Cambio de contraseña</span>
              <Toggle checked={settings.eventPasswordChange} onChange={v => setSettings({...settings, eventPasswordChange: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Recuperación</span>
              <Toggle checked={settings.eventPasswordRecovery} onChange={v => setSettings({...settings, eventPasswordRecovery: v})} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">Intentos fallidos</span>
              <Toggle checked={settings.eventFailedLoginAttempts} onChange={v => setSettings({...settings, eventFailedLoginAttempts: v})} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISTA PREVIA DE REGISTROS (TABLA) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <TableProperties size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">VISTA PREVIA DE REGISTROS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">MUESTRA DE LA TRAZABILIDAD (DATOS FICTICIOS).</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-tight">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-tight">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-tight">Módulo</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-tight">Acción</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-tight">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockAuditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-600 font-medium whitespace-nowrap">{log.date}</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-800 whitespace-nowrap">{log.user}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">{log.module}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700">{log.action}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase ${
                      log.status === 'Exitoso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. EXPORTACIÓN */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
            <Download size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">EXPORTACIÓN</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DESCARGA DE ARCHIVOS DE AUDITORÍA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/30">
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">EXPORTAR CSV</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-50 text-purple-600 uppercase">PREPARADO PARA BACKEND</span>
          </button>
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">EXPORTAR EXCEL</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-50 text-purple-600 uppercase">PREPARADO PARA BACKEND</span>
          </button>
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">EXPORTAR PDF</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-50 text-purple-600 uppercase">PREPARADO PARA BACKEND</span>
          </button>
        </div>
      </div>

      {/* 6. ESTADO DEL SISTEMA DE AUDITORÍA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shrink-0">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">ESTADO DEL SISTEMA DE AUDITORÍA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">RESUMEN DEL ENTORNO DE MONITOREO.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          <StatusIndicator label="REGISTRO DE EVENTOS" status="PREPARADO" />
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">RETENCIÓN</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-700">CONFIGURADA</span>
          </div>
          <StatusIndicator label="EXPORTACIÓN" status="PREPARADA" />
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">INTEGRACIÓN BACKEND</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-700">PENDIENTE</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">LOGS DEL SISTEMA</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-700">PENDIENTE</span>
          </div>
        </div>
      </div>

    </div>
  )
}
