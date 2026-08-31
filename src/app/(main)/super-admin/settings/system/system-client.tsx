'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Server, Info, Save, Activity, Settings2, Zap, FileText, Wrench, ShieldCheck } from 'lucide-react'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'
import { defaultSystemSettings, SystemSettings } from './system.defaults'

export function SystemClient() {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings)

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
            Ninguna acción en esta pantalla modifica el sistema real. Esta interfaz prepara la futura integración con los servicios administrativos.
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
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">SISTEMA</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">ADMINISTRA EL ESTADO GENERAL Y LA CONFIGURACIÓN GLOBAL DE LA PLATAFORMA INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Server size={12} className="text-blue-600" />
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

      {/* 1. ESTADO GENERAL DE LA PLATAFORMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">ESTADO DE LA PLATAFORMA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">INDICADORES DE SALUD DE LOS COMPONENTES PRINCIPALES.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          <StatusIndicator label="PLATAFORMA" status="ACTIVA" badge="OPERATIVA" />
          <StatusIndicator label="API" status="ACTIVA" badge="OPERATIVA" />
          <StatusIndicator label="BASE DE DATOS" status="ACTIVA" badge="OPERATIVA" />
          <StatusIndicator label="AUTENTICACIÓN" status="ACTIVA" badge="OPERATIVA" />
          <StatusIndicator label="ALMACENAMIENTO" status="ACTIVO" badge="OPERATIVO" />
        </div>
      </div>

      {/* 2. CONFIGURACIÓN DEL SISTEMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CONFIGURACIÓN DEL SISTEMA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">PARÁMETROS GLOBALES Y MODO MANTENIMIENTO.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">MODO MANTENIMIENTO</span>
            <Toggle checked={settings.maintenanceMode} onChange={v => setSettings({...settings, maintenanceMode: v})} />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">MOSTRAR MENSAJE DE MANTENIMIENTO</span>
            <Toggle checked={settings.showMaintenanceMessage} onChange={v => setSettings({...settings, showMaintenanceMessage: v})} disabled={!settings.maintenanceMode} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>MENSAJE DE MANTENIMIENTO</label>
            <textarea 
              className={`${inputClasses} h-24 py-3 resize-none`}
              value={settings.maintenanceMessage}
              onChange={e => setSettings({...settings, maintenanceMessage: e.target.value})}
              disabled={!settings.maintenanceMode}
            />
          </div>

          <div>
            <label className={labelClasses}>ZONA HORARIA GLOBAL</label>
            <select 
              className={inputClasses}
              value={settings.globalTimezone}
              onChange={e => setSettings({...settings, globalTimezone: e.target.value})}
            >
              <option value="America/Lima">AMERICA/LIMA</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>IDIOMA PREDETERMINADO</label>
            <select 
              className={inputClasses}
              value={settings.defaultLanguage}
              onChange={e => setSettings({...settings, defaultLanguage: e.target.value})}
            >
              <option value="Español">ESPAÑOL</option>
              <option value="Inglés">INGLÉS</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. RENDIMIENTO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">RENDIMIENTO</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">AJUSTES DE OPTIMIZACIÓN Y CACHÉ.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">OPTIMIZACIÓN AUTOMÁTICA</span>
            <Toggle checked={settings.autoOptimization} onChange={v => setSettings({...settings, autoOptimization: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">LIMPIEZA AUTOMÁTICA DE CACHÉ</span>
            <Toggle checked={settings.autoCacheClear} onChange={v => setSettings({...settings, autoCacheClear: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">COMPRESIÓN DE RECURSOS</span>
            <Toggle checked={settings.resourceCompression} onChange={v => setSettings({...settings, resourceCompression: v})} />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 uppercase">ACTUALIZACIÓN DE ESTADÍSTICAS</span>
            <Toggle checked={settings.autoStatsUpdate} onChange={v => setSettings({...settings, autoStatsUpdate: v})} />
          </div>
        </div>
      </div>

      {/* 4. REGISTROS DEL SISTEMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">REGISTROS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">VISUALIZACIÓN Y GESTIÓN DE LOGS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator label="REGISTRO DE ERRORES" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DE ADVERTENCIAS" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DE EVENTOS" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DEL SISTEMA" status="PREPARADO" />
        </div>
      </div>

      {/* 5. SERVICIOS INTERNOS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Server size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">SERVICIOS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">MONITOREO DE SERVICIOS SECUNDARIOS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator label="SERVICIO DE AUTENTICACIÓN" status="PREPARADO" />
          <StatusIndicator label="SERVICIO DE ARCHIVOS" status="PREPARADO" />
          <StatusIndicator label="SERVICIO DE NOTIFICACIONES" status="PREPARADO" />
          <StatusIndicator label="SERVICIO DE REPORTES" status="PREPARADO" />
          <StatusIndicator label="TAREAS PROGRAMADAS" status="PREPARADA" />
        </div>
      </div>

      {/* 6. MANTENIMIENTO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">MANTENIMIENTO</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">ACCIONES ADMINISTRATIVAS DEL SISTEMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/30">
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">LIMPIAR CACHÉ</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 uppercase">DISPONIBLE EN FUTURA IMPLEMENTACIÓN</span>
          </button>
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">REGENERAR ÍNDICES</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 uppercase">DISPONIBLE EN FUTURA IMPLEMENTACIÓN</span>
          </button>
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">REINICIAR SERVICIOS</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 uppercase">DISPONIBLE EN FUTURA IMPLEMENTACIÓN</span>
          </button>
          <button disabled className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed">
            <span className="text-sm font-bold text-slate-700 uppercase">ACTUALIZAR CONFIGURACIÓN</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 uppercase">DISPONIBLE EN FUTURA IMPLEMENTACIÓN</span>
          </button>
        </div>
      </div>

      {/* 7. RESUMEN DEL SISTEMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">RESUMEN DEL CENTRO DE CONFIGURACIÓN</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">ESTADO DE LOS MÓDULOS DE CONFIGURACIÓN GLOBAL.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">CONFIGURACIÓN GLOBAL</span>
            <span className="text-sm font-black text-emerald-600 uppercase">ACTIVA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">SEGURIDAD</span>
            <span className="text-sm font-black text-emerald-600 uppercase">CONFIGURADA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">MULTIEMPRESA</span>
            <span className="text-sm font-black text-emerald-600 uppercase">CONFIGURADA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">NOTIFICACIONES</span>
            <span className="text-sm font-black text-emerald-600 uppercase">CONFIGURADAS</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">AUDITORÍA</span>
            <span className="text-sm font-black text-amber-500 uppercase">PENDIENTE</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">SISTEMA</span>
            <span className="text-sm font-black text-blue-600 uppercase">EN CONFIGURACIÓN</span>
          </div>
        </div>
      </div>

    </div>
  )
}
