'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Users, Plus, Search, Shield, Lock, Globe, 
  Tag, CheckCircle2, AlertCircle, X, Sparkles, Compass,
  ArrowRight, ShieldCheck
} from 'lucide-react'
import type { CommunityGroup } from '@/types/community.types'
import { createGroupAction, joinGroupAction } from '@/app/(community)/comunidad/actions'
import { toast } from 'sonner'

export default function CommunityGroupsClient({
  initialGroups
}: {
  initialGroups: CommunityGroup[]
}) {
  const [groups, setGroups] = useState<CommunityGroup[]>(initialGroups)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set(['grp-soma-operaciones', 'grp-mecanica-pesada']))

  // Formulario de creación
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Mantenimiento Mecánico')
  const [tagsInput, setTagsInput] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'closed'>('public')

  const categories = [
    'all',
    'Mantenimiento Mecánico',
    'Seguridad y Salud',
    'Operaciones',
    'Transporte y Carga',
    'Geología y Perforación'
  ]

  const filteredGroups = groups.filter(g => {
    const matchesCategory = selectedCategory === 'all' || g.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre del grupo es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      const custom_tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const res = await createGroupAction({
        name,
        description,
        category,
        custom_tags,
        privacy
      })

      if (res.success && res.data) {
        const newGroup = res.data
        setGroups([newGroup, ...groups])
        setJoinedGroups(prev => new Set(prev).add(newGroup.id))
        setIsModalOpen(false)
        setName('')
        setDescription('')
        setTagsInput('')
        toast.success(`Grupo "${newGroup.name}" fundado con éxito. Ya puedes abrir debates técnicos.`)
      } else {
        toast.error(res.error || 'Error creando grupo')
      }
    } catch (e) {
      toast.error('Error al procesar la creación del grupo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async (groupId: string, groupName: string) => {
    const isJoined = joinedGroups.has(groupId)
    if (isJoined) {
      setJoinedGroups(prev => {
        const next = new Set(prev)
        next.delete(groupId)
        return next
      })
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members_count: Math.max(1, g.members_count - 1) } : g))
      toast.info(`Has salido del grupo "${groupName}"`)
    } else {
      setJoinedGroups(prev => new Set(prev).add(groupId))
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members_count: g.members_count + 1 } : g))
      toast.success(`Te has unido al grupo "${groupName}"`)
    }

    try {
      await joinGroupAction(groupId)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-2 sm:px-4 py-2">
      
      {/* Banner Superior Estilo Facebook Groups */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
              Comunidades de Práctica · Creación Abierta
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Grupos & Foros Especializados
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Espacios creados por profesionales para resolver fallas en faena, compartir manuales y debatir normativas de ingeniería e industria.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Crear nuevo grupo</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'Todos los grupos' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar grupos por nombre..."
            className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid de Grupos (Facebook Groups Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-2 shadow-2xs">
            <Users size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No se encontraron grupos en esta categoría</p>
            <p className="text-xs text-slate-500">Puedes crear el primer grupo técnico de esta especialidad haciendo clic en "Crear nuevo grupo".</p>
          </div>
        ) : (
          filteredGroups.map(g => {
            const isJoined = joinedGroups.has(g.id)
            return (
              <div 
                key={g.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Cabecera con degradado temático */}
                <div className="h-24 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 p-3 relative flex items-start justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-white/90 bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded-md">
                    {g.category}
                  </span>
                  <span className="text-[10px] text-white/90 font-bold flex items-center gap-1 bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded-md">
                    {g.privacy === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                    {g.privacy === 'public' ? 'Público' : 'Cerrado'}
                  </span>
                </div>

                {/* Contenido del Grupo */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {g.description || 'Comunidad técnica para intercambio de experiencias, resolución de anomalías y consultas de campo.'}
                    </p>

                    {g.custom_tags && g.custom_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {g.custom_tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {g.members_count} miembros
                    </span>

                    <button
                      type="button"
                      onClick={() => handleJoin(g.id, g.name)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        isJoined 
                          ? 'bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                      }`}
                    >
                      {isJoined ? 'Miembro' : 'Unirse al grupo'}
                    </button>
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>

      {/* Modal de Creación de Grupo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Fundar Nueva Comunidad Técnica</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Grupo o Foro</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Técnicos en Hidráulica y Válvulas Proporcionales"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Categoría Principal</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Mantenimiento Mecánico">Mantenimiento Mecánico</option>
                  <option value="Seguridad y Salud">Seguridad y Salud</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Transporte y Carga">Transporte y Carga</option>
                  <option value="Geología y Perforación">Geología y Perforación</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Descripción o Propósito Técnico</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué tópicos se compartirán y qué perfil de especialistas son bienvenidos..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Etiquetas personalizadas (separadas por coma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ej: #Hidráulica, #Bombas, #Válvulas"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Privacidad del Grupo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacy('public')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      privacy === 'public'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Público</span>
                    <span className="text-[10px] text-slate-500">Cualquiera puede ver el contenido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacy('closed')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      privacy === 'closed'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Cerrado</span>
                    <span className="text-[10px] text-slate-500">Solo miembros ven publicaciones</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
