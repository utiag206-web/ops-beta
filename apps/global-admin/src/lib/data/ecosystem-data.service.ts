/**
 * Servicio Central de Datos del Ecosistema: INTHALY GLOBAL
 * Arquitectura Monorepo Soberana y Desacoplada
 * 
 * Centraliza la obtención de datos para las pantallas administrativas
 * de Inthaly ID, Comunidad Inthaly, InthalyOps, Academia y Transporte.
 */

export interface EcosystemKPIs {
  totalIdentities: number
  verifiedIdentities: number
  activeSessions: number
  communityMembersCount: number
  communityGroupsCount: number
  opsCompaniesCount: number
  opsActiveWorkersCount: number
  totalSecurityEvents: number
  oidcActiveClientsCount: number
}

export interface AdminIdentityRecord {
  id: string
  email: string
  displayName: string
  status: 'active' | 'suspended' | 'pending_verification'
  isVerified: boolean
  mfaEnabled: boolean
  lastLoginAt: string
  createdAt: string
  roles: string[]
}

export interface AdminOidcClientRecord {
  clientId: string
  clientName: string
  clientType: 'public' | 'confidential'
  redirectUris: string[]
  allowedScopes: string[]
  requirePkce: boolean
  isActive: boolean
  description: string
  createdAt: string
}

export interface AdminSecurityEventRecord {
  id: string
  identityEmail: string
  eventType: string
  ipAddress: string
  userAgent: string
  createdAt: string
}

export interface AdminCommunityGroupRecord {
  id: string
  name: string
  category: string
  privacy: 'public' | 'closed'
  membersCount: number
  description: string
  tags: string[]
}

export interface AdminCompanyRecord {
  id: string
  name: string
  ruc: string
  status: 'active' | 'inactive'
  isDemo: boolean
  plan: 'enterprise' | 'pro' | 'starter'
  workersCount: number
  activeTareosCount: number
  createdAt: string
}

export interface AdminAcademiaRecord {
  satelliteName: string
  framework: string
  database: string
  subdomain: string
  syncStatus: 'satellite_autonomous' | 'oidc_ready' | 'prepared_contract'
  totalCertificationsIssued: number
  activeCoursesCount: number
  lastContractCheckAt: string
}

/**
 * Retorna las métricas consolidadas del Ecosistema INTHALY
 */
export async function getEcosystemKPIs(): Promise<EcosystemKPIs> {
  return {
    totalIdentities: 2,
    verifiedIdentities: 2,
    activeSessions: 1,
    communityMembersCount: 1,
    communityGroupsCount: 5,
    opsCompaniesCount: 7,
    opsActiveWorkersCount: 42,
    totalSecurityEvents: 14,
    oidcActiveClientsCount: 3
  }
}

/**
 * Retorna el catálogo de identidades de Inthaly ID para administración soberana
 */
export async function getAdminIdentities(): Promise<AdminIdentityRecord[]> {
  return [
    {
      id: 'id-super-admin-global',
      email: 'admin@inthaly.com',
      displayName: 'Super Admin Ecosistema',
      status: 'active',
      isVerified: true,
      mfaEnabled: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: '2026-09-18T10:00:00Z',
      roles: ['super_admin']
    },
    {
      id: 'id-carlos-mendoza-1',
      email: 'carlos.mendoza@inthaly.com',
      displayName: 'Ing. Carlos Mendoza',
      status: 'active',
      isVerified: true,
      mfaEnabled: false,
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: '2026-10-18T12:00:00Z',
      roles: ['user', 'community_author']
    }
  ]
}

/**
 * Retorna los clientes OIDC registrados en el core de Inthaly ID
 */
export async function getAdminOidcClients(): Promise<AdminOidcClientRecord[]> {
  return [
    {
      clientId: 'inthaly-community-web',
      clientName: 'Comunidad Inthaly Web',
      clientType: 'public',
      redirectUris: [
        'http://localhost:3000/comunidad/callback',
        'http://localhost:3003/callback',
        'https://comunidad.inthaly.com/callback'
      ],
      allowedScopes: ['openid', 'profile', 'email', 'community.read', 'community.write'],
      requirePkce: true,
      isActive: true,
      description: 'Red social profesional de la industria y minería. Autenticación con PKCE RFC 7636.',
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      clientId: 'inthaly-global-console',
      clientName: 'Consola Global INTHALY',
      clientType: 'confidential',
      redirectUris: [
        'http://localhost:3000/super-admin/callback',
        'http://localhost:3001/callback',
        'http://localhost:3001/api/auth/callback',
        'https://admin.inthaly.com/callback'
      ],
      allowedScopes: ['openid', 'profile', 'email', 'admin.all'],
      requirePkce: false,
      isActive: true,
      description: 'Centro único de administración y supervisión del ecosistema.',
      createdAt: '2026-11-01T08:00:00Z'
    },
    {
      clientId: 'inthaly-academy-satellite',
      clientName: 'Inthaly Academia (LMS)',
      clientType: 'confidential',
      redirectUris: ['https://app.inthaly.com/auth/oidc/callback'],
      allowedScopes: ['openid', 'profile', 'email', 'academy.certifications'],
      requirePkce: false,
      isActive: true,
      description: 'Plataforma educativa y emisión de certificados SOMA (Satélite Laravel 12).',
      createdAt: '2026-11-10T08:00:00Z'
    }
  ]
}

/**
 * Retorna los eventos de auditoría y seguridad central
 */
export async function getAdminSecurityEvents(): Promise<AdminSecurityEventRecord[]> {
  const now = Date.now()
  return [
    {
      id: 'sec-evt-1',
      identityEmail: 'admin@inthaly.com',
      eventType: 'login_success',
      ipAddress: '127.0.0.1',
      userAgent: 'INTHALY GLOBAL Console Agent (Chrome)',
      createdAt: new Date(now - 120000).toISOString()
    },
    {
      id: 'sec-evt-2',
      identityEmail: 'admin@inthaly.com',
      eventType: 'app_authorized',
      ipAddress: '127.0.0.1',
      userAgent: 'OIDC Gateway / inthaly-global-console',
      createdAt: new Date(now - 300000).toISOString()
    },
    {
      id: 'sec-evt-3',
      identityEmail: 'carlos.mendoza@inthaly.com',
      eventType: 'login_success',
      ipAddress: '190.238.112.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0',
      createdAt: new Date(now - 3600000).toISOString()
    },
    {
      id: 'sec-evt-4',
      identityEmail: 'desconocido@correo.com',
      eventType: 'login_failed',
      ipAddress: '185.220.101.5',
      userAgent: 'Python-requests/2.31.0',
      createdAt: new Date(now - 86400000).toISOString()
    }
  ]
}

/**
 * Retorna los foros y comunidades de práctica de Comunidad Inthaly
 */
export async function getAdminCommunityGroups(): Promise<AdminCommunityGroupRecord[]> {
  return [
    {
      id: 'grp-soma-1',
      name: 'SOMA & Seguridad en Operaciones Mineras',
      category: 'Seguridad y Salud',
      privacy: 'public',
      membersCount: 124,
      description: 'Espacio de intercambio de protocolos, análisis de incidentes de alto potencial y cumplimiento normativo en faena.',
      tags: ['#SOMA', '#CeroAccidentes', '#IPERC']
    },
    {
      id: 'grp-mecanica-1',
      name: 'Mecánica Pesada y Mantenimiento de Flotas',
      category: 'Mantenimiento Mecánico',
      privacy: 'public',
      membersCount: 89,
      description: 'Comunidad técnica para mecánicos, electricistas y supervisores de línea amarilla, volquetes y plantas concentradoras.',
      tags: ['#Cummins', '#CAT', '#LineaAmarilla']
    },
    {
      id: 'grp-geologia-1',
      name: 'Perforación, Geología y Control de Taludes',
      category: 'Operaciones Mineras',
      privacy: 'public',
      membersCount: 67,
      description: 'Red de geólogos, perforistas y especialistas en geomecánica para intercambio de experiencias en banco y subterránea.',
      tags: ['#Geologia', '#Perforacion', '#Geomecanica']
    },
    {
      id: 'grp-transporte-1',
      name: 'Transporte de Personal y Logística Minera',
      category: 'Transporte y Carga',
      privacy: 'public',
      membersCount: 45,
      description: 'Foro especializado para coordinadores de transporte, conductores profesionales y estándares de fatiga y somnolencia.',
      tags: ['#Logistica', '#TransportePersonal', '#Fatiga']
    },
    {
      id: 'grp-legislacion-1',
      name: 'Marco Legal, Sunafil & Relaciones Laborales',
      category: 'Normativa Laboral',
      privacy: 'public',
      membersCount: 78,
      description: 'Consultas sobre regímenes atípicos mineros (14x7, 20x10), descansos compensatorios y normativa DS 024-2016-EM.',
      tags: ['#RegimenAtipico', '#Sunafil', '#DS024']
    }
  ]
}

/**
 * Retorna las empresas administradas en InthalyOps Multiempresa
 */
export async function getAdminOpsCompanies(): Promise<AdminCompanyRecord[]> {
  return [
    {
      id: 'comp-1',
      name: 'CONTRATISTAS MINEROS UNIDOS S.A.C.',
      ruc: '20601234567',
      status: 'active',
      isDemo: false,
      plan: 'enterprise',
      workersCount: 28,
      activeTareosCount: 540,
      createdAt: '2026-01-15T08:00:00Z'
    },
    {
      id: 'comp-2',
      name: 'SERVICIOS MINEROS DEL SUR S.A.',
      ruc: '20602345678',
      status: 'active',
      isDemo: false,
      plan: 'enterprise',
      workersCount: 14,
      activeTareosCount: 310,
      createdAt: '2026-02-01T08:00:00Z'
    },
    {
      id: 'comp-3',
      name: 'EXPLOTACIÓN Y MINERÍA ANDINA S.A.',
      ruc: '20603456789',
      status: 'active',
      isDemo: false,
      plan: 'pro',
      workersCount: 8,
      activeTareosCount: 165,
      createdAt: '2026-03-10T08:00:00Z'
    },
    {
      id: 'comp-demo-1',
      name: 'MINERA LAS BAMBAS DEMO',
      ruc: '20559988771',
      status: 'active',
      isDemo: true,
      plan: 'enterprise',
      workersCount: 5,
      activeTareosCount: 45,
      createdAt: '2026-04-01T08:00:00Z'
    },
    {
      id: 'comp-demo-2',
      name: 'COMPAÑÍA MINERA ANTAMINA DEMO',
      ruc: '20559988772',
      status: 'active',
      isDemo: true,
      plan: 'enterprise',
      workersCount: 4,
      activeTareosCount: 32,
      createdAt: '2026-04-02T08:00:00Z'
    },
    {
      id: 'comp-demo-3',
      name: 'SOCIEDAD MINERA CERRO VERDE DEMO',
      ruc: '20559988773',
      status: 'active',
      isDemo: true,
      plan: 'enterprise',
      workersCount: 3,
      activeTareosCount: 28,
      createdAt: '2026-04-03T08:00:00Z'
    },
    {
      id: 'comp-demo-4',
      name: 'MINERA CHINALCO DEMO',
      ruc: '20559988774',
      status: 'inactive',
      isDemo: true,
      plan: 'starter',
      workersCount: 2,
      activeTareosCount: 12,
      createdAt: '2026-04-04T08:00:00Z'
    }
  ]
}

/**
 * Retorna el estado de integración con Inthaly Academia (Satélite Laravel 12)
 */
export async function getAdminAcademiaData(): Promise<AdminAcademiaRecord> {
  return {
    satelliteName: 'Inthaly Academia LMS',
    framework: 'Laravel 12 / PHP 8.3 / Tailwind',
    database: 'MySQL 8.4 Autónomo (Sin fusión con PostgreSQL)',
    subdomain: 'app.inthaly.com',
    syncStatus: 'prepared_contract',
    totalCertificationsIssued: 342,
    activeCoursesCount: 12,
    lastContractCheckAt: new Date().toISOString()
  }
}
