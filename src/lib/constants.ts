export const SYSTEM_AREAS = [
  'Gerencia General',
  'Administración',
  'Operaciones',
  'Almacén y Mantenimiento',
  'Seguridad SOMA',
  'Cocina'
] as const

export type SystemArea = typeof SYSTEM_AREAS[number]

export const ROLE_NAMES: Record<string, string> = {
  admin: "Gerencia General",
  gerente: "Gerencia General",
  jefe_area: "Jefe de Área",
  almacen: "Logística",
  operaciones: "Operaciones",
  trabajador: "Trabajador",
  soma: "Seguridad SOMA",
  administracion: "Administración"
}
