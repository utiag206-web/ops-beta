// ================================================================
// RBAC Granular V1 — Core Type Definitions
// Compatible con el sistema de roles actuales (role_id string)
// ================================================================

/**
 * Módulos disponibles del sistema.
 * Deben coincidir con los permisos actuales en ROLE_PERMISSIONS.
 */
export type Module =
  | 'dashboard'
  | 'workers'
  | 'inventory'
  | 'movements'
  | 'requerimientos'
  | 'incidencias'
  | 'camp'
  | 'transport'
  | 'caja-chica'
  | 'bonuses'
  | 'attendance'
  | 'soma-capacitaciones'
  | 'soma-charlas'
  | 'soma-hsec'
  | 'ppe'
  | 'assets'
  | 'analytics'
  | 'users'
  | 'configuracion'
  | 'profile'
  | 'reports'
  | 'tareo'
  | 'soma'
  | 'documents'
  | 'company'
  | 'operaciones'
  | 'mecanica'
  | 'mina'
  | 'planta'
  | 'produccion'
  | 'maderas'
  | string // compatibilidad con módulos dinámicos

/**
 * Acciones granulares definidas por el sistema V1.
 * read    → puede ver/leer registros
 * create  → puede crear nuevos registros
 * update  → puede editar registros existentes
 * delete  → puede eliminar registros
 * approve → puede aprobar/rechazar (ej: requerimientos, gastos)
 * export  → puede exportar datos (Excel/PDF)
 * manage  → control total del módulo (equivale a all)
 */
export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage'

/**
 * Permiso granular: módulo + acción.
 * Ejemplo: { module: 'inventory', action: 'create' }
 */
export interface GranularPermission {
  module: Module
  action: Action
}

/**
 * Registro de override de permiso por usuario.
 * Permite conceder o revocar acciones específicas sin cambiar el rol.
 */
export interface UserPermissionOverride {
  user_id: string
  company_id: string
  module: Module
  action: Action
  granted: boolean  // true = conceder, false = revocar
  granted_by?: string
  created_at?: string
}

/**
 * Resultado de resolución RBAC para un usuario activo.
 * Incluye permisos del rol + overrides individuales.
 */
export interface ResolvedPermissions {
  /** true = super admin / wildcard */
  isWildcard: boolean
  /** Módulos a los que tiene acceso de lectura mínimo */
  modules: Set<Module>
  /** Acciones granulares autorizadas por módulo */
  grants: Map<Module, Set<Action>>
  /** Overrides cargados de la DB para el usuario */
  overrides: UserPermissionOverride[]
}

/**
 * Roles válidos del sistema (compatibilidad con el sistema actual).
 */
export type SystemRoleId =
  | 'super_admin'
  | 'superadmin'
  | 'admin'
  | 'gerente'
  | 'jefe_area'
  | 'almacen'
  | 'operaciones'
  | 'soma'
  | 'supervisor'
  | 'administracion'
  | 'trabajador'
  | 'cocina'
  | 'mecanica'
  | 'logistica'
  | string
