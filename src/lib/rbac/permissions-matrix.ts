// ================================================================
// RBAC Granular V1 — Permissions Matrix
// Define qué acciones puede realizar cada rol en cada módulo.
// 
// Estructura: PERMISSIONS_MATRIX[role][module] = Action[]
// Wildcard '*' significa acceso total (manage en todo).
// ================================================================

import { Action, Module } from './types'

type RoleMatrix = {
  wildcard?: true
  modules?: Partial<Record<Module, Action[]>>
}

/**
 * Matriz maestra de permisos granulares por rol.
 * 
 * Notas de diseño:
 * - 'manage' implica todas las acciones sobre ese módulo.
 * - Los módulos no listados → sin acceso para ese rol.
 * - jefe_area se resuelve dinámicamente por área en el engine.
 */
export const PERMISSIONS_MATRIX: Record<string, RoleMatrix> = {

  // ---------------------------------------------------------------
  // SUPER_ADMIN: Control total del sistema — wildcard
  // ---------------------------------------------------------------
  super_admin: { wildcard: true },
  superadmin:  { wildcard: true }, // alias compatibilidad

  // ---------------------------------------------------------------
  // ADMIN: Control operativo total dentro del tenant
  // ---------------------------------------------------------------
  admin: {
    modules: {
      dashboard:          ['read'],
      workers:            ['read', 'create', 'update', 'delete', 'export'],
      inventory:          ['read', 'create', 'update', 'delete', 'export'],
      movements:          ['read', 'create', 'update', 'delete', 'export'],
      requerimientos:     ['read', 'create', 'update', 'delete', 'approve', 'export'],
      incidencias:        ['read', 'create', 'update', 'delete', 'export'],
      camp:               ['read', 'create', 'update', 'delete'],
      transport:          ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'caja-chica':       ['read', 'create', 'update', 'delete', 'approve', 'export'],
      bonuses:            ['read', 'create', 'update', 'delete', 'approve', 'export'],
      attendance:         ['read', 'create', 'update', 'delete', 'export'],
      'soma-capacitaciones': ['read', 'create', 'update', 'delete'],
      'soma-charlas':     ['read', 'create', 'update', 'delete'],
      'soma-hsec':        ['read', 'create', 'update', 'delete'],
      ppe:                ['read', 'create', 'update', 'delete', 'export'],
      assets:             ['read', 'create', 'update', 'delete', 'export'],
      analytics:          ['read', 'export'],
      users:              ['read', 'create', 'update', 'delete', 'manage'],
      configuracion:      ['read', 'update', 'manage'],
      profile:            ['read', 'update'],
      reports:            ['read', 'export'],
      tareo:              ['read', 'create', 'update', 'delete', 'approve', 'export'],
      soma:               ['read', 'create', 'update', 'delete'],
      documents:          ['read', 'create', 'update', 'delete', 'export'],
      company:            ['read', 'update', 'manage'],
      operaciones:        ['read', 'create', 'update', 'delete', 'approve', 'export'],
      mecanica:           ['read', 'create', 'update', 'delete', 'approve', 'export'],
      mina:               ['read', 'create', 'update', 'delete', 'export'],
      planta:             ['read', 'create', 'update', 'delete', 'export'],
    }
  },

  // ---------------------------------------------------------------
  // GERENTE: Visibilidad total + aprobaciones, sin gestión de sistema
  // ---------------------------------------------------------------
  gerente: {
    modules: {
      dashboard:          ['read'],
      workers:            ['read', 'export'],
      inventory:          ['read', 'export'],
      movements:          ['read', 'export'],
      requerimientos:     ['read', 'approve', 'export'],
      incidencias:        ['read', 'export'],
      camp:               ['read'],
      transport:          ['read', 'approve', 'export'],
      'caja-chica':       ['read', 'approve', 'export'],
      bonuses:            ['read', 'approve', 'export'],
      attendance:         ['read', 'export'],
      'soma-capacitaciones': ['read'],
      'soma-charlas':     ['read'],
      'soma-hsec':        ['read'],
      ppe:                ['read', 'export'],
      assets:             ['read', 'export'],
      analytics:          ['read', 'export'],
      profile:            ['read', 'update'],
      reports:            ['read', 'export'],
      tareo:              ['read', 'approve', 'export'],
      soma:               ['read'],
      documents:          ['read', 'export'],
      company:            ['read'],
      operaciones:        ['read', 'export'],
      mecanica:           ['read', 'export'],
      mina:               ['read', 'export'],
    }
  },

  // ---------------------------------------------------------------
  // OPERACIONES / MINA: Foco en campo y personal operativo
  // ---------------------------------------------------------------
  operaciones: {
    modules: {
      dashboard:          ['read'],
      workers:            ['read'],
      tareo:              ['read', 'create', 'update', 'export'],
      inventory:          ['read', 'create'],
      movements:          ['read', 'create'],
      requerimientos:     ['read', 'create', 'update', 'approve'],
      incidencias:        ['read', 'create', 'update'],
      camp:               ['read'],
      transport:          ['read', 'create'],
      'caja-chica':       ['read', 'create'],
      bonuses:            ['read'],
      attendance:         ['read', 'create', 'update'],
      'soma-capacitaciones': ['read', 'create'],
      'soma-charlas':     ['read', 'create'],
      soma:               ['read'],
      operaciones:        ['read', 'create', 'update', 'export'],
      mecanica:           ['read'],
      planta:             ['read'],
      reports:            ['read', 'export'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // ALMACÉN / LOGÍSTICA: Control de stock y abastecimiento
  // ---------------------------------------------------------------
  almacen: {
    modules: {
      dashboard:          ['read'],
      inventory:          ['read', 'create', 'update', 'delete', 'export'],
      movements:          ['read', 'create', 'update', 'export'],
      requerimientos:     ['read', 'update', 'approve', 'export'],
      reports:            ['read', 'export'],
      profile:            ['read', 'update'],
    }
  },

  logistica: {
    modules: {
      dashboard:          ['read'],
      inventory:          ['read', 'create', 'update', 'export'],
      movements:          ['read', 'create', 'update'],
      requerimientos:     ['read', 'create'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // SOMA: Seguridad, salud y prevención
  // ---------------------------------------------------------------
  soma: {
    modules: {
      dashboard:          ['read'],
      'soma-capacitaciones': ['read', 'create', 'update', 'delete', 'export'],
      'soma-charlas':     ['read', 'create', 'update', 'delete', 'export'],
      'soma-hsec':        ['read', 'create', 'update', 'delete', 'export'],
      incidencias:        ['read', 'create', 'update', 'delete', 'export'],
      ppe:                ['read', 'create', 'update', 'export'],
      reports:            ['read', 'export'],
      profile:            ['read', 'update'],
      soma:               ['read', 'create', 'update', 'delete', 'export'],
    }
  },

  // ---------------------------------------------------------------
  // SUPERVISOR / LÍDER DE CUADRILLA
  // ---------------------------------------------------------------
  supervisor: {
    modules: {
      dashboard:          ['read'],
      produccion:         ['read', 'create', 'update'],
      maderas:            ['read', 'create', 'update'],
      requerimientos:     ['read', 'create'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // ADMINISTRACIÓN: Finanzas, pagos y auditoría parcial
  // ---------------------------------------------------------------
  administracion: {
    modules: {
      dashboard:          ['read'],
      'caja-chica':       ['read', 'create', 'update', 'approve', 'export'],
      bonuses:            ['read', 'create', 'update', 'approve', 'export'],
      transport:          ['read', 'export'],
      users:              ['read'],
      reports:            ['read', 'export'],
      workers:            ['read', 'export'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // COCINA: Gestión de cocina y servicios
  // ---------------------------------------------------------------
  cocina: {
    modules: {
      dashboard:          ['read'],
      inventory:          ['read', 'create', 'update'],
      movements:          ['read', 'create'],
      requerimientos:     ['read', 'create'],
      'caja-chica':       ['read', 'create'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // MECÁNICA: Módulo de mantenimiento
  // ---------------------------------------------------------------
  mecanica: {
    modules: {
      dashboard:          ['read'],
      mecanica:           ['read', 'create', 'update', 'delete', 'export'],
      requerimientos:     ['read', 'create'],
      assets:             ['read', 'create', 'update'],
      'caja-chica':       ['read', 'create'],
      profile:            ['read', 'update'],
    }
  },

  // ---------------------------------------------------------------
  // TRABAJADOR: Autoservicio y vista personal
  // ---------------------------------------------------------------
  trabajador: {
    modules: {
      dashboard:          ['read'],
      documents:          ['read'],
      bonuses:            ['read'],
      transport:          ['read'],
      attendance:         ['read'],
      requerimientos:     ['read', 'create'],
      incidencias:        ['read', 'create'],
      ppe:                ['read'],
      profile:            ['read', 'update'],
      soma:               ['read'],
    }
  },
}

/**
 * Devuelve la matriz de acciones para un módulo dado un rol.
 * Si el rol tiene wildcard, devuelve todas las acciones.
 * Si no está en la matriz, devuelve array vacío.
 */
export function getActionsForRole(
  roleId: string,
  module: Module
): Action[] {
  const normalized = (roleId || '').toLowerCase()
  const matrix = PERMISSIONS_MATRIX[normalized]
  if (!matrix) return []
  if (matrix.wildcard) return ['read', 'create', 'update', 'delete', 'approve', 'export', 'manage']
  return matrix.modules?.[module as keyof typeof matrix.modules] ?? []
}

/**
 * Devuelve todos los módulos accesibles por un rol.
 */
export function getModulesForRole(roleId: string): Module[] {
  const normalized = (roleId || '').toLowerCase()
  const matrix = PERMISSIONS_MATRIX[normalized]
  if (!matrix) return ['dashboard', 'profile']
  if (matrix.wildcard) return Object.keys(PERMISSIONS_MATRIX['admin']?.modules ?? {}) as Module[]
  return Object.keys(matrix.modules ?? {}) as Module[]
}
