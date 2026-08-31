// ================================================================
// MATRIZ MAESTRA OFICIAL – Inthaly OPS
// Refleja exactamente la estructura solicitada por el USER
// ================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
 // 0. SUPER_ADMIN: Control total del sistema
 super_admin: ['*'],

 // 1. ADMINISTRADOR: Máximo control operativo DENTRO del tenant (Empresa)
 admin: [
 'dashboard',
 'workers',
 'inventory',
 'movements',
 'requerimientos',
 'incidencias',
 'camp',
 'transport',
 'caja-chica',
 'bonuses',
 'attendance',
 'soma-capacitaciones',
 'soma-charlas',
 'soma-hsec',
 'ppe',
 'assets',
 'analytics',
 'users',
 'configuracion',
 'profile',
 'reports',
 'tareo',
 'soma',
 'documents',
 'company',
 'operaciones',
 'mecanica',
 'mina',
 'planta'
 ],

 // 2. MINA / OPERACIONES: Foco en gestión de campo y personal operativo
 operaciones: [
 'dashboard', 
 'workers', 
 'tareo', 
 'inventory',
 'movements',
 'requerimientos', 
 'incidencias', 
 'camp', 
 'transport', // Subidas/Bajadas
 'caja-chica', // Filtrado por área en UI/Actions
 'bonuses',
 'attendance',
 'profile',
 'soma-capacitaciones', // Puede ver/registrar charlas/cursos en campo
 'soma-charlas',
 'soma',
 'operaciones',
 'mecanica',
 'planta',
 'reports'
 ],

 // 3. ALMACÉN / LOGÍSTICA: Control de stock y abastecimiento
 almacen: [
 'dashboard', 
 'inventory', // Productos, Stock, Almacenes
 'movements', // Kardex, Entradas/Salidas
 'requerimientos', // Atender requerimientos
 'reports',
 'profile'
 ],

 // 4. SOMA: Seguridad, salud y prevención
 soma: [
 'dashboard', 
 'soma-capacitaciones', 
 'soma-charlas', 
 'soma-hsec', 
 'incidencias', 
 'ppe', // Entrega EPP
 'reports',
 'profile',
 'soma'
 ],

 // 5. TRABAJADOR: Autoservicio y reportes personales
 trabajador: [
 'dashboard', 
 'documents', 
 'bonuses', 
 'transport', 
 'attendance', 
 'requerimientos', // Solo para solicitar
 'incidencias', // Reportar incidencia personal/campo
 'ppe', // Mis EPP
 'profile',
 'soma'
 ],

 // 6. ADMINISTRACIÓN: Finanzas, pagos y auditoría parcial
 administracion: [
 'dashboard',
 'caja-chica', // Caja chica oficina/admin
 'bonuses', 
 'transport', 
 'users', // Lectura/gestión parcial
 'reports', // Financieros
 'workers', // Lectura para bonos/pagos
 'profile'
 ],

 // Roles adicionales heredados o por compatibilidad
 gerente: [
 'dashboard',
 'workers',
 'inventory',
 'movements',
 'requerimientos',
 'incidencias',
 'camp',
 'transport',
 'caja-chica',
 'bonuses',
 'attendance',
 'soma-capacitaciones',
 'soma-charlas',
 'soma-hsec',
 'ppe',
 'assets',
 'analytics',
 'configuracion',
 'profile',
 'reports',
 'tareo',
 'soma',
 'documents',
 'company',
 'operaciones',
 'mecanica',
 'mina'
 ],
 logistica: [
 'dashboard', 
 'inventory', 
 'movements', 
 'requerimientos', 
 'profile'
 ],
 supervisor: [
    'dashboard',
    'produccion',
    'maderas',
    'requerimientos',
    'profile'
  ],
}

export function normalizeAreaName(name: string): string {
 if (!name) return ''
 return name
 .trim()
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
}

export function getPermissionsByRole(role_id: string, area?: string | null): string[] {
 const normalizedRole = (role_id || '').toLowerCase()
 let basePermissions = ROLE_PERMISSIONS[normalizedRole] || []
 
 // Compatibilidad para variaciones de Super Admin
 if (normalizedRole === 'superadmin') basePermissions = ROLE_PERMISSIONS['super_admin'] || ['*']

 // Lógica de área para jefes de área o roles específicos si fuera necesario
 if (normalizedRole === 'jefe_area') {
 const normArea = area ? normalizeAreaName(area) : ''
 let permissions: string[] = []
 
 if (normArea === 'seguridad soma') {
 permissions = ROLE_PERMISSIONS['soma']
 } else if (normArea === 'cocina') {
 permissions = [...ROLE_PERMISSIONS['almacen'], 'caja-chica']
 } else if (['operaciones', 'mina'].includes(normArea)) {
 permissions = ROLE_PERMISSIONS['operaciones']
 } else if (normArea === 'mecanica') {
 permissions = ['dashboard', 'mecanica', 'requerimientos', 'assets', 'caja-chica', 'profile']
 } else if (['almacen y mantenimiento', 'almacen', 'logistica'].includes(normArea)) {
 permissions = ROLE_PERMISSIONS['almacen']
 } else {
 permissions = ['dashboard', 'profile']
 }
 
 // Si tiene un área registrada, permitirle dinámicamente acceder al módulo de Caja Chica
 if (area && !permissions.includes('caja-chica')) {
 permissions = [...permissions, 'caja-chica']
 }
 return permissions
 }

 // Fallback de seguridad: Si no hay permisos, al menos dashboard y perfil
 if (basePermissions.length === 0) {
 return ['dashboard', 'profile']
 }

 return basePermissions
}

export function hasPermission(role_id: string, requiredPermission: string, area?: string | null): boolean {
 if (!role_id) return false
 const permissions = getPermissionsByRole(role_id, area)
 return permissions.includes('*') || permissions.includes(requiredPermission)
}
