// ================================================================
// RBAC Granular V1 — Server-Side Action Guard
// Para usar en Server Actions y Route Handlers.
//
// Uso:
//   const user = await requireAction('inventory', 'delete')
//   const user = await requireAction('requerimientos', 'approve')
// ================================================================

import { getUserSession } from '@/lib/auth'
import { can, deserializeFromArray } from '@/lib/rbac/engine'
import type { Module, Action } from '@/lib/rbac/types'

/**
 * Guard de acción granular para Server Actions.
 * Verifica que el usuario autenticado tenga permiso para ejecutar
 * una acción específica en un módulo.
 *
 * @throws Error con mensaje legible si el acceso es denegado.
 * @returns extendedUser si el acceso es permitido.
 *
 * @example
 *   export async function deleteProduct(id: string) {
 *     const user = await requireAction('inventory', 'delete')
 *     // ... lógica segura
 *   }
 */
export async function requireAction(module: Module, action: Action) {
  const { extendedUser } = await getUserSession()

  if (!extendedUser) {
    throw new Error(`Acceso Denegado: sesión no encontrada.`)
  }

  // Normalización de alias para compatibilidad total
  const targetModule = (module === 'planta_mineral' ? 'planta' : module) as Module
  const resolved = (extendedUser as any)?.resolved_permissions || (extendedUser.permissions?.length ? deserializeFromArray(extendedUser.permissions) : null)

  if (!resolved) {
    // Fallback: si por alguna razón no hay resolved_permissions,
    // verificamos con el sistema legacy (solo read-level)
    const { hasPermission } = await import('@/lib/permissions')
    if (!hasPermission(extendedUser.role_id, targetModule, extendedUser.area)) {
      throw new Error(`Acceso Denegado a '${targetModule}' (legacy fallback)`)
    }
    return extendedUser
  }

  if (!can(resolved, targetModule, action)) {
    console.warn(
      `[RBAC_V1_DENY] User ${extendedUser.id} (${extendedUser.role_id}) ` +
      `denied action '${action}' on module '${targetModule}'`
    )
    throw new Error(`Acceso Denegado: no tienes permiso para '${action}' en '${targetModule}'`)
  }

  return extendedUser
}

/**
 * Versión no-throw de requireAction.
 * Retorna true/false sin lanzar excepción.
 * Útil para UI condicional en Server Components.
 */
export async function checkAction(module: Module, action: Action): Promise<boolean> {
  try {
    await requireAction(module, action)
    return true
  } catch {
    return false
  }
}
