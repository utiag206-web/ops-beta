import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getSecuritySettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsSecuritySubmodulePage() {
  const security = await getSecuritySettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Políticas de Seguridad & Sesiones</h1>
            <p className="text-xs text-slate-500">Parámetros de autenticación transversal y mitigación de intrusiones</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Expiración de Sesión Inactiva (minutos)</label>
            <input
              type="text"
              readOnly
              defaultValue={`${security.sessionTimeoutMinutes} minutos`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Intentos Fallidos antes del Bloqueo</label>
            <input
              type="text"
              readOnly
              defaultValue={`${security.maxLoginAttempts} intentos`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Longitud Mínima de Contraseña</label>
            <input
              type="text"
              readOnly
              defaultValue={`${security.passwordMinLength} caracteres`}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">MFA para Super Administradores</label>
            <input
              type="text"
              readOnly
              defaultValue={security.mfaEnforcedForAdmins ? 'Obligatorio (Enforced)' : 'Opcional'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-emerald-700 font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
