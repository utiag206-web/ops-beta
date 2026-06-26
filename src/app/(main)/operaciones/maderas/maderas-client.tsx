'use client'

import React, { useMemo } from 'react'
import OperationsDataGrid, { GridColumn } from '@/components/operations/operations-grid'
import { upsertWoodRecord, deleteWoodRecord } from '../actions'

interface MaderasClientProps {
 initialRecords: any[]
 userRole: string
 warehouses?: any[]
}

const defaultRowValues = () => ({
 date: new Date().toISOString().split('T')[0],
 workplace: '',
 shift: 'Día',
 warehouse_id: '',
 boards_2in: 0,
 rajas: 0,
 strut_8in: 0,
 strut_6in: 0,
 strut_4in: 0,
 others: ''
})

export default function MaderasClient({ initialRecords, userRole, warehouses = [] }: MaderasClientProps) {
 const columns: GridColumn[] = useMemo(() => [
 { key: 'date', label: 'Fecha', type: 'date', width: '140px' },
 { key: 'workplace', label: 'Labor (Frente)', type: 'text', width: '170px', placeholder: 'CH. II 1 / Galería' },
 { key: 'shift', label: 'Turno', type: 'select', options: ['Día', 'Noche'], width: '120px' },
 { 
 key: 'warehouse_id', 
 label: 'Almacén de Consumo', 
 type: 'select', 
 options: [{ label: 'Seleccionar...', value: '' }, ...warehouses.map(w => ({ label: w.name, value: w.id }))],
 hideInGrid: true 
 },
 { key: 'boards_2in', label: 'Tablas 2"', type: 'number', width: '120px', placeholder: '0' },
 { key: 'rajas', label: 'Rajas', type: 'number', width: '120px', placeholder: '0' },
 { key: 'strut_8in', label: 'Puntal 8"', type: 'number', width: '120px', placeholder: '0' },
 { key: 'strut_6in', label: 'Puntal 6"', type: 'number', width: '120px', placeholder: '0' },
 { key: 'strut_4in', label: 'Puntal 4"', type: 'number', width: '120px', placeholder: '0' },
 { key: 'others', label: 'Otros Materiales', type: 'text', width: '220px', placeholder: 'Detalles de otros insumos...' }
 ], [warehouses])

 return (
 <div className="space-y-6">
 <OperationsDataGrid 
 title="Control de Maderas"
 subtitle="Registro y consumo de maderas de sostenimiento, puntales y tablas por labor."
 columns={columns}
 initialRows={initialRecords}
 onUpsert={upsertWoodRecord}
 onDelete={deleteWoodRecord}
 defaultRowValues={defaultRowValues}
 userRole={userRole}
 />
 </div>
 )
}
