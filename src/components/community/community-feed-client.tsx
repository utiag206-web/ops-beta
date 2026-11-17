'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Send, ThumbsUp, MessageSquare, Share2, Sparkles, 
  MapPin, Tag, ShieldCheck, HelpCircle, Users, 
  Compass, ArrowUpRight, Award, Bookmark, Filter,
  CheckCircle2, Clock, Wrench, Shield, Briefcase, Calendar,
  ChevronRight, Heart, Lightbulb, Check, Plus, Image as ImageIcon,
  MoreHorizontal, Globe, X, Minimize2, Maximize2, MessageCircle,
  ExternalLink, UserPlus, Flame, Smile, CheckCheck,
  Home, Search, Bell, Radio, Film, FileText, Building2, User
} from 'lucide-react'
import type { 
  CommunityPost, 
  RecommendationResult, 
  CommunityGroup, 
  ReactionType,
  CommunityProfile,
  DirectMessage
} from '@/types/community.types'
import { 
  createPostAction, 
  toggleReactionAction, 
  addCommentAction,
  toggleSavePostAction,
  getDirectMessagesAction,
  sendDirectMessageAction
} from '@/app/(community)/comunidad/actions'
import CommunitySidebar from '@/components/community/community-sidebar'
import { toast } from 'sonner'

export interface TechnicalOpportunity {
  id: string
  title: string
  company: string
  location: string
  type: string
  specialty: string
  description: string
  requirements: string[]
  publishedAt: string
}

export default function CommunityFeedClient({
  initialPosts,
  recommendedProfiles,
  groups,
  onlineContacts,
  initialSavedIds,
  currentUser
}: {
  initialPosts: CommunityPost[]
  recommendedProfiles: RecommendationResult[]
  groups: CommunityGroup[]
  initialStories?: any[]
  onlineContacts: CommunityProfile[]
  initialSavedIds: string[]
  currentUser: CommunityProfile | null
}) {
  // =========================================================================
  // ESTADOS PRINCIPALES DE NAVEGACIÓN Y FILTRADO
  // =========================================================================
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set(initialSavedIds))
  const [activeNav, setActiveNav] = useState<'inicio' | 'explorar' | 'red' | 'oportunidades' | 'guardados'>('inicio')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [feedSearchTerm, setFeedSearchTerm] = useState('')

  // Estado de solicitudes de conexión enviadas
  const [sentConnectionIds, setSentConnectionIds] = useState<Set<string>>(new Set())

  // =========================================================================
  // ESTADO DEL COMPOSITOR DE PUBLICACIÓN PROFESIONAL
  // =========================================================================
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<'general' | 'image' | 'doc' | 'specialty'>('general')
  const [postContent, setPostContent] = useState('')
  const [postImageUrl, setPostImageUrl] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // =========================================================================
  // ESTADO DE COMENTARIOS EN HILO
  // =========================================================================
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [localComments, setLocalComments] = useState<Record<string, Array<{ id: string; author: string; content: string; time: string }>>>({})

  // =========================================================================
  // ESTADO DE MENSAJERÍA DIRECTA FLOTANTE (DOCK MESSENGER SOBERANO)
  // =========================================================================
  const [activeChatContact, setActiveChatContact] = useState<CommunityProfile | null>(null)
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // =========================================================================
  // ESTADO DEL MODAL DE OPORTUNIDADES PROFESIONALES
  // =========================================================================
  const [selectedOpportunity, setSelectedOpportunity] = useState<TechnicalOpportunity | null>(null)
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set())

  // =========================================================================
  // MENÚS CONTEXTUALES DE PUBLICACIÓN (3 PUNTOS)
  // =========================================================================
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null)

  // Catálogo de etiquetas técnicas
  const availableTags = [
    '#SeguridadMinera', 
    '#MantenimientoPesado', 
    '#PerforaciónYVoladura', 
    '#SOMA', 
    '#Geomecánica', 
    '#LíneaAmarilla',
    '#OperacionesPlanta',
    '#GestiónAmbiental'
  ]

  // Catálogo de oportunidades técnicas de la industria
  const industrialOpportunities: TechnicalOpportunity[] = [
    {
      id: 'opp-1',
      title: 'Ingeniero Residente de Mina Subterránea',
      company: 'Minera San Gabriel S.A.',
      location: 'Arequipa, Perú (Régimen 14x7)',
      type: 'Tiempo Completo',
      specialty: 'Operaciones Mineras',
      description: 'Liderar las operaciones de perforación, voladura y sostenimiento garantizando el cumplimiento de los estándares de seguridad y productividad.',
      requirements: [
        'Colegiado en Ingeniería de Minas con más de 5 años de experiencia en mina subterránea.',
        'Dominio de normativas D.S. 024-2016-EM y sus modificatorias.',
        'Experiencia comprobada en optimización de ciclos de minado.'
      ],
      publishedAt: 'Hace 2 días'
    },
    {
      id: 'opp-2',
      title: 'Supervisor Senior SOMA / Seguridad y Salud Ocupacional',
      company: 'Consorcio Minero Andino',
      location: 'Moquegua, Perú (Régimen 20x10)',
      type: 'Tiempo Completo',
      specialty: 'SOMA & Seguridad Industrial',
      description: 'Supervisión integral de estándares de seguridad, IPERC continuo, investigación de incidentes y auditorías internas en planta concentradora.',
      requirements: [
        'Ingeniero de Minas, Metalúrgico, Químico o Higiene y Seguridad Colegiado.',
        'Mínimo 4 años en supervisión de seguridad en gran minería.',
        'Certificación en sistemas integrados de gestión ISO 45001 e ISO 14001.'
      ],
      publishedAt: 'Hace 3 días'
    },
    {
      id: 'opp-3',
      title: 'Jefe de Mantenimiento de Flota Pesada (CAT / Komatsu)',
      company: 'Operaciones Mineras del Sur',
      location: 'Cusco, Perú (Presencial)',
      type: 'Contrato por Proyecto',
      specialty: 'Mantenimiento Mecánico',
      description: 'Gestión del mantenimiento preventivo, predictivo y correctivo de camiones mineros 797F, palas hidráulicas y perforadoras rotativas.',
      requirements: [
        'Ingeniero Mecánico o Mecatrónico titulado.',
        'Experiencia sólida en análisis de fallas en motores C175 y transmisiones de alta potencia.',
        'Manejo avanzado de SIS CAT y Komatsu VIMS.'
      ],
      publishedAt: 'Hace 5 días'
    }
  ]

  // Cargar mensajes cuando se abre el chat directo
  useEffect(() => {
    if (activeChatContact) {
      getDirectMessagesAction(activeChatContact.id).then((msgs) => {
        setChatMessages(msgs)
      })
    }
  }, [activeChatContact])

  // Scroll automático en el chat flotante
  useEffect(() => {
    if (activeChatContact && !isChatMinimized) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, activeChatContact, isChatMinimized])

  // =========================================================================
  // HANDLERS FUNCIONALES
  // =========================================================================

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) {
      toast.error('Por favor escribe el contenido de tu publicación técnica')
      return
    }

    setIsSubmitting(true)
    try {
      const tags = selectedTag ? [selectedTag] : []
      const res = await createPostAction(postContent, selectedGroupId || undefined, tags)
      if (res.success && res.data) {
        const newPost = {
          ...res.data,
          media_urls: postImageUrl ? [postImageUrl] : []
        }
        setPosts([newPost, ...posts])
        setPostContent('')
        setPostImageUrl('')
        setSelectedTag('')
        setSelectedGroupId('')
        setIsComposerOpen(false)
        toast.success('Publicación profesional compartida en la red')
      } else {
        toast.error(res.error || 'Error al publicar')
      }
    } catch {
      toast.error('Error al enviar publicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleReaction = async (postId: string, reaction: ReactionType = 'helpful') => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const hasReacted = p.user_reaction === reaction
        return {
          ...p,
          likes_count: hasReacted ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
          user_reaction: hasReacted ? null : reaction
        }
      }
      return p
    }))

    try {
      await toggleReactionAction(postId, reaction)
      toast.success('Aporte marcado como útil')
    } catch {
      // rollback silencioso
    }
  }

  const handleToggleSave = async (postId: string) => {
    const isCurrentlySaved = savedPosts.has(postId)
    setSavedPosts(prev => {
      const next = new Set(prev)
      if (isCurrentlySaved) {
        next.delete(postId)
        toast.info('Publicación removida de tus marcadores')
      } else {
        next.add(postId)
        toast.success('Publicación guardada para consulta técnica')
      }
      return next
    })
    setActivePostMenuId(null)

    try {
      await toggleSavePostAction(postId)
    } catch {
      // ignore
    }
  }

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return

    const newCommentItem = {
      id: `comm-${Date.now()}`,
      author: currentUser?.display_name || 'Ing. Carlos Mendoza',
      content: text,
      time: 'Justo ahora'
    }

    setLocalComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentItem]
    }))

    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    toast.success('Comentario técnico publicado')

    try {
      await addCommentAction(postId, text)
    } catch {
      // ignore
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatContact) return

    const currentMsgText = chatInput.trim()
    const tempMsg: DirectMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser?.id || 'user-carlos-mendoza',
      receiver_id: activeChatContact.id,
      content: currentMsgText,
      created_at: new Date().toISOString(),
      is_read: false
    }

    setChatMessages(prev => [...prev, tempMsg])
    setChatInput('')

    try {
      await sendDirectMessageAction(activeChatContact.id, currentMsgText)
    } catch {
      toast.error('Error al enviar mensaje directo')
    }
  }

  const handleSendConnection = (profileId: string, name: string) => {
    setSentConnectionIds(prev => new Set(prev).add(profileId))
    toast.success(`Solicitud de conexión enviada a ${name}`)
  }

  const handleApplyOpportunity = (oppId: string, title: string) => {
    setAppliedOpportunities(prev => new Set(prev).add(oppId))
    setSelectedOpportunity(null)
    toast.success(`Postulación enviada a "${title}" con tu Perfil Inthaly`)
  }

  // =========================================================================
  // FILTRADO DE PUBLICACIONES
  // =========================================================================
  const displayedPosts = posts.filter(p => {
    if (feedSearchTerm.trim()) {
      const q = feedSearchTerm.toLowerCase()
      const matchText = p.content.toLowerCase().includes(q)
      const matchAuthor = (p.author?.display_name || '').toLowerCase().includes(q)
      const matchTag = (p.tags || []).some(t => t.toLowerCase().includes(q))
      if (!matchText && !matchAuthor && !matchTag) return false
    }

    if (selectedTagFilter) {
      if (!(p.tags || []).includes(selectedTagFilter)) return false
    }

    if (activeNav === 'guardados') {
      return savedPosts.has(p.id)
    }

    if (activeNav === 'explorar') {
      return p.likes_count >= 1 || (p.tags && p.tags.length > 0)
    }

    return true
  })

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 py-4 md:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: NAVEGACIÓN PROFESIONAL INTHALY (3 cols)                        */}
        {/* ========================================================================= */}
        <CommunitySidebar
          activeTab={activeNav}
          onSelectTab={(tab) => {
            setActiveNav(tab)
            setSelectedTagFilter(null)
          }}
          groupsCount={groups.length}
          savedCount={savedPosts.size}
          networkCount={recommendedProfiles.length}
          onOpenMessages={() => {
            if (onlineContacts.length > 0) {
              setActiveChatContact(onlineContacts[0])
              setIsChatMinimized(false)
            }
          }}
        />

        {/* ========================================================================= */}
        {/* COLUMNA 2: FEED CENTRAL PROFESIONAL (6 cols)                               */}
        {/* Estructura recomendada: media_1794887984001_d6397a3c.png                  */}
        {/* ========================================================================= */}
        <main className="lg:col-span-6 space-y-4">
          
          {/* ======================================================================= */}
          {/* 1. CAJA DE PUBLICACIÓN PROFESIONAL                                      */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 leading-snug">
              ¿Qué conocimiento, experiencia u oportunidad quieres compartir?
            </h3>
            
            <div 
              onClick={() => {
                setComposerMode('general')
                setIsComposerOpen(true)
              }}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-500 cursor-pointer transition-colors"
            >
              Escribe un aporte técnico, consulta operativa sobre minería o comparte una buena práctica industrial...
            </div>

            {/* Opciones directas: Publicación profesional · Imagen · Documento · Especialidad */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setComposerMode('general')
                  setIsComposerOpen(true)
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-blue-700"
              >
                <FileText size={15} />
                <span>Publicación profesional</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerMode('image')
                  setIsComposerOpen(true)
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
              >
                <ImageIcon size={15} className="text-emerald-600" />
                <span>Imagen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerMode('doc')
                  setIsComposerOpen(true)
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
              >
                <Award size={15} className="text-amber-600" />
                <span>Documento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposerMode('specialty')
                  setIsComposerOpen(true)
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
              >
                <Tag size={15} className="text-indigo-600" />
                <span>Especialidad</span>
              </button>
            </div>
          </div>

          {/* Banner de filtro activo (si aplica) */}
          {selectedTagFilter && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-xs flex items-center justify-between">
              <span>Filtrando por tema: <strong>{selectedTagFilter}</strong></span>
              <button 
                type="button" 
                onClick={() => setSelectedTagFilter(null)}
                className="text-xs font-bold underline hover:text-blue-950 cursor-pointer"
              >
                Quitar filtro
              </button>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 2. VISTA ESPECÍFICA: MI RED PROFESIONAL                                 */}
          {/* ======================================================================= */}
          {activeNav === 'red' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tu Red Profesional Industrial</h3>
                  <p className="text-xs text-slate-500">Conecta con especialistas con especialidad y región afín.</p>
                </div>
                <span className="text-xs font-bold text-blue-600 font-mono">
                  {recommendedProfiles.length} sugerencias
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedProfiles.map(rec => {
                  const prof = rec.candidateProfile
                  const isSent = sentConnectionIds.has(prof.id)
                  return (
                    <div key={prof.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {prof.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-black text-slate-900 truncate">{prof.display_name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{prof.headline}</p>
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {prof.specialties[0] || 'Minería'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendConnection(prof.id, prof.display_name)}
                          disabled={isSent}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
                            isSent 
                              ? 'bg-slate-200 text-slate-500 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isSent ? 'Solicitud enviada' : 'Conectar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatContact(prof)
                            setIsChatMinimized(false)
                          }}
                          className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Mensaje
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* 3. VISTA ESPECÍFICA: TABLERO DE OPORTUNIDADES PROFESIONALES              */}
          {/* ======================================================================= */}
          {activeNav === 'oportunidades' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Oportunidades y Convocatorias Laborales</h3>
                    <p className="text-xs text-slate-500">
                      Requerimientos técnicos reales de empresas contratistas y mineras en el ecosistema Inthaly.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Fase 4 Activa
                  </span>
                </div>
              </div>

              {industrialOpportunities.map(opp => {
                const isApplied = appliedOpportunities.has(opp.id)
                return (
                  <div key={opp.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {opp.specialty}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{opp.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-700">{opp.company}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {opp.location}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">{opp.publishedAt}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Modalidad: {opp.type}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOpportunity(opp)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                          isApplied 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {isApplied ? 'Postulado ✓' : 'Ver requisitos y postular'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ======================================================================= */}
          {/* 4. FEED DE PUBLICACIONES PROFESIONALES                                  */}
          {/* Estructura recomendada: media_1794887984001_d6397a3c.png                  */}
          {/* ======================================================================= */}
          {(activeNav === 'inicio' || activeNav === 'explorar' || activeNav === 'guardados') && (
            <div className="space-y-4">
              {displayedPosts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center space-y-2">
                  <Bookmark size={32} className="mx-auto text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-700">No hay publicaciones para este criterio</h3>
                  <p className="text-xs text-slate-400">Selecciona "Inicio" para ver toda la actividad técnica.</p>
                </div>
              ) : (
                displayedPosts.map((post) => {
                  const author = post.author || currentUser || { display_name: 'Colega Inthaly', headline: 'Profesional Industrial' }
                  const isSaved = savedPosts.has(post.id)
                  const hasReacted = !!post.user_reaction
                  const postCommentsList = localComments[post.id] || []

                  return (
                    <article 
                      key={post.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Cabecera Estructurada: Publicación Profesional */}
                      <div className="p-4 sm:p-5 pb-2">
                        
                        {/* Tag de Categoría Profesional */}
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-md border border-blue-200/60 tracking-wider">
                            Publicación profesional
                          </span>
                          
                          {/* Menú de Opciones (3 puntos) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                              className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {activePostMenuId === post.id && (
                              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-40">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSave(post.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Bookmark size={14} className={isSaved ? 'text-blue-600 fill-blue-600' : 'text-slate-400'} />
                                  <span>{isSaved ? 'Remover de guardados' : 'Guardar publicación'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(window.location.href)
                                    toast.success('Enlace de la publicación copiado')
                                    setActivePostMenuId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <Share2 size={14} className="text-slate-400" />
                                  <span>Copiar enlace</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metadatos: Autor · Especialidad · Empresa o Grupo */}
                        <div className="flex items-start gap-3 mt-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {author.display_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                              {author.display_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              <span>{author.headline || 'Especialista en Minería e Industria'}</span>
                              {post.group && (
                                <>
                                  <span className="mx-1">·</span>
                                  <span className="text-blue-700 font-bold">{post.group.name}</span>
                                </>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(post.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} · Comunidad Inthaly
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contenido Técnico */}
                      <div className="px-4 sm:px-5 py-2">
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                          {post.content}
                        </p>

                        {/* Etiquetas Técnicas */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {post.tags.map(t => (
                              <button 
                                key={t}
                                type="button"
                                onClick={() => setSelectedTagFilter(t)}
                                className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Evidencia Multimedia si Existe */}
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="mt-2 w-full max-h-96 bg-slate-900 overflow-hidden flex items-center justify-center">
                          <img 
                            src={post.media_urls[0]} 
                            alt="Esquema técnico" 
                            className="w-full h-auto object-cover max-h-96"
                          />
                        </div>
                      )}

                      {/* Estadísticas de Interacción Profesional */}
                      <div className="px-4 sm:px-5 py-2 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                            ✓
                          </span>
                          <span className="font-semibold text-slate-700">
                            {post.likes_count} especialistas encontraron esto útil
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{post.comments_count + postCommentsList.length} comentarios</span>
                          <span>{post.shares_count || 1} compartidos</span>
                        </div>
                      </div>

                      {/* Acciones Obligatorias: Me sirve · Comentar · Compartir · Guardar */}
                      <div className="px-3 py-1 flex items-center justify-between text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => handleToggleReaction(post.id, 'helpful')}
                          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            hasReacted 
                              ? 'text-blue-700 bg-blue-50/80 font-black' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <ThumbsUp size={15} className={hasReacted ? 'fill-blue-700' : ''} />
                          <span>Me sirve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                          className="flex-1 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare size={15} />
                          <span>Comentar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast.success('Publicación copiada al portapapeles para compartir')
                          }}
                          className="flex-1 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Share2 size={15} />
                          <span>Compartir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSave(post.id)}
                          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isSaved 
                              ? 'text-blue-700 bg-blue-50/80 font-black' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Bookmark size={15} className={isSaved ? 'fill-blue-700' : ''} />
                          <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                        </button>
                      </div>

                      {/* Hilo de Comentarios Técnico */}
                      {(activeCommentPostId === post.id || postCommentsList.length > 0) && (
                        <div className="px-4 sm:px-5 pt-3 pb-4 bg-slate-50/60 border-t border-slate-100 space-y-3">
                          
                          {/* Lista de comentarios */}
                          {postCommentsList.map(comm => (
                            <div key={comm.id} className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {comm.author.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 max-w-[90%] shadow-2xs">
                                <span className="text-xs font-black text-slate-900 block">{comm.author}</span>
                                <p className="text-xs text-slate-700 mt-0.5">{comm.content}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{comm.time}</span>
                              </div>
                            </div>
                          ))}

                          {/* Input de respuesta */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                              CM
                            </div>
                            <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                              <input
                                type="text"
                                placeholder="Escribe tu consulta o aporte técnico profesional..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddComment(post.id)
                                  }
                                }}
                                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddComment(post.id)}
                                className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                                title="Publicar comentario"
                              >
                                <Send size={13} />
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                    </article>
                  )
                })
              )}
            </div>
          )}

        </main>

        {/* ========================================================================= */}
        {/* COLUMNA 3: DESCUBRE (3 cols)                                               */}
        {/* Estructura recomendada: media_1794887984001_d6397a3c.png                  */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 select-none">
          <div className="sticky top-20 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            
            {/* Título de Sección */}
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Descubre
              </h2>
              <span className="text-[10px] text-blue-600 font-bold">Industrial</span>
            </div>

            {/* 1. Personas recomendadas */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Personas recomendadas
              </h3>

              <div className="space-y-2">
                {recommendedProfiles.slice(0, 2).map(rec => {
                  const prof = rec.candidateProfile
                  const isSent = sentConnectionIds.has(prof.id)
                  return (
                    <div key={prof.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {prof.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{prof.display_name}</h4>
                          <span className="text-[11px] text-slate-500 block truncate">{prof.headline}</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded mt-0.5 inline-block">
                            {prof.specialties[0]}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendConnection(prof.id, prof.display_name)}
                        disabled={isSent}
                        className={`w-full py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
                          isSent
                            ? 'bg-slate-200 text-slate-500 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSent ? 'Solicitud enviada' : 'Conectar'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Grupos relevantes */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Grupos relevantes
                </h3>
                <Link href="/comunidad/grupos" className="text-[10px] font-bold text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>

              <div className="space-y-2">
                {groups.slice(0, 3).map(grp => (
                  <div key={grp.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{grp.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {grp.members_count} especialistas
                      </span>
                    </div>
                    <Link
                      href="/comunidad/grupos"
                      className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors shrink-0"
                    >
                      Unirse
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Oportunidades destacadas */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Oportunidades
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveNav('oportunidades')}
                  className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Ver bolsa
                </button>
              </div>

              <div className="space-y-2">
                {industrialOpportunities.slice(0, 2).map(opp => (
                  <div 
                    key={opp.id} 
                    onClick={() => setSelectedOpportunity(opp)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 cursor-pointer transition-colors space-y-1"
                  >
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{opp.title}</h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-medium truncate">{opp.company}</span>
                      <span className="text-blue-600 font-bold">Postular →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Temas de interés */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Temas de interés
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTagFilter(selectedTagFilter === tag ? null : tag)
                      setActiveNav('inicio')
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      selectedTagFilter === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Contactos Activos en Línea */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Contactos activos
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-1">
                {onlineContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatContact(c)
                      setIsChatMinimized(false)
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px]">
                        {c.display_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">{c.display_name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: COMPOSITOR DE PUBLICACIÓN PROFESIONAL                             */}
      {/* ========================================================================= */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                {composerMode === 'image' ? 'Adjuntar Imagen o Esquema Técnico' : 
                 composerMode === 'doc' ? 'Compartir Documento o Ficha' : 
                 'Crear publicación profesional'}
              </h3>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                  CM
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {currentUser?.display_name || 'Ing. Carlos Mendoza'}
                  </h4>
                  <span className="text-[10px] text-slate-500">Publicando en Red Profesional Inthaly</span>
                </div>
              </div>

              <textarea
                rows={4}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="¿Qué conocimiento, experiencia u oportunidad quieres compartir?"
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <ImageIcon size={13} /> URL de fotografía técnica o esquema (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/esquema-operativo.jpg"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Building2 size={13} /> Publicar en un grupo de especialidad (opcional)
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="">Muro principal de la comunidad</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Especialidad</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !postContent.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Aporte Técnico'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETALLE DE OPORTUNIDAD LABORAL Y POSTULACIÓN                      */}
      {/* ========================================================================= */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {selectedOpportunity.specialty}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{selectedOpportunity.title}</h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {selectedOpportunity.company} · {selectedOpportunity.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900">Descripción de la posición:</h4>
                <p className="mt-1 leading-relaxed">{selectedOpportunity.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Requisitos indispensables:</h4>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                  {selectedOpportunity.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 space-y-1">
                <span className="font-bold block">Postulación Soberana con Inthaly ID:</span>
                <p className="text-[11px] leading-snug">
                  Se compartirá tu Perfil Profesional (CV estructurado, experiencias y estudios) directamente con el equipo de RRHH de la empresa contratante.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApplyOpportunity(selectedOpportunity.id, selectedOpportunity.title)}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirmar Postulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOCK FLOTANTE DE MENSAJERÍA DIRECTA SOBERANA                           */}
      {/* ========================================================================= */}
      {activeChatContact && (
        <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-72 sm:w-80 bg-white rounded-t-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all">
          
          <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsChatMinimized(!isChatMinimized)}>
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[10px]">
                  {activeChatContact.display_name.substring(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                  {activeChatContact.display_name}
                </h4>
                <span className="text-[9px] text-emerald-600 font-bold block leading-none">En línea</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <Minimize2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setActiveChatContact(null)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isChatMinimized && (
            <>
              <div className="h-64 p-3 overflow-y-auto bg-slate-50/70 space-y-2.5 text-xs">
                <div className="text-center text-[10px] text-slate-400 py-1">
                  Mensajería técnica soberana · Inthaly
                </div>

                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    Inicia la consulta técnica con {activeChatContact.display_name}
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.sender_id === (currentUser?.id || 'user-carlos-mendoza')
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-2xl px-3 py-1.5 leading-relaxed ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-xs' 
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className={`text-[9px] block text-right mt-0.5 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-100 focus:bg-white rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>
            </>
          )}

        </div>
      )}

    </div>
  )
}
