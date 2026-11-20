'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, Shield, Laptop, KeyRound, Globe, 
  Trash2, LogOut, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, ChevronRight, Lock, 
  ExternalLink, Sparkles, RefreshCw, Smartphone
} from 'lucide-react'
import type { 
  InthalyIdentity, 
  InthalySession, 
  ConnectedApp, 
  InthalySecurityEvent 
} from '@/types/inthaly-id.types'
import { 
  logoutIdentityAction, 
  revokeSessionAction, 
  changePasswordAction,
  revokeConnectedAppAction
} from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function InthalyIdAccountClient({
  identity,
  initialSessions,
  initialApps,
  initialSecurityEvents
}: {
  identity: InthalyIdentity
  initialSessions: InthalySession[]
  initialApps: ConnectedApp[]
  initialSecurityEvents: InthalySecurityEvent[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'identity' | 'security' | 'sessions' | 'apps'>('identity')

  const [sessions, setSessions] = useState<InthalySession[]>(initialSessions)
  const [apps, setApps] = useState<ConnectedApp[]>(initialApps)
  const [securityEvents] = useState<InthalySecurityEvent[]>(initialSecurityEvents)

  // Formulario de cambio de clave
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPass, setIsChangingPass] = useState(false)

  const handleLogout = async () => {
    await logoutIdentityAction()
    toast.success('Sesión cerrada correctamente')
    router.push('/id/login')
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await revokeSessionAction(sessionId)
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast.success('Sesión revocada exitosamente')
      } else {
        toast.error(res.error || 'Error al revocar sesión')
      }
    } catch {
      toast.error('Error al procesar la revocación')
    }
  }

  const handleRevokeApp = async (clientId: string, appName: string) => {
    if (!window.confirm(`¿Deseas revocar el acceso a "${appName}"? Tendrás que volver a autorizarla cuando ingreses a ella.`)) {
      return
    }

    try {
      const res = await revokeConnectedAppAction(clientId)
      if (res.success) {
        setApps(prev => prev.filter(a => a.client_id !== clientId))
        toast.success(`Acceso revocado a ${appName}`)
      } else {
        toast.error(res.error || 'Error al revocar aplicación')
      }
    } catch {
      toast.error('Error al revocar aplicación')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return

    setIsChangingPass(true)
    try {
      const res = await changePasswordAction(currentPassword, newPassword)
      if (res.success) {
        toast.success('Contraseña actualizada con éxito')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        toast.error(res.error || 'Error al actualizar contraseña')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      
      {/* Cabecera del Centro de Identidad */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-blue-50">
            {identity.display_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-black text-slate-900">{identity.display_name}</h1>
              {identity.is_verified && (
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verificado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{identity.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 pt-1 font-mono">
              <span>ID: {identity.id}</span>
              <span>·</span>
              <span className="text-emerald-600 font-bold">Estado: Activo</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Pestañas de Navegación del Centro de Identidad */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'identity' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User size={15} />
          <span>Mi Identidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'security' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound size={15} />
          <span>Seguridad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'sessions' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop size={15} />
          <span>Dispositivos ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('apps')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'apps' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={15} />
          <span>Apps Conectadas ({apps.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MI IDENTIDAD                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Información de la Cuenta</h2>
            <p className="text-xs text-slate-500">
              Datos centrales de tu identidad soberana en Inthaly ID.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Visible</span>
              <span className="font-bold text-slate-900 text-sm">{identity.display_name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</span>
              <span className="font-bold text-slate-900 text-sm">{identity.email}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identificador Global Soberano (UUID)</span>
              <span className="font-mono text-xs text-slate-700 select-all">{identity.id}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Registro</span>
              <span className="font-semibold text-slate-800">
                {new Date(identity.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Accesos Rápidos a Productos del Ecosistema */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Productos Disponibles con tu Inthaly ID
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/comunidad"
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Comunidad Inthaly</h4>
                  <p className="text-[11px] text-slate-500">Red profesional e industrial</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/dashboard"
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">InthalyOps</h4>
                  <p className="text-[11px] text-slate-500">Gestión empresarial y faena</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600" />
              </Link>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-80">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Inthaly Academy</h4>
                  <p className="text-[11px] text-slate-400">Plataforma educativa (LMS)</p>
                </div>
                <ExternalLink size={12} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEGURIDAD Y AUDITORÍA                                              */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Seguridad y Credenciales</h2>
            <p className="text-xs text-slate-500">
              Administra tu contraseña y revisa el registro inmutable de eventos de acceso.
            </p>
          </div>

          {/* Formulario de cambio de clave */}
          <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Actualizar Contraseña
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Contraseña Actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu clave actual"
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isChangingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>

          {/* Registro de Auditoría de Seguridad */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Historial de Eventos de Seguridad
            </h3>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {securityEvents.map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <span className="font-bold text-slate-800 capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        IP: {ev.ip_address} · {ev.user_agent}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ev.created_at).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISPOSITIVOS Y SESIONES ACTIVAS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Dispositivos y Sesiones Activas</h2>
              <p className="text-xs text-slate-500">
                Supervisa dónde está iniciada tu sesión y revoca accesos sospechosos o en desuso.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sessions.map(sess => (
              <div 
                key={sess.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{sess.device_name}</h4>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Activa
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      IP: {sess.ip_address} · Última actividad: {new Date(sess.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: APLICACIONES CONECTADAS (OIDC)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'apps' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Aplicaciones Conectadas</h2>
            <p className="text-xs text-slate-500">
              Productos y servicios del ecosistema autorizados para utilizar tu Inthaly ID.
            </p>
          </div>

          {apps.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Globe size={32} className="mx-auto text-slate-300" />
              <p className="text-xs">No tienes aplicaciones externas vinculadas actualmente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map(app => (
                <div 
                  key={app.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      APP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{app.app_name}</h4>
                      <p className="text-[11px] text-slate-500">{app.description || 'Aplicación del Ecosistema'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {app.scopes.map(sc => (
                          <span key={sc} className="text-[9px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded">
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevokeApp(app.client_id, app.app_name)}
                    className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer"
                  >
                    Revocar acceso
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
