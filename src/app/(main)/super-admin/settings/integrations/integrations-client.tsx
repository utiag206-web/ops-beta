'use client'

import Link from 'next/link'
import { ArrowLeft, Plug, Clock, MessageSquare, Database, CalendarDays, Webhook, ShieldAlert, Save } from 'lucide-react'
import { StatusIndicator } from '../components/status-indicator'

export function IntegrationsClient() {
  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
      {/* Banner de Próximamente */}
      <div className="bg-purple-50 border border-purple-200/60 rounded-2xl p-4 flex gap-3">
        <Clock size={20} className="text-purple-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-purple-800 tracking-tight uppercase">PRÓXIMAMENTE</h3>
          <p className="text-xs font-medium text-purple-700/80 mt-1">
            Este módulo se encuentra preparado para la futura integración con servicios externos. Actualmente no existen conexiones activas.
          </p>
        </div>
      </div>

      {/* Encabezado y Navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex-1">
          <Link 
            href="/super-admin/settings"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 uppercase tracking-tight"
          >
            <ArrowLeft size={16} />
            CONFIGURACIÓN
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">INTEGRACIONES</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">PREPARA LA CONEXIÓN ENTRE INTHALY OPS Y SERVICIOS EXTERNOS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Plug size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
            </div>
          </div>
        </div>
        
        <button 
          disabled
          className="flex items-center gap-2 bg-slate-100 text-slate-400 px-5 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed shrink-0 w-full sm:w-auto justify-center uppercase tracking-tight"
        >
          <Save size={18} />
          DISPONIBLE EN PRÓXIMA VERSIÓN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. COMUNICACIÓN */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">COMUNICACIÓN</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 grid grid-cols-1 gap-3">
            <StatusIndicator label="CORREO ELECTRÓNICO" status="PREPARADO" />
            <StatusIndicator label="WHATSAPP BUSINESS" status="PREPARADO" />
            <StatusIndicator label="SMS" status="PREPARADO" />
            <StatusIndicator label="PUSH NOTIFICATIONS" status="PREPARADO" />
          </div>
        </div>

        {/* 2. ALMACENAMIENTO */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">ALMACENAMIENTO</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 grid grid-cols-1 gap-3">
            <StatusIndicator label="GOOGLE DRIVE" status="PREPARADO" />
            <StatusIndicator label="ONEDRIVE" status="PREPARADO" />
            <StatusIndicator label="AMAZON S3" status="PREPARADO" />
          </div>
        </div>

        {/* 3. PRODUCTIVIDAD */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">PRODUCTIVIDAD</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 grid grid-cols-1 gap-3">
            <StatusIndicator label="GOOGLE CALENDAR" status="PREPARADO" />
            <StatusIndicator label="OUTLOOK" status="PREPARADO" />
            <StatusIndicator label="MICROSOFT TEAMS" status="PREPARADO" />
            <StatusIndicator label="SLACK" status="PREPARADO" />
          </div>
        </div>

        {/* 4. APIS */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Webhook size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">APIs Y DESARROLLADORES</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 grid grid-cols-1 gap-3">
            <StatusIndicator label="API KEYS" status="PREPARADO" />
            <StatusIndicator label="WEBHOOKS" status="PREPARADO" />
            <StatusIndicator label="OAUTH" status="PREPARADO" />
          </div>
        </div>

      </div>

      {/* ROADMAP DE INTEGRACIONES */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">PLANIFICACIÓN FUTURA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">ROADMAP DE DESARROLLO DEL MÓDULO.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-slate-50/30 relative overflow-hidden">
          {/* Timeline bar */}
          <div className="absolute left-10 md:left-12 top-8 bottom-8 w-px bg-slate-200"></div>

          <div className="space-y-6 relative">
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(248,250,252,1)] relative z-10 mt-0.5">
                <span className="text-[10px] font-black">1</span>
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-black text-slate-800 uppercase">FASE 1: INFRAESTRUCTURA PREPARADA</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Diseño visual de las interfaces de administración completado.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(248,250,252,1)] relative z-10 mt-0.5">
                <span className="text-[10px] font-black">2</span>
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-black text-slate-800 uppercase">FASE 2: PERSISTENCIA</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Implementación de tablas en Supabase para almacenamiento de credenciales encriptadas.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(248,250,252,1)] relative z-10 mt-0.5">
                <span className="text-[10px] font-black">3</span>
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-black text-slate-800 uppercase">FASE 3: CONEXIÓN DE PROVEEDORES</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Integración técnica con las APIs de terceros a nivel Global.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(248,250,252,1)] relative z-10 mt-0.5">
                <span className="text-[10px] font-black">4</span>
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-black text-slate-800 uppercase">FASE 4: ACTIVACIÓN POR EMPRESA</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Delegación de integraciones hacia los administradores de cada subsistema.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(248,250,252,1)] relative z-10 mt-0.5">
                <span className="text-[10px] font-black">5</span>
              </div>
              <div className="pt-0.5">
                <h4 className="text-sm font-black text-slate-800 uppercase">FASE 5: ADMINISTRACIÓN COMPLETA</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Monitoreo de uso de APIs y flujos automatizados de información.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ESTADO DEL MÓDULO */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">ESTADO TÉCNICO DEL MÓDULO</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">SITUACIÓN ACTUAL DE LA INFRAESTRUCTURA DE INTEGRACIONES.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">ARQUITECTURA</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-700">PREPARADA</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">UI</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-700">IMPLEMENTADA</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">PERSISTENCIA</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-700">PENDIENTE</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">BACKEND</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-700">PENDIENTE</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">SERVICIOS EXTERNOS</span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-700">PENDIENTES</span>
          </div>
        </div>
      </div>

    </div>
  )
}
