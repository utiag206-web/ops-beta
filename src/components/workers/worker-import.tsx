'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importWorkers } from '@/app/(main)/workers/actions'

interface WorkerImportData {
  name: string
  dni: string
  position: string
  phone: string
  hire_date?: string
}

export function WorkerImport() {
  const router = useRouter()
  const [data, setData] = useState<WorkerImportData[]>([])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[]

        // Robust mapping function
        const findValue = (row: any, options: string[]) => {
          const keys = Object.keys(row);
          for (const option of options) {
            const foundKey = keys.find(k => k.toLowerCase().trim() === option.toLowerCase());
            if (foundKey) return row[foundKey];
          }
          return null;
        };

        const validatedData = jsonData.map((row: any) => ({
          name: findValue(row, ['name', 'nombre', 'nombre completo', 'nombres', 'trabajador']),
          dni: findValue(row, ['dni', 'documento', 'cedula', 'id']),
          position: findValue(row, ['position', 'cargo', 'puesto', 'rol', 'ocupacion']),
          phone: findValue(row, ['phone', 'telefono', 'celular', 'movil']),
          hire_date: findValue(row, ['hire_date', 'fecha_ingreso', 'fecha ingreso', 'fecha de ingreso', 'hiredate'])
        }))

        // Filter valid rows (must have name and DNI)
        const validRows = validatedData.filter(row => row.name && row.dni)
        
        if (validRows.length === 0) {
          setError('No se encontraron datos válidos. Revisa los encabezados (Nombre, DNI, Cargo, Teléfono).')
          setData([])
        } else {
          setData(validRows)
        }
      } catch (err) {
        console.error(err)
        setError('Error al procesar el archivo. Asegúrate de que sea un Excel o CSV válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (data.length === 0) return

    setIsPending(true)
    setError(null)

    try {
      const result = await importWorkers(data)
      if (result.success) {
        router.push('/workers?imported=true')
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
          href="/workers" 
          className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-blue-600 self-start"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Importar Trabajadores</h1>
          <p className="text-slate-500 text-sm font-medium">Carga masiva de personal mediante Excel o CSV</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Atención</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {!data.length ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 transition-colors hover:border-blue-400 bg-slate-50">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Selecciona tu archivo</h3>
            <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
              Sube un archivo .xlsx, .xls o .csv con las columnas: <br/>
              <span className="font-mono text-xs font-bold bg-white px-1 rounded shadow-sm text-blue-600">Nombre, DNI, Cargo, Teléfono</span>
            </p>
            
            <label className="mt-6">
              <span className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-all shadow-md">
                Explorar Archivos
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
              />
            </label>
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
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{data.length} registros</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setData([])
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
                  {isPending ? 'Importando...' : 'Confirmar'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">DNI</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.dni}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.position}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.phone}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Check size={18} className="text-green-500 bg-green-50 rounded-full p-0.5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Instrucciones de Importación</h4>
          <p className="text-sm text-blue-700 mt-1">
            Asegúrate de que tu archivo tenga una fila de encabezados. Las columnas pueden llamarse en español (Nombre, DNI, Cargo, Teléfono) o inglés (name, dni, position, phone). La fecha de ingreso es opcional.
          </p>
        </div>
      </div>
    </div>
  )
}
