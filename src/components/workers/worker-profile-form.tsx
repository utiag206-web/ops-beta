'use client'

import { useState } from 'react'
import { updateWorkerFullProfile } from '@/app/(dashboard)/workers/actions'
import { Save, Loader2, Briefcase, Landmark, User, ShieldAlert } from 'lucide-react'
import { WorkerChildren } from '@/components/workers/worker-children'

const Input = ({ label, value, onChange, type = "text", required = false, disabled = false }: any) => (
  <div className="space-y-1.5 flex-1 min-w-[200px]">
    <label className="text-xs font-bold text-slate-500 uppercase">{label} {required && <span className="text-rose-500">*</span>}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={onChange}
      disabled={disabled}
      className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-slate-100 opacity-60' : 'bg-slate-50 focus:bg-white'}`}
      required={required}
    />
  </div>
)

const Select = ({ label, value, onChange, options, disabled = false }: any) => (
  <div className="space-y-1.5 flex-1 min-w-[200px]">
    <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
    <select 
      value={value || ''} 
      onChange={onChange} 
      disabled={disabled}
      className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-slate-100 opacity-60' : 'bg-slate-50 focus:bg-white cursor-pointer'}`}
    >
      <option value="">- Seleccionar -</option>
      {options.map((opt:any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
    </select>
  </div>
)

export function WorkerProfileForm({ worker, childrenList = [], canManage = false }: { worker: any, childrenList?: any[], canManage?: boolean }) {
  const [activeTab, setActiveTab] = useState<'laboral' | 'financial' | 'personal'>('laboral')
  const [isSaving, setIsSaving] = useState(false)
  
  // States
  const [laboral, setLaboral] = useState({
    name: worker.name || '',
    last_name: worker.last_name || '',
    document_number: worker.document_number || worker.dni || '',
    cod: worker.cod || '',
    position: worker.position || '',
    guardia: worker.guardia || '',
    condition: worker.condition || '',
    work_system: worker.work_system || '',
    current_status: worker.current_status || worker.status || 'ACTIVO',
    hire_date: worker.hire_date || '',
    termination_date: worker.termination_date || ''
  })
  
  const [financial, setFinancial] = useState({
    daily_rate: worker.financial?.daily_rate || 0,
    monthly_salary: worker.financial?.monthly_salary || 0,
    has_family_allowance: worker.financial?.has_family_allowance || false,
    family_allowance_amount: worker.financial?.family_allowance_amount || 0,
    bank_name: worker.financial?.bank_name || '',
    account_type: worker.financial?.account_type || '',
    account_number: worker.financial?.account_number || ''
  })
  
  const [personal, setPersonal] = useState({
    birth_date: worker.personal?.birth_date || '',
    gender: worker.personal?.gender || 'M',
    children_count: worker.personal?.children_count || 0,
    marital_status: worker.personal?.marital_status || '',
    address: worker.personal?.address || '',
    district: worker.personal?.district || '',
    province: worker.personal?.province || '',
    department: worker.personal?.department || '',
    phone_number: worker.personal?.phone_number || worker.phone || '',
    emergency_contact_name: worker.personal?.emergency_contact_name || '',
    emergency_contact_phone: worker.personal?.emergency_contact_phone || '',
    emergency_contact_relation: worker.personal?.emergency_contact_relation || '',
    driver_license: worker.personal?.driver_license || '',
    worker_category: worker.personal?.worker_category || ''
  })

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateWorkerFullProfile(worker.id, {
      laboral,
      financial,
      personal
    })
    setIsSaving(false)
    if (result.success) {
      alert(result.message || "Perfil actualizado correctamente.")
    } else {
      alert("Error crítico: " + (result.error || "No se pudo guardar la información."))
    }
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* HEADER TABS */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/50 p-2 gap-2">
        <button 
          onClick={() => setActiveTab('laboral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'laboral' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
        >
          <Briefcase size={16} /> Datos Laborales
        </button>
        <button 
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'financial' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
          <Landmark size={16} /> Sueldos y Cuentas
        </button>
        <button 
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'}`}
        >
          <User size={16} /> Perfil Personal
        </button>
        {canManage && (
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        )}
      </div>

      {/* FORM CONTENT */}
      <div className="p-6">
        {activeTab === 'laboral' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">Identidad Corporativa</h3>
            <div className="flex flex-wrap gap-4">
              <Input label="Código (COD)" value={laboral.cod} onChange={(e:any) => setLaboral({...laboral, cod: e.target.value})} disabled={!canManage} />
              <Input label="Documento (DNI/CE)" value={laboral.document_number} onChange={(e:any) => setLaboral({...laboral, document_number: e.target.value})} required disabled={!canManage} />
              <Input label="Nombres" value={laboral.name} onChange={(e:any) => setLaboral({...laboral, name: e.target.value})} required disabled={!canManage} />
              <Input label="Apellidos" value={laboral.last_name} onChange={(e:any) => setLaboral({...laboral, last_name: e.target.value})} disabled={!canManage} />
            </div>

            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2 mt-8">Asignación Operativa</h3>
            <div className="flex flex-wrap gap-4">
              <Input label="Cargo" value={laboral.position} onChange={(e:any) => setLaboral({...laboral, position: e.target.value})} required disabled={!canManage} />
              <Input label="Guardia" value={laboral.guardia} onChange={(e:any) => setLaboral({...laboral, guardia: e.target.value})} disabled={!canManage} />
              <Select 
                label="Sistema de Trabajo" 
                value={laboral.work_system} 
                onChange={(e:any) => setLaboral({...laboral, work_system: e.target.value})}
                disabled={!canManage}
                options={[
                  {val: '20X10', label: '20 x 10'},
                  {val: '14X7', label: '14 x 7'},
                  {val: '5X2', label: '5 x 2'},
                  {val: 'LIBRE', label: 'Libre (Locadores)'}
                ]}
              />
              <Select 
                label="Condición" 
                value={laboral.condition} 
                onChange={(e:any) => setLaboral({...laboral, condition: e.target.value})}
                disabled={!canManage}
                options={[
                  {val: 'PLANILLA', label: 'Planilla'},
                  {val: 'LOCACION', label: 'Locación (RxH)'},
                  {val: 'PRACTICANTE', label: 'Practicante'}
                ]}
              />
            </div>

            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2 mt-8">Estado de Contrato</h3>
            <div className="flex flex-wrap gap-4">
              <Select 
                label="Situación Actual" 
                value={laboral.current_status} 
                onChange={(e:any) => setLaboral({...laboral, current_status: e.target.value})}
                disabled={!canManage}
                options={[
                  {val: 'ACTIVO', label: '🟢 Activo'},
                  {val: 'CESADO', label: '🔴 Cesado'},
                  {val: 'SUSPENDIDO', label: '🟡 Suspendido'}
                ]}
              />
              <Input type="date" label="Fecha Ingreso" value={laboral.hire_date} onChange={(e:any) => setLaboral({...laboral, hire_date: e.target.value})} disabled={!canManage} />
              <Input type="date" label="Fecha Cese" value={laboral.termination_date} onChange={(e:any) => setLaboral({...laboral, termination_date: e.target.value})} disabled={!canManage} />
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-emerald-800 border-b border-emerald-100 pb-2">Remuneración Base</h3>
            <div className="flex flex-wrap gap-4">
              <Input type="number" label="Sueldo Diario (S/)" value={financial.daily_rate} onChange={(e:any) => setFinancial({...financial, daily_rate: parseFloat(e.target.value) || 0})} disabled={!canManage} />
              <Input type="number" label="Sueldo Mensual Fijo (S/)" value={financial.monthly_salary} onChange={(e:any) => setFinancial({...financial, monthly_salary: parseFloat(e.target.value) || 0})} disabled={!canManage} />
            </div>

            <h3 className="text-lg font-black text-emerald-800 border-b border-emerald-100 pb-2 mt-8">Beneficios Sociales</h3>
            <div className="flex flex-wrap items-center gap-6">
              <label className={`flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl ${!canManage ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  checked={financial.has_family_allowance} 
                  onChange={(e) => setFinancial({...financial, has_family_allowance: e.target.checked})}
                  disabled={!canManage}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-sm text-emerald-800">Tiene Asignación Familiar</span>
              </label>
              
              {financial.has_family_allowance && (
                <div className="w-48 animate-in fade-in slide-in-from-left-2">
                  <Input type="number" label="Monto Asig. Fam (S/)" value={financial.family_allowance_amount} onChange={(e:any) => setFinancial({...financial, family_allowance_amount: parseFloat(e.target.value) || 0})} disabled={!canManage} />
                </div>
              )}
            </div>

            <h3 className="text-lg font-black text-emerald-800 border-b border-emerald-100 pb-2 mt-8">Cuenta de Pago</h3>
            <div className="flex flex-wrap gap-4">
              <Select 
                label="Entidad Bancaria" 
                value={financial.bank_name} 
                onChange={(e:any) => setFinancial({...financial, bank_name: e.target.value})}
                disabled={!canManage}
                options={[
                  {val: 'BCP', label: 'BCP'},
                  {val: 'BBVA', label: 'BBVA'},
                  {val: 'INTERBANK', label: 'Interbank'},
                  {val: 'SCOTIABANK', label: 'Scotiabank'},
                  {val: 'BANBIF', label: 'BanBif'},
                  {val: 'PICHINCHA', label: 'Pichincha'},
                  {val: 'NACION', label: 'Banco de la Nación'}
                ]}
              />
              <Select 
                label="Tipo de Cuenta" 
                value={financial.account_type} 
                onChange={(e:any) => setFinancial({...financial, account_type: e.target.value})}
                disabled={!canManage}
                options={[
                  {val: 'AHORROS', label: 'Ahorros'},
                  {val: 'CORRIENTE', label: 'Corriente'},
                  {val: 'SUELDO', label: 'Sueldo'}
                ]}
              />
              <Input label="Nº Cuenta / CCI" value={financial.account_number} onChange={(e:any) => setFinancial({...financial, account_number: e.target.value})} disabled={!canManage} />
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-purple-800 border-b border-purple-100 pb-2">Información Demográfica</h3>
            <div className="flex flex-wrap gap-4">
              <Input type="date" label="Fecha Nacimiento" value={personal.birth_date} onChange={(e:any) => setPersonal({...personal, birth_date: e.target.value})} disabled={!canManage} />
              <Select 
                label="Género" 
                value={personal.gender} 
                onChange={(e:any) => setPersonal({...personal, gender: e.target.value})}
                disabled={!canManage}
                options={[{val: 'M', label: 'Masculino'}, {val: 'F', label: 'Femenino'}]}
              />
              <Select 
                label="Estado Civil" 
                value={personal.marital_status} 
                onChange={(e:any) => setPersonal({...personal, marital_status: e.target.value})}
                disabled={!canManage}
                options={[{val: 'SOLTERO', label: 'Soltero'}, {val: 'CASADO', label: 'Casado'}, {val: 'CONVIVIENTE', label: 'Conviviente'}]}
              />
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-slate-500 uppercase">Nº Hijos Registrados</label>
                <div className="w-full px-3 py-2 text-sm font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-xl flex items-center h-[38px]">
                  {childrenList.length} {childrenList.length === 1 ? 'Hijo' : 'Hijos'}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <WorkerChildren workerId={worker.id} initialChildren={childrenList} canManage={canManage} />
            </div>

            <h3 className="text-lg font-black text-purple-800 border-b border-purple-100 pb-2 mt-8">Ubicación y Contacto</h3>
            <div className="flex flex-wrap gap-4">
              <div className="w-full flex gap-4">
                <Input label="Teléfono / Celular" value={personal.phone_number} onChange={(e:any) => setPersonal({...personal, phone_number: e.target.value})} disabled={!canManage} />
                <Input label="Licencia de Conducir (Cat)" value={personal.driver_license} onChange={(e:any) => setPersonal({...personal, driver_license: e.target.value})} disabled={!canManage} />
              </div>
              <Input label="Dirección Completa" value={personal.address} onChange={(e:any) => setPersonal({...personal, address: e.target.value})} disabled={!canManage} />
              <Input label="Distrito" value={personal.district} onChange={(e:any) => setPersonal({...personal, district: e.target.value})} disabled={!canManage} />
              <Input label="Provincia" value={personal.province} onChange={(e:any) => setPersonal({...personal, province: e.target.value})} disabled={!canManage} />
              <Input label="Departamento" value={personal.department} onChange={(e:any) => setPersonal({...personal, department: e.target.value})} disabled={!canManage} />
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mt-8 relative overflow-hidden">
              <ShieldAlert size={100} className="absolute -right-6 -top-6 text-rose-100 opacity-50" />
              <h3 className="text-lg font-black text-rose-800 mb-4 flex items-center gap-2 relative z-10">
                Contacto de Emergencia
              </h3>
              <div className="flex flex-wrap gap-4 relative z-10">
                <Input label="Nombre del Contacto" value={personal.emergency_contact_name} onChange={(e:any) => setPersonal({...personal, emergency_contact_name: e.target.value})} disabled={!canManage} />
                <Input label="Teléfono (Emergencia)" value={personal.emergency_contact_phone} onChange={(e:any) => setPersonal({...personal, emergency_contact_phone: e.target.value})} disabled={!canManage} />
                <Input label="Parentesco" value={personal.emergency_contact_relation} onChange={(e:any) => setPersonal({...personal, emergency_contact_relation: e.target.value})} disabled={!canManage} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
