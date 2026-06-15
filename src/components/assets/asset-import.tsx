'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Loader2, Save, Download } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importAssets, checkExistingAssetCodes } from '@/app/(main)/assets/actions'
import { toast } from 'sonner'

interface AssetImportData {
  code: string
  name: string
  brand?: string
  model?: string
  category: string
  status: string
  location: string
  fecha_adquisicion?: string
  observaciones?: string
}

export function AssetImport() {
  const router = useRouter()
  const [data, setData] = useState<AssetImportData[]>([])
  const [existingCodes, setExistingCodes] = useState<string[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const downloadAssetTemplate = () => {
    const headers = [
      'código',
      'nombre',
      'marca',
      'modelo',
      'categoría',
      'estado',
      'ubicación',
      'fecha_adquisicion',
      'observaciones'
    ]
    const samples = [
      {
        código: 'ACT-001',
        nombre: 'MONTACARGAS ELÉCTRICO',
        marca: 'Toyota',
        modelo: '7FGU25',
        categoría: 'equipo',
        estado: 'operativo',
        ubicación: 'Taller Norte',
        fecha_adquisicion: '2025-06-15',
        observaciones: 'Adquirido nuevo con garantía'
      },
      {
        código: 'ACT-002',
        nombre: 'ROTOMARTILLO INDUSTRIAL',
        marca: 'Bosch',
        modelo: 'GBH 2-28',
        categoría: 'herramienta',
        estado: 'operativo',
        ubicación: 'Almacén Central',
        fecha_adquisicion: '2025-09-20',
        observaciones: 'Con maleta y accesorios'
      },
      {
        código: 'ACT-003',
        nombre: 'CAMIONETA 4X4',
        marca: 'Toyota',
        modelo: 'Hilux',
        categoría: 'equipo',
        estado: 'en mantenimiento',
        ubicación: 'Taller Central',
        fecha_adquisicion: '2024-03-10',
        observaciones: 'Cambio de pastillas de freno'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(samples, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Activos')
    XLSX.writeFile(wb, 'Plantilla_Activos_Oficial.xlsx')
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
          code: (findValue(row, ['code', 'codigo', 'código']) || '').toString().trim().toUpperCase(),
          name: (findValue(row, ['name', 'nombre', 'activo', 'nombre activo']) || '').toString().trim().toUpperCase(),
          brand: (findValue(row, ['brand', 'marca']) || '').toString().trim(),
          model: (findValue(row, ['model', 'modelo']) || '').toString().trim(),
          category: (findValue(row, ['category', 'categoria', 'categoría', 'tipo']) || 'equipo').toString().trim().toLowerCase(),
          status: (findValue(row, ['status', 'estado', 'estado operativo']) || 'operativo').toString().trim().toLowerCase(),
          location: (findValue(row, ['location', 'ubicacion', 'ubicación']) || 'ALMACEN CENTRAL').toString().trim().toUpperCase(),
          fecha_adquisicion: (findValue(row, ['fecha_adquisicion', 'fecha adquisicion', 'adquisicion', 'fecha']) || '').toString().trim(),
          observaciones: (findValue(row, ['observaciones', 'observacion', 'notas']) || '').toString().trim()
        }))

        const validRows = validatedData.filter(row => row.code && row.name)

        if (validRows.length === 0) {
          setError('No se encontraron activos válidos. Revisa los encabezados (Código, Nombre, Categoría).')
          setData([])
          return
        }

        // Check which codes already exist in DB
        const codes = validRows.map(r => r.code)
        const dbCheck = await checkExistingAssetCodes(codes)
        
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
      const result = await importAssets(data)
      if (result.success) {
        toast.success(`Se importaron ${result.count} activos correctamente.`)
        router.push('/assets')
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
          href="/assets" 
          className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-blue-600 self-start"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Importar Activos</h1>
          <p className="text-slate-500 text-sm font-medium">Carga masiva o actualización de activos vía Excel/CSV</p>
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
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Selecciona tu archivo</h3>
            <p className="text-slate-500 text-sm mt-1 text-center max-w-xs mb-4">
              Sube un archivo Excel (.xlsx, .xls) o CSV con las columnas: <br/>
              <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-blue-600 block mt-2">Código, Nombre, Marca, Modelo, Categoría, Estado, Ubicación</span>
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <button 
                onClick={downloadAssetTemplate}
                className="bg-white border-2 border-blue-200 hover:bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
              >
                <Download size={16} className="text-blue-600" /> Descargar Plantilla
              </button>
              <label className="bg-blue-600 hover:bg-blue-700 !text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-md flex items-center gap-2">
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
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{data.length} activos listos</p>
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-95"
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
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Código / Serie</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Activo</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => {
                    const isExisting = existingCodes.includes(row.code)
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-black text-indigo-600 font-mono">{row.code}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.brand || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{row.model || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{row.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 font-bold">{row.location}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 uppercase">{row.status}</td>
                        <td className="px-4 py-3 text-center">
                          {isExisting ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                              Sobreescribir
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">
                              Crear
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

      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Validación de Códigos</h4>
          <p className="text-sm text-blue-700 mt-1">
            * Se valida duplicidad por código de activo o número de serie. Si un activo ya se encuentra registrado con el mismo código en la empresa, sus campos se actualizarán con la nueva información cargada (upsert).<br/>
            * Para el nombre del activo, el sistema concatenará automáticamente el **Nombre**, **Marca** y **Modelo** provistos para facilitar la identificación descriptiva.
          </p>
        </div>
      </div>
    </div>
  )
}
