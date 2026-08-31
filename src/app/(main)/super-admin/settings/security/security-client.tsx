'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Key, Clock, UserCheck, ShieldCheck, Activity, Save } from 'lucide-react'

import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'

export function SecuritySettingsClient() {
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Estado local que simula la configuración
  const [settings, setSettings] = useState({
    passwordPolicy: 'ESTÁNDAR',
    maxLoginAttempts: 5,
    tempLockoutEnabled: true,
    lockoutDuration: 15,
    maxSessionDuration: 8,
    allowMultipleSessions: true,
    maxConcurrentSessions: 3,
    autoLogoutEnabled: true,
    autoLogoutDuration: 30,
    emailVerificationEnabled: true,
    mfaEnabled: false, // MFA is visually locked
    securePasswordRecovery: true
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMessage('')
    
    // Simulación de guardado local
    await new Promise(resolve => setTimeout(resolve, 800))
    
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
      
      {/* Encabezado y Navegación */}
      <div>
        <Link 
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 uppercase tracking-tight"
        >
          <ArrowLeft size={16} />
          CONFIGURACIÓN
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">SEGURIDAD</h1>
            <p className="text-slate-500 font-medium text-sm mt-1 uppercase">ADMINISTRA LAS POLÍTICAS DE SEGURIDAD Y CONTROL DE ACCESO DE INTHALY OPS.</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Shield size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
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
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 uppercase tracking-tight">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {successMessage}
        </div>
      )}

      {/* 1. Seguridad de Acceso */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <Key size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">SEGURIDAD DE ACCESO</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">DEFINE LAS POLÍTICAS GENERALES PARA EL ACCESO A LA PLATAFORMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-slate-50/30">
          <div>
            <label className={labelClasses}>POLÍTICA DE CONTRASEÑA</label>
            <select 
              className={inputClasses}
              value={settings.passwordPolicy}
              onChange={e => setSettings({...settings, passwordPolicy: e.target.value})}
            >
              <option value="ESTÁNDAR">ESTÁNDAR</option>
              <option value="FUERTE">FUERTE</option>
              <option value="MUY FUERTE">MUY FUERTE</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>INTENTOS MÁXIMOS DE INICIO DE SESIÓN</label>
            <input 
              type="number" 
              min={1}
              max={10}
              className={inputClasses}
              value={settings.maxLoginAttempts}
              onChange={e => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value) || 5})}
            />
          </div>

          <div className="md:col-span-2 flex flex-col md:flex-row gap-6 md:items-start p-5 bg-white border border-slate-100 rounded-2xl">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClasses} style={{marginBottom: 0}}>BLOQUEO TEMPORAL TRAS INTENTOS FALLIDOS</label>
                <Toggle 
                  checked={settings.tempLockoutEnabled} 
                  onChange={v => setSettings({...settings, tempLockoutEnabled: v})} 
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Bloquea la cuenta automáticamente para prevenir ataques de fuerza bruta.</p>
            </div>
            
            <div className="w-full md:w-64 shrink-0">
              <label className={labelClasses}>DURACIÓN DEL BLOQUEO</label>
              <select 
                className={inputClasses}
                disabled={!settings.tempLockoutEnabled}
                value={settings.lockoutDuration}
                onChange={e => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
              >
                <option value={5}>5 MINUTOS</option>
                <option value={15}>15 MINUTOS</option>
                <option value={30}>30 MINUTOS</option>
                <option value={60}>60 MINUTOS</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control de Sesiones */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">CONTROL DE SESIONES</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CONFIGURA EL COMPORTAMIENTO DE LAS SESIONES DE USUARIO.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 gap-6 bg-slate-50/30">
          <div>
            <label className={labelClasses}>DURACIÓN MÁXIMA DE SESIÓN</label>
            <select 
              className={inputClasses}
              value={settings.maxSessionDuration}
              onChange={e => setSettings({...settings, maxSessionDuration: parseInt(e.target.value)})}
            >
              <option value={1}>1 HORA</option>
              <option value={4}>4 HORAS</option>
              <option value={8}>8 HORAS</option>
              <option value={24}>24 HORAS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <label className={labelClasses} style={{marginBottom: 0}}>PERMITIR MÚLTIPLES SESIONES</label>
                <Toggle 
                  checked={settings.allowMultipleSessions} 
                  onChange={v => setSettings({...settings, allowMultipleSessions: v})} 
                />
              </div>
              <label className={labelClasses}>LÍMITE DE SESIONES SIMULTÁNEAS</label>
              <input 
                type="number"
                min={1}
                max={10}
                className={inputClasses}
                disabled={!settings.allowMultipleSessions}
                value={settings.maxConcurrentSessions}
                onChange={e => setSettings({...settings, maxConcurrentSessions: parseInt(e.target.value) || 3})}
              />
            </div>

            <div className="p-5 bg-white border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <label className={labelClasses} style={{marginBottom: 0}}>CIERRE AUTOMÁTICO POR INACTIVIDAD</label>
                <Toggle 
                  checked={settings.autoLogoutEnabled} 
                  onChange={v => setSettings({...settings, autoLogoutEnabled: v})} 
                />
              </div>
              <label className={labelClasses}>TIEMPO DE INACTIVIDAD</label>
              <select 
                className={inputClasses}
                disabled={!settings.autoLogoutEnabled}
                value={settings.autoLogoutDuration}
                onChange={e => setSettings({...settings, autoLogoutDuration: parseInt(e.target.value)})}
              >
                <option value={15}>15 MINUTOS</option>
                <option value={30}>30 MINUTOS</option>
                <option value={60}>60 MINUTOS</option>
                <option value={120}>120 MINUTOS</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Autenticación */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">AUTENTICACIÓN</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CONFIGURA LOS MECANISMOS ADICIONALES DE VERIFICACIÓN DE IDENTIDAD.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">VERIFICACIÓN DE CORREO ELECTRÓNICO</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Requerir verificación para nuevos usuarios</span>
            </div>
            <Toggle 
              checked={settings.emailVerificationEnabled} 
              onChange={v => setSettings({...settings, emailVerificationEnabled: v})} 
            />
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">RECUPERACIÓN SEGURA DE CONTRASEÑA</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">Mediante enlaces seguros de un solo uso</span>
            </div>
            <Toggle 
              checked={settings.securePasswordRecovery} 
              onChange={v => setSettings({...settings, securePasswordRecovery: v})} 
            />
          </div>

          <div className="md:col-span-2 p-5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between opacity-80">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700 tracking-tight uppercase block">AUTENTICACIÓN MULTIFACTOR (MFA)</span>
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase bg-purple-100 text-purple-700">PRÓXIMAMENTE</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase mt-0.5 block">Requerir un segundo factor para el inicio de sesión</span>
            </div>
            <Toggle checked={false} onChange={() => {}} disabled={true} />
          </div>
        </div>
      </div>

      {/* 4. Protección de la Plataforma */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">PROTECCIÓN DE LA PLATAFORMA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">CONTROLES PREPARADOS PARA PROTEGER OPERACIONES CRÍTICAS DE LA PLATAFORMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator label="PROTECCIÓN DE RUTAS" status="ACTIVA" />
          <StatusIndicator label="CONTROL DE ROLES" status="ACTIVO" />
          <StatusIndicator label="AISLAMIENTO MULTI-TENANT" status="ACTIVO" />
          <StatusIndicator label="PROTECCIÓN DE OPERACIONES CRÍTICAS" status="PREPARADO" />
        </div>
      </div>

      {/* 5. Auditoría y Trazabilidad */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">AUDITORÍA Y TRAZABILIDAD</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">SUPERVISA LAS ACCIONES ADMINISTRATIVAS Y CAMBIOS IMPORTANTES REALIZADOS EN LA PLATAFORMA.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
          <StatusIndicator label="REGISTRO DE ACCIONES ADMINISTRATIVAS" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DE CAMBIOS DE CONFIGURACIÓN" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DE CAMBIOS DE ROLES" status="PREPARADO" />
          <StatusIndicator label="REGISTRO DE ACCIONES CRÍTICAS" status="PREPARADO" />
        </div>
      </div>

    </div>
  )
}
