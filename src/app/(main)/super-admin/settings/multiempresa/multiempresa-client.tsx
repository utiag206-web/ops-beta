'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building, ShieldCheck, Settings2, Sliders, Repeat, KeyRound, Server, Save, RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'
import { defaultMultiCompanySettings, MultiCompanySettings } from './multiempresa.defaults'
import { updateMultiCompanySettings } from './actions'

interface MultiempresaClientProps {
  initialSettings?: MultiCompanySettings
  initialLastSynced?: string | null
  companyStats?: {
    total: number
    active: number
    suspended: number
  }
}

export function MultiempresaClient({
  initialSettings = defaultMultiCompanySettings,
  initialLastSynced = null,
  companyStats = { total: 0, active: 0, suspended: 0 }
}: MultiempresaClientProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<MultiCompanySettings>(initialSettings)
  const [lastSynced, setLastSynced] = useState<string | null>(initialLastSynced)

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMessage('')
    
    try {
      const res = await updateMultiCompanySettings(settings)
      if (res.success) {
        if (res.lastSynced) setLastSynced(res.lastSynced)
        setSuccessMessage('CAMBIOS GUARDADOS Y APLICADOS EN TIEMPO REAL')
        toast.success('Configuración multiempresa actualizada y persistida en base de datos.')
        setTimeout(() => {
          setSuccessMessage('')
        }, 4000)
      } else {
        toast.error(res.error || 'Error al guardar la configuración.')
      }
    } catch (err: any) {
      toast.error('Error de conexión al guardar configuración.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleModule = (module: string) => {
    setSettings(prev => {
      const exists = prev.availableModules.includes(module)
      return {
        ...prev,
        availableModules: exists
          ? prev.availableModules.filter(m => m !== module)
          : [...prev.availableModules, module]
      }
    })
  }

  const inputClasses = "h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
  const labelClasses = "text-xs font-bold text-slate-500 mb-2 block tracking-tight uppercase"
  
  const allModules = ['TAREO', 'WORKERS', 'INVENTARIO', 'PPE', 'REPORTES', 'TRANSPORTE', 'BONOS', 'DOCUMENTOS', 'CAMPAMENTO']

  // Formato legible de fecha de sincronización
  const formattedSyncDate = lastSynced 
    ? new Date(lastSynced).toLocaleString('es-PE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    : 'EN LÍNEA (ACTUALIZADO)'

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
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
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">MULTIEMPRESA</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">ADMINISTRA LA ESTRUCTURA, LOS LÍMITES Y LAS POLÍTICAS GLOBALES DEL ENTORNO MULTIEMPRESA DE INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Building size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <RefreshCw size={12} className="text-emerald-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">ÚLTIMA SINCRONIZACIÓN: {formattedSyncDate}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto justify-center uppercase tracking-tight cursor-pointer"
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

      {/* 1. GESTIÓN DE EMPRESAS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">GESTIÓN DE EMPRESAS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE EL COMPORTAMIENTO GENERAL DE LAS EMPRESAS DENTRO DE LA PLATAFORMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="md:col-span-2 p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">PERMITIR CREACIÓN DE NUEVAS EMPRESAS</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Habilita o bloquea administrativamente el registro de nuevos tenants</span>
            </div>
            <Toggle 
              checked={settings.allowNewCompanies} 
              onChange={v => setSettings({...settings, allowNewCompanies: v})} 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>ESTADO INICIAL DE UNA NUEVA EMPRESA</label>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">ACTIVO</span>
            </div>
            <select 
              className={inputClasses}
              value={settings.defaultCompanyStatus}
              onChange={e => setSettings({...settings, defaultCompanyStatus: e.target.value as any})}
            >
              <option value="ACTIVA">ACTIVA (HABILITADA INMEDIATAMENTE)</option>
              <option value="PENDIENTE">PENDIENTE (REQUIERE ACTIVACIÓN)</option>
              <option value="REVISIÓN">REVISIÓN (AUDITORÍA PREVIA)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>IDENTIFICADOR DE EMPRESA</label>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">ACTIVO</span>
            </div>
            <select 
              className={inputClasses}
              value={settings.companyIdentifierMode}
              onChange={e => setSettings({...settings, companyIdentifierMode: e.target.value as any})}
            >
              <option value="AUTOMÁTICO">AUTOMÁTICO (SLUG AUTOGENERADO)</option>
              <option value="MANUAL">MANUAL (ESPECIFICADO POR ADMIN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. AISLAMIENTO MULTIEMPRESA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">AISLAMIENTO MULTIEMPRESA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">SUPERVISA LOS CONTROLES QUE GARANTIZAN LA SEPARACIÓN DE DATOS ENTRE EMPRESAS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator 
            label="AISLAMIENTO POR EMPRESA" 
            status="ACTIVO" 
            description="LOS DATOS SE ENCUENTRAN ASOCIADOS A SU EMPRESA CORRESPONDIENTE (COMPANY_ID)." 
          />
          <StatusIndicator 
            label="PROTECCIÓN RLS" 
            status="ACTIVA" 
            description="LAS POLÍTICAS DE SEGURIDAD EN POSTGRESQL PROTEGEN EL ACCESO ENTRE TENANTS." 
          />
          <StatusIndicator 
            label="IDENTIFICACIÓN DE TENANT" 
            status="ACTIVA" 
            description="LA PLATAFORMA RESUELVE EL CONTEXTO AISLADO MEDIANTE COOKIES Y CABECERAS SEGURAS." 
          />
          <StatusIndicator 
            label="VALIDACIÓN DE ACCESO" 
            status="ACTIVA" 
            description="EL ACCESO A LOS RECURSOS RESPETA ESTRICTAMENTE EL CONTEXTO Y ROL DE LA EMPRESA." 
          />
        </div>
      </div>

      {/* 3. CONFIGURACIÓN PREDETERMINADA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CONFIGURACIÓN PREDETERMINADA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE LOS VALORES INICIALES QUE SE APLICAN AUTOMÁTICAMENTE AL CREAR UNA NUEVA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>ZONA HORARIA PREDETERMINADA</label>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">HERENCIA ACTIVA</span>
            </div>
            <select 
              className={inputClasses}
              value={settings.defaultTimezone}
              onChange={e => setSettings({...settings, defaultTimezone: e.target.value})}
            >
              <option value="America/Lima">AMERICA/LIMA (UTC-5)</option>
              <option value="America/Bogota">AMERICA/BOGOTA (UTC-5)</option>
              <option value="America/Santiago">AMERICA/SANTIAGO (UTC-4)</option>
              <option value="UTC">UTC (TIEMPO UNIVERSAL)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>FORMATO DE FECHA</label>
            <select 
              className={inputClasses}
              value={settings.defaultDateFormat}
              onChange={e => setSettings({...settings, defaultDateFormat: e.target.value})}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>IDIOMA PREDETERMINADO</label>
            <select 
              className={inputClasses}
              value={settings.defaultLanguage}
              onChange={e => setSettings({...settings, defaultLanguage: e.target.value})}
            >
              <option value="ESPAÑOL">ESPAÑOL</option>
              <option value="ENGLISH">ENGLISH</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>MONEDA PREDETERMINADA</label>
            <select 
              className={inputClasses}
              value={settings.defaultCurrency}
              onChange={e => setSettings({...settings, defaultCurrency: e.target.value})}
            >
              <option value="PEN — SOL PERUANO">PEN — SOL PERUANO</option>
              <option value="USD — DÓLAR AMERICANO">USD — DÓLAR AMERICANO</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. LÍMITES POR EMPRESA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
            <Sliders size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">LÍMITES POR EMPRESA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE LOS LÍMITES OPERATIVOS PREPARADOS PARA CADA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>USUARIOS MÁXIMOS</label>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">PERSISTIDO</span>
            </div>
            <input 
              type="number"
              min="1"
              max="5000"
              className={inputClasses}
              value={settings.maxUsers}
              onChange={e => setSettings({...settings, maxUsers: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>TRABAJADORES MÁXIMOS</label>
            <input 
              type="number"
              min="1"
              max="20000"
              className={inputClasses}
              value={settings.maxWorkers}
              onChange={e => setSettings({...settings, maxWorkers: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>SESIONES SIMULTÁNEAS</label>
            <input 
              type="number"
              min="1"
              max="100"
              className={inputClasses}
              value={settings.maxConcurrentSessions}
              onChange={e => setSettings({...settings, maxConcurrentSessions: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>ALMACENAMIENTO (GB)</label>
            <input 
              type="number"
              min="1"
              max="1000"
              className={inputClasses}
              value={settings.storageLimitGB}
              onChange={e => setSettings({...settings, storageLimitGB: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <div className="flex justify-between items-center mb-1">
              <label className={labelClasses} style={{marginBottom: 0}}>MÓDULOS DISPONIBLES EN EL ECOSISTEMA</label>
              <span className="text-[10px] text-slate-400 font-bold">Haz clic en un módulo para habilitarlo o deshabilitarlo globalmente</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {allModules.map(module => {
                const isActive = settings.availableModules.includes(module)
                return (
                  <button
                    key={module}
                    type="button"
                    onClick={() => toggleModule(module)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider uppercase border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                    }`}
                  >
                    {module}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. CICLO DE VIDA DE LA EMPRESA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Repeat size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CICLO DE VIDA DE LA EMPRESA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CONFIGURA EL COMPORTAMIENTO Y POLÍTICAS DEL ESTADO DE CADA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">SUSPENSIÓN DE EMPRESA</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">ACTIVO</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Permite la suspensión administrativa de una empresa</span>
            </div>
            <Toggle 
              checked={settings.allowSuspension} 
              onChange={v => setSettings({...settings, allowSuspension: v})} 
            />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">REACTIVACIÓN DE EMPRESA</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Habilita la reversión de una suspensión de empresa</span>
            </div>
            <Toggle 
              checked={settings.allowReactivation} 
              onChange={v => setSettings({...settings, allowReactivation: v})} 
            />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">CONFIRMACIÓN DE ACCIONES CRÍTICAS</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Requiere confirmación explícita antes de ejecutar suspensiones</span>
            </div>
            <Toggle 
              checked={settings.requireCriticalActionConfirmation} 
              onChange={v => setSettings({...settings, requireCriticalActionConfirmation: v})} 
            />
          </div>

          <div>
            <label className={labelClasses}>PERÍODO DE GRACIA (ANTES DE SUSPENSIÓN DEFINITIVA)</label>
            <select 
              className={inputClasses}
              value={settings.gracePeriodDays}
              onChange={e => setSettings({...settings, gracePeriodDays: parseInt(e.target.value) || 0})}
            >
              <option value={3}>3 DÍAS</option>
              <option value={7}>7 DÍAS (RECOMENDADO)</option>
              <option value={15}>15 DÍAS</option>
              <option value={30}>30 DÍAS</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. IDENTIDAD Y ACCESO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">IDENTIDAD Y ACCESO</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">PREPARA LA CONFIGURACIÓN DE IDENTIDAD Y ACCESO ESPECÍFICA DE CADA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator 
            label="IDENTIFICACIÓN POR SLUG" 
            status="ACTIVO" 
            description="CADA EMPRESA DISPONE DE UN SLUG ÚNICO PARA ACCESO Y RESOLUCIÓN DE RUTAS." 
          />
          <StatusIndicator 
            label="PORTAL DE TRABAJADORES" 
            status="ACTIVO" 
            description="ACCESO DISPONIBLE VÍA /W/[SLUG] CON DNI/PIN Y AISLAMIENTO DE CUADRILLAS."
          />
          <StatusIndicator 
            label="ACCESO POR DOMINIO" 
            status="PREPARADO" 
            badge="PRÓXIMAMENTE"
            description="ROUTING MEDIANTE DOMINIO PERSONALIZADO (EJ. CLIENTE.EMPRESA.COM)."
          />
          <StatusIndicator 
            label="PERSONALIZACIÓN POR EMPRESA" 
            status="ACTIVO" 
            description="SOPORTE PARA LOGOTIPOS, JORNADAS LABORALES Y REGLAS ESPECÍFICAS." 
          />
        </div>
      </div>

      {/* 7. ESTADO GENERAL DEL ENTORNO MULTIEMPRESA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shrink-0">
            <Server size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">ESTADO DEL ENTORNO MULTIEMPRESA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">RESUMEN EN TIEMPO REAL DE LA INFRAESTRUCTURA MULTI-TENANT.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">EMPRESAS REGISTRADAS</span>
            <span className="text-xl font-black text-slate-900">{companyStats.total} EMPRESAS</span>
            <span className="text-[10px] text-emerald-600 font-bold">{companyStats.active} Activas · {companyStats.suspended} Suspendidas</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">AISLAMIENTO DE DATOS</span>
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} /> ACTIVO (COMPANY_ID)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Partición estricta de tablas</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">PROTECCIÓN RLS POSTGRESQL</span>
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} /> ACTIVA
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Row Level Security en BD</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">IDENTIFICACIÓN DE TENANT</span>
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} /> ACTIVA
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Contexto vía cookies y slug</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">GESTIÓN CENTRALIZADA</span>
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} /> ACTIVA
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Consola de Super Administrador</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">ESCALABILIDAD HORIZONTAL</span>
            <span className="text-sm font-black text-blue-600 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} /> PREPARADA
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Capacidad para nuevos tenants</span>
          </div>
        </div>
      </div>

    </div>
  )
}
