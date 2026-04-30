'use client'

import { Calendar, Clock, User, CheckCircle2, ArrowRight } from 'lucide-react'

interface AttendanceListProps {
  records: any[]
  isWorker?: boolean
}

export function AttendanceList({ records = [], isWorker = false }: AttendanceListProps) {
  if (!records || records.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Calendar className="text-slate-300" size={32} />
        </div>
        <p className="font-medium text-slate-700">Sin registros de asistencia</p>
        <p className="text-xs text-slate-500 mt-1">No se han encontrado registros para el periodo seleccionado.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Día / Fecha</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Marcación (Ingreso - Salida)</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {isWorker ? 'Mi Asistencia' : record.worker?.name || 'Sistema'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-600 capitalize">
                      {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4 font-mono text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                      <span className="font-bold">{record.check_in || '--:--'}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-300" />
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                      <span className="font-bold">{record.check_out || '--:--'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                    record.check_in && record.check_out 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {record.check_in && record.check_out ? 'Completo' : 'En Curso'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
