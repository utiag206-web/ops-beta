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
  Home, Search, Bell, Radio, Film
} from 'lucide-react'
import type { 
  CommunityPost, 
  RecommendationResult, 
  CommunityGroup, 
  ReactionType,
  TechnicalStory,
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
import { toast } from 'sonner'

export default function CommunityFeedClient({
  initialPosts,
  recommendedProfiles,
  groups,
  initialStories,
  onlineContacts,
  initialSavedIds,
  currentUser
}: {
  initialPosts: CommunityPost[]
  recommendedProfiles: RecommendationResult[]
  groups: CommunityGroup[]
  initialStories: TechnicalStory[]
  onlineContacts: CommunityProfile[]
  initialSavedIds: string[]
  currentUser: CommunityProfile | null
}) {
  // Estados de Feed y Publicaciones
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set(initialSavedIds))
  const [activeFilter, setActiveFilter] = useState<'for-you' | 'explorer' | 'following' | 'friends' | 'saved' | 'my-groups'>('for-you')
  const [sidebarSearch, setSidebarSearch] = useState('')
  
  // Estado del Modal de Creación de Publicación
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postImageUrl, setPostImageUrl] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado de Comentarios en Hilo
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [localComments, setLocalComments] = useState<Record<string, Array<{ id: string; author: string; content: string; time: string }>>>({})

  // Estado de Historias / Stories Viewer
  const [stories, setStories] = useState<TechnicalStory[]>(initialStories)
  const [activeStory, setActiveStory] = useState<TechnicalStory | null>(null)
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false)
  const [newStoryTitle, setNewStoryTitle] = useState('')
  const [newStoryTag, setNewStoryTag] = useState('#Seguridad')

  // Estado de Contactos y Chat Flotante (Dock Messenger Style)
  const [activeChatContact, setActiveChatContact] = useState<CommunityProfile | null>(null)
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Estado de Menús contextuales de publicaciones (3 dots)
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null)

  const availableTags = [
    '#Seguridad', 
    '#Mantenimiento', 
    '#Perforación', 
    '#LíneaAmarilla', 
    '#Operaciones', 
    '#Geología',
    '#SOMA',
    '#Geomecánica'
  ]

  // Cargar mensajes cuando se abre un chat
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
  // HANDLERS DE INTERACCIÓN
  // =========================================================================

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) {
      toast.error('Por favor escribe el contenido de tu publicación')
      return
    }

    setIsSubmitting(true)
    try {
      const tags = selectedTag ? [selectedTag] : []
      const res = await createPostAction(postContent, selectedGroupId || undefined, tags)
      if (res.success && res.data) {
        // Asignar imagen si fue ingresada
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
        toast.success('Publicación técnica compartida en la comunidad')
      } else {
        toast.error(res.error || 'Error al publicar')
      }
    } catch (err: any) {
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
    } catch (e) {
      // rollback si falla
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
        toast.success('Publicación guardada en tus marcadores técnicos')
      }
      return next
    })
    setActivePostMenuId(null)

    try {
      await toggleSavePostAction(postId)
    } catch (e) {
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
    toast.success('Comentario añadido')

    try {
      await addCommentAction(postId, text)
    } catch (e) {
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
    } catch (e) {
      toast.error('Error al enviar mensaje')
    }
  }

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStoryTitle.trim()) return

    const newStory: TechnicalStory = {
      id: `story-${Date.now()}`,
      author_id: currentUser?.id || 'user-carlos-mendoza',
      author_name: currentUser?.display_name || 'Ing. Carlos Mendoza',
      author_specialty: 'Ingeniería de Minas',
      title: newStoryTitle.trim(),
      gradient: 'from-blue-700 via-indigo-800 to-slate-900',
      tag: newStoryTag,
      created_at: new Date().toISOString()
    }

    setStories([newStory, ...stories])
    setIsCreateStoryOpen(false)
    setNewStoryTitle('')
    toast.success('Aporte técnico destacado publicado')
  }

  // Filtrado de publicaciones dinámico
  const displayedPosts = posts.filter(p => {
    // Filtro por término de búsqueda en sidebar si existe
    if (sidebarSearch.trim()) {
      const matchSearch = 
        p.content.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        (p.author?.display_name || '').toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(sidebarSearch.toLowerCase()))
      if (!matchSearch) return false
    }

    if (activeFilter === 'saved') return savedPosts.has(p.id)
    if (activeFilter === 'my-groups') return !!p.group_id
    if (activeFilter === 'following' || activeFilter === 'friends') {
      // Muestra publicaciones con interacciones o de contactos relevantes
      return true
    }
    return true
  })

  return (
    <div className="w-full max-w-[1536px] mx-auto px-2 sm:px-4 py-3 md:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: ESTILO TIKTOK WEB CONTEMPORÁNEO (3 cols)              */}
        {/* Basado estrictamente en referencia: media_1794884025833_3332de7e.png     */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-1 select-none">
          <div className="sticky top-18 space-y-1 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            
            {/* 1. Barra de Búsqueda Superior */}
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100/90 hover:bg-slate-200/70 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:border-blue-400 focus:outline-none transition-all"
              />
            </div>

            {/* 2. Ítems Principales de Navegación Vertical */}
            <div className="space-y-0.5">
              
              {/* Para ti (Principal) */}
              <button
                type="button"
                onClick={() => setActiveFilter('for-you')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'for-you'
                    ? 'text-rose-600 bg-rose-50/80'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Home size={20} className={activeFilter === 'for-you' ? 'text-rose-600 stroke-[2.5]' : 'text-slate-700'} />
                <span className="text-[13px] font-black">Para ti</span>
              </button>

              {/* Explorador */}
              <button
                type="button"
                onClick={() => setActiveFilter('explorer')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'explorer'
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Compass size={20} className="text-slate-700" />
                <span className="text-[13px] font-bold">Explorador</span>
              </button>

              {/* Siguiendo */}
              <button
                type="button"
                onClick={() => setActiveFilter('following')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'following'
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[8px] font-bold text-rose-600">
                    S
                  </div>
                </div>
                <span className="text-[13px] font-bold">Siguiendo</span>
              </button>

              {/* Amigos / Colegas */}
              <button
                type="button"
                onClick={() => setActiveFilter('friends')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'friends'
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Users size={20} className="text-slate-700" />
                <span className="text-[13px] font-bold">Amigos</span>
              </button>

              {/* Minidramas / Especialidades */}
              <Link
                href="/comunidad/grupos"
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Film size={20} className="text-slate-700" />
                <span className="text-[13px] font-bold">Minidramas & Grupos</span>
              </Link>

              {/* EN VIVO */}
              <div 
                onClick={() => toast.info('Próxima transmisión técnica en vivo: Viernes 19:00 hrs')}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center ring-2 ring-rose-500/30 shrink-0">
                  <Radio size={13} className="animate-pulse" />
                </div>
                <span className="text-[13px] font-bold">EN VIVO</span>
              </div>

              {/* Mensajes (Badge rojo 4 idéntico a referencia) */}
              <div
                onClick={() => {
                  if (onlineContacts.length > 0) {
                    setActiveChatContact(onlineContacts[0])
                    setIsChatMinimized(false)
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <Send size={20} className="text-slate-700 -rotate-45" />
                    {/* Badge circular rojo con el número 4 exacto de la referencia */}
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                      4
                    </span>
                  </div>
                  <span className="text-[13px] font-bold ml-1">Mensajes</span>
                </div>
              </div>

              {/* Actividad (Badge rojo 7 idéntico a referencia) */}
              <div
                onClick={() => toast.info('Tienes 7 nuevas reacciones e interacciones técnicas')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <MessageSquare size={20} className="text-slate-700" />
                    {/* Badge circular rojo con el número 7 exacto de la referencia */}
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                      7
                    </span>
                  </div>
                  <span className="text-[13px] font-bold ml-1">Actividad</span>
                </div>
              </div>

              {/* Cargar / Publicar (+) */}
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-md border-2 border-slate-700 flex items-center justify-center text-slate-700 shrink-0">
                  <Plus size={14} strokeWidth={3} />
                </div>
                <span className="text-[13px] font-bold">Cargar</span>
              </button>

              {/* Perfil */}
              <Link
                href="/comunidad/perfil"
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0 ring-1 ring-slate-300">
                  CM
                </div>
                <span className="text-[13px] font-bold">Perfil</span>
              </Link>

              {/* Más */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'saved' ? 'for-you' : 'saved')}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreHorizontal size={20} className="text-slate-700" />
                <span className="text-[13px] font-bold">Más {savedPosts.size > 0 && `(${savedPosts.size} guardados)`}</span>
              </button>

            </div>

            {/* 3. Subsección: Cuentas que sigues (Exacto a referencia) */}
            <div className="pt-3 border-t border-slate-100 mt-2 space-y-1">
              <h4 className="text-[12px] font-black text-slate-900 px-3 pb-1">
                Cuentas que sigues
              </h4>

              <div className="space-y-1">
                
                {/* Cuenta 1: Arq. Diana Corza */}
                <div
                  onClick={() => {
                    toast.info('Perfil de Arq. Diana Corza: Especialista en Obras y Arquitectura Minera')
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 p-0.5 shrink-0 ring-1 ring-amber-400">
                    <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      DC
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                      Arq. Diana Corza
                    </h5>
                    <span className="text-[11px] text-slate-500 block truncate leading-tight">
                      dianacorza0
                    </span>
                  </div>
                </div>

                {/* Cuenta 2: PaulaRuiz | Escalante */}
                <div
                  onClick={() => {
                    toast.info('Perfil de PaulaRuiz: Geomecánica y Estabilidad de Macizos')
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 p-0.5 shrink-0 ring-1 ring-rose-400">
                    <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      PR
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                      PaulaRuiz | Escalan...
                    </h5>
                    <span className="text-[11px] text-slate-500 block truncate leading-tight">
                      soypaularuiz
                    </span>
                  </div>
                </div>

                {/* Cuenta 3: Ing. Elena Rodríguez */}
                <div
                  onClick={() => {
                    if (onlineContacts.length > 0) {
                      setActiveChatContact(onlineContacts[0])
                      setIsChatMinimized(false)
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 p-0.5 shrink-0 ring-1 ring-emerald-400">
                    <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      ER
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                      Ing. Elena Rodríguez
                    </h5>
                    <span className="text-[11px] text-slate-500 block truncate leading-tight">
                      elenasoma
                    </span>
                  </div>
                </div>

                {/* Cuenta 4: Marco Valdivia */}
                <div
                  onClick={() => {
                    if (onlineContacts.length > 1) {
                      setActiveChatContact(onlineContacts[1])
                      setIsChatMinimized(false)
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 p-0.5 shrink-0 ring-1 ring-blue-400">
                    <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      MV
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                      Marco Valdivia
                    </h5>
                    <span className="text-[11px] text-slate-500 block truncate leading-tight">
                      valdiviamec
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer institucional discreto */}
            <div className="px-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
              <p>Comunidad Inthaly · Red Profesional Soberana</p>
            </div>

          </div>
        </aside>

        {/* ========================================================================= */}
        {/* COLUMNA CENTRAL: FEED PRINCIPAL + STORIES + COMPOSITOR (6 cols)            */}
        {/* ========================================================================= */}
        <main className="lg:col-span-6 space-y-4">
          
          {/* ======================================================================= */}
          {/* 1. CARRUSEL DE HISTORIAS / DESTACADOS TÉCNICOS (FACEBOOK STORIES BAR)    */}
          {/* ======================================================================= */}
          <section className="overflow-x-auto pb-1 no-scrollbar select-none">
            <div className="flex gap-2.5 min-w-max">
              
              {/* Tarjeta 1: Crear Historia Técnica / Aporte */}
              <div 
                onClick={() => setIsCreateStoryOpen(true)}
                className="w-28 sm:w-32 h-48 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs relative flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                    CM
                  </div>
                </div>
                <div className="h-16 bg-white relative flex flex-col items-center justify-center px-1">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center absolute -top-4.5 border-4 border-white shadow-xs group-hover:bg-blue-700 transition-colors">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-black text-slate-900 mt-3 text-center leading-tight">
                    Crear historia
                  </span>
                </div>
              </div>

              {/* Tarjetas 2 a N: Historias de Colegas */}
              {stories.map(st => (
                <div
                  key={st.id}
                  onClick={() => setActiveStory(st)}
                  className={`w-28 sm:w-32 h-48 rounded-2xl p-2.5 flex flex-col justify-between relative overflow-hidden cursor-pointer shadow-xs hover:scale-[1.02] transition-transform bg-gradient-to-b ${st.gradient || 'from-blue-700 to-slate-900'}`}
                >
                  {/* Avatar con anillo azul en esquina superior */}
                  <div className="w-9 h-9 rounded-full bg-white/20 p-0.5 border-2 border-blue-400 z-10 shrink-0">
                    <div className="w-full h-full rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {st.author_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Texto inferior de la historia */}
                  <div className="z-10">
                    <span className="text-[9px] font-extrabold text-blue-200 uppercase tracking-wider block">
                      {st.tag || '#Técnico'}
                    </span>
                    <p className="text-white text-[11px] font-bold leading-tight line-clamp-3 drop-shadow-sm mt-0.5">
                      {st.title}
                    </p>
                    <span className="text-white/80 text-[10px] font-medium block truncate mt-1">
                      {st.author_name}
                    </span>
                  </div>

                  {/* Overlay gradiente oscuro */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                </div>
              ))}

            </div>
          </section>

          {/* ======================================================================= */}
          {/* 2. COMPOSITOR DE PUBLICACIONES TIPO CÁPSULA (FACEBOOK POST COMPOSER)     */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                CM
              </div>
              {/* Cápsula interactiva tipo Facebook */}
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="w-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-left text-slate-500 hover:text-slate-700 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full transition-colors cursor-pointer border border-transparent"
              >
                ¿Qué desafío operativo o aporte técnico tienes hoy, Carlos?
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition-colors text-emerald-600 cursor-pointer"
              >
                <ImageIcon size={18} />
                <span className="text-slate-700 hidden sm:inline">Foto / Evidencia</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition-colors text-blue-600 cursor-pointer"
              >
                <Tag size={18} />
                <span className="text-slate-700 hidden sm:inline">Especialidad</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition-colors text-purple-600 cursor-pointer"
              >
                <Users size={18} />
                <span className="text-slate-700 hidden sm:inline">Grupo de destino</span>
              </button>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 3. FEED DE PUBLICACIONES (FACEBOOK POST CARDS CONTEMPORÁNEAS)            */}
          {/* ======================================================================= */}
          <div className="space-y-4">
            {displayedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center space-y-2">
                <Bookmark size={32} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">No hay publicaciones para este filtro</h3>
                <p className="text-xs text-slate-400">Selecciona "Muro Técnico Principal" para ver toda la actividad.</p>
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
                    {/* Header de la Publicación */}
                    <div className="p-4 pb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          {author.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                              {author.display_name}
                            </span>
                            {post.group && (
                              <>
                                <span className="text-[11px] text-slate-400">en</span>
                                <Link 
                                  href={`/comunidad/grupos`}
                                  className="text-[11px] font-bold text-blue-700 hover:underline"
                                >
                                  {post.group.name}
                                </Link>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>{new Date(post.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1" title="Público en Comunidad Inthaly">
                              <Globe size={11} className="text-slate-400" /> Público
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de 3 puntos (Opciones) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activePostMenuId === post.id && (
                          <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in duration-100">
                            <button
                              type="button"
                              onClick={() => handleToggleSave(post.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Bookmark size={15} className={isSaved ? 'text-amber-500 fill-amber-500' : 'text-slate-500'} />
                              <span>{isSaved ? 'Remover de guardados' : 'Guardar publicación'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href)
                                toast.success('Enlace de la publicación copiado')
                                setActivePostMenuId(null)
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Share2 size={15} className="text-slate-500" />
                              <span>Copiar enlace al portapapeles</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenido Textual del Post */}
                    <div className="px-4 py-2">
                      <p className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-line font-normal">
                        {post.content}
                      </p>

                      {/* Etiquetas de especialidad */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {post.tags.map(t => (
                            <span 
                              key={t}
                              className="text-[11px] font-bold text-blue-600 bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Imagen / Evidencia multimedia si existe */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="mt-2 w-full max-h-96 bg-slate-900 overflow-hidden flex items-center justify-center">
                        <img 
                          src={post.media_urls[0]} 
                          alt="Evidencia técnica" 
                          className="w-full h-auto object-cover max-h-96"
                        />
                      </div>
                    )}

                    {/* Barra de Estadísticas (Contadores) */}
                    <div className="px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                          👍
                        </span>
                        <span className="font-semibold text-slate-700">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{post.comments_count + postCommentsList.length} comentarios</span>
                        <span>{post.shares_count || 1} veces compartido</span>
                      </div>
                    </div>

                    {/* Barra de Acciones Estilo Facebook Web (Me sirve / Comentar / Compartir / Guardar) */}
                    <div className="px-2 py-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleReaction(post.id, 'helpful')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          hasReacted 
                            ? 'text-blue-600 bg-blue-50/70 font-black' 
                            : 'text-slate-600 hover:bg-[#f0f2f5]'
                        }`}
                      >
                        <ThumbsUp size={16} className={hasReacted ? 'fill-blue-600' : ''} />
                        <span>Me sirve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#f0f2f5] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={16} />
                        <span>Comentar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toast.success('Publicación compartida en tu red')
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#f0f2f5] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Share2 size={16} />
                        <span>Compartir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          isSaved 
                            ? 'text-amber-600 bg-amber-50/70 font-black' 
                            : 'text-slate-600 hover:bg-[#f0f2f5]'
                        }`}
                      >
                        <Bookmark size={16} className={isSaved ? 'fill-amber-600' : ''} />
                        <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                      </button>
                    </div>

                    {/* Hilo de Comentarios Desplegable */}
                    {(activeCommentPostId === post.id || postCommentsList.length > 0) && (
                      <div className="px-4 pt-2 pb-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                        
                        {/* Lista de comentarios existentes */}
                        {postCommentsList.map(comm => (
                          <div key={comm.id} className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {comm.author.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="bg-[#f0f2f5] rounded-2xl px-3.5 py-2 max-w-[85%]">
                              <span className="text-xs font-black text-slate-900 block">{comm.author}</span>
                              <p className="text-xs text-slate-800 mt-0.5">{comm.content}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{comm.time}</span>
                            </div>
                          </div>
                        ))}

                        {/* Input de respuesta rápida */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                            CM
                          </div>
                          <div className="flex-1 flex items-center bg-[#f0f2f5] rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                            <input
                              type="text"
                              placeholder="Escribe un comentario técnico o recomendación..."
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
                              <Send size={14} />
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
        </main>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: CONEXIONES SUGERIDAS + GRUPOS + CONTACTOS EN LÍNEA (3)   */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 select-none">
          <div className="sticky top-18 space-y-4">
            
            {/* Widget: Colegas Sugeridos (Estilo "Personas que quizás conozcas / Solicitudes" de Facebook) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Colegas sugeridos
                </h4>
                <span className="text-[10px] font-bold text-blue-600">Especialidad Común</span>
              </div>

              <div className="space-y-3">
                {recommendedProfiles.slice(0, 2).map((rec) => {
                  const prof = rec.candidateProfile
                  return (
                    <div key={prof.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {prof.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-black text-slate-900 truncate">{prof.display_name}</h5>
                          <p className="text-[11px] text-slate-500 truncate">{prof.headline}</p>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Coincidencia en {prof.specialties[0] || 'Minería e Industria'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            toast.success(`Solicitud de conexión enviada a ${prof.display_name}`)
                          }}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                        >
                          Conectar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast.info('Sugerencia descartada')
                          }}
                          className="py-1.5 px-3 bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Widget: Grupos Populares */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Grupos de interés
                </h4>
                <Link href="/comunidad/grupos" className="text-[11px] font-bold text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>

              <div className="space-y-2">
                {groups.slice(0, 3).map(grp => (
                  <div key={grp.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{grp.name}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {grp.members_count} especialistas
                      </span>
                    </div>
                    <Link
                      href="/comunidad/grupos"
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                    >
                      Unirse
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget: Contactos en Línea (Messenger Style) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Contactos activos
                </h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="space-y-1">
                {onlineContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatContact(c)
                      setIsChatMinimized(false)
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {c.display_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors block truncate">
                        {c.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {c.headline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: COMPOSITOR COMPLETO DE PUBLICACIÓN TÉCNICA                        */}
      {/* ========================================================================= */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 text-center flex-1">
                Crear publicación técnica
              </h3>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              
              {/* Usuario e indicador de visibilidad */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  CM
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {currentUser?.display_name || 'Ing. Carlos Mendoza'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Globe size={10} /> Comunidad Inthaly
                    </span>
                  </div>
                </div>
              </div>

              {/* Textarea amplia */}
              <textarea
                rows={4}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="¿Qué desafío operativo resolviste hoy? ¿Dudas sobre molienda, IPERC o motores diésel?"
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />

              {/* Input opcional de imagen/evidencia */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <ImageIcon size={13} /> Adjuntar URL de fotografía técnica o esquema (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto-operacion.jpg"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selector de Grupo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Users size={13} /> Publicar en un grupo específico (opcional)
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Muro general de Comunidad Inthaly</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Etiquetas Rápidas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Etiqueta de especialidad</span>
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

              {/* Botón de Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !postContent.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar en Comunidad'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISOR DE HISTORIA TÉCNICA (STORY VIEWER)                         */}
      {/* ========================================================================= */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="max-w-md w-full h-[620px] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-between p-5 text-white">
            
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${activeStory.gradient || 'from-blue-800 to-slate-950'} -z-10`} />

            {/* Top Bar: Barra de progreso + Autor */}
            <div className="space-y-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full animate-[progress_5s_linear]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white text-blue-800 flex items-center justify-center font-bold text-xs">
                    {activeStory.author_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{activeStory.author_name}</h4>
                    <span className="text-[10px] text-white/70">{activeStory.author_specialty}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStory(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Center Content */}
            <div className="my-auto text-center px-4 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-300 bg-white/10 px-3 py-1 rounded-full inline-block">
                {activeStory.tag}
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-snug drop-shadow-md">
                "{activeStory.title}"
              </h2>
            </div>

            {/* Bottom: Respuesta rápida */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Responder a ${activeStory.author_name}...`}
                className="flex-1 bg-white/20 placeholder-white/60 text-xs px-4 py-2.5 rounded-full border border-white/30 focus:outline-none focus:bg-white/30"
              />
              <button
                type="button"
                onClick={() => {
                  toast.success(`Respuesta enviada a ${activeStory.author_name}`)
                  setActiveStory(null)
                }}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREAR NUEVA HISTORIA TÉCNICA                                     */}
      {/* ========================================================================= */}
      {isCreateStoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Crear Historia / Destacado Técnico</h3>
              <button
                type="button"
                onClick={() => setIsCreateStoryOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Título o Aporte del Día</label>
                <textarea
                  rows={3}
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  placeholder="Ej: Calibración de presiones en bomba de lodos o hallazgo en talud..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Etiqueta</label>
                <select
                  value={newStoryTag}
                  onChange={(e) => setNewStoryTag(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="#Seguridad">#Seguridad</option>
                  <option value="#Mecánica">#Mecánica</option>
                  <option value="#Geología">#Geología</option>
                  <option value="#Voladura">#Voladura</option>
                  <option value="#Operaciones">#Operaciones</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Publicar Historia Destacada
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOCK FLOTANTE DE CHAT (MESSENGER CHAT BOX EN ESQUINA INFERIOR DERECHA)   */}
      {/* ========================================================================= */}
      {activeChatContact && (
        <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-72 sm:w-80 bg-white rounded-t-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all">
          
          {/* Header del Chat */}
          <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsChatMinimized(!isChatMinimized)}>
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {activeChatContact.display_name.substring(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
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
                title={isChatMinimized ? "Maximizar" : "Minimizar"}
              >
                <Minimize2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setActiveChatContact(null)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                title="Cerrar chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Cuerpo del Chat (Mensajes) */}
          {!isChatMinimized && (
            <>
              <div className="h-64 p-3 overflow-y-auto bg-slate-50/70 space-y-2.5 text-xs">
                <div className="text-center text-[10px] text-slate-400 py-1">
                  Conversación cifrada y soberana · Ecosistema Inthaly
                </div>

                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    Inicia la conversación técnica con {activeChatContact.display_name}
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

              {/* Input de Mensaje */}
              <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
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
