'use client'

/**
 * INTHALY OPS — Global Console: Administración de Industrias, Arquetipos y Capacidades
 * FASE 5: Componente Cliente de Administración
 * 
 * Torre de Control Central:
 *  - Pestaña 1: Empresas y Perfiles (Gestión por Tenant)
 *  - Pestaña 2: Industrias y Arquetipos Oficiales
 *  - Pestaña 3: Catálogo Central de Capacidades
 *  - Pestaña 4: Matriz Comparativa Arquetipos vs Capacidades
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Cpu,
  Layers,
  Search,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Save,
  RotateCcw,
  X,
  ExternalLink,
  ShieldCheck,
  Pickaxe,
  HardHat,
  Truck,
  Factory,
  Briefcase,
  Wheat,
  Shield,
  Boxes,
  Lock,
  ChevronRight,
  Filter,
  Check,
  Eye,
  Settings2,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CapabilitiesAdminData,
  CompanyWithProfileAdmin,
  updateCompanyOperatingProfileAdmin,
  toggleCompanyLegacyMode
} from './actions'
import {
  IndustryCode,
  CapabilityKey,
  CapabilityStatus,
  SemanticToken,
  WorkRegime,
  BaseLocationType,
  PrimaryAssetType
} from '@/lib/operating-profiles/types'

// Map de iconos Lucide por nombre de icono
const ICON_MAP: Record<string, React.ElementType> = {
  Pickaxe,
  HardHat,
  Truck,
  Factory,
  Briefcase,
  Wheat,
  Shield,
  Building2
}

interface CapabilitiesAdminClientProps {
  initialData: CapabilitiesAdminData
}

export function CapabilitiesAdminClient({ initialData }: CapabilitiesAdminClientProps) {
  const [activeTab, setActiveTab] = useState<'empresas' | 'industrias' | 'capacidades' | 'matriz'>('empresas')
  const [companies, setCompanies] = useState<CompanyWithProfileAdmin[]>(initialData.companies)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterIndustry, setFilterIndustry] = useState<string>('all')
  const [filterLegacy, setFilterLegacy] = useState<string>('all')

  // Modal de edición de perfil de empresa
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithProfileAdmin | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario de edición en modal
  const [editIndustry, setEditIndustry] = useState<IndustryCode>('MINERIA_METALURGIA')
  const [editLegacyMode, setEditLegacyMode] = useState<boolean>(false)
  const [editCapabilities, setEditCapabilities] = useState<Partial<Record<CapabilityKey, CapabilityStatus>>>({})
  const [editTerminology, setEditTerminology] = useState<Partial<Record<SemanticToken, string>>>({})
  const [editWorkRegime, setEditWorkRegime] = useState<WorkRegime>('ROTATIVO')
  const [editBaseLocation, setEditBaseLocation] = useState<BaseLocationType>('MINA')
  const [editPrimaryAsset, setEditPrimaryAsset] = useState<PrimaryAssetType>('MAQUINARIA_PESADA')
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('all')

  // Filtro de búsqueda en catálogo de capacidades
  const [capSearchTerm, setCapSearchTerm] = useState('')
  const [capCategoryFilter, setCapCategoryFilter] = useState('all')

  // Abrir modal de edición para una empresa
  const handleOpenEdit = (comp: CompanyWithProfileAdmin) => {
    setSelectedCompany(comp)
    setEditIndustry(comp.profile.industry_key || 'MINERIA_METALURGIA')
    setEditLegacyMode(Boolean(comp.profile.is_legacy_mode))
    setEditCapabilities({ ...(comp.profile.custom_capabilities || {}) })
    setEditTerminology({ ...(comp.profile.terminology_overrides || comp.profile.custom_terminology || {}) })
    setEditWorkRegime(comp.profile.operational_context?.work_regime || 'ROTATIVO')
    setEditBaseLocation(comp.profile.operational_context?.base_location_type || 'MINA')
    setEditPrimaryAsset(comp.profile.operational_context?.primary_asset_type || 'MAQUINARIA_PESADA')
    setIsEditModalOpen(true)
  }

  // Guardar cambios en perfil operativo
  const handleSaveProfile = async () => {
    if (!selectedCompany) return
    setIsSaving(true)
    const toastId = toast.loading('Guardando perfil operativo y actualizando caché...')

    try {
      const res = await updateCompanyOperatingProfileAdmin({
        companyId: selectedCompany.id,
        industryCode: editIndustry,
        archetypeCode: editIndustry,
        isLegacyMode: editLegacyMode,
        customCapabilities: editCapabilities,
        customTerminology: editTerminology,
        operationalContext: {
          work_regime: editWorkRegime,
          base_location_type: editBaseLocation,
          primary_asset_type: editPrimaryAsset
        }
      })

      if (res.success && res.profile) {
        toast.success(`Perfil de "${selectedCompany.name}" actualizado correctamente.`, { id: toastId })
        // Actualizar estado local
        setCompanies(prev =>
          prev.map(c => (c.id === selectedCompany.id ? { ...c, profile: res.profile! } : c))
        )
        setIsEditModalOpen(false)
      } else {
        toast.error(res.error || 'Error al guardar el perfil', { id: toastId })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error inesperado', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrado de empresas en Tab 1
  const filteredCompanies = useMemo(() => {
    return companies.filter(comp => {
      const matchSearch =
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp.industry || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchIndustry =
        filterIndustry === 'all' || comp.profile.industry_key === filterIndustry

      const matchLegacy =
        filterLegacy === 'all' ||
        (filterLegacy === 'legacy' && comp.profile.is_legacy_mode) ||
        (filterLegacy === 'normal' && !comp.profile.is_legacy_mode)

      return matchSearch && matchIndustry && matchLegacy
    })
  }, [companies, searchTerm, filterIndustry, filterLegacy])

  // Filtrado de capacidades en Tab 3
  const filteredCapabilities = useMemo(() => {
    return Object.values(initialData.capabilitiesCatalog).filter(cap => {
      const matchSearch =
        cap.name.toLowerCase().includes(capSearchTerm.toLowerCase()) ||
        cap.key.toLowerCase().includes(capSearchTerm.toLowerCase()) ||
        cap.description.toLowerCase().includes(capSearchTerm.toLowerCase())

      const matchCat = capCategoryFilter === 'all' || cap.category === capCategoryFilter
      return matchSearch && matchCat
    })
  }, [initialData.capabilitiesCatalog, capSearchTerm, capCategoryFilter])

  // Arquetipo de la industria actualmente seleccionada en el modal
  const selectedArchetype = initialData.archetypes[editIndustry] || initialData.archetypes.MINERIA_METALURGIA

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header y Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-1">
            <Link href="/super-admin/settings" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Configuración Global
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Industrias y Capacidades</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="text-blue-600" size={22} />
            Administración de Industrias, Arquetipos y Capacidades
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Torre de control central para la parametrización de contextos operativos y gobierno de capacidades por empresa.
          </p>
        </div>

        {/* Badges de resumen */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
            <Building2 size={13} className="text-slate-500" />
            {companies.length} Empresas
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
            <Layers size={13} className="text-blue-500" />
            {initialData.industries.length} Industrias
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200">
            <Cpu size={13} className="text-indigo-500" />
            {initialData.capabilityKeys.length} Capacidades
          </span>
        </div>
      </div>

      {/* 2. Pestañas Principales */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('empresas')}
          className={`px-3.5 py-2 rounded-t-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'empresas'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-b-white text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Building2 size={14} />
          Empresas y Perfiles ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('industrias')}
          className={`px-3.5 py-2 rounded-t-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'industrias'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-b-white text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Layers size={14} />
          Industrias y Arquetipos ({initialData.industries.length})
        </button>
        <button
          onClick={() => setActiveTab('capacidades')}
          className={`px-3.5 py-2 rounded-t-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'capacidades'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-b-white text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Cpu size={14} />
          Catálogo de Capacidades ({initialData.capabilityKeys.length})
        </button>
        <button
          onClick={() => setActiveTab('matriz')}
          className={`px-3.5 py-2 rounded-t-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matriz'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-b-white text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Sliders size={14} />
          Matriz Arquetipos vs Capacidades
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PESTAÑA 1: EMPRESAS Y PERFILES OPERATIVOS */}
      {/* ==================================================================== */}
      {activeTab === 'empresas' && (
        <div className="space-y-3">
          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa por nombre o sector..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterIndustry}
                onChange={e => setFilterIndustry(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Todas las Industrias</option>
                {initialData.industries.map(ind => (
                  <option key={ind.code} value={ind.code}>
                    {ind.officialLabel}
                  </option>
                ))}
              </select>

              <select
                value={filterLegacy}
                onChange={e => setFilterLegacy(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Todos los Modos</option>
                <option value="legacy">Solo Legacy Mode</option>
                <option value="normal">Solo Verticalizadas</option>
              </select>
            </div>
          </div>

          {/* Tabla de Empresas y Perfiles */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Empresa</th>
                    <th className="py-2.5 px-3">Estado Tenant</th>
                    <th className="py-2.5 px-3">Industria Activa</th>
                    <th className="py-2.5 px-3">Modo Operativo</th>
                    <th className="py-2.5 px-3">Capacidades Activas</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron empresas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map(comp => {
                      const activeCapsCount = Object.values(comp.profile.capabilities).filter(
                        s => s === 'ACTIVE'
                      ).length

                      const meta = initialData.industries.find(i => i.code === comp.profile.industry_key)
                      const IconComponent = meta ? ICON_MAP[meta.iconName] || Building2 : Building2

                      return (
                        <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{comp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {comp.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                comp.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {comp.status.toUpperCase()}
                            </span>
                            {comp.is_test && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 text-[9px] font-bold">
                                TEST
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <IconComponent size={14} className="text-blue-600 shrink-0" />
                              <span>{meta?.officialLabel || comp.profile.industry_key}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Arquetipo: {comp.profile.archetype_code || comp.profile.industry_key}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {comp.profile.is_legacy_mode ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <AlertTriangle size={11} />
                                LEGACY MODE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                <CheckCircle2 size={11} />
                                VERTICALIZADO
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {activeCapsCount} / {initialData.capabilityKeys.length} activas
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleOpenEdit(comp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Settings2 size={13} />
                              Configurar
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 2: INDUSTRIAS Y ARQUETIPOS OFICIALES */}
      {/* ==================================================================== */}
      {activeTab === 'industrias' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {initialData.industries.map(ind => {
              const IconComp = ICON_MAP[ind.iconName] || Building2
              const archetype = initialData.archetypes[ind.code]
              const recCaps = archetype?.recommended_capabilities || {}
              const activeCount = Object.values(recCaps).filter(s => s === 'ACTIVE').length
              const betaCount = Object.values(recCaps).filter(s => s === 'BETA').length
              const protoCount = Object.values(recCaps).filter(s => s === 'PROTOTYPE').length
              const comingSoonCount = Object.values(recCaps).filter(s => s === 'COMING_SOON').length
              const disabledCount = Object.values(recCaps).filter(s => s === 'DISABLED').length

              return (
                <div
                  key={ind.code}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 relative hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                      <IconComp size={18} />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                      {ind.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{ind.officialLabel}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ind.description}</p>
                  </div>

                  {/* Arquetipo Contexto */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-400">Régimen base:</span>
                      <span className="font-semibold text-slate-700">{archetype?.default_context?.work_regime || 'ESTÁNDAR'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-400">Base operativa:</span>
                      <span className="font-semibold text-slate-700">{archetype?.default_context?.base_location_type || 'OFICINA'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-400">Activo primario:</span>
                      <span className="font-semibold text-slate-700">{archetype?.default_context?.primary_asset_type || 'GENERAL'}</span>
                    </div>
                  </div>

                  {/* Capacidades recomendadas */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {activeCount} Activas
                    </span>
                    {betaCount > 0 && (
                      <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        {betaCount} Beta
                      </span>
                    )}
                    {protoCount > 0 && (
                      <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                        {protoCount} Prototipo
                      </span>
                    )}
                    {comingSoonCount > 0 && (
                      <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                        {comingSoonCount} Próximamente
                      </span>
                    )}
                    <span className="text-slate-500 font-medium ml-auto">
                      {disabledCount} Inactivas
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 3: CATÁLOGO CENTRAL DE CAPACIDADES */}
      {/* ==================================================================== */}
      {activeTab === 'capacidades' && (
        <div className="space-y-3">
          {/* Filtros de capacidades */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={capSearchTerm}
                onChange={e => setCapSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, clave o ruta..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={capCategoryFilter}
              onChange={e => setCapCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
            >
              <option value="all">Todas las Categorías</option>
              <option value="CORE">CORE (Universal)</option>
              <option value="OPERACIONES">OPERACIONES</option>
              <option value="LOGISTICA_MECANICA">LOGISTICA Y MECANICA</option>
              <option value="SEGURIDAD_SOMA">SEGURIDAD SOMA</option>
              <option value="SERVICIOS_PERSONAL">SERVICIOS AL PERSONAL</option>
              <option value="ADMINISTRACION">ADMINISTRACIÓN</option>
            </select>
          </div>

          {/* Listado de capacidades */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Capacidad</th>
                    <th className="py-2.5 px-3">Clave Interna</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Lifecycle Predeterminado</th>
                    <th className="py-2.5 px-3">Ruta / Prefijo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCapabilities.map(cap => {
                    const isCore = cap.isCore
                    return (
                      <tr key={cap.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{cap.name}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{cap.description}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 font-semibold">
                          {cap.key}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {cap.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isCore ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Lock size={10} />
                              CORE UNIVERSAL
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              VERTICAL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              cap.defaultStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800'
                                : cap.defaultStatus === 'BETA'
                                ? 'bg-blue-50 text-blue-800'
                                : cap.defaultStatus === 'PROTOTYPE'
                                ? 'bg-purple-50 text-purple-800'
                                : cap.defaultStatus === 'COMING_SOON'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cap.defaultStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {cap.route || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 4: MATRIZ COMPARATIVA ARQUETIPOS VS CAPACIDADES */}
      {/* ==================================================================== */}
      {activeTab === 'matriz' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders size={14} className="text-blue-600" />
              Matriz Cruzada de Capacidades vs Sectores
            </h3>
            <span className="text-[11px] text-slate-500">Configuración recomendada de fábrica por Arquetipo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2 px-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">Capacidad</th>
                  {initialData.industries.map(ind => (
                    <th key={ind.code} className="py-2 px-2.5 text-center min-w-[90px]">
                      {ind.officialLabel.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialData.capabilityKeys.map(key => {
                  const def = initialData.capabilitiesCatalog[key]
                  return (
                    <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-1.5 px-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                        <span>{def?.name || key}</span>
                        {def?.isCore && (
                          <span className="ml-1.5 px-1 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                            CORE
                          </span>
                        )}
                      </td>
                      {initialData.industries.map(ind => {
                        const archetype = initialData.archetypes[ind.code]
                        const status = archetype?.recommended_capabilities?.[key] || 'DISABLED'
                        return (
                          <td key={ind.code} className="py-1.5 px-2 text-center">
                            {status === 'ACTIVE' ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="ACTIVE" />
                            ) : status === 'BETA' ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" title="BETA" />
                            ) : status === 'PROTOTYPE' ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" title="PROTOTYPE" />
                            ) : (
                              <span className="inline-block w-2 h-2 rounded-full bg-slate-200" title="DISABLED" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE EDICIÓN DE PERFIL OPERATIVO */}
      {/* ==================================================================== */}
      {isEditModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  {selectedCompany.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    Configurar Perfil Operativo: {selectedCompany.name}
                  </h2>
                  <p className="text-[11px] text-slate-500">ID: {selectedCompany.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido del Modal (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Sección 1: Sector y Modo Legacy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sector / Industria Asignada
                  </label>
                  <select
                    value={editIndustry}
                    onChange={e => setEditIndustry(e.target.value as IndustryCode)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {initialData.industries.map(ind => (
                      <option key={ind.code} value={ind.code}>
                        {ind.officialLabel}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Determina el arquetipo base y vocabulario por defecto.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Modo de Compatibilidad (Legacy Mode)
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setEditLegacyMode(!editLegacyMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        editLegacyMode ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editLegacyMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${editLegacyMode ? 'text-amber-800' : 'text-slate-600'}`}>
                      {editLegacyMode ? 'Activo (Preserva todos los módulos)' : 'Inactivo (Verticalizado)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Si está activo, ningún módulo preexistente se oculta para esta empresa.
                  </p>
                </div>
              </div>

              {/* Sección 2: Matriz de Capacidades y Overrides */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Cpu size={14} className="text-blue-600" />
                    Gobernanza de Capacidades por Empresa
                  </h3>
                  <select
                    value={modalCategoryFilter}
                    onChange={e => setModalCategoryFilter(e.target.value)}
                    className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-700"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="CORE">CORE</option>
                    <option value="OPERACIONES">OPERACIONES</option>
                    <option value="LOGISTICA_MECANICA">LOGÍSTICA / MECÁNICA</option>
                    <option value="SEGURIDAD_SOMA">SOMA</option>
                  </select>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Capacidad</th>
                        <th className="py-2 px-3">Arquetipo Base</th>
                        <th className="py-2 px-3">Estado Empresa (Override)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {initialData.capabilityKeys.map(key => {
                        const def = initialData.capabilitiesCatalog[key]
                        if (modalCategoryFilter !== 'all' && def?.category !== modalCategoryFilter) {
                          return null
                        }

                        const archetypeStatus: CapabilityStatus = selectedArchetype?.recommended_capabilities?.[key] || 'DISABLED'
                        const currentOverride = editCapabilities[key]
                        const effectiveStatus = currentOverride || archetypeStatus
                        const isCore = def?.isCore

                        return (
                          <tr key={key} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              <div>{def?.name || key}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{key}</div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {archetypeStatus}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {isCore ? (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  INMUTABLE (ACTIVE)
                                </span>
                              ) : (
                                <select
                                  value={effectiveStatus}
                                  onChange={e => {
                                    const val = e.target.value as CapabilityStatus
                                    setEditCapabilities(prev => ({
                                      ...prev,
                                      [key]: val
                                    }))
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                                    effectiveStatus === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : effectiveStatus === 'BETA'
                                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                                      : effectiveStatus === 'PROTOTYPE'
                                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                                      : effectiveStatus === 'COMING_SOON'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="BETA">BETA</option>
                                  <option value="PROTOTYPE">PROTOTYPE</option>
                                  <option value="COMING_SOON">COMING_SOON</option>
                                  <option value="DISABLED">DISABLED</option>
                                </select>
                              )}
                              {currentOverride && (
                                <span className="ml-2 text-[9px] text-blue-600 font-bold">
                                  (Personalizado)
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 3: Overrides de Terminología Semántica */}
              <div className="space-y-2.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-indigo-600" />
                  Personalización de Vocabulario (Terminology Overrides)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Personal / Colaboradores (Plural):
                    </label>
                    <input
                      type="text"
                      value={editTerminology['worker.plural'] || ''}
                      onChange={e =>
                        setEditTerminology(prev => ({ ...prev, 'worker.plural': e.target.value }))
                      }
                      placeholder="Ej: Operadores, Obreros, Choferes..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Activo Primario (Singular):
                    </label>
                    <input
                      type="text"
                      value={editTerminology['asset.primary.singular'] || ''}
                      onChange={e =>
                        setEditTerminology(prev => ({ ...prev, 'asset.primary.singular': e.target.value }))
                      }
                      placeholder="Ej: Vehículo, Maquinaria, Implemento..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Nombre Módulo Operaciones:
                    </label>
                    <input
                      type="text"
                      value={editTerminology['operation.module_name'] || ''}
                      onChange={e =>
                        setEditTerminology(prev => ({ ...prev, 'operation.module_name': e.target.value }))
                      }
                      placeholder="Ej: Gestión de Mina, Operaciones y Flota..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Ubicación Primaria:
                    </label>
                    <input
                      type="text"
                      value={editTerminology['location.primary'] || ''}
                      onChange={e =>
                        setEditTerminology(prev => ({ ...prev, 'location.primary': e.target.value }))
                      }
                      placeholder="Ej: Frente de Mina, Obra, Ruta..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal con Acciones */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={13} />
                {isSaving ? 'Guardando...' : 'Guardar y Aplicar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
