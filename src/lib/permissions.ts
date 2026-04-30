// ================================================================
// MATRIZ MAESTRA OFICIAL – Inthaly OPS
// Refleja exactamente la estructura solicitada por el USER
// ================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // 1. ADMINISTRADOR: Acceso total e historial
  admin: ['*'],

  // 2. OPERACIONES: Foco en gestión de campo y personal operativo
  operaciones: [
    'dashboard', 
    'workers', 
    'tareo', 
    'requerimientos', 
    'incidencias', 
    'camp', 
    'transport',    // Subidas/Bajadas
    'caja-chica',    // Filtrado por área en UI/Actions
    'bonuses',
    'attendance',
    'profile',
    'soma-capacitaciones', // Puede ver/registrar charlas/cursos en campo
    'soma-charlas'
  ],

  // 3. ALMACÉN / LOGÍSTICA: Control de stock y abastecimiento
  almacen: [
    'dashboard', 
    'inventory',    // Productos, Stock, Almacenes
    'movements',    // Kardex, Entradas/Salidas
    'requerimientos', // Atender requerimientos
    'profile'
  ],

  // 4. SOMA: Seguridad, salud y prevención
  soma: [
    'dashboard', 
    'soma-capacitaciones', 
    'soma-charlas', 
    'soma-hsec', 
    'incidencias', 
    'ppe',          // Entrega EPP
    'reports',
    'profile'
  ],

  // 5. TRABAJADOR: Autoservicio y reportes personales
  trabajador: [
    'dashboard', 
    'documents', 
    'bonuses', 
    'transport', 
    'attendance', 
    'requerimientos', // Solo para solicitar
    'incidencias',    // Reportar incidencia personal/campo
    'ppe',           // Mis EPP
    'profile'
  ],

  // 6. ADMINISTRACIÓN: Finanzas, pagos y auditoría parcial
  administracion: [
    'dashboard',
    'caja-chica',    // Caja chica oficina/admin
    'bonuses', 
    'transport', 
    'users',        // Lectura/gestión parcial
    'reports',       // Financieros
    'workers',       // Lectura para bonos/pagos
    'profile'
  ],

  // Roles adicionales heredados o por compatibilidad
  gerente: ['*'], // Gerente suele actuar como Admin
  logistica: [
    'dashboard', 
    'inventory', 
    'movements', 
    'requerimientos',
    'profile'
  ],
}

export function getPermissionsByRole(role_id: string, area?: string | null): string[] {
  const normalizedRole = (role_id || '').toLowerCase()
  const basePermissions = ROLE_PERMISSIONS[normalizedRole] || []

  // Lógica de área para jefes de área o roles específicos si fuera necesario
  if (normalizedRole === 'jefe_area') {
    if (area === 'Seguridad SOMA') return ROLE_PERMISSIONS['soma']
    if (area === 'Cocina') return ROLE_PERMISSIONS['almacen']
    if (area === 'Operaciones') return ROLE_PERMISSIONS['operaciones']
    return ['dashboard', 'profile']
  }

  return basePermissions
}

export function hasPermission(role_id: string, requiredPermission: string, area?: string | null): boolean {
  if (!role_id) return false
  const permissions = getPermissionsByRole(role_id, area)
  return permissions.includes('*') || permissions.includes(requiredPermission)
}
