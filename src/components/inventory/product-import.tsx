'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Loader2, Save, Download } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importProducts, checkExistingProductCodes } from '@/app/(main)/inventory/actions'
import { toast } from 'sonner'

interface ProductImportData {
  code: string
  name: string
  category: string
  descripcion: string
  unit: string
  type?: string
  stock_minimo: number
  fecha_ingreso?: string
  observaciones?: string
  stock_inicial?: number
  almacen_destino?: string
}

export function ProductImport() {
  const router = useRouter()
  const [data, setData] = useState<ProductImportData[]>([])
  const [existingCodes, setExistingCodes] = useState<string[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const downloadProductTemplate = () => {
    const headers = [
      'código',
      'nombre',
      'categoría',
      'descripción',
      'unidad',
      'tipo',
      'stock_minimo',
      'fecha_ingreso',
      'observaciones',
      'stock_inicial',
      'almacen_destino'
    ]
    const samples = [
      {
        código: 'SKU-001',
        nombre: 'CLAVOS 2 PULGADAS',
        categoría: 'herramientas',
        descripción: 'Clavos de acero reforzados',
        unidad: 'unidad',
        tipo: 'herramienta',
        stock_minimo: 50,
        fecha_ingreso: '2026-01-10',
        observaciones: 'Para almacén de mina',
        stock_inicial: 100,
        almacen_destino: 'Almacén Central'
      },
      {
        código: 'SKU-002',
        nombre: 'GAMBUCHOS',
        categoría: 'alimentos',
        descripción: 'Ración de chocolate de campamento',
        unidad: 'unidad',
        tipo: 'consumible',
        stock_minimo: 20,
        fecha_ingreso: '2026-01-10',
        observaciones: 'Consumo cocina',
        stock_inicial: 80,
        almacen_destino: 'Almacén Cocina'
      },
      {
        código: 'SKU-003',
        nombre: 'PITA',
        categoría: 'otro',
        descripción: 'Cuerda de pita de amarre',
        unidad: 'metros',
        tipo: 'consumible',
        stock_minimo: 10,
        fecha_ingreso: '2026-01-10',
        observaciones: 'Consumo general',
        stock_inicial: 200,
        almacen_destino: 'Almacén Central'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(samples, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Productos')
    XLSX.writeFile(wb, 'Plantilla_Productos_Oficial.xlsx')
    toast.success('Plantilla descargada con éxito.')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    
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

        const validatedData = jsonData.map((row: any) => ({
          code: (findValue(row, ['code', 'codigo', 'código', 'sku']) || '').toString().trim().toUpperCase(),
          name: (findValue(row, ['name', 'nombre', 'producto', 'descripción del producto']) || '').toString().trim().toUpperCase(),
          category: (findValue(row, ['category', 'categoria', 'categoría', 'rubro']) || 'EPP').toString().trim().toLowerCase(),
          descripcion: (findValue(row, ['description', 'descripcion', 'descripción', 'detalles']) || '').toString().trim(),
          unit: (findValue(row, ['unit', 'unidad', 'unidad de medida', 'medida']) || 'unidad').toString().trim().toLowerCase(),
          type: (findValue(row, ['type', 'tipo']) || '').toString().trim().toLowerCase(),
          stock_minimo: Number(findValue(row, ['stock_minimo', 'stock minimo', 'minimo', 'min_stock'])) || 0,
          fecha_ingreso: (findValue(row, ['fecha_ingreso', 'fecha ingreso', 'fecha']) || '').toString().trim(),
          observaciones: (findValue(row, ['observaciones', 'observacion', 'notas']) || '').toString().trim(),
          stock_inicial: Number(findValue(row, ['stock_inicial', 'stock inicial', 'cantidad_inicial', 'stock'])) || 0,
          almacen_destino: (findValue(row, ['almacen_destino', 'almacen', 'almacén', 'destino']) || '').toString().trim()
        }))

        const validRows = validatedData.filter(row => row.code && row.name)

        if (validRows.length === 0) {
          setError('No se encontraron productos válidos. Revisa los encabezados (Código, Nombre, Categoría).')
          setData([])
          return
        }

        // Check which codes already exist in DB
        const codes = validRows.map(r => r.code)
        const dbCheck = await checkExistingProductCodes(codes)
        
        if (dbCheck.data) {
          setExistingCodes(dbCheck.data)
        }

        setData(validRows)
      } catch (err) {
        console.error(err)
        setError('Error al procesar el archivo Excel.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (data.length === 0) return
    setIsPending(true)
    setError(null)

    try {
      const result = await importProducts(data)
      if (result.success) {
        toast.success(`Se importaron ${result.count} productos correctamente.`)
        router.push('/inventory/products')
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
          href="/inventory/products" 
          className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-indigo-600 self-start"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Importar Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm font-medium">Carga masiva o actualización de productos vía Excel/CSV</p>
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

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {!data.length ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 bg-slate-50">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Selecciona tu archivo</h3>
            <p className="text-slate-500 text-sm mt-1 text-center max-w-xs mb-4">
              Sube un archivo Excel (.xlsx, .xls) o CSV con las columnas: <br/>
              <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-indigo-600 block mt-2">Código, Nombre, Categoría, Unidad, Stock Minimo</span>
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <button 
                onClick={downloadProductTemplate}
                className="bg-white border-2 border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
              >
                <Download size={16} className="text-indigo-600" /> Descargar Plantilla
              </button>
              <label className="bg-indigo-600 hover:bg-indigo-700 !text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-md flex items-center gap-2">
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
                  <p className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{fileName}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{data.length} productos listos</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setData([])
                    setExistingCodes([])
                    setError(null)
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 rounded-xl border-2 border-slate-100 transition-all active:scale-95"
                >
                  Cambiar
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isPending ? 'Procesando...' : 'Confirmar Importación'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm max-h-[400px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 sticky top-0 z-10 border-b border-slate-150">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Producto</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unidad</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Mín.</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Inicial</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Almacén Destino</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => {
                    const isExisting = existingCodes.includes(row.code)
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-black text-indigo-600 font-mono">{row.code}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{row.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{row.unit}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{row.stock_minimo}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{row.stock_inicial || 0}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.almacen_destino || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {isExisting ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                              Actualizar (Upsert)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">
                              Nuevo
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex gap-4">
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Validaciones y Compatibilidad</h4>
          <p className="text-sm text-indigo-700 mt-1">
            * El sistema valida duplicidad por código. Si el producto ya existe, se actualizarán sus datos generales de rubro, unidad y stock mínimo (upsert).<br/>
            * Si defines un **Stock Inicial** mayor a cero, se registrará un movimiento de ingreso automático en el **Almacén Destino** indicado (si el almacén no existe en el sistema, se creará uno nuevo automáticamente).
          </p>
        </div>
      </div>
    </div>
  )
}
