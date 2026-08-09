export interface WorkerCodeSettings {
  auto_generate_code: boolean
  code_prefix: string
  code_length: number
  initial_number: number
  pad_with_zeros: boolean
  auto_increment: boolean
}

export interface AttendanceSettings {
  daily_hours: number
  working_days: string[]
  late_tolerance_minutes: number
  late_tolerance_exit_minutes: number
  tardiness_grace_period_minutes: number
  break_time_minutes: number
  default_working_hours: string
  entry_time: string
  exit_time: string
  allow_overtime: boolean
  overtime_start_after_minutes: number
  min_overtime_minutes: number
  rounding_mode: 'NONE' | 'NEAREST_15' | 'NEAREST_30'
  enable_gps_tracking: boolean
}

export type CompanyAttendanceSettings = AttendanceSettings

export interface HrModulesSettings {
  enable_vacations: boolean
  enable_permissions: boolean
  enable_medical_leave: boolean
  enable_contracts: boolean
  enable_renewals: boolean
  enable_document_control: boolean
}

export interface CompanyHrSettings {
  code_settings: WorkerCodeSettings
  attendance_settings: AttendanceSettings
  modules_settings: HrModulesSettings
}

export const DEFAULT_HR_SETTINGS: CompanyHrSettings = {
  code_settings: {
    auto_generate_code: true,
    code_prefix: 'EMP',
    code_length: 6,
    initial_number: 1,
    pad_with_zeros: true,
    auto_increment: true
  },
  attendance_settings: {
    daily_hours: 8,
    working_days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    late_tolerance_minutes: 15,
    late_tolerance_exit_minutes: 15,
    tardiness_grace_period_minutes: 5,
    break_time_minutes: 60,
    default_working_hours: '08:30 - 18:00',
    entry_time: '08:30',
    exit_time: '18:00',
    allow_overtime: true,
    overtime_start_after_minutes: 0,
    min_overtime_minutes: 30,
    rounding_mode: 'NONE',
    enable_gps_tracking: true
  },
  modules_settings: {
    enable_vacations: true,
    enable_permissions: true,
    enable_medical_leave: true,
    enable_contracts: true,
    enable_renewals: true,
    enable_document_control: true
  }
}

export function formatWorkerCode(codeSettings: WorkerCodeSettings, sequenceNum?: number): string {
  const prefix = (codeSettings.code_prefix || 'EMP').trim().toUpperCase()
  const num = sequenceNum !== undefined ? sequenceNum : (codeSettings.initial_number || 1)
  
  if (codeSettings.pad_with_zeros) {
    const padded = String(num).padStart(codeSettings.code_length || 6, '0')
    return prefix ? `${prefix}-${padded}` : padded
  }

  return prefix ? `${prefix}-${num}` : String(num)
}

export function getCompanyHrSettings(company: any): CompanyHrSettings {
  if (!company) return DEFAULT_HR_SETTINGS

  if (company.hr_settings && typeof company.hr_settings === 'object' && Object.keys(company.hr_settings).length > 0) {
    return {
      code_settings: { ...DEFAULT_HR_SETTINGS.code_settings, ...company.hr_settings.code_settings },
      attendance_settings: { ...DEFAULT_HR_SETTINGS.attendance_settings, ...company.hr_settings.attendance_settings },
      modules_settings: { ...DEFAULT_HR_SETTINGS.modules_settings, ...company.hr_settings.modules_settings }
    }
  }

  if (company.working_hours && typeof company.working_hours === 'string' && company.working_hours.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(company.working_hours)
      if (parsed.hr_settings) {
        return {
          code_settings: { ...DEFAULT_HR_SETTINGS.code_settings, ...parsed.hr_settings.code_settings },
          attendance_settings: { ...DEFAULT_HR_SETTINGS.attendance_settings, ...parsed.hr_settings.attendance_settings },
          modules_settings: { ...DEFAULT_HR_SETTINGS.modules_settings, ...parsed.hr_settings.modules_settings }
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  return DEFAULT_HR_SETTINGS
}

export function packWorkingHoursWithHrSettings(
  existingWorkingHoursRaw: string, 
  hrSettings: CompanyHrSettings,
  authSettings?: any
): string {
  let baseObj: any = {}
  if (existingWorkingHoursRaw && typeof existingWorkingHoursRaw === 'string' && existingWorkingHoursRaw.trim().startsWith('{')) {
    try {
      baseObj = JSON.parse(existingWorkingHoursRaw)
    } catch (e) {
      baseObj = { raw_hours: existingWorkingHoursRaw }
    }
  } else {
    baseObj = { raw_hours: existingWorkingHoursRaw || '' }
  }

  baseObj.hr_settings = hrSettings
  if (authSettings) {
    baseObj.auth_settings = authSettings
  }

  return JSON.stringify(baseObj)
}

export async function generateAutomaticWorkerCodes(
  supabase: any,
  companyId: string,
  countNeeded: number = 1
): Promise<string[]> {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    const hrSettings = getCompanyHrSettings(company)
    const codeSettings = hrSettings.code_settings

    const prefix = (codeSettings.code_prefix || 'EMP').trim().toUpperCase()

    // Fetch existing worker codes for this company
    const { data: workers } = await supabase
      .from('workers')
      .select('cod')
      .eq('company_id', companyId)

    let maxSeq = Math.max(0, (codeSettings.initial_number || 1) - 1)

    if (workers && workers.length > 0) {
      workers.forEach((w: any) => {
        if (!w.cod) return
        const rawCod = String(w.cod).trim().toUpperCase()
        let numStr = ''
        if (prefix && rawCod.startsWith(prefix)) {
          numStr = rawCod.replace(`${prefix}-`, '').replace(prefix, '')
        } else {
          numStr = rawCod.replace(/[^0-9]/g, '')
        }
        const parsed = parseInt(numStr, 10)
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed
        }
      })
    }

    const generated: string[] = []
    for (let i = 1; i <= countNeeded; i++) {
      const nextSeq = maxSeq + i
      generated.push(formatWorkerCode(codeSettings, nextSeq))
    }

    return generated
  } catch (err) {
    console.error('Error generating automatic worker codes:', err)
    return Array.from({ length: countNeeded }, (_, i) => `EMP-${String(Date.now() + i).slice(-6)}`)
  }
}
