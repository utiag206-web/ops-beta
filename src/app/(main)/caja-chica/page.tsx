'use client'

export const dynamic = 'force-dynamic'

import React, { 
  useState, 
  useEffect 
} from 'react'
import { 
  Coins, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Search, 
  Filter,
  CreditCard,
  Phone,
  Banknote,
  Receipt,
  Building,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  Hash
} from 'lucide-react'
import { getPettyCashStats, getPettyCashTransactions } from './actions'
import { useRbac } from '@/components/providers/rbac-provider'
import { AddTransactionModal } from '@/components/caja-chica/add-transaction-modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const CATEGORY_MAP: any = {
  alimentos: { label: 'Alimentos', icon: '🍎' },
  transporte: { label: 'Transporte', icon: '🚗' },
  mantenimiento: { label: 'Mantenimiento', icon: '🔧' },
  utiles: { label: 'Útiles', icon: '📚' },
  emergencia: { label: 'Emergencia', icon: '🚨' },
  otros: { label: 'Otros', icon: '📦' },
  fondo_inicial: { label: 'Fondo Inicial', icon: '🏦' },
  reposicion: { label: 'Reposición', icon: '🔄' },
  reembolso: { label: 'Reembolso', icon: '💰' },
}

export default function CajaChicaPage() {
  const { user, role_id } = useRbac()
  const isAdmin = role_id === 'admin'
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [area, setArea] = useState(user?.area || 'Cocina')

  async function loadData() {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([
        getPettyCashStats(area),
        getPettyCashTransactions(area)
      ])
      setStats(s)
      if (t.data) setTransactions(t.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Si no somos admin/gerente, forzar el área según el rol
    if (!['admin', 'gerente'].includes(role_id || '')) {
      if (role_id === 'administracion') {
        setArea('Administración')
      } else if (role_id === 'operaciones') {
        setArea('Operaciones')
      } else if (user?.area) {
        setArea(user.area)
      }
    }
  }, [user, role_id])

  useEffect(() => {
    loadData()
  }, [area])

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  )

  const methodIcons: any = {
    efectivo: <Banknote className="w-4 h-4 text-emerald-600" />,
    transferencia: <CreditCard className="w-4 h-4 text-blue-600" />,
    yape: <Phone className="w-4 h-4 text-indigo-600" />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center gap-6 relative">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-slate-200">
            <Coins size={32} />
          </div>
          <div>
            {['admin', 'gerente'].includes(role_id || '') ? (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Vista Administrativa Central</p>
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="bg-transparent border-none p-0 text-3xl font-black text-slate-800 tracking-tight focus:ring-0 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <option value="Cocina">Caja Chica: Cocina</option>
                  <option value="Operaciones">Caja Chica: Operaciones</option>
                  <option value="Administración">Caja Chica: Administración</option>
                </select>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Caja Chica: {area}</h1>
                <p className="text-slate-500 font-bold text-lg">Gestión de ingresos y gastos {area}</p>
              </>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] relative z-10"
        >
          <Plus className="w-5 h-5" />
          Registrar Movimiento
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Widget 1: Saldo Actual */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden col-span-1 md:col-span-1">
           <div className="absolute top-4 right-4 text-white/10 rotate-12">
             <Wallet size={80} />
           </div>
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Saldo en Caja</p>
           <h3 className="text-4xl font-black text-white tracking-tighter mb-4">
             S/ {stats?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </h3>
           <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Fondo Activo</span>
           </div>
        </div>

        {/* Widget 2: Ingresos Mes */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
             <TrendingUp size={24} />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos (Mes)</p>
           <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
             S/ {stats?.monthIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </h3>
           <div className="mt-2 text-[10px] font-bold text-emerald-600">Entradas de fondos</div>
        </div>

        {/* Widget 3: Gastos Mes */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1">
           <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
             <TrendingDown size={24} />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gastos (Mes)</p>
           <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
             S/ {stats?.monthExpenses?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </h3>
           <div className="mt-2 text-[10px] font-bold text-rose-600 text-nowrap">Consumo acumulado mensual</div>
        </div>

        {/* Widget 4: Período/Info */}
        <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex flex-col justify-center gap-4 col-span-1">
           <div className="flex justify-between items-center text-[11px] font-black text-blue-900/60 uppercase">
             <span>Período</span>
             <span className="text-blue-900">{format(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase()}</span>
           </div>
           <div className="space-y-2">
             <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${ (stats?.monthExpenses / stats?.monthIncome) > 0.8 ? 'bg-rose-500' : 'bg-blue-600' }`}
                  style={{ width: `${Math.min((stats?.monthExpenses / stats?.monthIncome) * 100 || 0, 100)}%` }}
                ></div>
             </div>
             <p className="text-[9px] font-black text-blue-400 text-right">USO DE RECURSOS DEL MES</p>
           </div>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Historial de Movimientos</h3>
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              {transactions.length} REGISTROS
            </span>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100 w-full lg:w-auto overflow-x-auto no-scrollbar">
             {[
               { id: 'all', label: 'Todos' },
               { id: 'ingreso', label: 'Ingresos' },
               { id: 'egreso', label: 'Egresos' }
             ].map(m => (
               <button 
                key={m.id}
                onClick={() => setFilter(m.id)}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
                  filter === m.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
               >
                 {m.label}
               </button>
             ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Responsable / Categoría</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivo / Concepto</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Referencia</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right px-8">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                     <div className="flex flex-col items-center gap-3">
                       <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                       <span className="text-sm font-bold text-slate-400">Consultando base de datos...</span>
                     </div>
                   </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                     <div className="flex flex-col items-center gap-3 opacity-30">
                       <Wallet size={64} className="text-slate-300" />
                       <span className="text-lg font-black text-slate-400">Sin movimientos que mostrar</span>
                     </div>
                   </td>
                </tr>
              ) : filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-all group animate-in slide-in-from-left duration-300">
                  <td className="py-7 px-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border transition-colors ${
                        t.type === 'ingreso' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <span className={`text-[9px] font-black leading-none mb-1 ${t.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {format(new Date(t.date), 'MMM').toUpperCase()}
                        </span>
                        <span className={`text-base font-black leading-none ${t.type === 'ingreso' ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {format(new Date(t.date), 'dd')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-7">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{t.responsible?.name}</span>
                        <ChevronRight size={10} className="text-slate-300" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs">{CATEGORY_MAP[t.category]?.icon}</span>
                         <span className="text-sm font-black text-slate-800">{CATEGORY_MAP[t.category]?.label || 'General'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-7 max-w-sm">
                    <p className="text-sm font-bold text-slate-700 leading-tight mb-2 group-hover:text-slate-950 transition-colors">{t.reason}</p>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                          {methodIcons[t.payment_method]}
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{t.payment_method}</span>
                       </div>
                    </div>
                  </td>
                  <td className="py-7 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {t.operation_number && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100 flex items-center gap-1">
                           <Hash size={10} /> {t.operation_number}
                        </span>
                      )}
                      {t.voucher_url && (
                        <a 
                          href={t.voucher_url} 
                          target="_blank" 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-white text-[9px] font-black rounded-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-md shadow-slate-200"
                        >
                          <Receipt size={12} /> VER COMPROBANTE
                        </a>
                      )}
                      {!t.operation_number && !t.voucher_url && <span className="text-[10px] text-slate-300 font-bold italic">-</span>}
                    </div>
                  </td>
                  <td className="py-7 text-right px-8">
                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-2 text-xl font-black tracking-tighter ${
                        t.type === 'ingreso' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {t.type === 'ingreso' ? <ArrowUpCircle size={18} className="text-emerald-400" /> : <ArrowDownCircle size={18} className="text-slate-300" />}
                        S/ {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${t.type === 'ingreso' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {t.type === 'ingreso' ? 'Ingreso a caja' : 'Egreso de caja'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false)
          loadData()
        }}
        area={area}
      />
    </div>
  )
}
