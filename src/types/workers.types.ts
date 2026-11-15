/**
 * Tipos de Dominio: Personal y Nómina (Workers) — INTHALY
 * Fuente única de verdad para la entidad Trabajador en el ecosistema.
 */

export interface WorkerFinancial {
  id?: string
  worker_id?: string
  daily_rate?: number
  monthly_salary?: number
  bank_name?: string
  account_number?: string
  cci?: string
  created_at?: string
  [key: string]: unknown
}

export interface Worker {
  id: string
  company_id?: string
  name: string
  last_name?: string
  dni: string
  position?: string
  status: 'active' | 'inactive' | 'suspended' | string
  phone?: string
  hire_date?: string
  photo_url?: string
  daily_rate?: number
  monthly_salary?: number
  worker_financial?: WorkerFinancial | WorkerFinancial[] | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface WorkerChild {
  id: string
  worker_id: string
  name: string
  birth_date: string
  dni?: string
  created_at?: string
  [key: string]: unknown
}

export interface WorkerDocument {
  id: string
  worker_id: string
  name: string
  file_url: string
  document_type?: string
  created_at: string
  [key: string]: unknown
}

export interface WorkerImportData {
  name: string
  last_name?: string
  dni: string
  position?: string
  phone?: string
  daily_rate?: number
  monthly_salary?: number
  [key: string]: unknown
}

export interface WorkerFilterParams {
  status?: string
  search?: string
  companyId?: string
  isRecent?: boolean
}
