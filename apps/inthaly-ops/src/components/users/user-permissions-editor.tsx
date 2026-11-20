'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Shield, 
  RotateCcw, 
  Loader2, 
  Check, 
  X, 
  AlertCircle, 
  Search,
  Sparkles,
  Info
} from 'lucide-react'
import { 
  getUserGranularPermissions, 
  setUserPermissionOverride, 
  removeUserPermissionOverride, 
  resetUserPermissionOverrides 
} from '@/app/(main)/users/actions'
import { toast } from 'sonner'
import type { Module, Action, UserPermissionOverride } from '@/lib/rbac/types'

interface UserPermissionsEditorProps {
  userId: string
  userName: string
  userRole?: string
  userArea?: string
}

interface GranularData {
  roleId: string
  area: string | null
  isWildcard: boolean
  baseGrants: Record<string, string[]>
  resolvedGrants: Record<string, string[]>
  overrides: UserPermissionOverride[]
}

const ACTION_LABELS: Record<Action, { label: string; desc: string }> = {
  read: { label: 'Ver', desc: 'Consultar y listar registros' },
  create: { label: 'Crear', desc: 'Crear nuevos registros' },
  update: { label: 'Editar', desc: 'Modificar registros existentes' },
  delete: { label: 'Eliminar', desc: 'Eliminar registros' },
  approve: { label: 'Aprobar', desc: 'Aprobar o autorizar solicitudes' },
  export: { label: 'Exportar', desc: 'Descargar datos en Excel / PDF' },
  manage: { label: 'Admin', desc: 'Control total de configuración' },
}

const ALL_ACTIONS: Action[] = ['read', 'create', 'update', 'delete', 'approve', 'export']

interface ModuleDefinition {
  id: Module
  name: string
  category: string
  actions: Action[]
}

const MODULES_CATALOG: ModuleDefinition[] = [
  // Operaciones
  { id: 'dashboard', name: 'Dashboard Principal', category: 'General', actions: ['read'] },
  { id: 'workers', name: 'Trabajadores / Personal', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'attendance', name: 'Asistencia y Tareo Diario', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'tareo', name: 'Tareo Consolidado', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'operaciones', name: 'Operaciones Generales', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'mina', name: 'Operaciones Mina', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'planta', name: 'Operaciones Planta', category: 'Operaciones', actions: ['read', 'create', 'update', 'delete', 'export'] },
  
  // Almacén & Logística
  { id: 'inventory', name: 'Inventario de Materiales', category: 'Almacén', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'movements', name: 'Movimientos (Entradas / Salidas)', category: 'Almacén', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'ppe', name: 'EPP (Equipos de Protección)', category: 'Almacén', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'assets', name: 'Activos Fijos / Herramientas', category: 'Almacén', actions: ['read', 'create', 'update', 'delete', 'export'] },
  
  // Finanzas & Requerimientos
  { id: 'requerimientos', name: 'Requerimientos de Compra', category: 'Finanzas & Compras', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'caja-chica', name: 'Caja Chica y Rendiciones', category: 'Finanzas & Compras', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'bonuses', name: 'Bonos y Gratificaciones', category: 'Finanzas & Compras', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  
  // Seguridad (SOMA)
  { id: 'soma', name: 'Módulo SOMA General', category: 'Seguridad SOMA', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'soma-capacitaciones', name: 'Capacitaciones SOMA', category: 'Seguridad SOMA', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'soma-charlas', name: 'Charlas de 5 Minutos', category: 'Seguridad SOMA', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'soma-hsec', name: 'Inspecciones HSEC', category: 'Seguridad SOMA', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'incidencias', name: 'Incidencias / Accidentes', category: 'Seguridad SOMA', actions: ['read', 'create', 'update', 'delete', 'export'] },

  // Flota & Mantenimiento
  { id: 'mecanica', name: 'Taller Mecánico & Flota', category: 'Mantenimiento', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'transport', name: 'Logística de Transporte', category: 'Mantenimiento', actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
  { id: 'camp', name: 'Campamento y Habitabilidad', category: 'Mantenimiento', actions: ['read', 'create', 'update', 'delete'] },

  // Reportes y Administración
  { id: 'reports', name: 'Centro de Reportes', category: 'Gestión', actions: ['read', 'export'] },
  { id: 'analytics', name: 'Analítica Avanzada', category: 'Gestión', actions: ['read', 'export'] },
  { id: 'documents', name: 'Gestor Documental', category: 'Gestión', actions: ['read', 'create', 'update', 'delete', 'export'] },
  { id: 'users', name: 'Gestión de Usuarios', category: 'Gestión', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { id: 'company', name: 'Configuración Empresa', category: 'Gestión', actions: ['read', 'update', 'manage'] },
]

export function UserPermissionsEditor({ userId, userName, userRole, userArea }: UserPermissionsEditorProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GranularData | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  // Load granular permissions
  const loadData = async () => {
    setLoading(true)
    const res = await getUserGranularPermissions(userId)
    if (res.success && res.data) {
      setData(res.data)
    } else {
      toast.error(res.error || 'No se pudieron cargar los permisos granulares')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [userId])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(MODULES_CATALOG.map(m => m.category))
    return ['Todas', ...Array.from(set)]
  }, [])

  // Filtered modules
  const filteredModules = useMemo(() => {
    return MODULES_CATALOG.filter(mod => {
      const matchCat = selectedCategory === 'Todas' || mod.category === selectedCategory
      const matchSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mod.id.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCategory, searchTerm])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold text-slate-500">Cargando permisos granulares...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-slate-500">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p className="text-sm font-bold">No se pudieron obtener los permisos del usuario.</p>
      </div>
    )
  }

  if (data.isWildcard) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
        <Sparkles className="mx-auto text-amber-600" size={32} />
        <h4 className="text-sm font-black text-amber-900">Acceso Wildcard Total (Super Admin)</h4>
        <p className="text-xs text-amber-700">
          Este usuario cuenta con el rol de Super Administrador, por lo que tiene todos los permisos en todos los módulos de forma irrestricta.
        </p>
      </div>
    )
  }

  // Toggle action permission
  const handleToggleAction = async (module: Module, action: Action) => {
    const key = `${module}:${action}`
    setSavingKey(key)

    // Check base status
    const isBaseGranted = (data.baseGrants[module] || []).includes(action)
    
    // Check override status
    const existingOverride = data.overrides.find(o => o.module === module && o.action === action)

    try {
      if (!existingOverride) {
        // No override: create one with the inverse of base
        const newGranted = !isBaseGranted
        const res = await setUserPermissionOverride(userId, module, action, newGranted)
        if (res.success) {
          setData(prev => {
            if (!prev) return prev
            const newOverrides = [
              ...prev.overrides,
              { user_id: userId, company_id: '', module, action, granted: newGranted }
            ]
            const currentActions = new Set(prev.resolvedGrants[module] || [])
            if (newGranted) currentActions.add(action)
            else currentActions.delete(action)

            return {
              ...prev,
              overrides: newOverrides,
              resolvedGrants: {
                ...prev.resolvedGrants,
                [module]: Array.from(currentActions)
              }
            }
          })
          toast.success(newGranted ? `Permiso '${action}' concedido` : `Permiso '${action}' revocado`)
        } else {
          toast.error(res.error || 'Error al guardar permiso')
        }
      } else {
        // Already has an override: remove it to return to base
        const res = await removeUserPermissionOverride(userId, module, action)
        if (res.success) {
          setData(prev => {
            if (!prev) return prev
            const newOverrides = prev.overrides.filter(o => !(o.module === module && o.action === action))
            const currentActions = new Set(prev.resolvedGrants[module] || [])
            if (isBaseGranted) currentActions.add(action)
            else currentActions.delete(action)

            return {
              ...prev,
              overrides: newOverrides,
              resolvedGrants: {
                ...prev.resolvedGrants,
                [module]: Array.from(currentActions)
              }
            }
          })
          toast.success(`Restablecido al valor por defecto del rol`)
        } else {
          toast.error(res.error || 'Error al eliminar override')
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado')
    } finally {
      setSavingKey(null)
    }
  }

  // Reset all overrides
  const handleResetAll = async () => {
    if (!confirm('¿Seguro que deseas restablecer todos los permisos a los valores por defecto de su rol?')) return
    setResetting(true)
    const res = await resetUserPermissionOverrides(userId)
    setResetting(false)
    if (res.success) {
      toast.success('Permisos restablecidos a los valores del rol')
      loadData()
    } else {
      toast.error(res.error || 'Error al restablecer permisos')
    }
  }

  const overridesCount = data.overrides.length

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={16} />
            <span className="text-xs font-black text-slate-800">
              Rol Base: <span className="text-blue-600 uppercase tracking-wider">{data.roleId}</span>
            </span>
            {data.area && (
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                Área: {data.area}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {overridesCount === 0 
              ? 'Usando permisos estándar definidos por la matriz de roles.' 
              : `${overridesCount} ajuste(s) personalizado(s) aplicado(s).`}
          </p>
        </div>

        {overridesCount > 0 && (
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-sm shrink-0"
          >
            {resetting ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
            Restablecer Rol
          </button>
        )}
      </div>

      {/* Legend / Guide */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          Rol Base
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          Concedido Extra
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          Revocado
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Info size={12} />
          Clic en cualquier botón para alternar
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filtrar módulo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredModules.map(mod => {
          const baseActions = data.baseGrants[mod.id] || []
          const activeActions = data.resolvedGrants[mod.id] || []

          return (
            <div 
              key={mod.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-3 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800">{mod.name}</h5>
                  <span className="text-[10px] text-slate-400 font-semibold">{mod.category}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {mod.id}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mod.actions.map(action => {
                  const key = `${mod.id}:${action}`
                  const isSaving = savingKey === key
                  const isBase = baseActions.includes(action)
                  const isActive = activeActions.includes(action)
                  const override = data.overrides.find(o => o.module === mod.id && o.action === action)

                  // Determine appearance
                  let btnClass = 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-transparent'
                  let stateLabel = 'Sin acceso'
                  let indicatorColor = 'bg-slate-300'

                  if (override) {
                    if (override.granted) {
                      // Explicit grant
                      btnClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-sm'
                      stateLabel = 'Concedido'
                      indicatorColor = 'bg-emerald-500'
                    } else {
                      // Explicit revoke
                      btnClass = 'bg-rose-50 text-rose-700 border-rose-300 line-through opacity-80'
                      stateLabel = 'Revocado'
                      indicatorColor = 'bg-rose-500'
                    }
                  } else if (isBase) {
                    // Inherited from role
                    btnClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                    stateLabel = 'Rol'
                    indicatorColor = 'bg-blue-500'
                  }

                  const actionInfo = ACTION_LABELS[action] || { label: action, desc: '' }

                  return (
                    <button
                      key={action}
                      disabled={isSaving}
                      onClick={() => handleToggleAction(mod.id, action)}
                      title={`${actionInfo.label}: ${actionInfo.desc} — Estado: ${stateLabel}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border transition-all ${btnClass} disabled:opacity-50`}
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={10} />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></span>
                      )}
                      <span>{actionInfo.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            No se encontraron módulos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}
