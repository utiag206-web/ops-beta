import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, Shield, Building2, Bell, 
  Plug, Server, Activity, Info, ChevronRight 
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Configuración Global</h1>
          <p className="text-slate-500">Administración central del ecosistema, módulos y políticas transversales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          return (
            <Link 
              key={idx} 
              href={cat.href}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer relative"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${cat.colorClass}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mt-2 pr-6 leading-tight">{cat.title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{cat.description}</p>
              
              <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500">
                <ChevronRight size={20} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
