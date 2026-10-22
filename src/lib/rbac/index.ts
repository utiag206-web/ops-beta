// ================================================================
// RBAC Granular V1 — Public Index
// Re-exporta todos los tipos, engine y guards del módulo RBAC.
// ================================================================

// Tipos
export type { Module, Action, GranularPermission, UserPermissionOverride, ResolvedPermissions, SystemRoleId } from './types'

// Matriz de permisos
export { PERMISSIONS_MATRIX, getActionsForRole, getModulesForRole } from './permissions-matrix'

// Motor de resolución
export {
  resolvePermissions,
  can,
  canModule,
  getActionsForModule,
  serializeToLegacyArray,
  deserializeFromArray,
} from './engine'

// Guards de servidor (solo en Server Components / Server Actions)
// Importar directamente para evitar que lleguen al cliente:
//   import { requireAction } from '@/lib/rbac/server-guards'
