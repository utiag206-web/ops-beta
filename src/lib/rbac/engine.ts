// ================================================================
// RBAC Granular V1 — Permissions Engine
// 
// Resuelve permisos combinando:
//   1. Matriz maestra del rol (PERMISSIONS_MATRIX)
//   2. Lógica de área para jefe_area
//   3. Overrides individuales por usuario (user_permissions DB)
// 
// API principal:
//   resolvePermissions(roleId, area?, overrides?) → ResolvedPermissions
//   can(resolved, module, action) → boolean
//   canModule(resolved, module) → boolean (equiv. hasPermission actual)
// ================================================================

import { Module, Action, ResolvedPermissions, UserPermissionOverride } from './types'
import { getActionsForRole, getModulesForRole, PERMISSIONS_MATRIX } from './permissions-matrix'
import { normalizeAreaName } from '@/lib/permissions'

const ALL_ACTIONS: Action[] = ['read', 'create', 'update', 'delete', 'approve', 'export', 'manage']

// ----------------------------------------------------------------
// Resolución base por rol + área
// ----------------------------------------------------------------

/**
 * Calcula el roleId efectivo para jefe_area según el área asignada.
 * Mantiene la lógica exacta de getPermissionsByRole en permissions.ts.
 */
function resolveJefeAreaRole(area: string | null | undefined): string {
  const norm = area ? normalizeAreaName(area) : ''
  if (norm === 'seguridad soma') return 'soma'
  if (norm === 'cocina') return 'cocina'
  if (['operaciones', 'mina'].includes(norm)) return 'operaciones'
  if (norm === 'mecanica') return 'mecanica'
  if (['almacen y mantenimiento', 'almacen', 'logistica'].includes(norm)) return 'almacen'
  // Área desconocida → acceso mínimo más caja-chica (misma lógica actual)
  return '_jefe_area_default'
}

/**
 * Construye el mapa de grants (módulo → Set<Action>) para un rol dado.
 */
function buildGrantsFromRole(roleId: string, area?: string | null): Map<Module, Set<Action>> {
  const grants = new Map<Module, Set<Action>>()
  const normalized = (roleId || '').toLowerCase()

  let effectiveRole = normalized

  // Resolución especial para jefe_area
  if (normalized === 'jefe_area') {
    effectiveRole = resolveJefeAreaRole(area)
    
    if (effectiveRole === '_jefe_area_default') {
      // dashboard + profile + caja-chica (si tiene área)
      const minModules: Module[] = ['dashboard', 'profile']
      if (area) minModules.push('caja-chica')
      for (const mod of minModules) {
        grants.set(mod, new Set<Action>(['read']))
      }
      // caja-chica también con create
      if (area) {
        grants.get('caja-chica')!.add('create')
      }
      return grants
    }
  }

  const matrix = PERMISSIONS_MATRIX[effectiveRole]
  if (!matrix) {
    // Rol desconocido → mínimo dashboard + profile
    grants.set('dashboard', new Set(['read']))
    grants.set('profile', new Set(['read', 'update']))
    return grants
  }

  if (matrix.wildcard) {
    // Wildcard: todos los módulos del admin + todos los actions
    const allModules = Object.keys(PERMISSIONS_MATRIX['admin']?.modules ?? {}) as Module[]
    for (const mod of allModules) {
      grants.set(mod, new Set(ALL_ACTIONS))
    }
    return grants
  }

  for (const [mod, actions] of Object.entries(matrix.modules ?? {})) {
    if (actions && actions.length > 0) {
      grants.set(mod as Module, new Set(actions as Action[]))
    }
  }

  // jefe_area heredado: añadir caja-chica si tiene área y no la tiene ya
  if (normalized === 'jefe_area' && area && !grants.has('caja-chica')) {
    grants.set('caja-chica', new Set(['read', 'create']))
  }

  return grants
}

// ----------------------------------------------------------------
// Aplicación de overrides individuales
// ----------------------------------------------------------------

function applyOverrides(
  grants: Map<Module, Set<Action>>,
  overrides: UserPermissionOverride[]
): Map<Module, Set<Action>> {
  if (!overrides || overrides.length === 0) return grants

  const result = new Map(grants)

  for (const override of overrides) {
    const { module, action, granted } = override
    if (!result.has(module)) {
      result.set(module, new Set())
    }
    if (granted) {
      result.get(module)!.add(action)
    } else {
      result.get(module)!.delete(action)
      // Si el módulo queda vacío de acciones, eliminar
      if (result.get(module)!.size === 0) {
        result.delete(module)
      }
    }
  }

  return result
}

// ----------------------------------------------------------------
// Función principal de resolución
// ----------------------------------------------------------------

/**
 * Resuelve el conjunto completo de permisos para un usuario activo.
 * 
 * @param roleId    - role_id del usuario (ej: 'admin', 'jefe_area')
 * @param area      - área asignada (relevante para jefe_area)
 * @param overrides - overrides individuales cargados de user_permissions
 * @returns ResolvedPermissions listo para consultar con `can()`
 */
export function resolvePermissions(
  roleId: string,
  area?: string | null,
  overrides: UserPermissionOverride[] = []
): ResolvedPermissions {
  const normalized = (roleId || '').toLowerCase()
  const isWildcard = normalized === 'super_admin' || normalized === 'superadmin' || !!PERMISSIONS_MATRIX[normalized]?.wildcard

  const baseGrants = buildGrantsFromRole(normalized, area)
  const finalGrants = applyOverrides(baseGrants, overrides)

  return {
    isWildcard,
    modules: new Set(finalGrants.keys()),
    grants: finalGrants,
    overrides,
  }
}

// ----------------------------------------------------------------
// Helpers de consulta
// ----------------------------------------------------------------

/**
 * Verifica si el usuario puede realizar una acción específica en un módulo.
 * Equivalente granular de hasPermission() pero a nivel de acción.
 * 
 * @example
 *   can(resolved, 'inventory', 'delete') // → false para almacen básico
 *   can(resolved, 'requerimientos', 'approve') // → true para jefe_area mina
 */
export function can(
  resolved: ResolvedPermissions,
  module: Module,
  action: Action
): boolean {
  if (resolved.isWildcard) return true
  const moduleGrants = resolved.grants.get(module)
  if (!moduleGrants) return false
  return moduleGrants.has('manage') || moduleGrants.has(action)
}

/**
 * Verifica si el usuario tiene acceso de lectura mínimo a un módulo.
 * Compatible 1:1 con hasPermission() del sistema actual.
 */
export function canModule(resolved: ResolvedPermissions, module: Module): boolean {
  if (!module || module === 'dashboard' || module === 'profile') return true
  if (resolved.isWildcard) return true
  return resolved.modules.has(module)
}

/**
 * Devuelve todas las acciones permitidas para un módulo específico.
 */
export function getActionsForModule(
  resolved: ResolvedPermissions,
  module: Module
): Action[] {
  if (resolved.isWildcard) return ALL_ACTIONS
  const moduleGrants = resolved.grants.get(module)
  if (!moduleGrants) return []
  if (moduleGrants.has('manage')) return ALL_ACTIONS
  return Array.from(moduleGrants)
}

/**
 * Serializa los permisos a array de strings para compatibilidad
 * con el sistema actual de permissions: string[].
 * 
 * Produce strings como 'inventory:read', 'inventory:create', etc.
 * Y también el módulo plano 'inventory' para hasPermission() legacy.
 */
export function serializeToLegacyArray(resolved: ResolvedPermissions): string[] {
  if (resolved.isWildcard) return ['*']
  
  const perms: string[] = []
  for (const [mod, actions] of resolved.grants.entries()) {
    // Permiso plano para compatibilidad con hasPermission(role, module)
    perms.push(mod)
    // Permisos granulares nuevos
    for (const action of actions) {
      perms.push(`${mod}:${action}`)
    }
  }
  return perms
}

/**
 * Reconstruye ResolvedPermissions a partir del array serializado en sesión.
 * Permite recuperar el estado granular sin re-resolver desde la BD.
 */
export function deserializeFromArray(permArray: string[]): ResolvedPermissions {
  if (permArray.includes('*')) {
    return {
      isWildcard: true,
      modules: new Set(),
      grants: new Map(),
      overrides: [],
    }
  }

  const grants = new Map<Module, Set<Action>>()
  const modules = new Set<Module>()

  for (const perm of permArray) {
    if (perm.includes(':')) {
      const [mod, action] = perm.split(':') as [Module, Action]
      if (!grants.has(mod)) grants.set(mod, new Set())
      grants.get(mod)!.add(action)
      modules.add(mod)
    } else {
      // Permiso plano legacy: asumimos 'read' como mínimo
      modules.add(perm as Module)
      if (!grants.has(perm as Module)) {
        grants.set(perm as Module, new Set(['read']))
      }
    }
  }

  return {
    isWildcard: false,
    modules,
    grants,
    overrides: [],
  }
}
