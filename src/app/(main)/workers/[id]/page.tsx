import { getWorkerById, getWorkerDocuments, getWorkerChildren } from '../actions'
import { getUserSession } from '@/lib/auth'
import { getPPEDeliveries } from '../../ppe/actions'
import { getBonuses } from '../../bonuses/actions'
import { getTransportPayments } from '../../transport/actions'
import { getAttendance } from '../../attendance/actions'
import { WorkerDocuments } from '@/components/workers/worker-documents'
import { WorkerProfileForm } from '@/components/workers/worker-profile-form'
import { WorkerChildren } from '@/components/workers/worker-children'
import { PPEList } from '@/components/ppe/ppe-list'
import { BonusList } from '@/components/bonuses/bonus-list'
import { TransportList } from '@/components/transport/transport-list'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { ArrowLeft, User, Phone, IdCard, Calendar, Briefcase, Shield, FileText, Coins, Bus, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function WorkerDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const { extendedUser } = await getUserSession()
  const canManage = ['admin', 'operaciones'].includes(extendedUser?.role_id || '')
  
  const worker = await getWorkerById(id)

  if (!worker) {
    notFound()
  }

  const [documents, ppeDeliveries, bonuses, transportPayments, attendanceHistory, children] = await Promise.all([
    getWorkerDocuments(id),
    getPPEDeliveries(id),
    getBonuses(id),
    getTransportPayments(id),
    getAttendance(id),
    getWorkerChildren(id)
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/workers" 
          className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Perfil del Trabajador</h1>
          <p className="text-slate-500">Gestiona la información y documentos de {worker.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-4 border-4 border-white shadow-sm overflow-hidden">
              {worker.photo_url ? (
                <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{worker.name}</h2>
            <p className="text-blue-600 font-medium">{worker.position}</p>
            
            <div className="mt-4 w-full pt-4 border-t border-slate-50 space-y-3 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <IdCard size={18} className="text-slate-400" />
                <span className="text-sm">DNI: {worker.dni}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-slate-400" />
                <span className="text-sm">{worker.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm">Ingreso: {worker.hire_date ? new Date(worker.hire_date).toLocaleDateString() : 'No registrada'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Briefcase size={18} className="text-slate-400" />
                <span className="text-sm">Estado: 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {worker.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <IdCard size={20} className="text-blue-600" />
              Ficha Técnica del Trabajador
            </h3>
            <WorkerProfileForm worker={worker} childrenList={children} canManage={canManage} />
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Historial de Asistencia
            </h3>
            <AttendanceList records={attendanceHistory} />
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Coins size={20} className="text-amber-500" />
              Bonificaciones
            </h3>
            <BonusList bonuses={bonuses} isAdmin={true} />
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bus size={20} className="text-indigo-500" />
              Pasajes y Transporte
            </h3>
            <TransportList payments={transportPayments} />
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Equipos de Protección (EPP)
            </h3>
            <PPEList deliveries={ppeDeliveries} />
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Documentación
            </h3>
            <WorkerDocuments workerId={worker.id} initialDocuments={documents} canManage={canManage} />
          </section>
        </div>
      </div>
    </div>
  )
}
