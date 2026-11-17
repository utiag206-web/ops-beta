'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, ArrowRight, Users, Wrench, 
  Compass, Lock, Sparkles, CheckCircle2, Globe 
} from 'lucide-react'
import { authorizeOidcFlowAction } from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function CommunityLoginClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleContinueWithInthalyId = async () => {
    setIsLoading(true)
    try {
      const res = await authorizeOidcFlowAction({
        clientId: 'inthaly-community-web',
        redirectUri: 'http://localhost:3000/comunidad/callback',
        scope: 'openid profile email community.write'
      })

      if (res.success && res.data) {
        router.push(res.data.redirectUrl)
      } else {
        toast.error(res.error || 'Error iniciando flujo de autenticación')
      }
    } catch {
      toast.error('Error de conexión con Inthaly ID')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      
      {/* Tarjeta Principal de Bienvenida */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Columna Izquierda: Presentación y Visión */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-600/25">
                IN
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-slate-900 leading-none">
                  Comunidad <span className="text-blue-600">Inthaly</span>
                </span>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">
                  Red Social Profesional
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Conecta con las personas que hacen crecer tu industria.
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                El espacio especializado para técnicos, ingenieros, supervisores, transportistas y contratistas de minería y faena pesada.
              </p>
            </div>

            {/* Puntos Clave de Valor */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Conocimiento Técnico Real</h4>
                  <p className="text-slate-500 text-[11px]">Resuelve fallas operativas de bombas, perforadoras y motores diésel con colegas en campo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Grupos y Foros Dinámicos</h4>
                  <p className="text-slate-500 text-[11px]">Crea o únete libremente a comunidades sobre SOMA, geología, voladura y mantenimiento.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Privacidad y Soberanía Total</h4>
                  <p className="text-slate-500 text-[11px]">Tu identidad pertenece a ti. Tu empleador no puede ver tus conversaciones privadas ni foros cerrados.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Ecosistema Tecnológico Inthaly · Minería, Construcción, Logística y Energía · 2026
          </div>
        </div>

        {/* Columna Derecha: Acceso con Inthaly ID */}
        <div className="lg:col-span-5 bg-slate-50/80 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-200/90 flex flex-col justify-center space-y-6">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-md shadow-blue-600/25">
              ID
            </div>
            <h3 className="text-base font-black text-slate-900">Ingreso Seguro Centralizado</h3>
            <p className="text-xs text-slate-500">
              Inicia sesión con tu cuenta global Inthaly ID
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleContinueWithInthalyId}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Conectando con Inthaly ID...' : 'Continuar con Inthaly ID'}</span>
              <ArrowRight size={16} />
            </button>

            <Link
              href="/id/register?client_id=inthaly-community-web&redirect_uri=http://localhost:3000/comunidad/callback"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              Crear cuenta nueva Inthaly ID
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-[11px] text-slate-500 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Lock size={12} className="text-blue-600" />
              <span>Autenticación descentralizada</span>
            </div>
            <p className="leading-relaxed">
              No duplicas contraseñas ni perfiles. Tus credenciales se validan en el núcleo seguro de Inthaly ID.
            </p>
          </div>

          <div className="text-center">
            <Link href="/comunidad" className="text-xs font-bold text-slate-500 hover:text-slate-800">
              Explorar como visitante →
            </Link>
          </div>

        </div>

      </div>

    </div>
  )
}
