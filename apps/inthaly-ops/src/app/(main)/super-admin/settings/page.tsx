import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, Shield, Building2, Bell, 
  Plug, Server, Activity, Info, ChevronRight, Boxes 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsHubPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  const categories = [
    {
      title: 'Configuración General',
      description: 'Identidad del ecosistema, logo, idioma, moneda, zona horaria y formatos.',
      href: '/super-admin/settings/general',
      icon: Settings,
      colorClass: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Industrias y Capacidades',
      description: 'Gestión de sectores, arquetipos, catálogo central de capacidades y perfiles operativos por empresa.',
      href: '/super-admin/settings/capabilities',
      icon: Boxes,
      colorClass: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Seguridad',
      description: 'Políticas de acceso, sesiones y seguridad de cuentas.',
      href: '/super-admin/settings/security',
      icon: Shield,
      colorClass: 'bg-red-50 text-red-600',
    },
    {
      title: 'Multiempresa',
      description: 'Valores predeterminados, parámetros heredables y configuración inicial.',
      href: '/super-admin/settings/multiempresa',
      icon: Building2,
      colorClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Notificaciones',
      description: 'Alertas, correos automáticos, recordatorios y notificaciones push.',
      href: '/super-admin/settings/notifications',
      icon: Bell,
      colorClass: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Integraciones',
      description: 'Servicios externos y APIs disponibles.',
      href: '/super-admin/settings/integrations',
      icon: Plug,
      colorClass: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Sistema',
      description: 'Estado de la plataforma, servicios e infraestructura.',
      href: '/super-admin/settings/system',
      icon: Server,
      colorClass: 'bg-cyan-50 text-cyan-600',
    },
    {
      title: 'Auditoría',
      description: 'Actividad administrativa, cambios y eventos relevantes.',
      href: '/super-admin/settings/audit',
      icon: Activity,
      colorClass: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Acerca del Sistema',
      description: 'Versión, información del producto, soporte y documentación.',
      href: '/super-admin/settings/about',
      icon: Info,
      colorClass: 'bg-slate-100 text-slate-600',
    },
  ]

  return (
    <div className="space-y-3 sm:space-y-3.5 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">Centro de Configuración Global</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Administración central del ecosistema, módulos y políticas transversales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          return (
            <Link 
              key={idx} 
              href={cat.href}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-100 shadow-2xs hover:border-blue-200 hover:shadow-xs transition-all group cursor-pointer relative"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${cat.colorClass}`}>
                <Icon size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 pr-5 leading-snug tracking-tight">{cat.title}</h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-normal line-clamp-2">{cat.description}</p>
              
              <div className="absolute top-3.5 right-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all">
                <ChevronRight size={13} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
