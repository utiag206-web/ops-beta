'use client'

import Link from 'next/link'
import { ArrowLeft, Info, Cpu, Book, LifeBuoy, Key, Layers, CheckCircle2, Clock } from 'lucide-react'

export function AboutClient() {
  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
      {/* Banner de Información */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3">
        <Info size={20} className="text-slate-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">INFORMACIÓN DEL SISTEMA</h3>
          <p className="text-xs font-medium text-slate-600/80 mt-1">
            Esta pantalla es de solo lectura y proporciona detalles técnicos sobre la instancia actual de la Consola Global.
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
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">ACERCA DEL SISTEMA</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase">INFORMACIÓN GENERAL, VERSIÓN, SOPORTE Y ESTADO DEL PRODUCTO INTHALY OPS.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100/50">
              <Info size={12} className="text-blue-600" />
              <span className="text-[10px] font-black tracking-wider uppercase">CONFIGURACIÓN GLOBAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. INFORMACIÓN DEL PRODUCTO */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">PRODUCTO</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">NOMBRE</span>
              <span className="text-sm font-bold text-slate-800">INTHALY OPS</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">PLATAFORMA</span>
              <span className="text-sm font-bold text-slate-800">CONSOLA GLOBAL</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">VERSIÓN ACTUAL</span>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">v1.0.0-beta</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">BUILD</span>
              <span className="text-sm font-mono text-slate-600">8f92a1c</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">COMPILACIÓN</span>
              <span className="text-sm font-bold text-slate-800">AGOSTO 2026</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">ESTADO VERSIÓN</span>
              <span className="text-sm font-black text-emerald-600 uppercase tracking-tight">ESTABLE (PRE-PROD)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">ENTORNO</span>
              <span className="text-sm font-bold text-slate-800">DESARROLLO</span>
            </div>
          </div>
        </div>

        {/* 2. INFORMACIÓN TÉCNICA */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">INFORMACIÓN TÉCNICA</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">FRAMEWORK</span>
              <span className="text-sm font-bold text-slate-800">NEXT.JS</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">VERSIÓN NEXT.JS</span>
              <span className="text-sm font-bold text-slate-800">15.5.18</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">LIBRERÍA UI</span>
              <span className="text-sm font-bold text-slate-800">REACT 19</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">LENGUAJE</span>
              <span className="text-sm font-bold text-slate-800">TYPESCRIPT</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">BASE DE DATOS</span>
              <span className="text-sm font-bold text-slate-800">SUPABASE (POSTGRESQL)</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">ARQUITECTURA</span>
              <span className="text-sm font-bold text-slate-800">MULTIEMPRESA (AISLADA)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">ESTADO PROYECTO</span>
              <span className="text-sm font-bold text-slate-800">EN CONSTRUCCIÓN FASE 1</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 3. DOCUMENTACIÓN */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Book size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">DOCUMENTACIÓN</h2>
            </div>
          </div>
          <div className="p-6 bg-slate-50/30 flex-1 grid grid-cols-1 gap-3">
            {[
              'Manual del Administrador',
              'Manual Técnico',
              'Guía de Usuario',
              'API Documentation',
              'Centro de Ayuda'
            ].map((doc, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                <span className="text-sm font-bold text-slate-700 uppercase">{doc}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-500 uppercase">PRÓXIMAMENTE</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SOPORTE Y 5. LICENCIA */}
        <div className="flex flex-col gap-6">
          
          {/* SOPORTE */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
                <LifeBuoy size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">SOPORTE</h2>
              </div>
            </div>
            <div className="p-6 bg-slate-50/30 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">CORREO</span>
                <span className="text-sm font-bold text-slate-800">soporte@inthaly.com</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">SITIO WEB</span>
                <span className="text-sm font-bold text-slate-800">www.inthaly.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">CONTACTO TÉCNICO</span>
                <span className="text-sm font-bold text-slate-800">+51 900 000 000</span>
              </div>
            </div>
          </div>

          {/* LICENCIA */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Key size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">LICENCIA</h2>
              </div>
            </div>
            <div className="p-6 bg-slate-50/30 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">ESTADO</span>
                <span className="text-sm font-black text-emerald-600 uppercase">ACTIVA</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">TIPO</span>
                <span className="text-sm font-bold text-slate-800">ENTERPRISE GLOBAL</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">ACTIVACIÓN</span>
                <span className="text-sm font-bold text-slate-800">15 AGO 2026</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">PRÓXIMA VALIDACIÓN</span>
                <span className="text-sm font-bold text-slate-800">15 AGO 2027</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 6. RESUMEN DEL ECOSISTEMA */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">RESUMEN DEL ECOSISTEMA</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tight">ESTADO DE IMPLEMENTACIÓN DE LA CONSOLA GLOBAL FASE 1.</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-slate-50/30">
          {[
            'CONFIGURACIÓN GENERAL',
            'SEGURIDAD',
            'MULTIEMPRESA',
            'NOTIFICACIONES',
            'SISTEMA',
            'AUDITORÍA'
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item}</span>
            </div>
          ))}
          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
            <Clock size={16} className="text-amber-500 shrink-0" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-tight">INTEGRACIONES (PRÓXIMAMENTE)</span>
          </div>
        </div>
      </div>

    </div>
  )
}
