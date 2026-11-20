'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, User, MapPin, Tag, Lock, AlertTriangle, 
  CheckCircle2, PauseCircle, Trash2, LogOut, Info, Eye, EyeOff,
  ShieldCheck, ArrowLeft, ChevronRight, Camera, Edit3, Briefcase,
  GraduationCap, Globe, Users, Bookmark, MessageSquare, Check, Sparkles,
  Mail, Phone, FileText, Award, Lightbulb, ChevronDown, Plus, ExternalLink,
  Upload, Link as LinkIcon, X
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
  
  // Referencias para carga de archivos
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Formulario y estado de edición
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || 'Ing. Carlos Mendoza')
  const [headline, setHeadline] = useState(initialProfile?.headline || 'Ingeniero de Minas Residente | Especialista en Subterránea')
  const [bio, setBio] = useState(initialProfile?.bio || 'Profesional adaptable a cualquier entorno laboral, proactivo, con más de 14 años liderando operaciones mineras subterráneas en el sur del Perú. Especialista en mallas de perforación, seguridad de socavón y gestión de guardias.')
  const [city, setCity] = useState('Arequipa')
  const [country, setCountry] = useState('Perú')
  const [phone, setPhone] = useState('+51 987 654 321')
  const [email, setEmail] = useState('carlos.mendoza@inthaly.com')
  const [linkedin, setLinkedin] = useState('https://linkedin.com/in/carlos-mendoza-minas')
  const [website, setWebsite] = useState('https://carlosmendoza-geotrack.pe')
  const [cipNumber, setCipNumber] = useState('CIP 189420')
  const [specialtiesInput, setSpecialtiesInput] = useState(initialProfile?.specialties?.join(', ') || 'Perforación y Voladura, Seguridad Minera, Gestión de Guardias')
  const [allowEmployerMatching, setAllowEmployerMatching] = useState(!!initialProfile?.allow_employer_matching)
  
  // Imágenes de perfil y portada
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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
  const [languages] = useState([
    { id: 'lang-1', name: 'Español', level: 'Nativo' },
    { id: 'lang-2', name: 'Inglés', level: 'Intermedio Técnico' }
  ])

  // Estado de banners informativos (omitibles)
  const [showBioTip, setShowBioTip] = useState(true)
  const [showStudiesTip, setShowStudiesTip] = useState(true)

  // Desvinculación y estado
  const [isPaused, setIsPaused] = useState(initialProfile ? !initialProfile.is_active : false)
  const [isDeleted, setIsDeleted] = useState(false)

  // Modal de Edición Estilo Facebook ("Información")
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editModalTab, setEditModalTab] = useState<'detalles' | 'personales' | 'contacto' | 'enlaces' | 'empleo' | 'formacion' | 'fotos' | 'privacidad'>('detalles')
  const [isSaving, setIsSaving] = useState(false)

  // Campos para añadir experiencia laboral dinámica
  const [newExpRole, setNewExpRole] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpDates, setNewExpDates] = useState('')
  const [newExpLocation, setNewExpLocation] = useState('')
  const [newExpDesc, setNewExpDesc] = useState('')
  const [isAddingExp, setIsAddingExp] = useState(false)

  // Campos para añadir estudios dinámicos
  const [newEduDegree, setNewEduDegree] = useState('')
  const [newEduInstitution, setNewEduInstitution] = useState('')
  const [newEduDates, setNewEduDates] = useState('')
  const [isAddingEdu, setIsAddingEdu] = useState(false)

  // =========================================================================
  // PERSISTENCIA LOCAL: Recuperar información al cargar
  // =========================================================================
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('inthaly_community_profile_data')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        if (parsed.displayName) setDisplayName(parsed.displayName)
        if (parsed.headline) setHeadline(parsed.headline)
        if (parsed.bio) setBio(parsed.bio)
        if (parsed.city) setCity(parsed.city)
        if (parsed.country) setCountry(parsed.country)
        if (parsed.phone) setPhone(parsed.phone)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.linkedin) setLinkedin(parsed.linkedin)
        if (parsed.website) setWebsite(parsed.website)
        if (parsed.cipNumber) setCipNumber(parsed.cipNumber)
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl)
        if (parsed.coverUrl) setCoverUrl(parsed.coverUrl)
        if (parsed.experiences && Array.isArray(parsed.experiences)) setExperiences(parsed.experiences)
        if (parsed.studies && Array.isArray(parsed.studies)) setStudies(parsed.studies)
        if (parsed.specialtiesInput) setSpecialtiesInput(parsed.specialtiesInput)
      }
    } catch {
      // ignore
    }
  }, [])

  // Subida de Portada
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const resUrl = reader.result as string
        setCoverUrl(resUrl)
        try {
          const prev = JSON.parse(localStorage.getItem('inthaly_community_profile_data') || '{}')
          localStorage.setItem('inthaly_community_profile_data', JSON.stringify({ ...prev, coverUrl: resUrl }))
        } catch {
          // ignore
        }
        toast.success('Fotografía de portada actualizada con éxito')
      }
      reader.readAsDataURL(file)
    }
  }

  // Subida de Avatar
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const resUrl = reader.result as string
        setAvatarUrl(resUrl)
        try {
          const prev = JSON.parse(localStorage.getItem('inthaly_community_profile_data') || '{}')
          localStorage.setItem('inthaly_community_profile_data', JSON.stringify({ ...prev, avatarUrl: resUrl }))
        } catch {
          // ignore
        }
        toast.success('Fotografía de perfil actualizada con éxito')
      }
      reader.readAsDataURL(file)
    }
  }

  // Añadir Experiencia
  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpRole || !newExpCompany) {
      toast.error('Cargo y Empresa son obligatorios')
      return
    }
    const newEntry = {
      id: `exp-${Date.now()}`,
      role: newExpRole,
      company: newExpCompany,
      dates: newExpDates || '2024 - Actualidad',
      location: newExpLocation || `${city}, ${country}`,
      description: newExpDesc || 'Supervisión y operaciones técnicas en faena.'
    }
    const updated = [newEntry, ...experiences]
    setExperiences(updated)
    setNewExpRole('')
    setNewExpCompany('')
    setNewExpDates('')
    setNewExpLocation('')
    setNewExpDesc('')
    setIsAddingExp(false)
    toast.success('Nueva experiencia añadida al perfil')
  }

  // Añadir Estudio
  const handleAddStudy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEduDegree || !newEduInstitution) {
      toast.error('Título e Institución son obligatorios')
      return
    }
    const newEntry = {
      id: `edu-${Date.now()}`,
      degree: newEduDegree,
      institution: newEduInstitution,
      dates: newEduDates || '2024'
    }
    const updated = [...studies, newEntry]
    setStudies(updated)
    setNewEduDegree('')
    setNewEduInstitution('')
    setNewEduDates('')
    setIsAddingEdu(false)
    toast.success('Nuevo estudio académico añadido')
  }

  // Guardar Cambios del Perfil (Servidor + Local)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const specialties = specialtiesInput.split(',').map(s => s.trim()).filter(Boolean)

      // 1. Guardar en servidor
      const res = await updateCommunityProfileAction({
        display_name: displayName,
        headline,
        bio,
        location_region: `${city}, ${country}`,
        specialties,
        allow_employer_matching: allowEmployerMatching
      })

      if (res.success && res.data) {
        setProfile(res.data)
      }

      // 2. Guardar en persistencia local para asegurar persistencia de todos los campos extendidos
      const payload = {
        displayName,
        headline,
        bio,
        city,
        country,
        phone,
        email,
        linkedin,
        website,
        cipNumber,
        avatarUrl,
        coverUrl,
        experiences,
        studies,
        specialtiesInput,
        allowEmployerMatching
      }
      localStorage.setItem('inthaly_community_profile_data', JSON.stringify(payload))

      setIsEditingInfo(false)
      toast.success('Información profesional y de contacto guardada con éxito')
    } catch {
      toast.error('Error al guardar información')
    } finally {
      setIsSaving(false)
    }
  }

  // Desvinculación
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
          localStorage.removeItem('inthaly_community_profile_data')
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
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 md:py-6 space-y-6">

      {/* ========================================================================= */}
      {/* 1. CABECERA: PORTADA PANORÁMICA Y FOTOGRAFÍA (ALINEACIÓN PROFESIONAL)      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">

        {/* Foto de Portada Panorámica con Selector Real de Archivo */}
        <div className="h-44 sm:h-60 bg-slate-900 relative flex items-end justify-end p-4 overflow-hidden group">
          {coverUrl ? (
            <img src={coverUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900" />
          )}

          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleCoverUpload}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="relative z-10 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Cambiar portada</span>
          </button>
        </div>

        {/* Fila de Avatar e Identidad: Estructura Limpia Sin Invasión de Portada */}
        <div className="px-6 sm:px-8 pb-5 pt-0">

          {/* Fila Superior: Avatar + Acciones Rápidas */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-3">

            {/* Avatar Circular con Botón Azul de Cámara */}
            <div className="relative shrink-0">
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-3xl sm:text-4xl ring-4 ring-white shadow-md overflow-hidden bg-cover bg-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-800 to-indigo-900 flex items-center justify-center text-white font-black text-3xl sm:text-4xl">
                    CM
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-colors"
                title="Cambiar foto de perfil"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Acciones Rápidas Principales */}
            <div className="flex items-center gap-2.5 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 size={14} /> Editar perfil
              </button>
              <Link
                href="/comunidad"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Ver muro
              </Link>
            </div>

          </div>

          {/* Datos de Contacto y Nombre: Exclusivamente dentro de la tarjeta blanca */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {displayName}
            </h1>

            <p className="text-xs text-slate-600 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <MapPin size={13} className="text-blue-600" /> {city}, {country}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Mail size={13} className="text-blue-600" /> {email}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Phone size={13} className="text-blue-600" /> {phone}
              </span>
              {cipNumber && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-slate-700 font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <Award size={13} className="text-amber-600" /> {cipNumber}
                  </span>
                </>
              )}
              {linkedin && (
                <>
                  <span className="text-slate-300">·</span>
                  <a href={linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-[11px] font-bold">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Navegación de Pestañas del Perfil */}
          <div className="flex items-center gap-1 border-t border-slate-100 pt-3 mt-4 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('cv')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'cv' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Currículum & Trayectoria
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'posts' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Publicaciones Técnicas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'groups' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Grupos & Foros
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Privacidad & Desconexión
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PESTAÑA PRINCIPAL: CURRÍCULUM Y TRAYECTORIA (REFERENCIA EXACTA)        */}
      {/* ========================================================================= */}
      {activeTab === 'cv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* COLUMNA IZQUIERDA: CV Y TRAYECTORIA (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">

            {/* Tarjeta de Titular y Resumen */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {headline}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalTab('detalles')
                    setIsEditingInfo(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                  title="Editar titular y bio"
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
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 cursor-pointer"
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
                  onClick={() => {
                    setEditModalTab('empleo')
                    setIsEditingInfo(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                  title="Editar experiencias"
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
                      <button
                        type="button"
                        onClick={() => {
                          setEditModalTab('empleo')
                          setIsEditingInfo(true)
                        }}
                        className="text-slate-300 group-hover:text-blue-600 transition-colors cursor-pointer"
                        title="Modificar en formulario"
                      >
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
                onClick={() => {
                  setEditModalTab('empleo')
                  setIsAddingExp(true)
                  setIsEditingInfo(true)
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 pt-2 cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => {
                    setEditModalTab('formacion')
                    setIsEditingInfo(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                  title="Editar estudios"
                >
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
                      <button
                        type="button"
                        onClick={() => {
                          setEditModalTab('formacion')
                          setIsEditingInfo(true)
                        }}
                        className="text-slate-300 group-hover:text-blue-600 transition-colors cursor-pointer"
                        title="Modificar en formulario"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">{edu.dates}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditModalTab('formacion')
                  setIsAddingEdu(true)
                  setIsEditingInfo(true)
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 pt-1 cursor-pointer"
              >
                <Plus size={14} /> Añadir más estudios
              </button>

              {/* Banner de Estudios Tip */}
              {showStudiesTip && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs mt-3">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 leading-tight">
                      Tus últimos estudios terminaron hace tiempo. Añade uno nuevo si te has formado desde entonces.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStudiesTip(false)}
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta: Idiomas */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Idiomas</h3>
              <div className="flex flex-wrap items-center gap-2">
                {languages.map((l) => (
                  <span key={l.id} className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    {l.name} - <span className="text-slate-500 font-medium">{l.level}</span>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: HERRAMIENTAS DE CV (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">

            {/* Tarjeta 1: Plantillas de CV */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Plantillas de CV</h3>
                <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Nuevo
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tienes disponibles formatos oficiales para descargar o imprimir tu currículum de manera cómoda y profesional para postulaciones mineras.
              </p>
              <button
                type="button"
                onClick={() => toast.success('Generador de CV en formato PDF oficial preparado.')}
                className="w-full py-2.5 bg-[#173a74] hover:bg-[#112d5b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Diseña tu CV
              </button>
            </div>

            {/* Tarjeta 2: Cartas de Presentación */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Cartas de presentación</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crea o edita tus cartas de presentación y adjúntalas a tus postulaciones a contratistas. Las empresas valoran positivamente candidatos que explican su experiencia en campo.
              </p>
              <button
                type="button"
                onClick={() => toast.info('Redactor de carta de presentación industrial abierto.')}
                className="w-full py-2.5 bg-[#173a74] hover:bg-[#112d5b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Crear carta
              </button>
            </div>

            {/* Tarjeta 3: Cómo Mejorar mi CV */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Cómo mejorar mi CV</span>
                </div>
                <span className="w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-700 font-extrabold text-[11px] flex items-center justify-center">
                  94%
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => toast.info('Adjunta tu CV en PDF o Word para autocompletar.')}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div>
                    <h5 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Sube tu CV</h5>
                    <p className="text-[10px] text-slate-400">Inserta tu archivo en word o pdf y adjúntalo en tus postulaciones</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => toast.info('Test de competencias operativas disponible.')}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div>
                    <h5 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Identifica tu potencial profesional</h5>
                    <p className="text-[10px] text-slate-400">Descubre gratis tus competencias laborales para el sector industrial</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PESTAÑA: PUBLICACIONES TÉCNICAS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Publicaciones Técnicas y Buenas Prácticas</h3>
              <p className="text-xs text-slate-500">Tus aportes compartidos en el muro general y en foros especializados.</p>
            </div>
            <Link
              href="/comunidad"
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Nueva Publicación
            </Link>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">#Perforación #Campamento #Mantenimiento</span>
              <span className="text-[10px] text-slate-400">18 Nov</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Colegas, ante las bajas temperaturas (-8°C) en campamento sobre los 4,300 msnm, estamos reforzando la purga de condensado en líneas de aire para evitar congelamiento de válvulas en martillos perforadores...
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 font-bold">
              <span>👍 14 Me sirve</span>
              <span>💬 3 comentarios</span>
              <span>🔄 2 compartidos</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PESTAÑA: GRUPOS Y FOROS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Mis Comunidades y Foros de Práctica</h3>
              <p className="text-xs text-slate-500">Espacios técnicos donde participas activamente.</p>
            </div>
            <Link
              href="/comunidad/grupos"
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Explorar más grupos
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Seguridad y Salud</span>
              <h4 className="text-sm font-black text-slate-900">SOMA & Seguridad en Operaciones Mineras</h4>
              <p className="text-xs text-slate-600">Espacio de intercambio de protocolos, análisis de incidentes de alto potencial e IPERC.</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">124 miembros</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">Miembro Activo</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Mantenimiento Mecánico</span>
              <h4 className="text-sm font-black text-slate-900">Mecánica Pesada y Mantenimiento de Flotas</h4>
              <p className="text-xs text-slate-600">Comunidad técnica para mecánicos, electricistas y supervisores de línea amarilla y volquetes.</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">89 miembros</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">Miembro Activo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PESTAÑA: PRIVACIDAD & DESCONEXIÓN                                      */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Garantías de Privacidad & Derecho a la Desconexión</h3>
            <p className="text-xs text-slate-500 mt-1">
              En Inthaly, tu perfil en Comunidad pertenece a tu identidad soberana (Inthaly ID) y no a la empresa donde laboras.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-700" />
              Blindaje Laboral Garantizado (ADR-014)
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Tu empleador en InthalyOps no tiene visibilidad sobre tus consultas técnicas privadas, participaciones en grupos cerrados ni búsquedas de oportunidades.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Opciones de Desconexión</h4>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Pausar presencia comunitaria</span>
                <p className="text-[11px] text-slate-500">Oculta temporalmente tu perfil y aportes del muro general.</p>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(isPaused ? 'resume_profile' : 'pause_profile')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isPaused ? 'Reanudar perfil' : 'Pausar perfil'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-200">
              <div>
                <span className="text-xs font-bold text-rose-950 block">Eliminar presencia comunitaria definitivamente</span>
                <p className="text-[11px] text-rose-800">Borra todos tus datos de Comunidad. Tus tareos y boletas en InthalyOps permanecen intactos.</p>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink('delete_community_presence')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE INFORMACIÓN ESTILO FACEBOOK WEB (REFERENCIA IMAGEN INFORMACIÓN) */}
      {/* ========================================================================= */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">

            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Editar Información Profesional</h3>
                <p className="text-[11px] text-slate-500">Configura tus datos personales, trayectoria laboral, colegiatura y privacidad.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo del Modal: Distribución en 2 Columnas (Referencia Facebook Información) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[460px]">

              {/* Columna Izquierda: Menú de Navegación "Información" */}
              <div className="w-full md:w-60 bg-slate-50/90 border-r border-slate-200/80 p-3 space-y-1 shrink-0 overflow-y-auto">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 py-2">
                  Información
                </div>

                <nav className="space-y-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditModalTab('detalles')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'detalles'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Detalles</span>
                    {editModalTab === 'detalles' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('personales')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'personales'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Datos personales</span>
                    {editModalTab === 'personales' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('contacto')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'contacto'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Información de contacto</span>
                    {editModalTab === 'contacto' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('enlaces')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'enlaces'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Enlaces & Colegiatura</span>
                    {editModalTab === 'enlaces' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('empleo')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'empleo'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Empleo & Experiencia</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${editModalTab === 'empleo' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {experiences.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('formacion')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'formacion'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Formación académica</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${editModalTab === 'formacion' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {studies.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('fotos')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'fotos'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Fotos de perfil y portada</span>
                    {editModalTab === 'fotos' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditModalTab('privacidad')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      editModalTab === 'privacidad'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>Información de privacidad</span>
                    {editModalTab === 'privacidad' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                </nav>
              </div>

              {/* Columna Derecha: Contenido y Campos Editables */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white">

                {/* 1. DETALLES */}
                {editModalTab === 'detalles' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Detalles Profesionales</h4>
                      <p className="text-[11px] text-slate-500">Define tu titular principal, especialidades y extracto profesional.</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Titular Profesional / Cargo Principal</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Ej: Montacarguista / Ingeniero de Minas Residente | Especialista en Subterránea"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Especialidades Técnicas (separadas por coma)</label>
                      <input
                        type="text"
                        value={specialtiesInput}
                        onChange={(e) => setSpecialtiesInput(e.target.value)}
                        placeholder="Ej: Perforación y Voladura, Seguridad Minera, IPERC, Mantenimiento"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Resumen Profesional (Bio)</label>
                      <textarea
                        rows={5}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Escribe un resumen detallado de tus competencias, responsabilidades y logros en el sector minero e industrial..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. DATOS PERSONALES */}
                {editModalTab === 'personales' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Datos Personales</h4>
                      <p className="text-[11px] text-slate-500">Nombre con el que interactúas en la comunidad técnica.</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Completo y Grado Académico</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej: Geison Utia o Ing. Carlos Mendoza"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-600" /> Identidad Verificada Inthaly ID
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Tu identidad en Comunidad Inthaly es independiente de la empresa donde laboras. Tu empleador no tiene acceso a tus consultas técnicas ni mensajes privados.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. INFORMACIÓN DE CONTACTO */}
                {editModalTab === 'contacto' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Información de Contacto</h4>
                      <p className="text-[11px] text-slate-500">Ubicación geográfica y canales de comunicación profesional.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Ciudad o Región</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej: Callao, Lima, Arequipa, Cusco"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">País</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Ej: Perú"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+51 987 654 321"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo Electrónico Profesional</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu.nombre@inthaly.com"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ENLACES Y COLEGIATURA */}
                {editModalTab === 'enlaces' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Enlaces y Acreditaciones</h4>
                      <p className="text-[11px] text-slate-500">Conecta tu perfil de LinkedIn, portafolio técnico y matrícula del Colegio de Ingenieros.</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Perfil de LinkedIn</label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/usuario"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Sitio Web / Portafolio Técnico</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://tuportafolio.com"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Colegiatura / Matrícula Profesional</label>
                      <input
                        type="text"
                        value={cipNumber}
                        onChange={(e) => setCipNumber(e.target.value)}
                        placeholder="Ej: CIP 189420 o Licencia Técnica Especializada"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* 5. EMPLEO & EXPERIENCIA */}
                {editModalTab === 'empleo' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Empleo & Trayectoria Profesional</h4>
                        <p className="text-[11px] text-slate-500">Administra los cargos y empresas registradas en tu perfil.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingExp(!isAddingExp)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> {isAddingExp ? 'Cerrar formulario' : 'Añadir experiencia'}
                      </button>
                    </div>

                    {/* Formulario para Añadir Experiencia */}
                    {isAddingExp && (
                      <div className="p-4 bg-slate-50 border border-blue-200 rounded-2xl space-y-3">
                        <span className="text-xs font-black text-blue-900 block">Registrar Nuevo Cargo</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Cargo / Puesto</label>
                            <input
                              type="text"
                              value={newExpRole}
                              onChange={(e) => setNewExpRole(e.target.value)}
                              placeholder="Ej: Montacarguista / Supervisor SOMA"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Empresa</label>
                            <input
                              type="text"
                              value={newExpCompany}
                              onChange={(e) => setNewExpCompany(e.target.value)}
                              placeholder="Ej: COIMSAC / SERVICIOS MINEROS S.A."
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Periodo</label>
                            <input
                              type="text"
                              value={newExpDates}
                              onChange={(e) => setNewExpDates(e.target.value)}
                              placeholder="Ej: Febrero 2024 - Actualidad"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Ubicación</label>
                            <input
                              type="text"
                              value={newExpLocation}
                              onChange={(e) => setNewExpLocation(e.target.value)}
                              placeholder="Ej: Callao, Perú"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Descripción / Responsabilidades</label>
                          <textarea
                            rows={2}
                            value={newExpDesc}
                            onChange={(e) => setNewExpDesc(e.target.value)}
                            placeholder="Carga y descarga de camiones, despacho con boleta, picking..."
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingExp(false)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddExperience}
                            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Guardar Cargo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lista de Experiencias Actuales */}
                    <div className="space-y-3">
                      {experiences.map((exp) => (
                        <div key={exp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black text-slate-900">{exp.role}</h5>
                            <p className="text-[11px] font-bold text-slate-700">{exp.company} · <span className="text-slate-500 font-normal">{exp.dates}</span></p>
                            <p className="text-[11px] text-slate-600">{exp.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = experiences.filter(x => x.id !== exp.id)
                              setExperiences(updated)
                              toast.info('Experiencia eliminada')
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Eliminar experiencia"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. FORMACIÓN ACADÉMICA */}
                {editModalTab === 'formacion' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Formación Académica y Estudios</h4>
                        <p className="text-[11px] text-slate-500">Títulos universitarios, formación técnica y diplomados.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingEdu(!isAddingEdu)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> {isAddingEdu ? 'Cerrar formulario' : 'Añadir estudio'}
                      </button>
                    </div>

                    {/* Formulario para Añadir Estudio */}
                    {isAddingEdu && (
                      <div className="p-4 bg-slate-50 border border-blue-200 rounded-2xl space-y-3">
                        <span className="text-xs font-black text-blue-900 block">Registrar Nuevo Estudio</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Título / Especialidad</label>
                          <input
                            type="text"
                            value={newEduDegree}
                            onChange={(e) => setNewEduDegree(e.target.value)}
                            placeholder="Ej: Educación Secundaria / Operador de Montacargas / Ing. Minas"
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Institución Educativa</label>
                            <input
                              type="text"
                              value={newEduInstitution}
                              onChange={(e) => setNewEduInstitution(e.target.value)}
                              placeholder="Ej: Libertador Simón Bolívar / UNSA / TECSUP"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Periodo</label>
                            <input
                              type="text"
                              value={newEduDates}
                              onChange={(e) => setNewEduDates(e.target.value)}
                              placeholder="Ej: Abril 2005 - Diciembre 2007"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingEdu(false)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddStudy}
                            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Guardar Estudio
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lista de Estudios */}
                    <div className="space-y-3">
                      {studies.map((edu) => (
                        <div key={edu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black text-slate-900">{edu.degree}</h5>
                            <p className="text-[11px] font-bold text-slate-700">{edu.institution} · <span className="text-slate-500 font-normal">{edu.dates}</span></p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = studies.filter(x => x.id !== edu.id)
                              setStudies(updated)
                              toast.info('Estudio eliminado')
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Eliminar estudio"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. FOTOS DE PERFIL Y PORTADA */}
                {editModalTab === 'fotos' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Fotos de Perfil y Portada</h4>
                      <p className="text-[11px] text-slate-500">Carga imágenes profesionales para tu presencia técnica.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                      <span className="text-xs font-bold text-slate-800 block">Fotografía de Perfil</span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base overflow-hidden shrink-0 ring-2 ring-blue-500 shadow-sm">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Vista previa" className="w-full h-full object-cover" />
                          ) : (
                            <span>CM</span>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Upload size={14} /> Subir nueva foto
                          </button>
                          <p className="text-[10px] text-slate-500 mt-1">Recomendado: formato cuadrado JPG o PNG (máx. 5MB).</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                      <span className="text-xs font-bold text-slate-800 block">Fotografía de Portada Panorámica</span>
                      <div className="h-28 rounded-2xl bg-slate-900 overflow-hidden relative flex items-center justify-center group">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Vista previa portada" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900" />
                        )}
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="absolute bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Camera size={14} /> Cambiar portada
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">Recomendado: imagen panorámica horizontal de operaciones industriales o mineras.</p>
                    </div>
                  </div>
                )}

                {/* 8. PRIVACIDAD & MATCHING */}
                {editModalTab === 'privacidad' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Información Legal y Privacidad</h4>
                      <p className="text-[11px] text-slate-500">Controla la visibilidad de tu perfil ante oportunidades y empresas.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Matching de Oportunidades Laborales</span>
                          <p className="text-[11px] text-slate-500">Permitir que reclutadores del sector minero e industrial te sugieran vacantes afines a tu especialidad.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={allowEmployerMatching}
                          onChange={(e) => setAllowEmployerMatching(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 text-xs space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-700" /> Blindaje de Desconexión Laboral
                      </div>
                      <p className="text-[11px] text-emerald-900">
                        Por diseño de Inthaly ID, tus comentarios técnicos, consultas sobre IPERC y grupos de práctica no pueden ser auditados por tu empleador actual en InthalyOps.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer del Modal: Acciones */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Sección: {editModalTab.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
