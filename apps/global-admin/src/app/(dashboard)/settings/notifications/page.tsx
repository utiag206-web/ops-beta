import React from 'react'
import Link from 'next/link'
import { Bell, ArrowLeft, Mail, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getNotificationsSettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsNotificationsPage() {
  const notifications = await getNotificationsSettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Bell size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Notificaciones & Alertas Transversales</h1>
            <p className="text-xs text-slate-500">Configuración de servidor de correo SMTP y canales de aviso operativo</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Parámetros SMTP Saliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Servidor SMTP</label>
            <input type="text" readOnly defaultValue={notifications.smtpHost} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Puerto SMTP</label>
            <input type="text" readOnly defaultValue={`${notifications.smtpPort} (TLS)`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Correo Remitente</label>
            <input type="text" readOnly defaultValue={notifications.senderEmail} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Destinatario de Resumen Diario</label>
            <input type="text" readOnly defaultValue={notifications.dailySummaryEmail} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800" />
          </div>
        </div>
      </div>
    </div>
  )
}
