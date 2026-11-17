'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Briefcase, MapPin, Tag, ShieldCheck, 
  ArrowRight, Sparkles, CheckCircle2 
} from 'lucide-react'
import { updateCommunityProfileAction } from '@/app/(community)/comunidad/actions'
import { toast } from 'sonner'

export default function CommunityOnboardingClient() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [specialty, setSpecialty] = useState('Seguridad y Salud (SOMA)')
  const [locationRegion, setLocationRegion] = useState('Arequipa, Perú')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const specialties = [
    'Seguridad y Salud (SOMA)',
    'Mantenimiento Mecánico y Flota',
    'Perforación y Voladura',
    'Operaciones de Mina Subterránea',
    'Operaciones de Tajo Abierto',
    'Geología y Geomecánica',
    'Transporte Pesado y Logística'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('El nombre visible es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      // REGLA A4: El servidor resuelve la identidad desde la cookie de sesión autenticada
      const res = await updateCommunityProfileAction({
        display_name: displayName.trim(),
        headline: headline.trim() || `Especialista en ${specialty}`,
        bio: bio.trim() || `Profesional del sector industrial especializado en ${specialty}.`,
        location_region: locationRegion,
        specialties: [specialty],
        allow_employer_matching: false
      })

      if (res.success) {
        toast.success('¡Perfil comunitario configurado con éxito!')
        router.push('/comunidad')
      } else {
        toast.error(res.error || 'Error al crear perfil. Asegúrate de haber iniciado sesión.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de sesión no autorizada')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xl mx-auto border border-blue-200">
            <Sparkles size={22} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Configura tu perfil en <span className="text-blue-600">Comunidad Inthaly</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Completa tus datos profesionales para conectar con colegas de mina, participar en foros y descubrir oportunidades técnicas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Paso 1: Nombre profesional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" /> Nombre Completo o Título Visible
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Ing. Carlos Mendoza o Juan Pérez"
              required
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Paso 2: Titular profesional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Briefcase size={13} className="text-slate-400" /> Titular o Cargo Actual
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ej. Supervisor SOMA Senior | Residente de Guardia"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Paso 3: Especialidad Principal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" /> Especialidad Principal
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Paso 4: Región / Zona Operativa */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" /> Ubicación u Operación Minera
            </label>
            <input
              type="text"
              value={locationRegion}
              onChange={(e) => setLocationRegion(e.target.value)}
              placeholder="Ej. Arequipa, Perú | Campamento Cuajone"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Paso 5: Biografía corta */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Resumen Técnico o Trayectoria (Opcional)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Breve reseña sobre tus años de experiencia, certificaciones o proyectos destacados..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salvaguarda de privacidad soberana */}
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-blue-900">Privacidad y Soberanía Inthaly</p>
              <p className="text-[11px] text-blue-700/90 leading-tight">
                Tu perfil pertenece a tu identidad Inthaly ID. Tu empleador en InthalyOps no puede acceder a tus mensajes privados ni a tus grupos cerrados.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? 'Guardando perfil...' : 'Comenzar a Explorar Comunidad'}
            <ArrowRight size={14} />
          </button>
        </form>

      </div>
    </div>
  )
}
