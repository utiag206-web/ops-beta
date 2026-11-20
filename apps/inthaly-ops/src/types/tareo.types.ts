/**
 * Tipos de Dominio: Tareo Operativo y Asistencia — INTHALY
 * Definición central de partes diarios, marcas de asistencia y cálculos.
 */

export type TareoStatusCode = 'AC' | 'DL' | 'F' | 'DM' | 'TR' | 'PER' | 'VAC' | 'SUB' | string

export interface TareoRecord {
  id: string
  company_id: string
  worker_id: string
  tareo_date: string
  status: TareoStatusCode
  hours_worked?: number | null
  shift?: 'dia' | 'noche' | string | null
  labor_area?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface TareoBatchInput {
  worker_id: string
  tareo_date: string
  status: TareoStatusCode
  hours_worked?: number
  shift?: string
  labor_area?: string
}

export interface TareoNote {
  id: string
  company_id: string
  worker_id: string
  tareo_date: string
  note: string
  created_at: string
}

export interface TareoConfig {
  id?: string
  company_id: string
  cycle_start_day: number
  standard_hours: number
  night_shift_bonus_percent: number
  overtime_threshold: number
}

export interface AttendancePunch {
  id: string
  worker_id: string
  company_id: string
  punch_time: string
  punch_type: 'in' | 'out'
  latitude?: number | null
  longitude?: number | null
  source: 'web' | 'mobile' | 'biometric' | 'offline'
  synced_at?: string
}

export interface TareoDayDetail {
  workerId: string
  date: string
  status: TareoStatusCode
  punches: AttendancePunch[]
  hoursCalculated: number
  overtimeHours: number
}
