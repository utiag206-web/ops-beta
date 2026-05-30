'use client'

import React, { useMemo } from 'react'
import OperationsDataGrid, { GridColumn } from '@/components/operations/operations-grid'
import { upsertProductionRecord, deleteProductionRecord } from '../actions'

interface ProduccionClientProps {
  initialRecords: any[]
  userRole: string
  warehouses?: any[]
}

const defaultRowValues = () => ({
  date: new Date().toISOString().split('T')[0],
  workplace: '',
  shift: 'Día',
  warehouse_id: '',
  advance_meters: '',
  nails_qty: 0,
  cambuchos: 0,
  chocolate_qty: 0,
  pita_meters: '',
  shift_supervisor: '',
  dumper_mineral: '',
  dumper_waste: '',
  observations: ''
})

export default function ProduccionClient({ initialRecords, userRole, warehouses = [] }: ProduccionClientProps) {
  const columns: GridColumn[] = useMemo(() => [
    { key: 'date', label: 'Fecha', type: 'date', width: '140px' },
    { key: 'workplace', label: 'Labor (Frente)', type: 'text', width: '160px', placeholder: 'Pique 02 / Chimenea' },
    { key: 'shift', label: 'Turno', type: 'select', options: ['Día', 'Noche'], width: '120px' },
    { 
      key: 'warehouse_id', 
      label: 'Almacén de Consumo', 
      type: 'select', 
      options: [{ label: 'Seleccionar...', value: '' }, ...warehouses.map(w => ({ label: w.name, value: w.id }))],
      hideInGrid: true 
    },
    { key: 'advance_meters', label: 'Avance (Cortes)', type: 'text', width: '160px', placeholder: '4 cortes / 2.50m' },
    { key: 'nails_qty', label: 'Clavos (u)', type: 'number', width: '110px', placeholder: '0' },
    { key: 'cambuchos', label: 'Cambuchos', type: 'number', width: '120px', placeholder: '0' },
    { key: 'chocolate_qty', label: 'Chocolate (u)', type: 'number', width: '130px', placeholder: '0' },
    { key: 'pita_meters', label: 'Pita (m)', type: 'text', width: '120px', placeholder: '90 cm / 1.2m' },
    { key: 'shift_supervisor', label: 'Supervisor', type: 'text', width: '160px', placeholder: 'Supervisor de turno' },
    { key: 'dumper_mineral', label: 'Dumper Min', type: 'text', width: '130px', placeholder: '1 / -' },
    { key: 'dumper_waste', label: 'Dumper Des', type: 'text', width: '130px', placeholder: '2 / 1/2' },
    { key: 'observations', label: 'Observaciones', type: 'text', width: '240px', placeholder: 'Comentarios adicionales...' }
  ], [warehouses])

  return (
    <div className="space-y-6">
      <OperationsDataGrid 
        title="Control de Producción Diaria"
        subtitle="Monitoreo industrial y consumo de insumos en frentes mineros y labores."
        columns={columns}
        initialRows={initialRecords}
        onUpsert={upsertProductionRecord}
        onDelete={deleteProductionRecord}
        defaultRowValues={defaultRowValues}
        userRole={userRole}
      />
    </div>
  )
}
