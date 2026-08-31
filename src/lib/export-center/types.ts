export type FilterFieldType = 
  | 'date_range'
  | 'month_year'
  | 'text'
  | 'select'
  | 'area'
  | 'warehouse'
  | 'worker'
  | 'boolean'
  | 'checkbox'
  | 'number_range'

export interface SelectOption {
  label: string
  value: string
}

export interface FilterFieldSchema {
  key: string
  label: string
  type: FilterFieldType
  placeholder?: string
  options?: SelectOption[]
  required?: boolean
  defaultValue?: any
  description?: string
}

export interface QuickFilterPreset {
  label: string
  values: Record<string, any>
}

export interface ColumnDefinition {
  header: string
  key: string
  width?: number
  format?: 'currency' | 'date' | 'number' | 'text' | 'badge'
}

export interface ReportDefinition {
  id: string
  code: string
  title: string
  description: string
  category: 'rrhh' | 'mina' | 'logistica' | 'finanzas' | 'soma'
  categoryLabel: string
  iconName: string
  colorScheme: {
    bg: string
    text: string
    border: string
    badgeBg: string
    badgeText: string
  }
  formats: ('excel' | 'csv')[]
  recommendedPeriod?: string
  quickFilters?: QuickFilterPreset[]
  filters: FilterFieldSchema[]
  actionKey: string
}

export type ReportCategory = {
  id: string
  label: string
  icon: string
  description?: string
}

export type ExportFilterValues = {
  periodPreset?: 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'custom'
  startDate?: string
  endDate?: string
  area?: string
  workerId?: string
  warehouseId?: string
  status?: string
  searchTerm?: string
  stockCondition?: 'all' | 'with_stock' | 'no_stock'
  equipmentType?: string
  conceptType?: string
  paymentMethod?: string
  priority?: string
  severity?: string
  shift?: string
  includeInitialBalance?: boolean
  format?: 'excel' | 'csv'
  [key: string]: any
}

export interface ReportPreviewResult {
  success: boolean
  totalCount: number
  columns: ColumnDefinition[]
  sampleRows: any[]
  error?: string
}

export interface ExportResult {
  success: boolean
  columns: ColumnDefinition[]
  data: any[]
  error?: string
}

export interface ExportAuditItem {
  id: string
  userName: string
  reportId: string
  reportTitle: string
  category: string
  format: string
  filtersApplied: Record<string, any>
  recordsCount: number
  status: string
  createdAt: string
}

export interface AuxiliaryExportData {
  workers: {
    id: string
    fullName: string
    dni: string
    position: string
    area: string
    status?: string
  }[]
  warehouses: {
    id: string
    name: string
    location?: string
  }[]
  company: {
    id?: string
    name: string
    tax_id: string
    address?: string
  }
}
