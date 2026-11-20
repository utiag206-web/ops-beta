export interface AuditSettings {
  // Configuración de Auditoría
  logAdministrativeActions: boolean
  logConfigurationChanges: boolean
  logRoleChanges: boolean
  logCriticalEvents: boolean
  logSuperAdminAccess: boolean

  // Retención de Registros
  retentionPeriodDays: number
  autoDeleteEnabled: boolean
  exportAllowed: boolean

  // Eventos Auditados - Administración
  eventAdminLogin: boolean
  eventAdminLogout: boolean
  eventConfigChange: boolean

  // Eventos Auditados - Empresas
  eventCompanyCreate: boolean
  eventCompanySuspend: boolean
  eventCompanyReactivate: boolean

  // Eventos Auditados - Usuarios
  eventUserCreate: boolean
  eventUserSuspend: boolean
  eventUserRoleChange: boolean

  // Eventos Auditados - Seguridad
  eventPasswordChange: boolean
  eventPasswordRecovery: boolean
  eventFailedLoginAttempts: boolean
}

export const defaultAuditSettings: AuditSettings = {
  logAdministrativeActions: true,
  logConfigurationChanges: true,
  logRoleChanges: true,
  logCriticalEvents: true,
  logSuperAdminAccess: true,

  retentionPeriodDays: 90,
  autoDeleteEnabled: true,
  exportAllowed: true,

  eventAdminLogin: true,
  eventAdminLogout: true,
  eventConfigChange: true,

  eventCompanyCreate: true,
  eventCompanySuspend: true,
  eventCompanyReactivate: true,

  eventUserCreate: true,
  eventUserSuspend: true,
  eventUserRoleChange: true,

  eventPasswordChange: true,
  eventPasswordRecovery: true,
  eventFailedLoginAttempts: true,
}

// Simulador de datos de auditoría
export const mockAuditLogs = [
  { id: 1, date: '2026-08-18 10:30:15', user: 'Super Admin', module: 'Configuración Global', action: 'Cambio de configuración', status: 'Exitoso' },
  { id: 2, date: '2026-08-18 09:15:00', user: 'Super Admin', module: 'Empresas', action: 'Empresa creada (Constructora ABC)', status: 'Exitoso' },
  { id: 3, date: '2026-08-17 16:45:22', user: 'Admin Sistema', module: 'Usuarios', action: 'Usuario suspendido', status: 'Exitoso' },
  { id: 4, date: '2026-08-17 11:20:05', user: 'Super Admin', module: 'Seguridad', action: 'Intento de inicio de sesión fallido', status: 'Fallido' },
  { id: 5, date: '2026-08-16 14:10:33', user: 'Usuario Prueba', module: 'Seguridad', action: 'Cambio de contraseña', status: 'Exitoso' },
  { id: 6, date: '2026-08-15 08:05:12', user: 'Super Admin', module: 'Roles', action: 'Cambio de rol de usuario a Admin', status: 'Exitoso' },
]
