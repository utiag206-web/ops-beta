'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building, ShieldCheck, Settings2, Sliders, Repeat, KeyRound, Server, Save, Info, RefreshCw } from 'lucide-react'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'
import { defaultMultiCompanySettings, MultiCompanySettings } from './multiempresa.defaults'

export function MultiempresaClient() {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [settings, setSettings] = useState<MultiCompanySettings>(defaultMultiCompanySettings)

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMessage('')
    
    // Simulación de guardado asíncrono
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // TODO (Backend): Aquí se debe inyectar el servicio de persistencia global (Supabase/API)
    // Ej: await saveGlobalMultiCompanySettings(settings)
    
    setIsSaving(false)
    setSuccessMessage('CAMBIOS GUARDADOS (SIMULACIÓN LOCAL)')
    
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const inputClasses = "h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
  const labelClasses = "text-xs font-bold text-slate-500 mb-2 block tracking-tight uppercase"
  
  const allModules = ['TAREO', 'WORKERS', 'INVENTARIO', 'PPE', 'REPORTES', 'TRANSPORTE', 'BONOS', 'DOCUMENTOS', 'CAMPAMENTO']

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
      {/* Banner de Modo Simulación */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex gap-3">
        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-800 tracking-tight uppercase">MODO SIMULACIÓN</h3>
          <p className="text-xs font-medium text-amber-700/80 mt-1">
            Las configuraciones mostradas en esta pantalla son simuladas y actualmente no modifican la configuración real del entorno multiempresa. Esta interfaz prepara la futura integración con la capa de persistencia.
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
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">MULTIEMPRESA</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">ADMINISTRA LA ESTRUCTURA, LOS LÍMITES Y LAS POLÍTICAS GLOBALES DEL ENTORNO MULTIEMPRESA DE INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Building size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/50">
              <RefreshCw size={12} className="text-slate-500" />
              <span className="text-[10px] font-black tracking-wider uppercase">ÚLTIMA SINCRONIZACIÓN: NO DISPONIBLE (SIMULACIÓN)</span>
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
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Habilita el registro de nuevos tenants</span>
            </div>
            <Toggle 
              checked={settings.allowNewCompanies} 
              onChange={v => setSettings({...settings, allowNewCompanies: v})} 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>ESTADO INICIAL DE UNA NUEVA EMPRESA</label>
              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">PREPARADO PARA BACKEND</span>
            </div>
            <select 
              className={inputClasses}
              value={settings.defaultCompanyStatus}
              onChange={e => setSettings({...settings, defaultCompanyStatus: e.target.value as any})}
            >
              <option value="ACTIVA">ACTIVA</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="REVISIÓN">REVISIÓN</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>IDENTIFICADOR DE EMPRESA</label>
            <select 
              className={inputClasses}
              value={settings.companyIdentifierMode}
              onChange={e => setSettings({...settings, companyIdentifierMode: e.target.value as any})}
            >
              <option value="AUTOMÁTICO">AUTOMÁTICO (SLUG AUTOGENERADO)</option>
              <option value="MANUAL">MANUAL</option>
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
            description="LOS DATOS SE ENCUENTRAN ASOCIADOS A SU EMPRESA CORRESPONDIENTE." 
          />
          <StatusIndicator 
            label="PROTECCIÓN RLS" 
            status="ACTIVA" 
            description="LAS POLÍTICAS DE SEGURIDAD DE FILAS PROTEGEN EL ACCESO ENTRE EMPRESAS." 
          />
          <StatusIndicator 
            label="IDENTIFICACIÓN DE TENANT" 
            status="ACTIVA" 
            description="LA PLATAFORMA IDENTIFICA EL CONTEXTO DE EMPRESA DEL USUARIO." 
          />
          <StatusIndicator 
            label="VALIDACIÓN DE ACCESO" 
            status="ACTIVA" 
            description="EL ACCESO A LOS RECURSOS RESPETA EL CONTEXTO DE LA EMPRESA." 
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
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE LOS VALORES INICIALES QUE PODRÍAN UTILIZARSE AL CONFIGURAR UNA NUEVA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelClasses} style={{marginBottom: 0}}>ZONA HORARIA PREDETERMINADA</label>
              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">PREPARADO PARA BACKEND</span>
            </div>
            <select 
              className={inputClasses}
              value={settings.defaultTimezone}
              onChange={e => setSettings({...settings, defaultTimezone: e.target.value})}
            >
              <option value="America/Lima">AMERICA/LIMA</option>
              <option value="America/Bogota">AMERICA/BOGOTA</option>
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
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
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
              <option value="INGLÉS">INGLÉS</option>
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
              <option value="USD — DÓLAR">USD — DÓLAR</option>
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
              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">PREPARADO PARA BACKEND</span>
            </div>
            <input 
              type="number"
              className={inputClasses}
              value={settings.maxUsers}
              onChange={e => setSettings({...settings, maxUsers: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>TRABAJADORES MÁXIMOS</label>
            <input 
              type="number"
              className={inputClasses}
              value={settings.maxWorkers}
              onChange={e => setSettings({...settings, maxWorkers: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>SESIONES SIMULTÁNEAS</label>
            <input 
              type="number"
              className={inputClasses}
              value={settings.maxConcurrentSessions}
              onChange={e => setSettings({...settings, maxConcurrentSessions: parseInt(e.target.value) || 0})}
            />
          </div>

          <div>
            <label className={labelClasses}>ALMACENAMIENTO (GB)</label>
            <input 
              type="number"
              className={inputClasses}
              value={settings.storageLimitGB}
              onChange={e => setSettings({...settings, storageLimitGB: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <label className={labelClasses}>MÓDULOS DISPONIBLES</label>
            <p className="text-[10px] text-slate-400 font-medium mb-3">Esta sección es únicamente informativa y prepara la futura gestión de módulos y licenciamiento por empresa.</p>
            <div className="flex flex-wrap gap-2">
              {allModules.map(module => (
                <div key={module} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-black tracking-wider uppercase border border-blue-100">
                  {module}
                </div>
              ))}
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
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CONFIGURA EL COMPORTAMIENTO PREPARADO PARA EL CICLO DE VIDA DE UNA EMPRESA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">SUSPENSIÓN DE EMPRESA</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-50 text-purple-600">PREPARADO PARA BACKEND</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase leading-snug block">Permite preparar la suspensión administrativa de una empresa.</span>
            </div>
            <Toggle 
              checked={settings.allowSuspension} 
              onChange={v => setSettings({...settings, allowSuspension: v})} 
            />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">REACTIVACIÓN DE EMPRESA</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase leading-snug block mt-1">Habilita la reversión de una suspensión.</span>
            </div>
            <Toggle 
              checked={settings.allowReactivation} 
              onChange={v => setSettings({...settings, allowReactivation: v})} 
            />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="pr-4">
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">CONFIRMACIÓN DE ACCIONES CRÍTICAS</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase leading-snug block mt-1">Requiere confirmación antes de ejecutar acciones administrativas sensibles.</span>
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
              onChange={e => setSettings({...settings, gracePeriodDays: parseInt(e.target.value)})}
            >
              <option value={0}>0 DÍAS</option>
              <option value={7}>7 DÍAS</option>
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
            status="PREPARADO" 
            description="CADA EMPRESA PUEDE DISPONER DE UN IDENTIFICADOR ÚNICO PARA SU ENTORNO." 
          />
          <StatusIndicator 
            label="PORTAL DE TRABAJADORES" 
            status="ACTIVO" 
          />
          <StatusIndicator 
            label="ACCESO POR DOMINIO" 
            status="PREPARADO" 
            badge="PRÓXIMAMENTE"
          />
          <StatusIndicator 
            label="PERSONALIZACIÓN POR EMPRESA" 
            status="PREPARADO" 
            description="PERMITE PREPARAR CONFIGURACIONES VISUALES ESPECÍFICAS PARA CADA EMPRESA." 
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
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">RESUMEN INFORMATIVO DE LA ARQUITECTURA MULTI-TENANT.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/30">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">AISLAMIENTO DE DATOS</span>
            <span className="text-sm font-black text-emerald-600">ACTIVO</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">RLS</span>
            <span className="text-sm font-black text-emerald-600">ACTIVO</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">IDENTIFICACIÓN DE TENANT</span>
            <span className="text-sm font-black text-emerald-600">ACTIVA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">GESTIÓN CENTRALIZADA</span>
            <span className="text-sm font-black text-emerald-600">ACTIVA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">CONFIGURACIÓN POR EMPRESA</span>
            <span className="text-sm font-black text-amber-600">PREPARADA</span>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">ESCALABILIDAD</span>
            <span className="text-sm font-black text-amber-600">PREPARADA</span>
          </div>
        </div>
      </div>

    </div>
  )
}
