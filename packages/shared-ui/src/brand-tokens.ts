/**
 * Tokens de Identidad Visual Corporativa INTHALY
 * Azul corporativo, blanco, fondos claros y acentos sobrios.
 */

export const INTHALY_BRAND = {
  name: 'INTHALY',
  tagline: 'Tecnología e Innovación para la Industria y Minería',
  colors: {
    // Azul institucional
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#0F172A',
    },
    // Neutros corporativos
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    // Estados del Centro de Control
    status: {
      success: '#10B981', // Esmeralda / Operativo
      warning: '#F59E0B', // Ámbar / Degradado
      error: '#EF4444',   // Rojo / Crítico
      offline: '#6B7280', // Gris / Sin conexión
      pending: '#3B82F6', // Azul / Pendiente
    }
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
} as const
