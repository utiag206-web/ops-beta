import Link from 'next/link'
import { 
  Wrench, Truck, Cpu, Fuel, Activity, ClipboardCheck, 
  Hammer, FileText, ArrowRight, ShieldCheck, Gauge, CheckCircle2
} from 'lucide-react'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mecánica y Mantenimiento | Inthaly OPS',
  description: 'Módulo integral para la gestión técnica, mantenimiento y control de equipos.',
}

export default async function MecanicaHubPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const sections = [
    {
      title: 'Mantenimiento de Vehículos',
      desc: 'Control de mantenimiento preventivo y correctivo para vehículos livianos y pesados.',
      href: '/mecanica/mantenimiento-vehiculos',
      icon: Truck,
      color: 'bg-blue-500 text-white',
      badge: 'Livianos y Pesados'
    },
    {
      title: 'Generador Eléctrico (Mantenimiento)',
      desc: 'Seguimiento de horómetro, filtros, alternador y planes de mantenimiento del grupo electrógeno.',
      href: '/mecanica/generador-mantenimiento',
      icon: Activity,
      color: 'bg-amber-500 text-white',
      badge: 'Preventivo / Correctivo'
    },
    {
      title: 'Generador Eléctrico (Combustible)',
      desc: 'Registro de despachos de diésel, horas operadas por turno y ratio de consumo galones/hora.',
      href: '/mecanica/generador-combustible',
      icon: Fuel,
      color: 'bg-orange-500 text-white',
      badge: 'Control Diésel'
    },
    {
      title: 'Compresora de Aire (Mantenimiento)',
      desc: 'Estado de presiones PSI, cambios de aceite de tornillo/pistón y revisión de válvulas.',
      href: '/mecanica/compresora-mantenimiento',
      icon: Cpu,
      color: 'bg-indigo-500 text-white',
      badge: 'Mantenimiento'
    },
    {
      title: 'Compresora de Aire (Combustible)',
      desc: 'Seguimiento de abastecimiento de combustible y rendimiento por turno de operación.',
      href: '/mecanica/compresora-combustible',
      icon: Fuel,
      color: 'bg-rose-500 text-white',
      badge: 'Control Diésel'
    },
    {
      title: 'Equipos de Mina',
      desc: 'Mantenimiento y reparación de maquinaria subterránea y superficie (scoops, perforadoras).',
      href: '/mecanica/equipos-mina',
      icon: Wrench,
      color: 'bg-emerald-500 text-white',
      badge: 'Maquinaria de Mina'
    },
    {
      title: 'Checklists Pre-Operacionales',
      desc: 'Inspecciones diarias de 10 puntos críticos antes del inicio de turno de cada equipo.',
      href: '/mecanica/checklists',
      icon: ClipboardCheck,
      color: 'bg-teal-500 text-white',
      badge: 'Seguridad Operativa'
    },
    {
      title: 'Control de Herramientas',
      desc: 'Inventario de taller, estado de operatividad, asignación de custodios y calibraciones.',
      href: '/mecanica/herramientas',
      icon: Hammer,
      color: 'bg-purple-500 text-white',
      badge: 'Custodia y Taller'
    },
    {
      title: 'Requerimientos de Taller',
      desc: 'Solicitud directa de repuestos, lubricantes e insumos nuevos o existentes al almacén.',
      href: '/requerimientos',
      icon: FileText,
      color: 'bg-slate-700 text-white',
      badge: 'Logística / Compras'
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Wrench size={28} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                Área de Mecánica y Mantenimiento
              </h1>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-blue-200 uppercase">
                Operativo
              </span>
            </div>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
              Control técnico exclusivo de vehículos, generador, compresora, equipos de mina y herramientas.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Flota Vehicular</p>
            <p className="text-xl font-black text-slate-800">100% Operativo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Generador Eléctrico</p>
            <p className="text-xl font-black text-slate-800">En Línea</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Cpu size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Compresora Mina</p>
            <p className="text-xl font-black text-slate-800">Presión 120 PSI</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Hammer size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Herramientas</p>
            <p className="text-xl font-black text-slate-800">Custodiadas</p>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec, idx) => {
          const Icon = sec.icon
          return (
            <Link
              key={idx}
              href={sec.href}
              className="group bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${sec.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 px-2.5 py-1 rounded-full transition-colors">
                    {sec.badge}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  {sec.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-blue-600">
                <span>Acceder a la sección</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
