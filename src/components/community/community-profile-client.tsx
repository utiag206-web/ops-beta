'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Shield, User, MapPin, Tag, Lock, AlertTriangle, 
  CheckCircle2, PauseCircle, Trash2, LogOut, Info, Eye, EyeOff,
  ShieldCheck, ArrowLeft, ChevronRight, Camera, Edit3, Briefcase,
  GraduationCap, Globe, Users, Bookmark, MessageSquare, Check, Sparkles,
  Mail, Phone, FileText, Award, Lightbulb, ChevronDown, Plus, ExternalLink
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
  const [activeTab, setActiveTab] = useState<'cv' | 'posts' | 'groups' | 'privacy'>('cv')
  
  // Formulario y estado de edición
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || 'Ing. Carlos Mendoza')
  const [headline, setHeadline] = useState(initialProfile?.headline || 'Ingeniero de Minas Residente | Especialista en Subterránea')
  const [bio, setBio] = useState(initialProfile?.bio || 'Profesional adaptable a cualquier entorno laboral, proactivo, con más de 14 años liderando operaciones mineras subterráneas en el sur del Perú. Especialista en mallas de perforación, seguridad de socavón y gestión de guardias.')
  const [locationRegion, setLocationRegion] = useState(initialProfile?.location_region || 'Arequipa, Perú')
  const [phone, setPhone] = useState('+51 987 654 321')
  const [email, setEmail] = useState('carlos.mendoza@inthaly.com')
  const [specialtiesInput, setSpecialtiesInput] = useState(initialProfile?.specialties?.join(', ') || 'Perforación y Voladura, Seguridad Minera, Gestión de Guardias')
  const [allowEmployerMatching, setAllowEmployerMatching] = useState(!!initialProfile?.allow_employer_matching)
  
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Experiencias Profesionales (Estructura de la Referencia Visual)
  const [experiences, setExperiences] = useState([
    {
      id: 'exp-1',
      role: 'Ingeniero Residente de Mina',
      company: 'CONTRATISTAS MINEROS UNIDOS S.A.C.',
      dates: 'Febrero 2024 - Actualidad',
      description: 'Supervisión directa de frentes de avance en socavón, control de ciclo de minado, perforación mecanizada y cumplimiento de estándares SOMA.',
      location: 'Arequipa, Perú'
    },
    {
      id: 'exp-2',
      role: 'Jefe de Guardia de Operaciones Subterráneas',
      company: 'SERVICIOS MINEROS DEL SUR S.A.',
      dates: 'Enero 2020 - Febrero 2024',
      description: 'Coordinación operativa de guardias rotativas, asignación de cuadrillas de perforistas y operadores de scoops. Reportes de tareo y productividad diaria.',
      location: 'Cusco, Perú'
    },
    {
      id: 'exp-3',
      role: 'Supervisor Junior SOMA',
      company: 'MINERA HUANCAVELICA S.A.C.',
      dates: 'Marzo 2016 - Noviembre 2019',
      description: 'Inspección de labores subterráneas, control de ventilación de mangas, monitoreo de gases y capacitación continua en IPERC Continuo.',
      location: 'Huancavelica, Perú'
    }
  ])

  // Estudios y Formación Técnica
  const [studies, setStudies] = useState([
    {
      id: 'edu-1',
      degree: 'Ingeniería de Minas',
      institution: 'Universidad Nacional de San Agustín (UNSA)',
      dates: '2010 - 2015'
    },
    {
      id: 'edu-2',
      degree: 'Diplomado en Gestión de Seguridad y Salud Ocupacional Minera',
      institution: 'Instituto de Seguridad Minera (ISEM)',
      dates: '2021 - 2022'
    }
  ])

  // Idiomas
  const [languages, setLanguages] = useState([
    { id: 'lang-1', name: 'Español', level: 'Nativo' },
    { id: 'lang-2', name: 'Inglés', level: 'Intermedio Técnico' }
  ])

  // Estado de banners informativos (omitibles)
  const [showBioTip, setShowBioTip] = useState(true)
  const [showStudiesTip, setShowStudiesTip] = useState(true)
  const [showTestTip, setShowTestTip] = useState(true)

  // Desvinculación y estado
  const [isPaused, setIsPaused] = useState(initialProfile ? !initialProfile.is_active : false)
  const [isDeleted, setIsDeleted] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const specialties = specialtiesInput.split(',').map(s => s.trim()).filter(Boolean)
      const res = await updateCommunityProfileAction({
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
    } catch {
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
    } catch {
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
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA: PORTADA PANORÁMICA Y FOTOGRAFÍA ACTUAL (OBLIGATORIA)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Foto de Portada Panorámica Original */}
        <div className="h-40 sm:h-56 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 relative flex items-end justify-end p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent" />
          <button
            type="button"
            onClick={() => toast.info('Subida de portada personalizada')}
            className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Cambiar portada</span>
          </button>
        </div>

        {/* Fila de Avatar Superpuesto e Identidad */}
        <div className="px-5 sm:px-8 pb-5 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
            
            {/* Avatar Circular con Botón Azul '+' según Referencia */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl ring-4 ring-white overflow-hidden">
                  <User size={54} className="text-slate-300" />
                </div>
                <button
                  type="button"
                  onClick={() => toast.info('Actualizar foto de perfil')}
                  className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-colors"
                  title="Añadir foto"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Datos de Contacto y Nombre */}
              <div className="space-y-1 mb-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {displayName}
                  </h1>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingInfo(true)}
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <MapPin size={12} className="text-slate-400" /> {locationRegion}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-600 pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail size={12} className="text-blue-600" /> {email}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={12} className="text-blue-600" /> {phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 size={13} /> Editar perfil
              </button>
              <Link
                href="/comunidad"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Ver muro
              </Link>
            </div>

          </div>

          {/* Navegación por Pestañas */}
          <div className="mt-5 border-t border-slate-100 flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('cv')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'cv' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Currículum & Trayectoria
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'posts' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Publicaciones Técnicas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'groups' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Grupos & Foros
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'privacy' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Privacidad & Desconexión
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN RÁPIDA                                                   */}
      {/* ========================================================================= */}
      {isEditingInfo && (
        <div className="bg-white rounded-3xl border border-blue-200 shadow-lg p-5 sm:p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">Editar Datos Profesionales</h3>
            <button type="button" onClick={() => setIsEditingInfo(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
              Cerrar ✕
            </button>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Visible</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Cargo / Puesto Principal</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Resumen Profesional</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PESTAÑA PRINCIPAL: CURRÍCULUM Y TRAYECTORIA (REFERENCIA EXACTA)        */}
      {/* ========================================================================= */}
      {activeTab === 'cv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* COLUMNA IZQUIERDA: CV TRAYECTORIA (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Tarjeta de Titular y Resumen */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {headline}
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsEditingInfo(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {bio}
              </p>

              {/* Banner de Sugerencia / Tip */}
              {showBioTip && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 leading-tight">
                      Una descripción bien detallada y extensa de tu perfil profesional te ayudará a destacar entre otros candidatos del sector minero e industrial.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowBioTip(false)}
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta: Mis Experiencias Profesionales */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Mis experiencias profesionales
                </h3>
                <button 
                  type="button"
                  onClick={() => toast.info('Añadir experiencia')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              {/* Línea de Tiempo de Experiencias con Viñetas Azules */}
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-5 border-l-2 border-blue-600 space-y-1 group">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                        <span className="text-[11px] font-bold text-slate-700 uppercase">{exp.company}</span>
                      </div>
                      <button type="button" className="text-slate-300 group-hover:text-blue-600 transition-colors">
                        <Edit3 size={13} />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold">{exp.dates}</p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => toast.info('Formulario de nueva experiencia')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 pt-2"
              >
                <Plus size={14} /> Añadir nueva experiencia
              </button>
            </div>

            {/* Tarjeta: Mis Estudios */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  Mis estudios
                </h3>
                <button type="button" className="text-blue-600 hover:text-blue-800">
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="space-y-4">
                {studies.map((edu) => (
                  <div key={edu.id} className="relative pl-5 border-l-2 border-blue-600 space-y-0.5 group">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                        <span className="text-[11px] text-slate-600">{edu.institution}</span>
                      </div>
                      <button type="button" className="text-slate-300 group-hover:text-blue-600 transition-colors">
                        <Edit3 size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">{edu.dates}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => toast.info('Añadir formación')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 pt-1"
              >
                <Plus size={14} /> Añadir más estudios
              </button>

              {/* Banner de Estudios Tip */}
              {showStudiesTip && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 leading-tight">
                      Tus últimos estudios registrados culminaron hace tiempo. Añade certificaciones o capacitaciones recientes si te has formado desde entonces.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowStudiesTip(false)}
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta: Idiomas y Test */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Idiomas</h3>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:underline">
                    Añadir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map(l => (
                    <span key={l.id} className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
                      {l.name} - {l.level}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800">Test de idioma</h4>
                  <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Nuevo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                    <option>Inglés Técnico Minero</option>
                    <option>Portugués</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => toast.info('Iniciando test de idioma')}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Realizar test
                  </button>
                </div>
              </div>

              {/* Banner Test Tip */}
              {showTestTip && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <p className="text-[11px] text-blue-900">
                    Realiza cualquiera de los test de idioma, certifica tu nivel y añade los resultados automáticamente a tu perfil.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setShowTestTip(false)}
                    className="text-[11px] font-bold text-blue-700 hover:underline ml-2 shrink-0"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: RECURSOS Y MEJORA DE CV (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Tarjeta 1: Plantillas de CV */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900">Plantillas de CV</h3>
                <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Nuevo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tienes disponibles formatos oficiales para descargar o imprimir tu currículum de manera cómoda y profesional para postulaciones mineras.
              </p>
              <button
                type="button"
                onClick={() => toast.info('Generador de plantilla de CV en desarrollo')}
                className="w-full py-2.5 bg-[#0a3672] hover:bg-[#072550] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Diseña tu CV
              </button>
            </div>

            {/* Tarjeta 2: Cartas de Presentación */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-900">Cartas de presentación</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Crea o edita tus cartas de presentación y adjúntalas a tus postulaciones a contratistas. Las empresas valoran positivamente candidatos que explican su experiencia en campo.
              </p>
              <button
                type="button"
                onClick={() => toast.info('Editor de cartas de presentación')}
                className="w-full py-2.5 bg-[#0a3672] hover:bg-[#072550] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Crear carta
              </button>
            </div>

            {/* Tarjeta 3: Cómo Mejorar mi CV */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <h3 className="text-xs font-black text-slate-900">Cómo mejorar mi CV</h3>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 flex items-center justify-center font-bold text-[10px] text-emerald-700">
                  94%
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => toast.info('Módulo de carga de CV adjunto')}
                  className="w-full py-2.5 text-left flex items-center justify-between hover:text-blue-600 group"
                >
                  <div>
                    <span className="font-bold text-slate-800 block group-hover:text-blue-600">Sube tu CV</span>
                    <span className="text-[10px] text-slate-400 block">Inserta tu archivo en Word o PDF</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => toast.info('Evaluación de competencias')}
                  className="w-full py-2.5 text-left flex items-center justify-between hover:text-blue-600 group"
                >
                  <div>
                    <span className="font-bold text-slate-800 block group-hover:text-blue-600">Identifica tu potencial</span>
                    <span className="text-[10px] text-slate-400 block">Descubre gratis tus competencias en campo</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PESTAÑA: PUBLICACIONES TÉCNICAS (CONSERVADA)                            */}
      {/* ========================================================================= */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <MessageSquare size={22} />
          </div>
          <h3 className="text-sm font-black text-slate-900">Aportes y Publicaciones en la Red</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tus consultas operativas, procedimientos SOMA y soluciones técnicas compartidas con colegas.
          </p>
          <Link
            href="/comunidad"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
          >
            Ir al muro principal a publicar
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PESTAÑA: GRUPOS Y FOROS (CONSERVADA)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users size={22} />
          </div>
          <h3 className="text-sm font-black text-slate-900">Comunidades de Especialidad</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Participas en foros técnicos de SOMA, Mecánica Pesada y Geología.
          </p>
          <Link
            href="/comunidad/grupos"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            Explorar catálogo de grupos
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PESTAÑA: PRIVACIDAD Y DESCONEXIÓN SOBERANA (CONSERVADA)                */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              Gobernanza y Privacidad Soberana
            </h3>
            <p className="text-xs text-slate-500">
              Controla tu visibilidad comunitaria sin alterar tu historial laboral en InthalyOps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-xs text-slate-900 block">Pausar Perfil Temporalmente</span>
              <p className="text-[11px] text-slate-500 leading-tight">
                Oculta tu perfil y publicaciones de los resultados de búsqueda sin eliminar tus datos.
              </p>
              <button
                type="button"
                onClick={() => handleUnlink('pause_profile')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                {isPaused ? 'Reactivar visibilidad' : 'Pausar perfil'}
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2">
              <span className="font-bold text-xs text-rose-900 block">Derecho al Olvido Comunitario</span>
              <p className="text-[11px] text-rose-700/80 leading-tight">
                Elimina permanentemente tu perfil y aportes sociales. Tu empleo formal en InthalyOps permanece protegido.
              </p>
              <button
                type="button"
                onClick={() => handleUnlink('delete_community_presence')}
                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700"
              >
                Eliminar presencia social
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
