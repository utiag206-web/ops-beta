'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Shield, Key, Clock, UserCheck, ShieldCheck, Activity, Save, 
  Mail, Smartphone, Laptop, AlertTriangle, CheckCircle2, XCircle, RefreshCw, 
  Lock, Unlock, Eye, Globe, ShieldAlert, LogOut, Check, Info, Sparkles,
  Sliders, UserX, AlertOctagon, History, Fingerprint
} from 'lucide-react'
import { toast } from 'sonner'
import { Toggle } from '../components/toggle'
import { StatusIndicator } from '../components/status-indicator'

// Types for Mock Security State
interface ActiveSession {
  id: string
  user: string
  role: string
  device: string
  browser: string
  ip: string
  location: string
  lastActive: string
  isCurrent: boolean
}

interface AccessLog {
  id: string
  user: string
  role: string
  timestamp: string
  ip: string
  browser: string
  device: string
  status: 'success' | 'failed' | 'blocked'
  reason?: string
}

interface UserVerificationItem {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  verificationDate?: string
}

interface LockedAccount {
  id: string
  email: string
  name: string
  failedAttempts: number
  lockedAt: string
  unlockAt: string
}

import { RealSecurityUser, resendVerificationEmail } from './actions'

interface SecuritySettingsClientProps {
  initialUsers?: RealSecurityUser[]
}

export function SecuritySettingsClient({ initialUsers = [] }: SecuritySettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'passwords' | 'email_verification' | 'first_login' | 'sessions' | 'mfa' | 'access_logs' | 'lockouts'>('passwords')
  const [isSaving, setIsSaving] = useState(false)

  // 1. Password Policy State
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expirationDays: 90, // 0 = never
    passwordHistoryLimit: 3,
    forceChangeOnFirstLogin: true,
    allowPasswordPaste: true // NIST SP 800-63B Recommendation
  })

  // 2. Email Verification State - Utiliza datos reales de la plataforma si existen
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true)
  const [blockUnverifiedUsers, setBlockUnverifiedUsers] = useState(false)
  const [userVerifications, setUserVerifications] = useState<RealSecurityUser[]>(
    initialUsers.length > 0 
      ? initialUsers 
      : [
          { id: '1', name: 'Romel Chung', email: 'romel@inthaly.com', role: 'Gerente General', isVerified: true, verificationDate: '30/08/2026 10:30' },
          { id: '2', name: 'Geison Utia', email: 'geison@inthaly.com', role: 'Super Admin', isVerified: true, verificationDate: '30/08/2026 14:15' }
        ]
  )

  // Sincronizar si cambian los usuarios iniciales
  useState(() => {
    if (initialUsers.length > 0) {
      setUserVerifications(initialUsers)
    }
  })

  // 3. First Login State
  const [firstLoginPolicy, setFirstLoginPolicy] = useState({
    requirePasswordChange: true,
    tempPasswordExpiryHours: 48,
    notifyAdminOnFirstLogin: true
  })

  // 4. Session Management State
  const [sessionPolicy, setSessionPolicy] = useState({
    maxConcurrentSessions: 2,
    idleTimeoutMinutes: 30,
    forceLogoutOnClose: false,
    enableDeviceTracking: true
  })

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: 'sess-1',
      user: 'Geison Utia (Super Admin)',
      role: 'super_admin',
      device: 'Laptop Windows 11',
      browser: 'Google Chrome 128',
      ip: '190.237.45.12',
      location: 'Lima, Perú',
      lastActive: 'Hace un momento',
      isCurrent: true
    },
    {
      id: 'sess-2',
      user: 'Romel Chung (Gerente)',
      role: 'gerente',
      device: 'MacBook Pro macOS',
      browser: 'Safari 18.0',
      ip: '190.238.10.84',
      location: 'Arequipa, Perú',
      lastActive: 'Hace 12 min',
      isCurrent: false
    },
    {
      id: 'sess-3',
      user: 'Carlos Mendoza (Operaciones)',
      role: 'operaciones',
      device: 'Tablet Android Rugged',
      browser: 'Chrome Mobile',
      ip: '181.176.92.30',
      location: 'Trujillo, Perú (Planta)',
      lastActive: 'Hace 25 min',
      isCurrent: false
    }
  ])

  // 5. MFA (2FA) State
  const [mfaPolicy, setMfaPolicy] = useState({
    mode: 'optional' as 'disabled' | 'optional' | 'mandatory_admins' | 'mandatory_all',
    allowAuthenticatorApp: true,
    allowEmailOtp: true,
    backupCodesCount: 8
  })

  // 6. Access Logs State - Basado en las cuentas y correos reales de la plataforma
  const [accessLogsSearch, setAccessLogsSearch] = useState('')
  const [accessLogsFilter, setAccessLogsFilter] = useState<'all' | 'success' | 'failed' | 'blocked'>('all')
  
  const accessLogs: AccessLog[] = (userVerifications.length > 0 ? userVerifications : [
    { id: 'u-1', name: 'Geison Utia', email: 'geison@inthaly.com', role: 'Super Admin', isVerified: true },
    { id: 'u-2', name: 'Romel Chung', email: 'romel@inthaly.com', role: 'Gerente General', isVerified: true }
  ]).map((u, idx) => ({
    id: `log-${idx + 1}`,
    user: u.email,
    role: u.role,
    timestamp: `01/09/2026 ${Math.max(12, 21 - idx)}:15:${10 + (idx * 7) % 50}`,
    ip: idx === 0 ? '190.237.45.12' : idx === 1 ? '190.238.10.84' : `190.237.${100 + idx}.15`,
    browser: idx === 0 ? 'Chrome 128 (Windows)' : idx === 1 ? 'Safari 18 (macOS)' : 'Chrome Mobile (Android)',
    device: idx === 2 ? 'Mobile' : 'Desktop',
    status: 'success'
  }))

  // 7. Lockout State
  const [lockoutPolicy, setLockoutPolicy] = useState({
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    autoUnlockEnabled: true
  })

  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([
    {
      id: 'lock-1',
      email: 'luis.morales@mina.com',
      name: 'Luis Morales (Jefe de Mecánica)',
      failedAttempts: 5,
      lockedAt: '31/08/2026 16:08',
      unlockAt: '31/08/2026 16:23 (o desbloqueo manual)'
    }
  ])

  // Handlers
  const handleSaveAll = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    setIsSaving(false)
    toast.success('Políticas y configuraciones del Centro de Seguridad guardadas correctamente.')
  }

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success('Sesión remota cerrada exitosamente.')
  }

  const handleResendVerification = async (email: string) => {
    toast.loading(`Enviando enlace de verificación a ${email}...`, { id: 'resend-email' })
    const res = await resendVerificationEmail(email)
    if (res.success) {
      toast.success(res.message || `Enlace de verificación enviado exitosamente a ${email}`, { id: 'resend-email' })
    } else {
      toast.error(res.error || 'No se pudo enviar el correo de verificación', { id: 'resend-email' })
    }
  }

  const handleUnlockAccount = (id: string, email: string) => {
    setLockedAccounts(prev => prev.filter(acc => acc.id !== id))
    toast.success(`Cuenta de ${email} desbloqueada exitosamente.`)
  }

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      
      {/* 1. Header & Navigation */}
      <div>
        <Link 
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 transition-colors mb-3 tracking-wide uppercase"
        >
          <ArrowLeft size={16} />
          Volver a Configuración Global
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20 border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wide backdrop-blur-md inline-flex items-center gap-1.5">
                <Shield size={13} className="text-white" />
                <span>INTHALY OPS · CENTRO DE SEGURIDAD</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-xs font-bold backdrop-blur-md inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>Protección Activa</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="text-blue-100" size={32} />
              Centro de Seguridad & Control de Accesos
            </h1>
            <p className="text-xs sm:text-sm text-blue-50 max-w-2xl font-medium">
              Administración centralizada de políticas de contraseñas, validación de correo, control de sesiones activas, 2FA y auditoría de accesos.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-blue-950/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'GUARDANDO...' : 'GUARDAR POLÍTICAS'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (7 Modules) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('passwords')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'passwords'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Key size={15} />
          <span>1. Contraseñas</span>
        </button>

        <button
          onClick={() => setActiveTab('email_verification')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'email_verification'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail size={15} />
          <span>2. Verificación Correo</span>
        </button>

        <button
          onClick={() => setActiveTab('first_login')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'first_login'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={15} />
          <span>3. 1er Inicio de Sesión</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Laptop size={15} />
          <span>4. Sesiones Activas</span>
        </button>

        <button
          onClick={() => setActiveTab('mfa')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'mfa'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Fingerprint size={15} />
          <span>5. 2FA (Multifactor)</span>
        </button>

        <button
          onClick={() => setActiveTab('access_logs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'access_logs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History size={15} />
          <span>6. Historial Accesos</span>
        </button>

        <button
          onClick={() => setActiveTab('lockouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 ${
            activeTab === 'lockouts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lock size={15} />
          <span>7. Bloqueos ({lockedAccounts.length})</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: POLÍTICAS DE CONTRASEÑA
          ========================================== */}
      {activeTab === 'passwords' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Requisitos de Complejidad de Contraseña</h2>
                <p className="text-xs text-slate-500">Parámetros de seguridad aplicados a usuarios administrativos y operativos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase block mb-1">
                  Longitud Mínima de Contraseña
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="6"
                    max="18"
                    value={passwordPolicy.minLength}
                    onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: Number(e.target.value) })}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-blue-700 min-w-[50px] text-center">
                    {passwordPolicy.minLength} Caracteres
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase block mb-1">
                  Caducidad y Expiración (Días)
                </label>
                <select
                  value={passwordPolicy.expirationDays}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expirationDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value={30}>Cada 30 Días (Alta rotación)</option>
                  <option value={60}>Cada 60 Días</option>
                  <option value={90}>Cada 90 Días (Recomendado)</option>
                  <option value={180}>Cada 180 Días</option>
                  <option value={0}>Sin Expiración Obligatoria</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Requerir Mayúsculas (A-Z)</div>
                  <div className="text-[11px] text-slate-500">Al menos una letra mayúscula</div>
                </div>
                <Toggle
                  checked={passwordPolicy.requireUppercase}
                  onChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Requerir Minúsculas (a-z)</div>
                  <div className="text-[11px] text-slate-500">Al menos una letra minúscula</div>
                </div>
                <Toggle
                  checked={passwordPolicy.requireLowercase}
                  onChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireLowercase: checked })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Requerir Números (0-9)</div>
                  <div className="text-[11px] text-slate-500">Al menos un dígito numérico</div>
                </div>
                <Toggle
                  checked={passwordPolicy.requireNumbers}
                  onChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: checked })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Requerir Caracteres Especiales</div>
                  <div className="text-[11px] text-slate-500">Ejemplo: !@#$%^&*()_+-=</div>
                </div>
                <Toggle
                  checked={passwordPolicy.requireSpecialChars}
                  onChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireSpecialChars: checked })}
                />
              </div>
            </div>

            {/* Historial de Contraseñas para Evitar Reutilización */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  <span className="text-xs font-black text-slate-900">Historial de Contraseñas (Evitar Reutilización)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">Seguridad Avanzada</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                  Impide que los usuarios alternen o vuelvan a usar contraseñas anteriores al momento de actualizar o restablecer su credencial de acceso.
                </p>
              </div>
              <select
                value={passwordPolicy.passwordHistoryLimit}
                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, passwordHistoryLimit: Number(e.target.value) })}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none min-w-[240px]"
              >
                <option value={3}>No permitir las últimas 3 (Recomendado)</option>
                <option value={5}>No permitir las últimas 5 contraseñas</option>
                <option value={10}>No permitir las últimas 10 contraseñas</option>
                <option value={0}>Desactivado (Permitir reutilización)</option>
              </select>
            </div>

            {/* NIST Recommendation Box: Password Paste */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-900">Permitir Pegado de Contraseñas (Password Paste)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-black">NIST / OWASP</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed max-w-xl">
                  Recomendado para permitir el uso de gestores de contraseñas seguros (Bitwarden, 1Password, Google Passwords), incentivando contraseñas largas y de alta entropía.
                </p>
              </div>
              <Toggle
                checked={passwordPolicy.allowPasswordPaste}
                onChange={(checked) => setPasswordPolicy({ ...passwordPolicy, allowPasswordPaste: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: VERIFICACIÓN DE CORREO
          ========================================== */}
      {activeTab === 'email_verification' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Validación y Verificación de Correos Electrónicos</h2>
                <p className="text-xs text-slate-500">Asegura que los colaboradores y administradores utilicen bandejas de correo activas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Verificación de Correo Activa</div>
                  <div className="text-[11px] text-slate-500">Enviar email de confirmación tras el registro</div>
                </div>
                <Toggle
                  checked={emailVerificationEnabled}
                  onChange={setEmailVerificationEnabled}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Bloquear Acceso Sin Verificar</div>
                  <div className="text-[11px] text-slate-500">Impedir inicio de sesión hasta confirmar email</div>
                </div>
                <Toggle
                  checked={blockUnverifiedUsers}
                  onChange={setBlockUnverifiedUsers}
                />
              </div>
            </div>

            {/* User Verification Status Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Estado de Verificación de Cuentas</h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  {userVerifications.filter(u => u.isVerified).length} de {userVerifications.length} Verificados (
                  {Math.round((userVerifications.filter(u => u.isVerified).length / userVerifications.length) * 100)}%)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Correo Electrónico</th>
                      <th className="py-3 px-4">Rol Asignado</th>
                      <th className="py-3 px-4 text-center">Estado Verificación</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userVerifications.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{user.role}</td>
                        <td className="py-3 px-4 text-center">
                          {user.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={12} />
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                              <Clock size={12} />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!user.isVerified && (
                            <button
                              onClick={() => handleResendVerification(user.email)}
                              className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-black transition-colors"
                            >
                              Reenviar Email
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: PRIMER INICIO DE SESIÓN
          ========================================== */}
      {activeTab === 'first_login' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Flujo de Primer Acceso & Contraseñas Provisionales</h2>
                <p className="text-xs text-slate-500">Mecanismo de seguridad para usuarios recién dados de alta por el Administrador.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Forzar Cambio Obligatorio en el 1er Inicio de Sesión</div>
                  <div className="text-[11px] text-slate-500">El usuario no podrá navegar hasta establecer su propia clave secreta</div>
                </div>
                <Toggle
                  checked={firstLoginPolicy.requirePasswordChange}
                  onChange={(checked) => setFirstLoginPolicy({ ...firstLoginPolicy, requirePasswordChange: checked })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Caducidad de Contraseña Temporal (Horas)</div>
                  <div className="text-[11px] text-slate-500">Tiempo límite para que el usuario use su clave provisional inicial</div>
                </div>
                <select
                  value={firstLoginPolicy.tempPasswordExpiryHours}
                  onChange={(e) => setFirstLoginPolicy({ ...firstLoginPolicy, tempPasswordExpiryHours: Number(e.target.value) })}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value={24}>24 Horas</option>
                  <option value={48}>48 Horas (Recomendado)</option>
                  <option value={72}>72 Horas</option>
                  <option value={168}>7 Días</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: GESTIÓN DE SESIONES ACTIVAS
          ========================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Laptop size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Control de Sesiones Activas y Dispositivos</h2>
                <p className="text-xs text-slate-500">Supervisión en tiempo real y capacidad de cierre remoto de sesiones.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-black text-slate-700 block mb-1">Máximo de Sesiones Simultáneas por Usuario</label>
                <select
                  value={sessionPolicy.maxConcurrentSessions}
                  onChange={(e) => setSessionPolicy({ ...sessionPolicy, maxConcurrentSessions: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                >
                  <option value={1}>1 Sesión Estricta (Cierra la anterior)</option>
                  <option value={2}>2 Sesiones (Laptop + Celular)</option>
                  <option value={3}>3 Sesiones Concurrentes</option>
                  <option value={0}>Sin límite</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-black text-slate-700 block mb-1">Cierre Automático por Inactividad</label>
                <select
                  value={sessionPolicy.idleTimeoutMinutes}
                  onChange={(e) => setSessionPolicy({ ...sessionPolicy, idleTimeoutMinutes: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                >
                  <option value={15}>15 Minutos de Inactividad</option>
                  <option value={30}>30 Minutos (Recomendado)</option>
                  <option value={60}>60 Minutos</option>
                  <option value={120}>2 Horas</option>
                </select>
              </div>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Dispositivos y Sesiones Conectadas ({activeSessions.length})</h3>
              </div>

              <div className="space-y-2.5">
                {activeSessions.map(session => (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Laptop size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{session.user}</span>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              Tu Sesión Actual
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {session.device} · {session.browser}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>IP: {session.ip}</span>
                          <span>·</span>
                          <span>{session.location}</span>
                          <span>·</span>
                          <span>Actividad: {session.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <LogOut size={14} />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: AUTENTICACIÓN MULTIFACTOR (2FA)
          ========================================== */}
      {activeTab === 'mfa' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Fingerprint size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Autenticación Multifactor (2FA)</h2>
                <p className="text-xs text-slate-500">Capa adicional de verificación de identidad mediante TOTP y Códigos OTP.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase block mb-1">Exigencia de 2FA</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMfaPolicy({ ...mfaPolicy, mode: 'optional' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      mfaPolicy.mode === 'optional'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900">Opcional</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cada usuario decide si activarlo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMfaPolicy({ ...mfaPolicy, mode: 'mandatory_admins' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      mfaPolicy.mode === 'mandatory_admins'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900">Obligatorio Administradores</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Exigido para Super Admin y Gerencia</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMfaPolicy({ ...mfaPolicy, mode: 'mandatory_all' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      mfaPolicy.mode === 'mandatory_all'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900">Obligatorio Global</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Exigido para todos los usuarios</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-slate-800">App de Autenticación (TOTP)</div>
                      <div className="text-[10px] text-slate-500">Google Authenticator, Microsoft Authenticator</div>
                    </div>
                  </div>
                  <Toggle
                    checked={mfaPolicy.allowAuthenticatorApp}
                    onChange={(checked) => setMfaPolicy({ ...mfaPolicy, allowAuthenticatorApp: checked })}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-slate-800">Código OTP por Correo</div>
                      <div className="text-[10px] text-slate-500">Código de 6 dígitos enviado por email</div>
                    </div>
                  </div>
                  <Toggle
                    checked={mfaPolicy.allowEmailOtp}
                    onChange={(checked) => setMfaPolicy({ ...mfaPolicy, allowEmailOtp: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: HISTORIAL DE ACCESOS & AUDITORÍA
          ========================================== */}
      {activeTab === 'access_logs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Registro y Auditoría de Inicios de Sesión</h2>
                  <p className="text-xs text-slate-500">Trazabilidad de direcciones IP, navegadores, intentos correctos y fallidos.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={accessLogsFilter}
                  onChange={(e) => setAccessLogsFilter(e.target.value as any)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">Todos los Eventos</option>
                  <option value="success">🟢 Solo Exitosos</option>
                  <option value="failed">🔴 Solo Fallidos</option>
                  <option value="blocked">🚫 Solo Bloqueados</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario / Cuenta</th>
                    <th className="py-3 px-4">Dirección IP</th>
                    <th className="py-3 px-4">Navegador & Sistema</th>
                    <th className="py-3 px-4 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessLogs
                    .filter(log => accessLogsFilter === 'all' || log.status === accessLogsFilter)
                    .map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{log.timestamp}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{log.user}</div>
                          <div className="text-[10px] text-slate-400">{log.role}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{log.ip}</td>
                        <td className="py-3.5 px-4 text-slate-600">{log.browser}</td>
                        <td className="py-3.5 px-4 text-center">
                          {log.status === 'success' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              🟢 Éxito
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800" title={log.reason}>
                              🔴 Fallido
                            </span>
                          )}
                          {log.status === 'blocked' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900 text-white" title={log.reason}>
                              🚫 Bloqueado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 7: INTENTOS DE ACCESO & BLOQUEOS
          ========================================== */}
      {activeTab === 'lockouts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Protección contra Ataques de Fuerza Bruta & Bloqueo</h2>
                <p className="text-xs text-slate-500">Reglas de bloqueo automático tras múltiples contraseñas erróneas consecutivas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-black text-slate-700 block mb-1">Máximo de Intentos Fallidos</label>
                <select
                  value={lockoutPolicy.maxFailedAttempts}
                  onChange={(e) => setLockoutPolicy({ ...lockoutPolicy, maxFailedAttempts: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                >
                  <option value={3}>3 Intentos (Máxima seguridad)</option>
                  <option value={5}>5 Intentos (Recomendado)</option>
                  <option value={10}>10 Intentos</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-black text-slate-700 block mb-1">Tiempo de Bloqueo Temporal</label>
                <select
                  value={lockoutPolicy.lockoutDurationMinutes}
                  onChange={(e) => setLockoutPolicy({ ...lockoutPolicy, lockoutDurationMinutes: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none mt-1"
                >
                  <option value={15}>15 Minutos</option>
                  <option value={30}>30 Minutos</option>
                  <option value={60}>1 Hora</option>
                  <option value={0}>Solo Desbloqueo Manual por Admin</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">Desbloqueo Automático</div>
                  <div className="text-[10px] text-slate-500">Restablecer tras cumplirse el tiempo</div>
                </div>
                <Toggle
                  checked={lockoutPolicy.autoUnlockEnabled}
                  onChange={(checked) => setLockoutPolicy({ ...lockoutPolicy, autoUnlockEnabled: checked })}
                />
              </div>
            </div>

            {/* Currently Locked Accounts */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Cuentas Actualmente Bloqueadas</h3>

              {lockedAccounts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-semibold">
                  🛡️ No hay cuentas bloqueadas en este momento. Todas las cuentas están operativas.
                </div>
              ) : (
                <div className="space-y-2">
                  {lockedAccounts.map(account => (
                    <div
                      key={account.id}
                      className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs font-black text-rose-900 flex items-center gap-2">
                          <AlertOctagon size={16} className="text-rose-600" />
                          <span>{account.name}</span>
                          <span className="text-[10px] font-bold text-rose-700">({account.email})</span>
                        </div>
                        <div className="text-[11px] text-rose-700 mt-1">
                          Bloqueado a las {account.lockedAt} tras {account.failedAttempts} intentos fallidos. Desbloqueo programado: {account.unlockAt}.
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnlockAccount(account.id, account.email)}
                        className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-black transition-colors flex items-center gap-1.5 self-start sm:self-center shadow-sm"
                      >
                        <Unlock size={14} />
                        <span>Desbloquear Ahora</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
