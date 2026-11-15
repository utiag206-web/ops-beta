'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Shield, User, MapPin, Tag, Lock, AlertTriangle, 
  CheckCircle2, PauseCircle, Trash2, LogOut, Info, Eye, EyeOff,
  ShieldCheck, ArrowLeft, ChevronRight, Camera, Edit3, Briefcase,
  GraduationCap, Globe, Users, Bookmark, MessageSquare, Check, Sparkles
} from 'lucide-react'
import type { CommunityProfile, UnlinkLevel } from '@/types/community.types'
import { updateCommunityProfileAction, unlinkCommunityAction } from '@/app/(community)/comunidad/actions'
import { toast } from 'sonner'

export default function CommunityProfileClient({
  initialProfile
}: {
  initialProfile: CommunityProfile | null
}) {
  const [profile, setProfile] = useState<CommunityProfile | null>(initialProfile)
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'groups' | 'privacy'>('posts')
  
  // Formulario de edición
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || 'Ing. Carlos Mendoza')
  const [headline, setHeadline] = useState(initialProfile?.headline || 'Ingeniero de Minas Residente | Especialista en Subterránea')
  const [bio, setBio] = useState(initialProfile?.bio || 'Más de 14 años liderando operaciones mineras subterráneas en el sur del Perú. Especialista en mallas de perforación, seguridad de socavón y gestión de guardias.')
  const [locationRegion, setLocationRegion] = useState(initialProfile?.location_region || 'Arequipa, Perú')
  const [specialtiesInput, setSpecialtiesInput] = useState(initialProfile?.specialties?.join(', ') || 'Perforación y Voladura, Seguridad Minera, Gestión de Guardias')
  const [allowEmployerMatching, setAllowEmployerMatching] = useState(!!initialProfile?.allow_employer_matching)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Estado de desvinculación activa
  const [isPaused, setIsPaused] = useState(initialProfile ? !initialProfile.is_active : false)
  const [isDeleted, setIsDeleted] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const specialties = specialtiesInput.split(',').map(s => s.trim()).filter(Boolean)
      const res = await updateCommunityProfileAction({
        id: profile?.id,
        display_name: displayName,
        headline,
        bio,
        location_region: locationRegion,
        specialties,
        allow_employer_matching: allowEmployerMatching
      })

      if (res.success && res.data) {
        setProfile(res.data)
        setIsEditingInfo(false)
        toast.success('Perfil profesional actualizado con éxito')
      } else {
        toast.error('Error al actualizar perfil')
      }
    } catch (e) {
      toast.error('Error en el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlink = async (level: UnlinkLevel) => {
    const confirmationMessages: Record<UnlinkLevel, string> = {
      pause_profile: '¿Deseas pausar tu perfil comunitario? Ocultará tus posts y perfil del feed público temporalmente.',
      resume_profile: '¿Deseas reactivar tu perfil comunitario para volver a ser visible?',
      leave_group: '¿Deseas salir de todas las comunidades técnicas seleccionadas?',
      delete_community_presence: '¿Seguro que deseas eliminar totalmente tu presencia en Comunidad? Esto borrará tu perfil y posts comunitarios. (Tu empleo, tareo y boletas en InthalyOps no se verán afectados).'
    }

    if (!window.confirm(confirmationMessages[level])) return

    try {
      const res = await unlinkCommunityAction(level)
      if (res.success) {
        toast.success(res.message)
        if (level === 'pause_profile') setIsPaused(true)
        if (level === 'resume_profile') setIsPaused(false)
        if (level === 'delete_community_presence') {
          setIsDeleted(true)
          setProfile(null)
        }
      }
    } catch (e) {
      toast.error('Error al procesar la desvinculación')
    }
  }

  if (isDeleted) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Presencia Comunitaria Eliminada</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Has ejercido tu derecho al olvido comunitario. Tu perfil, posts y participaciones en foros han sido borrados de la red pública.
        </p>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 text-left text-xs space-y-2">
          <p className="font-bold text-blue-950 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-600" />
            Garantía Inmutable de InthalyOps (ADR-014):
          </p>
          <p className="text-blue-900/80 leading-relaxed text-[11px]">
            Tus datos laborales, asistencias de tareo, tareos mensuales y registros contractuales permanecen 100% intactos y seguros dentro del portal de tu empresa empleadora.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <ArrowLeft size={14} /> Volver a InthalyOps
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA DE PERFIL ESTILO FACEBOOK CONTEMPORÁNEO (COVER + AVATAR + TABS)*/}
      {/* ========================================================================= */}
      <div className="bg-white rounded-b-3xl border-b border-x border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Foto de Portada Panorámica */}
        <div className="h-44 sm:h-64 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative flex items-end justify-end p-4">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" />
          <button
            type="button"
            onClick={() => toast.info('Subida de foto de portada disponible en siguiente actualización')}
            className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Editar portada</span>
          </button>
        </div>

        {/* Fila de Avatar Superpuesto e Identidad */}
        <div className="px-4 sm:px-8 pb-4 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            
            {/* Avatar Circular Superpuesto con Anillo Blanco */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl ring-4 ring-white">
                  CM
                </div>
                <button
                  type="button"
                  onClick={() => toast.info('Actualización de foto de perfil disponible')}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-700 flex items-center justify-center shadow-md cursor-pointer transition-colors"
                  title="Cambiar foto de perfil"
                >
                  <Camera size={16} />
                </button>
              </div>

              {/* Nombre, Verificación y Headline */}
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {profile?.display_name || displayName}
                  </h1>
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]" title="Perfil Verificado en Red Inthaly">
                    ✓
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-lg">
                  {profile?.headline || headline}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" /> {profile?.location_region || locationRegion}
                  </span>
                  <span>·</span>
                  <span className="font-bold text-slate-800">42 conexiones</span>
                </div>
              </div>
            </div>

            {/* Acciones de Cabecera */}
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('about')
                  setIsEditingInfo(true)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 size={14} /> Editar perfil
              </button>
              <Link
                href="/comunidad"
                className="px-4 py-2 bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Ver muro
              </Link>
            </div>

          </div>

          {/* Barra de Pestañas de Perfil (Facebook Profile Navigation Tabs) */}
          <div className="mt-6 border-t border-slate-200/80 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'posts' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}
            >
              Publicaciones
              {activeTab === 'posts' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'about' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}
            >
              Información & Especialidades
              {activeTab === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'groups' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}
            >
              Grupos & Foros (2)
              {activeTab === 'groups' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                activeTab === 'privacy' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}
            >
              Privacidad & Desconexión
              {activeTab === 'privacy' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO SEGÚN PESTAÑA ACTIVA (DISTRIBUCIÓN 2 COLUMNAS ESTILO FACEBOOK)*/}
      {/* ========================================================================= */}

      {/* TAB 1: PUBLICACIONES & RESUMEN DE INTRO */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Columna Izquierda: Intro / Información Rápida */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Presentación</h3>
              <p className="text-xs text-slate-700 leading-relaxed text-center sm:text-left">
                {profile?.bio || bio}
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} className="text-slate-400" />
                  <span>Ingeniero de Minas Residente</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={16} className="text-slate-400" />
                  <span>Especialista en Mina Subterránea & Mallas</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-slate-400" />
                  <span>Vive en <span className="font-bold text-slate-900">{profile?.location_region || locationRegion}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-slate-400" />
                  <span>Visibilidad: <span className="font-bold text-blue-700">Pública en Red Inthaly</span></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('about')
                  setIsEditingInfo(true)
                }}
                className="w-full py-2 bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Editar información
              </button>
            </div>

            {/* Especialidades Clave */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
              <h3 className="text-sm font-black text-slate-900">Especialidades Técnicas</h3>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.specialties || ['Perforación y Voladura', 'Seguridad Minera', 'Gestión de Guardias']).map(sp => (
                  <span
                    key={sp}
                    className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Timeline de Publicaciones del Usuario */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Post del usuario en su muro */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  CM
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{profile?.display_name || displayName}</h4>
                  <span className="text-[10px] text-slate-400">Hace 4 horas · Público</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                Colegas, ante las bajas temperaturas (-8°C) en campamento sobre los 4,300 msnm, estamos reforzando la purga de condensado en líneas de aire para evitar congelamiento de válvulas en martillos perforadores. ¿Qué tipo de aditivo anticongelante les ha dado mejor ratio costo-beneficio sin degradar los sellos de nitrilo?
              </p>
              <div className="flex gap-1.5">
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">#Perforación</span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">#Campamento</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1 text-blue-600">👍 14 Me sirve</span>
                <span>3 comentarios</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: INFORMACIÓN & EDICIÓN DE PERFIL */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Información Profesional Soberana</h2>
            <p className="text-xs text-slate-500">
              Esta información se muestra en tu perfil público de Comunidad Inthaly y calibra las recomendaciones de colegas.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre público / Titulación</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ubicación / Región</label>
                <input
                  type="text"
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Titular profesional (Headline)</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Especialidades (separadas por comas)</label>
              <input
                type="text"
                value={specialtiesInput}
                onChange={(e) => setSpecialtiesInput(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Biografía / Trayectoria</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: GRUPOS & FOROS */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Mis Grupos y Foros</h2>
              <p className="text-xs text-slate-500">Espacios técnicos donde participas activamente.</p>
            </div>
            <Link
              href="/comunidad/grupos"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Explorar más grupos
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                SO
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">SOMA & Seguridad en Operaciones</h4>
                <p className="text-[11px] text-slate-500">124 miembros · Miembro activo</p>
                <Link href="/comunidad/grupos" className="text-[11px] font-bold text-blue-600 hover:underline mt-1 inline-block">
                  Ir al foro del grupo →
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                MP
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Mecánica Pesada y Flotas</h4>
                <p className="text-[11px] text-slate-500">89 miembros · Miembro activo</p>
                <Link href="/comunidad/grupos" className="text-[11px] font-bold text-blue-600 hover:underline mt-1 inline-block">
                  Ir al foro del grupo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SALVAGUARDAS, PRIVACIDAD Y DESCONEXIÓN EN 3 NIVELES */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} />
              Salvaguardas de Privacidad y Desconexión Soberana
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tus derechos garantizados por la arquitectura de Inthaly (ADR-013 y ADR-014).
            </p>
          </div>

          {/* Nivel 1: Pausar Perfil */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900">Nivel 1: Pausar visibilidad comunitaria</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Oculta temporalmente tu perfil del feed general y de las sugerencias. Puedes reactivarlo en cualquier momento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleUnlink(isPaused ? 'resume_profile' : 'pause_profile')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer ${
                isPaused 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {isPaused ? 'Reanudar perfil' : 'Pausar perfil'}
            </button>
          </div>

          {/* Nivel 2: Desvincular de Empleador */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900">Nivel 2: Desvincular de empleador actual</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Elimina cualquier correlación comunitaria con la empresa que te invitó. Tu perfil personal continúa existiendo de forma autónoma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleUnlink('leave_group')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              Desvincular
            </button>
          </div>

          {/* Nivel 3: Supresión Definitiva */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-rose-900">Nivel 3: Eliminación comunitaria definitiva</h4>
              <p className="text-[11px] text-rose-700/80 leading-relaxed mt-0.5">
                Borra permanentemente tu perfil y aportes en Comunidad Inthaly. Tu relación de trabajo y tareo en InthalyOps permanece 100% protegida.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleUnlink('delete_community_presence')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0 cursor-pointer"
            >
              Eliminar
            </button>
          </div>

        </div>
      )}

    </div>
  )
}
