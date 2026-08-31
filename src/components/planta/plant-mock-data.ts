export interface MineralBatch {
  id: string
  batchCode: string
  guideNumber: string
  receptionTime: string
  receptionDate: string
  truckPlate: string
  driverName: string
  originMine: string
  mineralType: string
  grossWeight: number // TMH
  tareWeight: number  // TMH
  netWeight: number   // TMH
  moisturePct: number
  estimatedGrade: string
  qualityStatus: 'optimo' | 'regular' | 'observado' | 'rechazado'
  qualityNotes: string
  stage: 'ingresado' | 'descargado' | 'acopio' | 'proceso' | 'terminado'
  stockpile: string
  operatorName: string
  dischargeTime?: string
  processingStartTime?: string
  processingEndTime?: string
}

export interface PlantShiftChecklist {
  id: string
  date: string
  shift: 'dia' | 'noche'
  supervisor: string
  operator: string
  scaleChecked: boolean
  hoppersChecked: boolean
  conveyorBeltsChecked: boolean
  crusherChecked: boolean
  ballMillChecked: boolean
  tailingsDamChecked: boolean
  downtimeMinutes: number
  downtimeReason: string
  notes: string
}

export const INITIAL_MINERAL_BATCHES: MineralBatch[] = [
  {
    id: 'BATCH-001',
    batchCode: 'LOT-2026-0841',
    guideNumber: 'GR-002-004128',
    receptionDate: '2026-08-30',
    receptionTime: '08:15',
    truckPlate: 'V7B-842',
    driverName: 'Jorge Quispe Mendoza',
    originMine: 'Nivel 1 - Frente Esperanza',
    mineralType: 'Sulfuros Polimetálicos',
    grossWeight: 28.5,
    tareWeight: 10.2,
    netWeight: 18.3,
    moisturePct: 4.5,
    estimatedGrade: '3.8 g/t Au | 4.2 oz/t Ag',
    qualityStatus: 'optimo',
    qualityNotes: 'Mineral de buena textura, sin sobretamaño ni presencia de desmonte estéril.',
    stage: 'proceso',
    stockpile: 'Tolva de Gruesos - Faja 1',
    operatorName: 'Carlos Ruiz (Líder Planta)',
    dischargeTime: '08:35',
    processingStartTime: '09:10'
  },
  {
    id: 'BATCH-002',
    batchCode: 'LOT-2026-0842',
    guideNumber: 'GR-002-004129',
    receptionDate: '2026-08-30',
    receptionTime: '09:40',
    truckPlate: 'T4M-915',
    driverName: 'Marcos Benítez Solís',
    originMine: 'Nivel 2 - Galería Sur 04',
    mineralType: 'Óxidos Auríferos',
    grossWeight: 31.2,
    tareWeight: 10.5,
    netWeight: 20.7,
    moisturePct: 6.2,
    estimatedGrade: '2.5 g/t Au | 1.8 oz/t Ag',
    qualityStatus: 'regular',
    qualityNotes: 'Contenido de humedad ligeramente elevado por filtración en galería.',
    stage: 'acopio',
    stockpile: 'Cancha B - Óxidos',
    operatorName: 'Lucía Flores',
    dischargeTime: '10:05'
  },
  {
    id: 'BATCH-003',
    batchCode: 'LOT-2026-0843',
    guideNumber: 'GR-002-004130',
    receptionDate: '2026-08-30',
    receptionTime: '11:20',
    truckPlate: 'B9K-720',
    driverName: 'Raúl Huamán Castro',
    originMine: 'Nivel 1 - Tajada 02',
    mineralType: 'Cuarzo con Pirita',
    grossWeight: 26.8,
    tareWeight: 9.8,
    netWeight: 17.0,
    moisturePct: 9.5,
    estimatedGrade: '1.1 g/t Au (Baja Ley)',
    qualityStatus: 'observado',
    qualityNotes: 'Alto contenido de roca estéril/desmonte visual. Se requiere triaje previo.',
    stage: 'descargado',
    stockpile: 'Cancha C - Cuarentena / Triaje',
    operatorName: 'Pedro Castillo',
    dischargeTime: '11:45'
  },
  {
    id: 'BATCH-004',
    batchCode: 'LOT-2026-0844',
    guideNumber: 'GR-002-004131',
    receptionDate: '2026-08-30',
    receptionTime: '13:10',
    truckPlate: 'V7B-842',
    driverName: 'Jorge Quispe Mendoza',
    originMine: 'Nivel 1 - Frente Esperanza',
    mineralType: 'Sulfuros Polimetálicos',
    grossWeight: 29.4,
    tareWeight: 10.2,
    netWeight: 19.2,
    moisturePct: 3.8,
    estimatedGrade: '4.1 g/t Au | 5.0 oz/t Ag',
    qualityStatus: 'optimo',
    qualityNotes: 'Excelente mineral de veta limpia. Listo para molienda continua.',
    stage: 'acopio',
    stockpile: 'Cancha A - Sulfuros Alta Ley',
    operatorName: 'Carlos Ruiz (Líder Planta)',
    dischargeTime: '13:30'
  },
  {
    id: 'BATCH-005',
    batchCode: 'LOT-2026-0845',
    guideNumber: 'GR-002-004132',
    receptionDate: '2026-08-30',
    receptionTime: '14:50',
    truckPlate: 'F2D-631',
    driverName: 'Efraín Torres Luna',
    originMine: 'Corta Principal - Rajo Norte',
    mineralType: 'Material de Desbroce / Techo',
    grossWeight: 24.1,
    tareWeight: 10.0,
    netWeight: 14.1,
    moisturePct: 12.0,
    estimatedGrade: 'Sin valor económico (< 0.2 g/t)',
    qualityStatus: 'rechazado',
    qualityNotes: 'Material desmonte rechazado para tolva. Derivado a botadero autorizado.',
    stage: 'terminado',
    stockpile: 'Botadero Mina Este',
    operatorName: 'Miguel Sánchez',
    dischargeTime: '15:10'
  },
  {
    id: 'BATCH-006',
    batchCode: 'LOT-2026-0846',
    guideNumber: 'GR-002-004133',
    receptionDate: '2026-08-30',
    receptionTime: '16:05',
    truckPlate: 'T4M-915',
    driverName: 'Marcos Benítez Solís',
    originMine: 'Nivel 2 - Galería Sur 04',
    mineralType: 'Óxidos Auríferos',
    grossWeight: 30.8,
    tareWeight: 10.5,
    netWeight: 20.3,
    moisturePct: 5.0,
    estimatedGrade: '2.9 g/t Au',
    qualityStatus: 'optimo',
    qualityNotes: 'Ingreso registrado en balanza. Pendiente confirmación de cancha de descarga.',
    stage: 'ingresado',
    stockpile: 'En Balanza / Entrada',
    operatorName: 'Carlos Ruiz (Líder Planta)'
  }
]

export const INITIAL_SHIFT_CHECKLIST: PlantShiftChecklist = {
  id: 'CHECK-PLANT-001',
  date: '2026-08-30',
  shift: 'dia',
  supervisor: 'Ing. Carlos Ruiz',
  operator: 'Pedro Castillo / Lucía Flores',
  scaleChecked: true,
  hoppersChecked: true,
  conveyorBeltsChecked: true,
  crusherChecked: true,
  ballMillChecked: true,
  tailingsDamChecked: true,
  downtimeMinutes: 25,
  downtimeReason: 'Limpieza de mallas en zaranda vibratoria secundaria.',
  notes: 'Planta de beneficio operando en régimen normal a 15 TMH/hora de tratamiento.'
}
