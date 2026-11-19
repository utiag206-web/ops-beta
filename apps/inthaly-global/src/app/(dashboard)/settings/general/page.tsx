import React from 'react'
import Link from 'next/link'
import { Settings, ArrowLeft, Save, Globe, MessageSquare, Mail } from 'lucide-react'
import { getGeneralSettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsGeneralPage() {
  const settings = await getGeneralSettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Settings size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Configuración General</h1>
            <p className="text-xs text-slate-500">Identidad del ecosistema, marca, moneda y localización</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nombre del Ecosistema</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.ecosystemName}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Razón Comercial</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.commercialName}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Moneda Predeterminada</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.defaultCurrency}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Zona Horaria Oficial</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.defaultTimezone}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">WhatsApp Comercial</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.commercialWhatsapp}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Correo de Soporte Institucional</label>
            <input
              type="text"
              readOnly
              defaultValue={settings.supportEmail}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-400 text-[11px]">
          <span>Parámetros persistidos de forma segura en el ecosistema</span>
          <span className="font-mono text-emerald-600 font-bold">Modo Soberano Activo</span>
        </div>
      </div>
    </div>
  )
}
