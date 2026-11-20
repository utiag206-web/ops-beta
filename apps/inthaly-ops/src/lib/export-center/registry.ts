import { ReportDefinition } from './types'

export const REPORT_CATEGORIES = [
  { id: 'all', label: 'Todas las Categorías', icon: 'LayoutGrid' },
  { id: 'rrhh', label: 'Recursos Humanos', icon: 'Users' },
  { id: 'mina', label: 'Mina y Operaciones', icon: 'Pickaxe' },
  { id: 'logistica', label: 'Centro Logístico', icon: 'Boxes' },
  { id: 'finanzas', label: 'Finanzas y Caja', icon: 'Coins' },
  { id: 'soma', label: 'Seguridad SOMA', icon: 'ShieldCheck' },
] as const

export const REPORT_REGISTRY: ReportDefinition[] = [
  // ==========================================
  // RECURSOS HUMANOS (RRHH)
  // ==========================================
  {
    id: 'rrhh_tareo_mensual',
    code: 'RRHH-01',
    title: 'Matriz Mensual de Tareo y Asistencia',
    description: 'Consolidado día por día de días trabajados, descansos, horas efectivas, horas extras y minutos de tardanza.',
    category: 'rrhh',
    categoryLabel: 'Recursos Humanos',
    iconName: 'CalendarCheck',
    colorScheme: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    formats: ['excel', 'csv'],
    recommendedPeriod: 'Mes en Curso',
    quickFilters: [
      { label: 'Mes Actual', values: { periodPreset: 'month' } },
      { label: 'Mes Anterior', values: { periodPreset: 'last_month' } }
    ],
    filters: [
      { key: 'date_range', label: 'Periodo de Tareo', type: 'date_range', required: true },
      { key: 'area', label: 'Filtrar por Área', type: 'area' },
      { key: 'workerId', label: 'Trabajador Específico', type: 'worker' },
      { 
        key: 'shift', 
        label: 'Turno', 
        type: 'select',
        options: [
          { label: 'Todos los Turnos', value: 'all' },
          { label: 'Turno Día', value: 'dia' },
          { label: 'Turno Noche', value: 'noche' }
        ]
      }
    ],
    actionKey: 'export_tareo_mensual'
  },
  {
    id: 'rrhh_trabajadores',
    code: 'RRHH-02',
    title: 'Padrón Maestro de Trabajadores',
    description: 'Ficha completa de colaboradores activos e inactivos, DNI, cargo, área, fecha de ingreso, régimen y datos de contacto.',
    category: 'rrhh',
    categoryLabel: 'Recursos Humanos',
    iconName: 'Users',
    colorScheme: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all' } },
      { label: 'Solo Activos', values: { status: 'active' } },
      { label: 'Inactivos', values: { status: 'inactive' } }
    ],
    filters: [
      { key: 'searchTerm', label: 'Buscar por Nombre o DNI', type: 'text', placeholder: 'Ej. Carlos, 458921...' },
      { key: 'area', label: 'Área / Departamento', type: 'area' },
      { 
        key: 'status', 
        label: 'Estado Laboral', 
        type: 'select',
        options: [
          { label: 'Todos los Estados', value: 'all' },
          { label: 'Solo Activos', value: 'active' },
          { label: 'Inactivos / Cesados', value: 'inactive' }
        ]
      }
    ],
    actionKey: 'export_trabajadores_padron'
  },
  {
    id: 'rrhh_asistencias_historico',
    code: 'RRHH-03',
    title: 'Registro de Marcaciones y Tardanzas',
    description: 'Trazabilidad detallada de check-in, check-out, minutos de tardanza y geolocalización por rango de fechas.',
    category: 'rrhh',
    categoryLabel: 'Recursos Humanos',
    iconName: 'Clock',
    colorScheme: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    formats: ['excel', 'csv'],
    recommendedPeriod: 'Últimos 30 días',
    quickFilters: [
      { label: 'Hoy', values: { periodPreset: 'today' } },
      { label: 'Esta Semana', values: { periodPreset: 'week' } },
      { label: 'Este Mes', values: { periodPreset: 'month' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Fechas', type: 'date_range', required: true },
      { key: 'area', label: 'Área', type: 'area' },
      { key: 'workerId', label: 'Trabajador', type: 'worker' },
      {
        key: 'status',
        label: 'Tipo de Asistencia / Estado',
        type: 'select',
        options: [
          { label: 'Todos los Registros', value: 'all' },
          { label: 'Solo Presentes', value: 'presente' },
          { label: 'Solo con Tardanza (> 0 min)', value: 'tardanza' },
          { label: 'Solo Faltas', value: 'falta' }
        ]
      }
    ],
    actionKey: 'export_asistencias_detalle'
  },
  {
    id: 'rrhh_bonos_transportes',
    code: 'RRHH-04',
    title: 'Reporte de Bonificaciones y Pasajes',
    description: 'Historial de pagos adicionales, bonos de producción, reintegros y traslados de personal liquidados.',
    category: 'rrhh',
    categoryLabel: 'Recursos Humanos',
    iconName: 'BadgePercent',
    colorScheme: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all' } },
      { label: 'Pagados', values: { status: 'paid' } },
      { label: 'Pendientes', values: { status: 'pending' } }
    ],
    filters: [
      { key: 'date_range', label: 'Periodo de Pago', type: 'date_range', required: true },
      { key: 'area', label: 'Área', type: 'area' },
      { key: 'workerId', label: 'Trabajador', type: 'worker' },
      {
        key: 'conceptType',
        label: 'Tipo de Concepto',
        type: 'select',
        options: [
          { label: 'Todos los Conceptos', value: 'all' },
          { label: 'Solo Bonificaciones', value: 'bono' },
          { label: 'Solo Pasajes y Viáticos', value: 'transporte' }
        ]
      },
      { 
        key: 'status', 
        label: 'Estado de Liquidación', 
        type: 'select',
        options: [
          { label: 'Todos los Estados', value: 'all' },
          { label: 'Pagados / Liquidados', value: 'paid' },
          { label: 'Pendientes de Pago', value: 'pending' }
        ]
      }
    ],
    actionKey: 'export_bonos_transportes'
  },
  {
    id: 'rrhh_entregas_epp',
    code: 'RRHH-05',
    title: 'Control de Entrega de EPPs y Firmas',
    description: 'Registro auditable de entrega de implementos de seguridad, tallas, fechas y estado de firma digital.',
    category: 'rrhh',
    categoryLabel: 'Recursos Humanos',
    iconName: 'Shield',
    colorScheme: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all' } },
      { label: 'Firmados', values: { status: 'signed' } },
      { label: 'Pendiente Firma', values: { status: 'pending' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Entrega', type: 'date_range' },
      { key: 'area', label: 'Área', type: 'area' },
      { key: 'workerId', label: 'Trabajador', type: 'worker' },
      {
        key: 'status',
        label: 'Estado de Firma Digital',
        type: 'select',
        options: [
          { label: 'Todos los Registros', value: 'all' },
          { label: 'Con Firma Conforme', value: 'signed' },
          { label: 'Pendientes de Firma', value: 'pending' }
        ]
      }
    ],
    actionKey: 'export_entregas_epp'
  },

  // ==========================================
  // MINA Y OPERACIONES (MINA)
  // ==========================================
  {
    id: 'mina_produccion_diaria',
    code: 'MINA-01',
    title: 'Consolidado de Producción por Labores',
    description: 'Control de carros extraídos, metros de avance, clavos, cambuchos, chocolate, pita, tipo de mineral y turno.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'Pickaxe',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    recommendedPeriod: 'Semana / Mes',
    quickFilters: [
      { label: 'Esta Semana', values: { periodPreset: 'week' } },
      { label: 'Este Mes', values: { periodPreset: 'month' } },
      { label: 'Turno Día', values: { status: 'dia' } },
      { label: 'Turno Noche', values: { status: 'noche' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Producción', type: 'date_range', required: true },
      { key: 'searchTerm', label: 'Labor / Frente de Trabajo', type: 'text', placeholder: 'Ej. NV-380, Galería 4...' },
      { 
        key: 'status', 
        label: 'Turno Operativo', 
        type: 'select',
        options: [
          { label: 'Todos los Turnos', value: 'all' },
          { label: 'Turno Día', value: 'dia' },
          { label: 'Turno Noche', value: 'noche' }
        ]
      }
    ],
    actionKey: 'export_produccion_mina'
  },
  {
    id: 'mina_consumo_maderas',
    code: 'MINA-02',
    title: 'Consumo de Maderas y Cuadros de Sostenimiento',
    description: 'Ingreso, despacho y consumo de tablas 2", rajas, puntales de 8", 6" y 4" por labor y zona de sostenimiento.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'TreePine',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Este Mes', values: { periodPreset: 'month' } },
      { label: 'Mes Anterior', values: { periodPreset: 'last_month' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Fechas', type: 'date_range', required: true },
      { key: 'searchTerm', label: 'Labor / Frente', type: 'text', placeholder: 'Ej. Labor 12...' },
      { key: 'warehouseId', label: 'Almacén / Depósito de Madera', type: 'warehouse' },
      {
        key: 'status',
        label: 'Turno',
        type: 'select',
        options: [
          { label: 'Todos los Turnos', value: 'all' },
          { label: 'Turno Día', value: 'dia' },
          { label: 'Turno Noche', value: 'noche' }
        ]
      }
    ],
    actionKey: 'export_maderas_mina'
  },
  {
    id: 'mina_mantenimiento_equipos',
    code: 'MINA-03',
    title: 'Historial de Mantenimiento de Maquinaria y Vehículos',
    description: 'Registro de intervenciones preventivas y correctivas de camionetas, grupos electrógenos, compresoras y maquinaria.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'Wrench',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all' } },
      { label: 'Operativos', values: { status: 'operativo' } },
      { label: 'En Mantenimiento', values: { status: 'mantenimiento' } }
    ],
    filters: [
      { key: 'searchTerm', label: 'Buscar por Nombre, Código o Placa', type: 'text', placeholder: 'Ej. Camioneta Hilux, EQ-01...' },
      { 
        key: 'status', 
        label: 'Estado Operativo del Activo', 
        type: 'select',
        options: [
          { label: 'Todos los Estados', value: 'all' },
          { label: 'Operativo', value: 'operativo' },
          { label: 'En Mantenimiento / Taller', value: 'mantenimiento' },
          { label: 'De Baja / Inoperativo', value: 'inactivo' }
        ]
      }
    ],
    actionKey: 'export_mantenimientos_equipos'
  },
  {
    id: 'mina_control_combustible',
    code: 'MINA-04',
    title: 'Despacho de Combustible y Rendimiento Diésel',
    description: 'Galones despachados, horómetros inicial/final y ratio de consumo (gal/hr) para generadores, compresoras y vehículos.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'Fuel',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    filters: [
      { key: 'date_range', label: 'Periodo de Despacho', type: 'date_range', required: true },
      { 
        key: 'equipmentType', 
        label: 'Equipo / Unidad de Destino', 
        type: 'select',
        options: [
          { label: 'Todos los Equipos', value: 'all' },
          { label: 'Generador Eléctrico Principal', value: 'generador' },
          { label: 'Compresora de Mina', value: 'compresora' },
          { label: 'Flota de Vehículos', value: 'vehiculo' }
        ]
      }
    ],
    actionKey: 'export_combustible_detalle'
  },
  {
    id: 'mina_checklists_equipos',
    code: 'MINA-05',
    title: 'Checklists Pre-Uso de Maquinaria y Vehículos',
    description: 'Inspecciones técnicas de 10 puntos críticos previas al inicio de turno, observaciones y conformidad de operatividad.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'ClipboardCheck',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    filters: [
      { key: 'date_range', label: 'Rango de Inspección', type: 'date_range' },
      { 
        key: 'status', 
        label: 'Resultado de Inspección', 
        type: 'select',
        options: [
          { label: 'Todos los Resultados', value: 'all' },
          { label: 'Aprobados / Conformes', value: 'aprobado' },
          { label: 'Observados', value: 'observado' },
          { label: 'Rechazados / Inoperativos', value: 'rechazado' }
        ]
      }
    ],
    actionKey: 'export_checklists_equipos'
  },
  {
    id: 'mina_inventario_herramientas',
    code: 'MINA-06',
    title: 'Inventario y Custodia de Herramientas de Taller',
    description: 'Catálogo de herramientas, custodio asignado, ubicación física en taller y semáforo de estado operativo.',
    category: 'mina',
    categoryLabel: 'Mina y Operaciones',
    iconName: 'Hammer',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800'
    },
    formats: ['excel', 'csv'],
    filters: [
      { key: 'searchTerm', label: 'Herramienta / Código / Custodio', type: 'text', placeholder: 'Ej. Taladro, Llave 1/2...' },
      { 
        key: 'status', 
        label: 'Condición Operativa', 
        type: 'select',
        options: [
          { label: 'Todas las Condiciones', value: 'all' },
          { label: 'Operativo', value: 'operativo' },
          { label: 'En Mantenimiento', value: 'en_reparacion' },
          { label: 'De Baja', value: 'de_baja' }
        ]
      }
    ],
    actionKey: 'export_herramientas_taller'
  },

  // ==========================================
  // CENTRO LOGÍSTICO (LOGÍSTICA)
  // ==========================================
  {
    id: 'logistica_catalogo_productos',
    code: 'LOG-01',
    title: 'Catálogo Maestro de Productos e Insumos',
    description: 'Maestro general de ítems registrados, códigos SKU, rubro, categoría, unidades de medida y estado.',
    category: 'logistica',
    categoryLabel: 'Centro Logístico',
    iconName: 'LayoutGrid',
    colorScheme: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all', stockCondition: 'all' } },
      { label: 'Activos', values: { status: 'active' } },
      { label: 'Inactivos', values: { status: 'inactive' } },
      { label: 'Con Stock', values: { stockCondition: 'with_stock' } },
      { label: 'Sin Stock', values: { stockCondition: 'no_stock' } }
    ],
    filters: [
      { key: 'searchTerm', label: 'Código SKU, Nombre o Descripción', type: 'text', placeholder: 'Ej. BROCA-12, Aceite...' },
      { key: 'warehouseId', label: 'Almacén de Referencia', type: 'warehouse' },
      { 
        key: 'status', 
        label: 'Estado del Producto', 
        type: 'select',
        options: [
          { label: 'Todos los Estados', value: 'all' },
          { label: 'Activo', value: 'active' },
          { label: 'Inactivo', value: 'inactive' },
          { label: 'Descontinuado', value: 'discontinued' }
        ]
      },
      {
        key: 'stockCondition',
        label: 'Condición de Stock',
        type: 'select',
        options: [
          { label: 'Todos (Con y Sin Stock)', value: 'all' },
          { label: 'Solo con Stock (> 0)', value: 'with_stock' },
          { label: 'Solo sin Stock (= 0)', value: 'no_stock' }
        ]
      }
    ],
    actionKey: 'export_catalogo_productos'
  },
  {
    id: 'logistica_control_stock',
    code: 'LOG-02',
    title: 'Reporte de Stock Actual y Niveles Críticos',
    description: 'Existencias actuales por almacén, unidad de medida, stock mínimo configurado y alerta de reposición urgente.',
    category: 'logistica',
    categoryLabel: 'Centro Logístico',
    iconName: 'Boxes',
    colorScheme: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todo el Stock', values: { status: 'all' } },
      { label: 'Normal', values: { status: 'normal' } },
      { label: 'Bajo Stock', values: { status: 'low' } },
      { label: 'Crítico', values: { status: 'critical' } },
      { label: 'Agotado (Cero)', values: { status: 'out_of_stock' } }
    ],
    filters: [
      { key: 'searchTerm', label: 'Buscar Producto o Código', type: 'text', placeholder: 'Ej. Casco, Grasa...' },
      { key: 'warehouseId', label: 'Almacén / Bodega Específica', type: 'warehouse' },
      { 
        key: 'status', 
        label: 'Nivel / Estado de Existencia', 
        type: 'select',
        options: [
          { label: 'Todo el Inventario', value: 'all' },
          { label: 'Stock Normal', value: 'normal' },
          { label: 'Stock Bajo / Advertencia', value: 'low' },
          { label: 'Stock Crítico (Bajo Mínimo)', value: 'critical' },
          { label: 'Agotado (Stock 0)', value: 'out_of_stock' }
        ]
      }
    ],
    actionKey: 'export_stock_actual'
  },
  {
    id: 'logistica_kardex_movimientos',
    code: 'LOG-03',
    title: 'Trazabilidad Kardex Físico y Movimientos',
    description: 'Historial detallado de entradas, salidas, transferencias internas, documentos de sustento, saldos inicial y final.',
    category: 'logistica',
    categoryLabel: 'Centro Logístico',
    iconName: 'History',
    colorScheme: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800'
    },
    formats: ['excel', 'csv'],
    recommendedPeriod: 'Mes / Rango Personalizado',
    quickFilters: [
      { label: 'Este Mes', values: { periodPreset: 'month' } },
      { label: 'Mes Anterior', values: { periodPreset: 'last_month' } },
      { label: 'Solo Entradas', values: { status: 'ingreso' } },
      { label: 'Solo Salidas', values: { status: 'salida' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Movimientos', type: 'date_range', required: true },
      { key: 'searchTerm', label: 'Buscar por Producto o N° Documento', type: 'text', placeholder: 'Ej. TRS-001, GR-102...' },
      { key: 'warehouseId', label: 'Almacén', type: 'warehouse' },
      { 
        key: 'status', 
        label: 'Tipo de Movimiento', 
        type: 'select',
        options: [
          { label: 'Todos los Movimientos', value: 'all' },
          { label: 'Solo Entradas / Compras', value: 'ingreso' },
          { label: 'Solo Salidas / Despachos', value: 'salida' }
        ]
      },
      { key: 'includeInitialBalance', label: 'Incluir Fila de Saldo Inicial y Final', type: 'checkbox', defaultValue: true }
    ],
    actionKey: 'export_kardex_general'
  },

  // ==========================================
  // FINANZAS Y GESTIÓN (FINANZAS)
  // ==========================================
  {
    id: 'finanzas_caja_chica_oficial',
    code: 'FIN-01',
    title: 'Libro Oficial y Auditable de Caja Chica',
    description: 'Movimientos de ingresos y egresos con RUC de empresa, número de operación, comprobantes adjuntos y saldo neto auditado.',
    category: 'finanzas',
    categoryLabel: 'Finanzas y Caja',
    iconName: 'Coins',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800'
    },
    formats: ['excel', 'csv'],
    recommendedPeriod: 'Mes en Curso',
    quickFilters: [
      { label: 'Este Mes', values: { periodPreset: 'month' } },
      { label: 'Mes Anterior', values: { periodPreset: 'last_month' } },
      { label: 'Solo Ingresos', values: { status: 'ingreso' } },
      { label: 'Solo Egresos', values: { status: 'egreso' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Operación', type: 'date_range', required: true },
      { key: 'searchTerm', label: 'Buscar por Concepto o N° Operación', type: 'text', placeholder: 'Ej. Combustible, OP-1049...' },
      { key: 'area', label: 'Caja / Área Asignada', type: 'area' },
      { 
        key: 'status', 
        label: 'Tipo de Flujo Financiero', 
        type: 'select',
        options: [
          { label: 'Todos los Movimientos', value: 'all' },
          { label: 'Solo Ingresos / Fondos', value: 'ingreso' },
          { label: 'Solo Egresos / Gastos', value: 'egreso' }
        ]
      },
      {
        key: 'paymentMethod',
        label: 'Método de Pago',
        type: 'select',
        options: [
          { label: 'Todos los Métodos', value: 'all' },
          { label: 'Efectivo', value: 'efectivo' },
          { label: 'Transferencia Bancaria', value: 'transferencia' },
          { label: 'Yape / Plin', value: 'yape' }
        ]
      }
    ],
    actionKey: 'export_caja_chica_oficial'
  },
  {
    id: 'finanzas_requerimientos_compras',
    code: 'FIN-02',
    title: 'Consolidado de Requerimientos y Pedidos de Compra',
    description: 'Solicitudes generadas por todas las áreas (Mina, Taller, Logística, SOMA), ítems solicitados, prioridad y estado de aprobación.',
    category: 'finanzas',
    categoryLabel: 'Finanzas y Caja',
    iconName: 'FileText',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todos', values: { status: 'all' } },
      { label: 'Pendientes', values: { status: 'pendiente' } },
      { label: 'Aprobados', values: { status: 'aprobado' } }
    ],
    filters: [
      { key: 'date_range', label: 'Fecha de Solicitud', type: 'date_range' },
      { key: 'searchTerm', label: 'Título o Ítem Solicitado', type: 'text', placeholder: 'Ej. Repuestos, Cables...' },
      { key: 'area', label: 'Área Solicitante', type: 'area' },
      { 
        key: 'status', 
        label: 'Estado del Pedido', 
        type: 'select',
        options: [
          { label: 'Todos los Estados', value: 'all' },
          { label: 'Pendientes de Aprobación', value: 'pendiente' },
          { label: 'Aprobados', value: 'aprobado' },
          { label: 'Rechazados', value: 'rechazado' }
        ]
      },
      {
        key: 'priority',
        label: 'Nivel de Prioridad',
        type: 'select',
        options: [
          { label: 'Todas las Prioridades', value: 'all' },
          { label: 'Alta / Emergencia', value: 'alta' },
          { label: 'Media', value: 'media' },
          { label: 'Baja', value: 'baja' }
        ]
      }
    ],
    actionKey: 'export_requerimientos_consolidado'
  },

  // ==========================================
  // SEGURIDAD Y SALUD OCUPACIONAL (SOMA)
  // ==========================================
  {
    id: 'soma_charlas_seguridad',
    code: 'SOMA-01',
    title: 'Libro de Charlas de Seguridad de 5 Minutos',
    description: 'Registro de temas tratados, fecha, líder expositor, cantidad de asistentes y evidencia de cumplimiento HSEC.',
    category: 'soma',
    categoryLabel: 'Seguridad SOMA',
    iconName: 'MessageSquare',
    colorScheme: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800'
    },
    formats: ['excel', 'csv'],
    filters: [
      { key: 'date_range', label: 'Periodo de Charlas', type: 'date_range' },
      { key: 'searchTerm', label: 'Tema / Tópico Tratado', type: 'text', placeholder: 'Ej. EPPs, Bloqueo y Etiquetado...' },
      { key: 'area', label: 'Área Objetivo', type: 'area' }
    ],
    actionKey: 'export_soma_charlas'
  },
  {
    id: 'soma_capacitaciones_matriz',
    code: 'SOMA-02',
    title: 'Matriz de Capacitaciones y Entrenamientos',
    description: 'Plan anual de capacitación, capacitador, vigencia de certificaciones y horas-hombre de formación.',
    category: 'soma',
    categoryLabel: 'Seguridad SOMA',
    iconName: 'GraduationCap',
    colorScheme: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800'
    },
    formats: ['excel', 'csv'],
    filters: [
      { key: 'date_range', label: 'Fecha de Capacitación', type: 'date_range' },
      { key: 'searchTerm', label: 'Nombre del Curso / Instructor', type: 'text', placeholder: 'Ej. Primeros Auxilios...' }
    ],
    actionKey: 'export_soma_capacitaciones'
  },
  {
    id: 'soma_incidencias_libro',
    code: 'SOMA-03',
    title: 'Libro Oficial de Incidencias y Accidentes',
    description: 'Registro de incidentes, actos y condiciones subestándar, nivel de severidad, medidas correctivas y estado de cierre.',
    category: 'soma',
    categoryLabel: 'Seguridad SOMA',
    iconName: 'ShieldAlert',
    colorScheme: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800'
    },
    formats: ['excel', 'csv'],
    quickFilters: [
      { label: 'Todas', values: { status: 'all' } },
      { label: 'Abiertas', values: { status: 'abierta' } },
      { label: 'Cerradas', values: { status: 'cerrada' } }
    ],
    filters: [
      { key: 'date_range', label: 'Rango de Incidencias', type: 'date_range' },
      { key: 'searchTerm', label: 'Buscar por Título o Descripción', type: 'text', placeholder: 'Ej. Caída de roca, Falla eléctrica...' },
      { 
        key: 'status', 
        label: 'Estado de Incidencia', 
        type: 'select',
        options: [
          { label: 'Todas', value: 'all' },
          { label: 'Abiertas / En Proceso', value: 'abierta' },
          { label: 'Cerradas / Resueltas', value: 'cerrada' }
        ]
      },
      {
        key: 'severity',
        label: 'Nivel de Severidad',
        type: 'select',
        options: [
          { label: 'Todas las Severidades', value: 'all' },
          { label: 'Baja', value: 'baja' },
          { label: 'Media', value: 'media' },
          { label: 'Alta / Crítica', value: 'alta' }
        ]
      }
    ],
    actionKey: 'export_soma_incidencias'
  }
]
