import Link from 'next/link'
import { 
  Users, UserCheck, ShieldAlert, BadgeDollarSign, 
  Package, Boxes, ClipboardCheck, Activity, 
  Clock, CheckCircle2, ArrowRight, FileText,
  Mountain, Bed, Construction, Building2
} from 'lucide-react'

export function StatWidget({ title, value, icon: Icon, color, bg, href, trend }: any) {
  const content = (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between gap-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 group h-full relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className={`${bg} p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm`}>
          <Icon className={color} size={26} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
            trend.type === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.type === 'up' ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 opacity-80">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">{value}</p>
      </div>
    </div>
  )

  if (href) return <Link href={href} className="block h-full">{content}</Link>
  return content
}

export function AlertWidget({ title, message, icon: Icon, color, bg, href }: any) {
  return (
    <div className={`${bg} border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 group-hover:rotate-12 transition-transform">
          <Icon className={color} size={28} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
          <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{message}</h4>
        </div>
      </div>
      {href && (
        <Link href={href} className="p-3 bg-white rounded-xl text-slate-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-blue-600 hover:scale-110">
          <ArrowRight size={24} />
        </Link>
      )}
    </div>
  )
}

export function ListWidget({ title, items, icon: Icon, color, hrefLabel, href }: any) {
  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-4">
          <div className={`${color.replace('text-', 'bg-')}/10 p-3 rounded-2xl`}>
            <Icon className={color} size={22} strokeWidth={2.5} />
          </div>
          <span className="tracking-tight">{title}</span>
        </h3>
        {href && (
          <Link href={href} className="text-[10px] font-black text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-2 px-5 py-2.5 bg-blue-50 rounded-xl transition-all uppercase tracking-widest shadow-sm">
            {hrefLabel || 'Ver todos'} <ArrowRight size={14} strokeWidth={3} />
          </Link>
        )}
      </div>
      <div className="space-y-4 flex-1">
        {items?.length > 0 ? (
          items.map((item: any, idx: number) => (
            <div key={idx} className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-[1.5rem] flex items-center justify-between group/item hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight group-hover/item:text-blue-600 transition-colors">{item.title || item.name}</p>
                <p className="text-[11px] font-bold text-slate-400 truncate mt-1">{item.subtitle}</p>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase ml-4 shadow-sm border ${item.badgeColor || 'bg-white text-slate-600 border-slate-100'}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-10 bg-slate-50/30 rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <Icon className="text-slate-200" size={32} />
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest leading-loose">No hay actividad reciente</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function WelcomeHero({ userName, roleName, area, companyName, viewMode }: any) {
  const getHeroContent = () => {
    switch (viewMode) {
      case 'ADMIN':
        return {
          title: "Panel Ejecutivo General",
          text: "Supervisa indicadores globales, personal y operaciones en tiempo real."
        }
      case 'FINANCE':
        return {
          title: "Gestión Administrativa y Finanzas",
          text: "Monitorea presupuestos, caja chica, pagos de bonos y reportes financieros."
        }
      case 'SOMA':
        return {
          title: "Centro de Seguridad Industrial",
          text: "Gestiona incidencias, capacitaciones, STOPs y cultura preventiva."
        }
      case 'OPERACIONES':
        return {
          title: "Centro Operativo",
          text: "Controla producción diaria, personal activo y flujo operativo."
        }
      case 'COCINA':
        return {
          title: "Gestión Cocina",
          text: "Administra insumos, consumo diario, caja chica y requerimientos."
        }
      case 'ALMACEN':
        return {
          title: "Centro Logístico",
          text: "Controla stock, ingresos, salidas y transferencias."
        }
      case 'WORKER':
        return {
          title: "Mi Espacio Laboral",
          text: "Consulta asistencia, beneficios, documentos y novedades internas."
        }
      default:
        return {
          title: "Panel de Control",
          text: "Visualiza el rendimiento operativo en tiempo real."
        }
    }
  }

  const content = getHeroContent()

  return (
    <div className="bg-[#1D4ED8] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] group-hover:bg-white/20 transition-all duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px]" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-white/10 backdrop-blur-xl text-white text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-[0.2em] border border-white/10 shadow-xl">
              {roleName} {area ? `| ${area}` : ''}
            </span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Building2 size={14} />
              {companyName}
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter leading-none text-white">
            {content.title} 👋
            <br />
            <span className="text-2xl lg:text-3xl text-blue-100 mt-3 block font-black">Hola, {userName}</span>
          </h1>
          <p className="text-blue-50 text-lg font-bold leading-relaxed max-w-lg mt-6">
            {content.text}
          </p>
        </div>
        
        <div className="flex items-center gap-8 shrink-0">
           <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 hover:bg-white/15 transition-all">
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Estado Global</p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                <p className="text-xl font-black text-white uppercase tracking-tighter">Operativo</p>
              </div>
           </div>
           
           <div className="hidden xl:flex flex-col items-center justify-center w-24 h-24 bg-white/10 rounded-full border border-white/20">
              <Activity size={32} className="text-white animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  )
}
