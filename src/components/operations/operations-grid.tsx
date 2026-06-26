'use client'

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import { 
 Plus, Trash2, Loader2, Save, Search, 
 ChevronLeft, ChevronRight, CheckCircle2, 
 AlertCircle, ShieldAlert, ArrowLeft, RefreshCw,
 FileSpreadsheet, Edit3, X
} from 'lucide-react'

// Interfaces
export interface GridColumn {
 key: string
 label: string
 type: 'date' | 'text' | 'number' | 'select'
 options?: any[]
 width?: string
 placeholder?: string
 hideInGrid?: boolean
}

interface OperationsDataGridProps {
 title: string
 subtitle: string
 columns: GridColumn[]
 initialRows: any[]
 onUpsert: (row: any) => Promise<{ success: boolean; data?: any; error?: string }>
 onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
 defaultRowValues: () => any
 userRole?: string
}

export default function OperationsDataGrid({
 title,
 subtitle,
 columns,
 initialRows,
 onUpsert,
 onDelete,
 defaultRowValues,
 userRole = 'operaciones'
}: OperationsDataGridProps) {
 // Navigation & Search State
 const [rows, setRows] = useState<any[]>([])
 const [searchTerm, setSearchTerm] = useState('')
 const [dateFilter, setDateFilter] = useState('')
 const [isPending, startTransition] = useTransition()

 // Modal State for structured Creation/Edition
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [editingRow, setEditingRow] = useState<any | null>(null) // null = Create Mode

 // Grid Keyboard Focus State
 const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
 const [isEditing, setIsEditing] = useState(false)

 // Status Indicators per Row/Cell
 const [savingRows, setSavingRows] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
 const [errorMessage, setErrorMessage] = useState<string | null>(null)
 
 // Selection
 const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})

 // Ref to container for keyboard event capturing
 const gridContainerRef = useRef<HTMLDivElement>(null)
 const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({})

 const canWrite = !!(userRole && !['trabajador', 'worker'].includes(userRole.toLowerCase()))

 // Initialize rows from initialRows props
 useEffect(() => {
 setRows(initialRows)
 }, [initialRows])

 // Filter rows based on search term and date
 const filteredRows = useMemo(() => {
 return rows.filter(row => {
 // Date Filter
 if (dateFilter && row.date !== dateFilter) {
 return false
 }
 
 // Search Term (Workplace / Supervisor / Observaciones)
 if (searchTerm) {
 const term = searchTerm.toLowerCase()
 const workplaceMatch = row.workplace?.toLowerCase().includes(term)
 const supervisorMatch = row.shift_supervisor?.toLowerCase().includes(term)
 const obsMatch = row.observations?.toLowerCase().includes(term)
 const othersMatch = row.others?.toLowerCase().includes(term)
 
 return workplaceMatch || supervisorMatch || obsMatch || othersMatch
 }
 
 return true
 })
 }, [rows, searchTerm, dateFilter])

 // Map columns key for O(1) index lookups
 const columnsMap = useMemo(() => {
 return columns.map((col, idx) => ({ ...col, index: idx }))
 }, [columns])

 // Handle cell click / focus
 const handleCellClick = (rowIndex: number, colIndex: number) => {
 if (!canWrite) return
 setFocusedCell({ rowIndex, colIndex })
 setIsEditing(true)
 }

 // Row update local helper
 const updateLocalCell = (rowIndex: number, key: string, value: any) => {
 setRows(prev => {
 const copy = [...prev]
 copy[rowIndex] = { ...copy[rowIndex], [key]: value }
 return copy
 })
 }

 // Trigger server-side persistence (Autosave)
 const triggerAutosave = async (rowIndex: number, key: string, currentValue: any) => {
 if (!canWrite) return
 
 const row = filteredRows[rowIndex]
 if (!row) return

 // Get the exact original row to check if anything actually changed
 const originalRow = initialRows.find(r => r.id === row.id)
 const isNew = String(row.id).startsWith('temp_')
 
 // If not new and value is identical, don't trigger server call
 if (!isNew && originalRow && originalRow[key] === currentValue) {
 return
 }

 const rowId = row.id
 setSavingRows(prev => ({ ...prev, [rowId]: 'saving' }))
 
 // Prepare payload (strip client-side temp id if new)
 const payload = { ...row }
 if (isNew) {
 delete payload.id
 }

 try {
 const res = await onUpsert(payload)
 if (res.success && res.data) {
 // Swap temp id with database ID, and update rows
 setRows(prev => 
 prev.map(r => r.id === rowId ? res.data : r)
 )
 setSavingRows(prev => ({ ...prev, [res.data.id]: 'saved' }))
 
 // Clear saved check after 1.5 seconds
 setTimeout(() => {
 setSavingRows(prev => {
 const next = { ...prev }
 delete next[res.data.id]
 return next
 })
 }, 1500)
 } else {
 setSavingRows(prev => ({ ...prev, [rowId]: 'error' }))
 setErrorMessage(res.error || 'Error al guardar la fila')
 }
 } catch (err: any) {
 setSavingRows(prev => ({ ...prev, [rowId]: 'error' }))
 setErrorMessage(err.message || 'Error de conexión')
 }
 }

 // Keyboard navigation & controls
 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (!focusedCell) return

 const { rowIndex, colIndex } = focusedCell
 const numRows = filteredRows.length
 const numCols = columns.length

 let nextRow = rowIndex
 let nextCol = colIndex
 let preventDefault = false

 // We allow normal editing inside inputs, but react to navigation keys
 if (e.key === 'ArrowUp' && !isEditing) {
 nextRow = Math.max(0, rowIndex - 1)
 preventDefault = true
 } else if (e.key === 'ArrowDown' && !isEditing) {
 nextRow = Math.min(numRows - 1, rowIndex + 1)
 preventDefault = true
 } else if (e.key === 'ArrowLeft' && !isEditing) {
 nextCol = Math.max(0, colIndex - 1)
 preventDefault = true
 } else if (e.key === 'ArrowRight' && !isEditing) {
 nextCol = Math.min(numCols - 1, colIndex + 1)
 preventDefault = true
 } else if (e.key === 'Tab') {
 preventDefault = true
 if (e.shiftKey) {
 // Shift + Tab -> Move left
 if (colIndex > 0) {
 nextCol = colIndex - 1
 } else if (rowIndex > 0) {
 nextRow = rowIndex - 1
 nextCol = numCols - 1
 }
 } else {
 // Tab -> Move right
 if (colIndex < numCols - 1) {
 nextCol = colIndex + 1
 } else if (rowIndex < numRows - 1) {
 nextRow = rowIndex + 1
 nextCol = 0
 }
 }
 } else if (e.key === 'Enter') {
 // Enter -> Save current edit, move to next row same column (Excel behavior)
 preventDefault = true
 setIsEditing(false)
 const currentCellKey = columns[colIndex].key
 const currentValue = filteredRows[rowIndex][currentCellKey]
 triggerAutosave(rowIndex, currentCellKey, currentValue)

 if (rowIndex < numRows - 1) {
 nextRow = rowIndex + 1
 }
 } else if (e.key === 'Escape') {
 setIsEditing(false)
 preventDefault = true
 }

 if (preventDefault) {
 e.preventDefault()
 }

 if (nextRow !== rowIndex || nextCol !== colIndex) {
 setFocusedCell({ rowIndex: nextRow, colIndex: nextCol })
 setIsEditing(true)
 
 // Auto-scroll focused cell into view if needed
 const cellKey = `${nextRow}-${nextCol}`
 const targetCell = cellRefs.current[cellKey]
 if (targetCell) {
 targetCell.scrollIntoView({ block: 'nearest', inline: 'nearest' })
 }
 }
 }

 // Open Creation Modal
 const handleOpenCreateModal = () => {
 if (!canWrite) return
 setEditingRow(null)
 setIsModalOpen(true)
 }

 // Open Edition Modal
 const handleOpenEditModal = (row: any) => {
 if (!canWrite) return
 setEditingRow(row)
 setIsModalOpen(true)
 }

 // Save via modal form callback
 const handleSaveModal = async (formData: any) => {
 const isNew = !formData.id
 const rowId = formData.id || `temp_${Date.now()}`

 try {
 const res = await onUpsert(formData)
 if (res.success && res.data) {
 setRows(prev => {
 if (isNew) {
 // Prepend new row at the top reactively
 return [res.data, ...prev]
 } else {
 // Replace modified row
 return prev.map(r => r.id === formData.id ? res.data : r)
 }
 })
 
 // Brief check animation for the row
 setSavingRows(prev => ({ ...prev, [res.data.id]: 'saved' }))
 setTimeout(() => {
 setSavingRows(prev => {
 const next = { ...prev }
 delete next[res.data.id]
 return next
 })
 }, 1500)
 
 setIsModalOpen(false)
 setEditingRow(null)
 } else {
 throw new Error(res.error || 'Error al guardar el registro')
 }
 } catch (err: any) {
 throw err
 }
 }

 // Delete selected rows
 const handleDeleteSelected = async () => {
 const idsToDelete = Object.keys(selectedIds).filter(id => selectedIds[id])
 if (idsToDelete.length === 0) return

 if (!confirm(`¿Está seguro de que desea eliminar los ${idsToDelete.length} registros seleccionados?`)) {
 return
 }

 startTransition(async () => {
 try {
 for (const id of idsToDelete) {
 if (String(id).startsWith('temp_')) {
 // Remove local temp row
 setRows(prev => prev.filter(r => r.id !== id))
 } else {
 const res = await onDelete(id)
 if (res.success) {
 setRows(prev => prev.filter(r => r.id !== id))
 } else {
 alert(`Error al eliminar registro: ${res.error}`)
 }
 }
 }
 setSelectedIds({})
 } catch (err: any) {
 alert(`Error: ${err.message}`)
 }
 })
 }

 // Toggle selection
 const handleToggleSelectRow = (id: string) => {
 setSelectedIds(prev => ({
 ...prev,
 [id]: !prev[id]
 }))
 }

 const handleToggleSelectAll = () => {
 const allSelected = filteredRows.every(r => selectedIds[r.id])
 const newSelected: Record<string, boolean> = {}
 
 if (!allSelected) {
 filteredRows.forEach(r => {
 newSelected[r.id] = true
 })
 }
 setSelectedIds(newSelected)
 }

 // Quick reset error banner
 useEffect(() => {
 if (errorMessage) {
 const timer = setTimeout(() => setErrorMessage(null), 5000)
 return () => clearTimeout(timer)
 }
 }, [errorMessage])

 return (
 <div className="space-y-4">
 {/* Visual Header - Light Corporate Premium style */}
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white text-slate-800 p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
 <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
 <div className="flex items-center gap-4 relative">
 <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
 <FileSpreadsheet className="w-8 h-8 text-blue-600 animate-pulse" />
 </div>
 <div>
 <h1 className="text-2xl font-black tracking-tight text-slate-800">
 {title}
 </h1>
 <p className="text-slate-500 font-medium text-xs mt-0.5">{subtitle}</p>
 </div>
 </div>

 {/* Toolbar & Filters */}
 <div className="flex flex-wrap items-center gap-3 relative">
 {/* Search */}
 <div className="relative group">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
 <input 
 type="text" 
 placeholder="Filtrar por labor, supervisor..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl w-64 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
 />
 </div>

 {/* Date Filter */}
 <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl">
 <span className="text-[10px] font-black text-slate-400">Fecha</span>
 <input 
 type="date" 
 value={dateFilter}
 onChange={e => setDateFilter(e.target.value)}
 className="bg-transparent border-none text-slate-800 font-bold text-xs outline-none cursor-pointer"
 />
 {dateFilter && (
 <button 
 onClick={() => setDateFilter('')}
 className="text-xs text-rose-500 hover:text-rose-600 font-bold ml-1"
 >
 Limpiar
 </button>
 )}
 </div>

 {/* Actions */}
 {canWrite && (
 <div className="flex items-center gap-2">
 <button 
 onClick={handleOpenCreateModal}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs tracking-normal transition-all shadow-sm active:scale-95 border border-blue-500/10"
 >
 <Plus size={14} />
 Fila Nueva
 </button>

 {Object.values(selectedIds).some(Boolean) && (
 <button 
 onClick={handleDeleteSelected}
 disabled={isPending}
 className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-505 disabled:opacity-50 text-white font-bold rounded-xl text-xs tracking-normal transition-all shadow-sm active:scale-95 border border-rose-500/10 animate-pulse"
 >
 <Trash2 size={14} />
 Eliminar
 </button>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Floating Alerts */}
 {errorMessage && (
 <div className="flex items-center gap-3 bg-rose-50 border-l-4 border-rose-600 text-rose-900 p-4 rounded-xl shadow-sm animate-in slide-in-from-top-4 duration-300">
 <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
 <div className="text-xs font-bold">{errorMessage}</div>
 </div>
 )}

 {/* DataGrid Container - Light Premium style */}
 <div 
 ref={gridContainerRef}
 onKeyDown={handleKeyDown}
 className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden relative"
 >
 <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
 <table className="w-max text-left border-collapse table-fixed select-none">
 <thead>
 <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
 {/* Checkbox Header */}
 <th className="sticky left-0 z-30 bg-slate-50 border-r border-slate-200 px-3 py-4 text-center w-12 align-middle">
 <input 
 type="checkbox"
 checked={filteredRows.length > 0 && filteredRows.every(r => selectedIds[r.id])}
 onChange={handleToggleSelectAll}
 className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20 cursor-pointer w-4 h-4"
 />
 </th>

 {/* Status Column */}
 <th className="sticky left-12 z-30 bg-slate-50 border-r border-slate-200 px-2 py-4 text-center w-12 align-middle text-[10px] font-black tracking-normal text-slate-500">
 EST
 </th>

 {/* Grid Columns */}
 {columns.filter(col => !col.hideInGrid).map((col, idx) => {
 const isPinned = col.key === 'date' || col.key === 'workplace' || col.key === 'shift'
 // Calculate pinned left coordinate
 let leftOffset = ''
 if (isPinned) {
 if (col.key === 'date') leftOffset = 'lg:left-[96px]'
 if (col.key === 'workplace') leftOffset = 'lg:left-[206px]'
 if (col.key === 'shift') leftOffset = 'lg:left-[356px]'
 }
 
 return (
 <th 
 key={col.key} 
 className={`
 border-r border-slate-200 px-4 py-4 text-[10px] font-black tracking-widest align-middle text-slate-600
 ${isPinned ? `lg:sticky z-20 bg-slate-50 ${leftOffset}` : ''}
 `}
 style={{ width: col.width || '150px' }}
 >
 <div className="flex items-center gap-1.5 justify-center">
 {col.label}
 </div>
 </th>
 )
 })}
 </tr>
 </thead>

 <tbody className="divide-y divide-slate-100">
 {filteredRows.length === 0 ? (
 <tr>
 <td colSpan={columns.length + 2} className="py-24 text-center text-slate-400 bg-slate-50/50">
 <div className="flex flex-col items-center justify-center gap-3">
 <FileSpreadsheet className="w-12 h-12 text-slate-300 animate-bounce" />
 <span className="font-black text-sm tracking-normal text-slate-500">Sin registros en esta hoja</span>
 <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
 No se encontraron filas que coincidan con la búsqueda o filtros de fecha. {canWrite && 'Presione "Fila Nueva" para comenzar.'}
 </p>
 </div>
 </td>
 </tr>
 ) : (
 filteredRows.map((row, rowIndex) => {
 const isSaving = savingRows[row.id] === 'saving'
 const isSaved = savingRows[row.id] === 'saved'
 const isError = savingRows[row.id] === 'error'
 const isSelected = !!selectedIds[row.id]

 return (
 <tr 
 key={row.id} 
 className={`
 hover:bg-slate-50/50 transition-colors group h-12
 ${isSelected ? 'bg-blue-50/20 hover:bg-blue-50/30' : 'bg-white'}
 `}
 >
 {/* Checkbox cell */}
 <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-200 px-3 text-center align-middle">
 <input 
 type="checkbox"
 checked={isSelected}
 onChange={() => handleToggleSelectRow(row.id)}
 className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer w-4 h-4"
 />
 </td>

 {/* Status indicator cell with visual Edit trigger on hover */}
 <td className="sticky left-12 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-200 px-2 text-center align-middle">
 <div className="flex items-center justify-center relative w-full h-full">
 {isSaving && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
 {isSaved && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />}
 {isError && <AlertCircle className="w-4 h-4 text-rose-500 animate-bounce" />}
 {!isSaving && !isSaved && !isError && (
 <>
 {/* Edit Pencil - Always visible on mobile, hover-only on desktop */}
 <button 
 onClick={() => handleOpenEditModal(row)}
 className="flex lg:hidden lg:group-hover:flex items-center justify-center text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded p-1.5 transition-all"
 title="Editar fila completa en modal"
 >
 <Edit3 size={11} className="stroke-[2.5]" />
 </button>
 {/* Number on idle - Hidden on mobile to make room for edit pencil */}
 <span className="text-[10px] font-bold text-slate-400 hidden lg:block lg:group-hover:hidden">
 {rowIndex + 1}
 </span>
 </>
 )}
 </div>
 </td>

 {/* Row Columns */}
 {columns.filter(col => !col.hideInGrid).map((col, colIndex) => {
 const isPinned = col.key === 'date' || col.key === 'workplace' || col.key === 'shift'
 let leftOffset = ''
 if (isPinned) {
 if (col.key === 'date') leftOffset = 'lg:left-[96px]'
 if (col.key === 'workplace') leftOffset = 'lg:left-[206px]'
 if (col.key === 'shift') leftOffset = 'lg:left-[356px]'
 }

 const cellKey = `${rowIndex}-${colIndex}`
 const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.colIndex === colIndex
 const cellValue = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : ''

 return (
 <td 
 key={col.key}
 ref={el => { cellRefs.current[cellKey] = el }}
 onClick={() => handleCellClick(rowIndex, colIndex)}
 className={`
 border-r border-slate-200 p-0 text-center align-middle h-12 relative transition-all duration-150
 ${isPinned ? `lg:sticky z-10 ${leftOffset} ${isSelected ? 'bg-blue-50/30 group-hover:bg-slate-100' : 'bg-white group-hover:bg-slate-50'}` : ''}
 ${isFocused ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''}
 `}
 style={{ width: col.width || '150px' }}
 >
 {isFocused && canWrite ? (
 col.type === 'select' ? (
 <select
 value={cellValue}
 onChange={e => updateLocalCell(rowIndex, col.key, e.target.value)}
 onBlur={() => {
 setIsEditing(false)
 triggerAutosave(rowIndex, col.key, cellValue)
 }}
 autoFocus
 className="w-full h-full text-xs font-bold text-slate-800 text-center outline-none bg-transparent cursor-pointer py-2 pr-4 border-none"
 >
 {col.options?.map(opt => {
 const val = typeof opt === 'string' ? opt : opt.value
 const label = typeof opt === 'string' ? opt : opt.label
 return (
 <option key={val} value={val} className="bg-white text-slate-900 font-bold">
 {label}
 </option>
 )
 })}
 </select>
 ) : col.type === 'date' ? (
 <input
 type="date"
 value={cellValue}
 onChange={e => updateLocalCell(rowIndex, col.key, e.target.value)}
 onBlur={() => {
 setIsEditing(false)
 triggerAutosave(rowIndex, col.key, cellValue)
 }}
 autoFocus
 className="w-full h-full text-xs font-bold text-slate-800 text-center border-none outline-none bg-transparent p-2"
 />
 ) : col.type === 'number' ? (
 <input
 type="number"
 value={cellValue === 0 ? '' : cellValue}
 onChange={e => {
 const val = e.target.value === '' ? 0 : Number(e.target.value)
 updateLocalCell(rowIndex, col.key, val)
 }}
 onBlur={() => {
 setIsEditing(false)
 triggerAutosave(rowIndex, col.key, cellValue)
 }}
 autoFocus
 placeholder={col.placeholder || '0'}
 className="w-full h-full text-xs font-bold text-slate-800 text-center border-none outline-none bg-transparent p-2"
 />
 ) : (
 <input
 type="text"
 value={cellValue}
 onChange={e => updateLocalCell(rowIndex, col.key, e.target.value)}
 onBlur={() => {
 setIsEditing(false)
 triggerAutosave(rowIndex, col.key, cellValue)
 }}
 autoFocus
 placeholder={col.placeholder || '-'}
 className="w-full h-full text-xs font-bold text-slate-800 text-center border-none outline-none bg-transparent p-2"
 />
 )
 ) : (
 // Static cell display
 <div className={`w-full h-full flex items-center justify-center px-3 py-2 text-xs font-bold leading-tight ${
 cellValue === '' ? 'text-slate-300' : 'text-slate-700'
 }`}>
 {col.type === 'select' && cellValue === '' ? (
 <span className="opacity-50">- Select -</span>
 ) : col.type === 'select' && cellValue ? (
 (() => {
 const found = col.options?.find(opt => (typeof opt === 'string' ? opt : opt.value) === cellValue)
 return found ? (typeof found === 'string' ? found : found.label) : cellValue
 })()
 ) : col.type === 'date' && cellValue ? (
 new Date(cellValue + 'T00:00:00').toLocaleDateString('es-PE', {
 day: '2-digit',
 month: '2-digit',
 year: 'numeric'
 })
 ) : (
 cellValue || '-'
 )}
 </div>
 )}
 </td>
 )
 })}
 </tr>
 )
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Shortcuts and Help Bar */}
 <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3.5 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between text-[11px] font-black text-slate-500 tracking-normal">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
 <span>Autoguardado activado (al salir de la celda). O use el formulario guiado al hacer click en el lápiz.</span>
 </div>
 {canWrite && (
 <div className="flex items-center gap-4">
 <span className="opacity-45">Grid:</span>
 <span>Tab / Shift+Tab (Mover Horizontal)</span>
 <span>Enter (Guardar y Bajar)</span>
 <span>Escape (Cancelar)</span>
 </div>
 )}
 </div>

 {/* Structured Modal Form - OperationsFormModal */}
 <OperationsFormModal 
 isOpen={isModalOpen}
 onClose={() => {
 setIsModalOpen(false)
 setEditingRow(null)
 }}
 columns={columns}
 row={editingRow}
 onSave={handleSaveModal}
 defaultRowValues={defaultRowValues}
 />
 </div>
 )
}

/**
 * ================================================================
 * OPERATIONS FORM MODAL - COMPONENT
 * ================================================================
 */
interface OperationsFormModalProps {
 isOpen: boolean
 onClose: () => void
 columns: GridColumn[]
 row: any | null // null = Create Mode, otherwise Edit Mode
 onSave: (data: any) => Promise<void>
 defaultRowValues: () => any
}

function OperationsFormModal({
 isOpen,
 onClose,
 columns,
 row,
 onSave,
 defaultRowValues
}: OperationsFormModalProps) {
 const [formData, setFormData] = useState<any>({})
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 // Initialize form state
 useEffect(() => {
 if (isOpen) {
 setError(null)
 if (row) {
 setFormData((prev: any) => ({ ...prev, ...row }))
 } else {
 const defaultVals = defaultRowValues()
 setFormData((prev: any) => ({ ...prev, ...defaultVals }))
 }
 }
 }, [isOpen, row?.id])

 if (!isOpen) return null

 const handleChange = (key: string, value: any) => {
 setFormData((prev: any) => ({
 ...prev,
 [key]: value
 }))
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError(null)

 try {
 await onSave(formData)
 } catch (err: any) {
 setError(err.message || 'Ocurrió un error inesperado al guardar')
 setLoading(false)
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
 <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
 {/* Modal Header */}
 <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/10">
 <FileSpreadsheet size={24} />
 </div>
 <div>
 <h2 className="text-lg font-black text-slate-800 leading-none">
 {row ? 'Editar Registro' : 'Nuevo Registro Operativo'}
 </h2>
 <p className="text-slate-400 text-xs font-medium mt-1">
 {row ? 'Modifique los campos estructurados' : 'Complete el formulario estructurado'}
 </p>
 </div>
 </div>
 <button 
 type="button"
 onClick={onClose}
 className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 {/* Modal Body Form */}
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
 <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
 {error && (
 <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
 <AlertCircle size={18} className="shrink-0 text-rose-600" />
 {error}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {columns.map(col => {
 const value = formData[col.key] !== undefined && formData[col.key] !== null ? formData[col.key] : ''

 return (
 <div key={col.key} className={`space-y-1.5 ${col.key === 'observations' || col.key === 'others' ? 'md:col-span-2' : ''}`}>
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-1">
 {col.label}
 </label>

 {col.type === 'select' ? (
 <select
 value={value}
 onChange={e => handleChange(col.key, e.target.value)}
 className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none text-slate-800 cursor-pointer"
 >
 {col.options?.map(opt => {
 const val = typeof opt === 'string' ? opt : opt.value
 const label = typeof opt === 'string' ? opt : opt.label
 return (
 <option key={val} value={val}>
 {label}
 </option>
 )
 })}
 </select>
 ) : col.type === 'date' ? (
 <input
 required
 type="date"
 value={value}
 onChange={e => handleChange(col.key, e.target.value)}
 className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none text-slate-800"
 />
 ) : col.type === 'number' ? (
 <input
 type="number"
 placeholder={col.placeholder || '0'}
 value={value === 0 ? '' : value}
 onChange={e => handleChange(col.key, e.target.value === '' ? 0 : Number(e.target.value))}
 className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none text-slate-800"
 />
 ) : (
 <input
 type="text"
 placeholder={col.placeholder || '-'}
 value={value}
 onChange={e => handleChange(col.key, e.target.value)}
 className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none text-slate-800"
 />
 )}
 </div>
 )
 })}
 </div>
 </div>

 {/* Modal Footer */}
 <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
 <button
 type="button"
 onClick={onClose}
 disabled={loading}
 className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-all text-xs tracking-normal disabled:opacity-50"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={loading}
 className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all shadow-md shadow-blue-500/10 text-xs tracking-normal flex items-center gap-2 disabled:opacity-50"
 >
 {loading ? (
 <>
 <Loader2 size={14} className="animate-spin" />
 Guardando...
 </>
 ) : (
 <>
 <Save size={14} />
 Guardar Registro
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
