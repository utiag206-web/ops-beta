export interface NotificationSettings {
  // Canales Disponibles
  channelEmail: boolean
  channelInApp: boolean
  channelPush: boolean
  channelSms: boolean
  channelWhatsapp: boolean

  // Eventos del Sistema
  eventNewUser: boolean
  eventNewCompany: boolean
  eventPasswordChange: boolean
  eventPasswordReset: boolean
  eventCompanySuspend: boolean
  eventCompanyReactivate: boolean
  eventCriticalError: boolean
  eventSystemUpdate: boolean
  eventGlobalSettingsChange: boolean
  eventSuperAdminAction: boolean

  // Recordatorios Automáticos
  reminderTasks: boolean
  reminderTasksFreq: string
  reminderDocuments: boolean
  reminderDocumentsFreq: string
  reminderAttendance: boolean
  reminderAttendanceFreq: string
  reminderVacations: boolean
  reminderVacationsFreq: string
  reminderLicenses: boolean
  reminderLicensesFreq: string

  // Preferencias Generales
  prefLanguage: string
  prefTimezone: string
  prefTimeRange: string
  prefGroupSimilar: boolean
  prefDailySummary: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  channelEmail: true,
  channelInApp: true,
  channelPush: false,
  channelSms: false,
  channelWhatsapp: false,

  eventNewUser: true,
  eventNewCompany: true,
  eventPasswordChange: true,
  eventPasswordReset: true,
  eventCompanySuspend: true,
  eventCompanyReactivate: true,
  eventCriticalError: true,
  eventSystemUpdate: true,
  eventGlobalSettingsChange: true,
  eventSuperAdminAction: true,

  reminderTasks: true,
  reminderTasksFreq: 'Diario',
  reminderDocuments: true,
  reminderDocumentsFreq: 'Semanal',
  reminderAttendance: true,
  reminderAttendanceFreq: 'Diario',
  reminderVacations: true,
  reminderVacationsFreq: 'Mensual',
  reminderLicenses: true,
  reminderLicensesFreq: 'Mensual',

  prefLanguage: 'Español',
  prefTimezone: 'America/Lima',
  prefTimeRange: '08:00 - 18:00',
  prefGroupSimilar: true,
  prefDailySummary: true,
}
