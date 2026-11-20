/**
 * Tipos de Dominio: Logística, Almacenes e Inventarios — INTHALY
 * Definición central de productos, stock, almacenes y movimientos de kardex.
 */

export interface Warehouse {
  id: string
  company_id?: string
  name: string
  location?: string
  is_active?: boolean
  created_at?: string
  [key: string]: unknown
}

export interface Product {
  id: string
  company_id?: string
  code: string
  name: string
  description?: string
  category?: string
  unit_of_measure?: string
  unit?: string
  min_stock?: number
  current_stock?: number
  unit_cost?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface StockItem {
  id: string
  company_id?: string
  product_id: string
  warehouse_id: string
  location: string
  quantity: number
  unit_cost?: number
  updated_at: string
  last_updated?: string
  products: {
    name: string
    code: string
    unit: string
    category: string
    min_stock: number
    [key: string]: unknown
  }
  warehouses?: {
    name: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type MovementType = 'ingreso' | 'salida' | 'ajuste'

export interface InventoryMovement {
  id: string
  company_id?: string
  product_id: string
  warehouse_id: string
  type: 'ingreso' | 'salida' | 'ajuste'
  quantity: number
  location: string
  observation: string
  created_at: string
  products: {
    name: string
    code: string
    unit: string
    category?: string
    min_stock?: number
    [key: string]: unknown
  }
  users?: {
    name: string
    [key: string]: unknown
  }
  warehouses?: {
    name: string
    [key: string]: unknown
  }
  movement_types?: {
    name: string
    effect: string
    code: string
    [key: string]: unknown
  }
  document_type?: string
  document_number?: string
  reference?: string
  responsible_name?: string
  running_balance?: number
  unit_cost?: number
  reference_document?: string
  source_warehouse_id?: string
  destination_warehouse_id?: string
  notes?: string
  created_by?: string
  [key: string]: unknown
}

export interface ProductImportData {
  code: string
  name: string
  category?: string
  unit_of_measure?: string
  min_stock?: number
  unit_cost?: number
}

export interface StockImportData {
  product_code: string
  warehouse_name: string
  quantity: number
  unit_cost?: number
}
