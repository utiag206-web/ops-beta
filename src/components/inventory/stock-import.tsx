'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Loader2, Save, Download, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importInitialStock, checkExistingProductCodes } from '@/app/(main)/inventory/actions'
import { toast } from 'sonner'

interface StockImportData {
 codigo_producto: string
 producto: string
 cantidad: number
 unidad: string
 almacen: string
 isValid?: boolean
 errorMsg?: string
}

export function StockImport() {
 const router = useRouter()
 const [data, setData] = useState<StockImportData[]>([])
 const [isPending, setIsPending] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [fileName, setFileName] = useState<string | null>(null)
 const [hasErrors, setHasErrors] = useState(false)

 const downloadStockTemplate = () => {
 const headers = [
 'codigo_producto',
 'producto',
 'cantidad',
 'unidad',
 'almacen'
 ]
 const samples = [
 {
 codigo_producto: 'SKU-001',
 producto: 'CLAVOS 2 PULGADAS',
 cantidad: 200,
 unidad: 'unidad',
 almacen: 'Almacén Central'
 },
 {
 codigo_producto: 'SKU-002',
 producto: 'GAMBUCHOS',
 cantidad: 150,
 unidad: 'unidad',
 almacen: 'Almacén Cocina'
 },
 {
 codigo_producto: 'SKU-003',
 producto: 'PITA',
 cantidad: 300,
 unidad: 'metros',
 almacen: 'Almacén Central'
 }
 ]

 const ws = XLSX.utils.json_to_sheet(samples, { header: headers })
 const wb = XLSX.utils.book_new()
 XLSX.utils.book_append_sheet(wb, ws, 'Inventario Inicial')
 XLSX.writeFile(wb, 'Plantilla_Inventario_Inicial_Oficial.xlsx')
 toast.success('Plantilla descargada con éxito.')
 }

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 setFileName(file.name)
 setError(null)
 setHasErrors(false)
 
 const reader = new FileReader()
 reader.onload = async (evt) => {
 try {
 const bstr = evt.target?.result
 const wb = XLSX.read(bstr, { type: 'binary' })
 const wsname = wb.SheetNames[0]
 const ws = wb.Sheets[wsname]
 const jsonData = XLSX.utils.sheet_to_json(ws) as any[]

 const findValue = (row: any, options: string[]) => {
 const keys = Object.keys(row);
 for (const option of options) {
 const foundKey = keys.find(k => k.toLowerCase().trim() === option.toLowerCase());
 if (foundKey) return row[foundKey];
 }
 return null;
 };

 const rawRows = jsonData.map((row: any) => ({
 codigo_producto: (findValue(row, ['codigo_producto', 'codigo producto', 'sku', 'código']) || '').toString().trim().toUpperCase(),
 producto: (findValue(row, ['producto', 'name', 'nombre']) || '').toString().trim().toUpperCase(),
 cantidad: Number(findValue(row, ['cantidad', 'quantity', 'stock', 'cantidad_inicial'])) || 0,
 unidad: (findValue(row, ['unidad', 'unit', 'medida']) || 'unidad').toString().trim().toLowerCase(),
 almacen: (findValue(row, ['almacen', 'almacén', 'warehouse', 'ubicacion']) || '').toString().trim()
 })).filter(r => r.codigo_producto && r.almacen)

 if (rawRows.length === 0) {
 setError('No se encontraron registros de stock válidos. Revisa los encabezados (Codigo_Producto, Almacen, Cantidad).')
 setData([])
 return
 }

 // Validate codes exist in Database
 const codes = rawRows.map(r => r.codigo_producto)
 const dbCheck = await checkExistingProductCodes(codes)
 const validCodes = new Set(dbCheck.data || [])

 let foundError = false
 const processedRows: StockImportData[] = rawRows.map(row => {
 const codeExists = validCodes.has(row.codigo_producto)
 const qtyValid = row.cantidad > 0

 let errorMsg = ''
 if (!codeExists) errorMsg = 'Producto no registrado en catálogo'
 else if (!qtyValid) errorMsg = 'Cantidad debe ser mayor a 0'

 if (errorMsg) foundError = true

 return {
 ...row,
 isValid: !errorMsg,
 errorMsg
 }
 })

 setHasErrors(foundError)
 setData(processedRows)
 } catch (err) {
 console.error(err)
 setError('Error al procesar el archivo Excel.')
 }
 }
 reader.readAsBinaryString(file)
 }

 const handleImport = async () => {
 if (data.length === 0 || hasErrors) return
 setIsPending(true)
 setError(null)

 try {
 const result = await importInitialStock(data)
 if (result.success) {
 toast.success(`Se importaron ${result.count} registros de stock inicial correctamente.`)
 router.push('/inventory/stock')
 router.refresh()
 } else {
 setError(`Error: ${result.error}`)
 }
 } catch (err) {
 setError('Ocurrió un error inesperado durante la importación.')
 } finally {
 setIsPending(false)
 }
 }

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center gap-4">
 <Link 
 href="/inventory/stock" 
 className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-emerald-600 self-start"
 >
 <ArrowLeft size={24} />
 </Link>
 <div>
 <h1 className="text-2xl font-black text-slate-800 tracking-tight">Importar Stock / Inventario Inicial</h1>
 <p className="text-slate-500 text-sm font-medium">Carga masiva de stock inicial para arranque de almacenes</p>
 </div>
 </div>

 {error && (
 <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3">
 <AlertCircle size={20} className="mt-0.5 shrink-0" />
 <div>
 <p className="text-sm font-bold">Atención</p>
 <p className="text-xs opacity-90">{error}</p>
 </div>
 </div>
 )}

 {hasErrors && (
 <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-3">
 <AlertTriangle size={20} className="mt-0.5 shrink-0" />
 <div>
 <p className="text-sm font-bold">Errores Detectados</p>
 <p className="text-xs opacity-90">
 Se detectaron productos no registrados en el catálogo. Por favor, importa primero el Catálogo de Productos antes de proceder con el Stock.
 </p>
 </div>
 </div>
 )}

 <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
 {!data.length ? (
 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 bg-slate-50">
 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
 <Upload size={32} />
 </div>
 <h3 className="text-lg font-bold text-slate-800">Selecciona tu archivo</h3>
 <p className="text-slate-500 text-sm mt-1 text-center max-w-xs mb-4">
 Sube un archivo Excel (.xlsx, .xls) o CSV con las columnas: <br/>
 <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-emerald-600 block mt-2">Codigo_Producto, Producto, Cantidad, Almacen</span>
 </p>
 
 <div className="flex flex-wrap gap-4 justify-center mt-4">
 <button 
 onClick={downloadStockTemplate}
 className="bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 shadow-sm"
 >
 <Download size={16} className="text-emerald-600" /> Descargar Plantilla
 </button>
 <label className="bg-emerald-600 hover:bg-emerald-700 !text-white px-6 py-2.5 rounded-xl text-xs font-black tracking-tight cursor-pointer transition-all shadow-md flex items-center gap-2">
 <Upload size={16} className="!text-white" />
 <span className="!text-white">Explorar Archivos</span>
 <input 
 type="file" 
 className="hidden" 
 accept=".xlsx, .xls, .csv" 
 onChange={handleFileUpload}
 />
 </label>
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-green-100 text-green-700 rounded-2xl shadow-sm shadow-green-100">
 <FileSpreadsheet size={24} />
 </div>
 <div>
 <p className="font-black text-slate-800 tracking-tight leading-none mb-1">{fileName}</p>
 <p className="text-xs text-slate-500 font-bold tracking-tight">{data.length} registros cargados</p>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-3">
 <button 
 onClick={() => {
 setData([])
 setError(null)
 setHasErrors(false)
 }}
 className="w-full sm:w-auto px-6 py-2.5 text-xs font-black text-slate-600 tracking-tight hover:bg-slate-50 rounded-xl border-2 border-slate-100 transition-all active:scale-95"
 >
 Cambiar
 </button>
 <button 
 onClick={handleImport}
 disabled={isPending || hasErrors}
 className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-400 text-white px-8 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:shadow-none"
 >
 {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
 {isPending ? 'Procesando...' : 'Confirmar Stock'}
 </button>
 </div>
 </div>

 <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm max-h-[400px]">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50 sticky top-0 z-10 border-b border-slate-150">
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal">Código Producto (SKU)</th>
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal">Producto</th>
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal">Cantidad</th>
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal">Unidad</th>
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal">Almacén Destino</th>
 <th className="px-4 py-3 text-xs font-bold text-slate-500 tracking-normal text-center">Estado / Validación</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {data.map((row, i) => (
 <tr key={i} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3 text-sm font-black text-indigo-600 font-mono">{row.codigo_producto}</td>
 <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.producto}</td>
 <td className="px-4 py-3 text-sm text-slate-600 font-mono">{row.cantidad}</td>
 <td className="px-4 py-3 text-sm text-slate-600">{row.unidad}</td>
 <td className="px-4 py-3 text-sm text-slate-700 font-bold">{row.almacen}</td>
 <td className="px-4 py-3 text-center">
 {row.isValid ? (
 <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-tight bg-green-50 text-green-700 border border-green-100 flex items-center justify-center gap-1 w-max mx-auto">
 <Check size={10} strokeWidth={3} /> Válido
 </span>
 ) : (
 <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-tight bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center gap-1 w-max mx-auto" title={row.errorMsg}>
 <AlertCircle size={10} strokeWidth={3} /> {row.errorMsg}
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex gap-4">
 <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
 <AlertCircle size={24} />
 </div>
 <div>
 <h4 className="font-bold text-emerald-900">Reglas de Negocio</h4>
 <p className="text-sm text-emerald-700 mt-1">
 * **Validación de Catálogo obligatoria:** El importador no creará productos inexistentes. Si un SKU en el Excel no coincide con ningún producto registrado, se marcará en rojo y la confirmación quedará bloqueada hasta solucionar el catálogo o corregir la plantilla.<br/>
 * **Creación autocurativa de Almacenes:** Si la columna **Almacén** indica una ubicación nueva, el sistema la creará automáticamente durante la importación.
 </p>
 </div>
 </div>
 </div>
 )
}
