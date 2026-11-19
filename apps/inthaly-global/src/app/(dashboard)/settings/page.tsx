import React from 'react'
import Link from 'next/link'
import { Settings, ArrowLeft, Building2, Bell, Plug, Server, Activity, Shield, Boxes } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const categories = [
    { title: 'Configuración General', desc: 'Identidad corporativa, zona horaria, moneda y formatos.', icon: Settings },
    { title: 'Industrias y Capacidades', desc: 'Perfiles operativos por industria y catálogo modular.', icon: Boxes },
    { title: 'Multiempresa', desc: 'Valores predeterminados y parámetros heredables de tenants.', icon: Building2 },
    { title: 'Seguridad', desc: 'Políticas transversales y control de acceso.', icon: Shield },
    { title: 'Notificaciones', desc: 'Plantillas de correo transaccional y alertas operativas.', icon: Bell },
    { title: 'Integraciones', desc: 'Clientes OIDC, APIs externas y webhooks.', icon: Plug },
    { title: 'Sistema & Diagnóstico', desc: 'Salud de infraestructura y estado de servicios.', icon: Server },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Settings size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Configuración Global del Ecosistema</h1>
            <p className="text-xs text-slate-500 font-mono">Políticas y Parámetros Transversales</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-300 transition-all">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Icon size={16} />
              </div>
              <h3 className="font-black text-slate-900 text-sm">{cat.title}</h3>
              <p className="text-slate-500 leading-relaxed">{cat.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
