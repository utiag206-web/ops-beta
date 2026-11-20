export interface CompanyAuthSettings {
  login_mode: 'COD_ONLY' | 'DNI_ONLY' | 'DNI_OR_COD' | 'EMAIL'
  secret_mode: 'DNI_DEFAULT' | 'BIRTHDATE' | 'CUSTOM_PIN' | 'PASSWORD'
  require_pin_change_on_first_login: boolean
  allow_keep_initial_password: boolean
  allow_password_recovery: boolean
  recovery_channel: 'NONE' | 'EMAIL' | 'SMS'
}

export const DEFAULT_AUTH_SETTINGS: CompanyAuthSettings = {
  login_mode: 'DNI_OR_COD',
  secret_mode: 'DNI_DEFAULT',
  require_pin_change_on_first_login: false,
  allow_keep_initial_password: true,
  allow_password_recovery: false,
  recovery_channel: 'NONE'
}

export function getCompanyAuthSettings(company: any): CompanyAuthSettings {
  if (!company) return DEFAULT_AUTH_SETTINGS
  
  if (company.auth_settings && typeof company.auth_settings === 'object' && Object.keys(company.auth_settings).length > 0) {
    return { ...DEFAULT_AUTH_SETTINGS, ...company.auth_settings }
  }

  if (company.working_hours && typeof company.working_hours === 'string' && company.working_hours.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(company.working_hours)
      if (parsed.auth_settings) {
        return { ...DEFAULT_AUTH_SETTINGS, ...parsed.auth_settings }
      }
    } catch (e) {
      // Fallback to default
    }
  }

  return DEFAULT_AUTH_SETTINGS
}

export function extractPlainWorkingHours(workingHoursRaw?: string | null): string {
  if (!workingHoursRaw || typeof workingHoursRaw !== 'string') return ''
  if (workingHoursRaw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(workingHoursRaw)
      return parsed.raw_hours || ''
    } catch (e) {
      return workingHoursRaw
    }
  }
  return workingHoursRaw
}

export function packWorkingHoursWithAuthSettings(plainHours: string, authSettings: CompanyAuthSettings): string {
  return JSON.stringify({
    raw_hours: plainHours || '',
    auth_settings: authSettings
  })
}
