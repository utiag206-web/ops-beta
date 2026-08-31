export interface SystemSettings {
  // Configuración del Sistema
  maintenanceMode: boolean
  showMaintenanceMessage: boolean
  maintenanceMessage: string
  globalTimezone: string
  defaultLanguage: string

  // Rendimiento
  autoOptimization: boolean
  autoCacheClear: boolean
  resourceCompression: boolean
  autoStatsUpdate: boolean
}

export const defaultSystemSettings: SystemSettings = {
  maintenanceMode: false,
  showMaintenanceMessage: false,
  maintenanceMessage: 'Estamos realizando tareas de mantenimiento. El sistema estará disponible en breve.',
  globalTimezone: 'America/Lima',
  defaultLanguage: 'Español',

  autoOptimization: true,
  autoCacheClear: true,
  resourceCompression: true,
  autoStatsUpdate: true,
}
