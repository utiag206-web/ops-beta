export const SYSTEM_AREAS = [
 'Gerencia General',
 'Administración',
 'Mina',
 'Mecánica',
 'Seguridad SOMA',
 'Cocina'
] as const

export type SystemArea = typeof SYSTEM_AREAS[number]

export const ROLE_NAMES: Record<string, string> = {
  super_admin: "Super Administrador",
  superadmin: "Super Administrador",
  admin: "Gerente General",
  gerente: "Gerencia General",
  jefe_area: "Jefe de Área",
  almacen: "Logística",
  operaciones: "Mina",
  supervisor: "Líder de Cuadrilla",
  mecanica: "Mecánica",
  trabajador: "Trabajador",
  soma: "Seguridad SOMA",
  administracion: "Administración",
  cocina: "Cocina"
}

export function formatOfficialPosition(positionOrRole: string | null | undefined): string {
  if (!positionOrRole) return 'Colaborador'
  const key = positionOrRole.toLowerCase().trim()
  if (ROLE_NAMES[key]) return ROLE_NAMES[key]
  if (key === 'supervisor') return 'Líder de Cuadrilla'
  if (key === 'admin' || key === 'administrador') return 'Gerente General'
  if (key === 'operaciones') return 'Mina'
  if (key === 'almacen') return 'Logística'
  if (key === 'trabajador' || key === 'worker') return 'Operario'
  return positionOrRole.charAt(0).toUpperCase() + positionOrRole.slice(1)
}
