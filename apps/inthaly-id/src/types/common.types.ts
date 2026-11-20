/**
 * Tipos Comunes y Contratos de Respuesta — INTHALY
 * Definición central de interfaces transversales del sistema.
 */

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
  metadata?: {
    timestamp?: string
    requestId?: string
  }
}

export type ApiResponse<T = unknown> = ActionResponse<T>

export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  hasNextPage: boolean
  cursor?: string
}

export interface DateRangeFilter {
  startDate?: string
  endDate?: string
}

export interface BaseAuditEntity {
  id: string
  company_id: string
  created_at: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export type SortOrder = 'asc' | 'desc'

export interface OperationalFilterOptions {
  search?: string
  companyId?: string
  status?: string
  limit?: number
  offset?: number
}
