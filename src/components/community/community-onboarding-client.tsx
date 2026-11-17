'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  User, Briefcase, MapPin, Tag, ShieldCheck, 
  ArrowRight, Sparkles, CheckCircle2 
} from 'lucide-react'
import { updateCommunityProfileAction } from '@/app/(community)/comunidad/actions'
import { toast } from 'sonner'

export default function CommunityOnboardingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const identityId = searchParams.get('identity_id') || 'id-new-community-member'
  const initialName = searchParams.get('name') || 'Profesional de Mina'

  const [displayName, setDisplayName] = useState(initialName)
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
      const res = await updateCommunityProfileAction({
        id: identityId,
        display_name: displayName,
        headline: headline.trim() || `Especialista en ${specialty}`,
        bio: bio.trim() || `Profesional del sector industrial especializado en ${specialty}.`,
        location_region: locationRegion,
        specialties: [specialty],
        allow_employer_matching: false
      })

      if (res.success) {
        toast.success('¡Perfil comunitario creado con éxito!')
        router.push('/comunidad')
      } else {
        toast.error(res.error || 'Error al crear perfil')
      }
    } catch {
      toast.error('Error al guardar perfil')
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
            Tu Inthaly ID ya está validado. Define cómo te verán otros colegas e ingenieros en la red.
          </p>
        </div>

        {/* Formulario Progresivo */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" /> Nombre Público en Comunidad
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" /> Especialidad Principal
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {specialties.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Briefcase size={13} className="text-slate-400" /> Titular Profesional (Headline)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ej: Supervisor SOMA | Auditor OHSAS / ISO"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" /> Región / Ubicación Operativa (Opcional)
            </label>
            <input
              type="text"
              value={locationRegion}
              onChange={(e) => setLocationRegion(e.target.value)}
              placeholder="Ej: Arequipa / Cusco / Moquegua, Perú"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Breve Presentación o Biografía (Opcional)</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Comparte tu experiencia en mina, plantas o talleres..."
              className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Privacidad Garantizada por Diseño</span>
            </div>
            <p className="text-blue-800/80 leading-relaxed">
              Tu participación en Comunidad es soberana y voluntaria. No expone tus contratos ni datos laborales en InthalyOps.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? 'Guardando perfil...' : 'Comenzar a Participar en la Red'}
            <ArrowRight size={16} />
          </button>
        </form>

      </div>
    </div>
  )
}
