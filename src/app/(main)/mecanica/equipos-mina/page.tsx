import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'
import { normalizeIndustryCode } from '@/lib/operating-profiles/industries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Maquinaria y Equipos | Mecánica Inthaly OPS',
  description: 'Mantenimiento y reparación de maquinaria y equipos operativos.',
}

export default async function EquiposMinaPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const industry = normalizeIndustryCode(extendedUser?.company_industry)

  let title = 'Mantenimiento y Reparación de Equipos'
  let subtitle = 'Control operativo, preventivo y correctivo de unidades y maquinaria.'
  let equipmentType = 'equipo_operativo'
  let defaultEquipmentName = 'Equipo Operativo Principal'
  let defaultEquipmentCode = 'EQ-01'
  let storageKey = 'equipos_general'

  if (industry === 'AGROINDUSTRIA_ALIMENTOS') {
    title = 'Mantenimiento de Maquinaria de Campo'
    subtitle = 'Control y mantenimiento de tractores, sistemas de bombeo, cosechadoras y fumigadoras.'
    equipmentType = 'maquinaria_campo'
    defaultEquipmentName = 'Tractor Agrícola John Deere 6110M'
    defaultEquipmentCode = 'TRC-01'
    storageKey = 'equipos_agro'
  } else if (industry === 'CONSTRUCCION_INFRAESTRUCTURA') {
    title = 'Mantenimiento de Maquinaria Pesada de Obra'
    subtitle = 'Control y mantenimiento de excavadoras, retroexcavadoras, grúas, rodillos y volquetes.'
    equipmentType = 'maquinaria_obra'
    defaultEquipmentName = 'Excavadora Caterpillar 320D'
    defaultEquipmentCode = 'EXC-01'
    storageKey = 'equipos_construccion'
  } else if (industry === 'TRANSPORTE_LOGISTICA') {
    title = 'Mantenimiento y Control de Flota de Transporte'
    subtitle = 'Control y mantenimiento de tractocamiones, remolques, furgones y unidades de carga.'
    equipmentType = 'flota_transporte'
    defaultEquipmentName = 'Tractocamión Volvo FH 540'
    defaultEquipmentCode = 'TRK-01'
    storageKey = 'equipos_transporte'
  } else if (industry === 'MINERIA_METALURGIA') {
    title = 'Mantenimiento y Reparación de Equipos de Mina'
    subtitle = 'Control de Scooptrams, Dumpers, Winches de arrastre y Perforadoras neumáticas/hidráulicas.'
    equipmentType = 'equipo_mina'
    defaultEquipmentName = 'Scooptram Wagner 1.5 yd'
    defaultEquipmentCode = 'SCP-01'
    storageKey = 'equipos_mina'
  } else if (industry === 'MANUFACTURA_INDUSTRIA') {
    title = 'Mantenimiento de Maquinaria y Líneas de Planta'
    subtitle = 'Control de líneas de producción, compresores industriales, calderas y motores.'
    equipmentType = 'maquinaria_planta'
    defaultEquipmentName = 'Línea de Envasado Automático'
    defaultEquipmentCode = 'LIN-01'
    storageKey = 'equipos_manufactura'
  }

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getMaintenanceRecords(equipmentType)

  return (
    <MaintenanceView
      title={title}
      subtitle={subtitle}
      equipmentType={equipmentType}
      defaultEquipmentName={defaultEquipmentName}
      defaultEquipmentCode={defaultEquipmentCode}
      storageKey={storageKey}
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
