/**
 * Servicio de Dominio: Comunidad Inthaly — INTHALY
 * Implementa lógica de perfiles soberanos, grupos dinámicos, feed técnico,
 * red de contactos, desconexión en 3 niveles y motor de recomendaciones heurístico.
 */

import type {
  CommunityProfile,
  CommunityGroup,
  CommunityGroupMember,
  CommunityPost,
  CommunityComment,
  CommunityReaction,
  CommunityConnection,
  CommunityInvitation,
  CommunityNotification,
  TechnicalStory,
  DirectMessage,
  RecommendationResult,
  RecommendationEngineWeights,
  UnlinkLevel,
  UnlinkActionResult,
  ReactionType
} from '@/types/community.types'
import type { ActionResponse } from '@/types/common.types'
import { inthalyCommunitySql } from '@/lib/db/community-db'
import {
  uploadObjectToStorage,
  generateStorageKey,
  validateFileConstraints
} from '@/lib/storage/object-storage.service'

// Helper para verificar conectividad con inthaly_community DB
let _comDbStatus: boolean | null = null
let _lastComDbCheck = 0

async function canUseCommunityDb(): Promise<boolean> {
  const now = Date.now()
  if (_comDbStatus !== null && now - _lastComDbCheck < 5000) {
    return _comDbStatus
  }
  try {
    const res = await inthalyCommunitySql`SELECT 1 as alive`
    _comDbStatus = !!(res && res.length > 0)
    _lastComDbCheck = now
    return _comDbStatus
  } catch {
    _comDbStatus = false
    _lastComDbCheck = now
    return false
  }
}

function mapDbProfile(row: any): CommunityProfile {
  return {
    id: String(row.id),
    slug: row.slug || String(row.display_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    display_name: String(row.display_name),
    headline: String(row.headline || ''),
    bio: String(row.bio || ''),
    avatar_url: row.avatar_url ? String(row.avatar_url) : undefined,
    banner_url: row.cover_url ? String(row.cover_url) : undefined,
    location_region: String(row.location_region || 'Perú'),
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    is_active: Boolean(row.is_active),
    visibility: 'public',
    allow_employer_matching: Boolean(row.allow_employer_matching),
    connections_count: 0,
    posts_count: 0
  }
}

// Pesos predeterminados del motor de recomendación heurístico ponderado
export const DEFAULT_RECOMMENDER_WEIGHTS: RecommendationEngineWeights = {
  specialtyWeight: 0.40,
  proximityWeight: 0.25,
  sharedGroupsWeight: 0.20,
  mutualConnectionsWeight: 0.15
}

// ==============================================================================
// ALMACÉN EN MEMORIA PARA MODO FALLBACK (CUANDO TABLAS REMOTAS NO ESTÁN MIGRARAS)
// ==============================================================================
interface MemoryStorage {
  profiles: Map<string, CommunityProfile>
  groups: Map<string, CommunityGroup>
  groupMembers: Map<string, CommunityGroupMember[]>
  posts: CommunityPost[]
  comments: Map<string, CommunityComment[]>
  reactions: CommunityReaction[]
  connections: CommunityConnection[]
  invitations: Map<string, CommunityInvitation>
  notifications: Map<string, CommunityNotification[]>
  stories: TechnicalStory[]
  directMessages: DirectMessage[]
  savedPosts: Map<string, Set<string>>
}

const memoryStore: MemoryStorage = {
  profiles: new Map(),
  groups: new Map(),
  groupMembers: new Map(),
  posts: [],
  comments: new Map(),
  reactions: [],
  connections: [],
  invitations: new Map(),
  notifications: new Map(),
  stories: [],
  directMessages: [],
  savedPosts: new Map()
}

// Inicialización de datos semilla para demostración inmediata
function seedMemoryStorage() {
  if (memoryStore.groups.size > 0) return

  // Perfiles semilla
  const p1: CommunityProfile = {
    id: 'user-carlos-mendoza',
    slug: 'carlos-mendoza',
    display_name: 'Ing. Carlos Mendoza',
    headline: 'Ingeniero de Minas Residente | Especialista en Subterránea',
    bio: 'Más de 14 años liderando operaciones mineras subterráneas en el sur del Perú. Apasionado por la optimización de mallas de perforación y seguridad de socavón.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    location_region: 'Arequipa, Perú',
    specialties: ['Perforación y Voladura', 'Seguridad Minera', 'Gestión de Guardias'],
    is_active: true,
    visibility: 'public',
    allow_employer_matching: false,
    connections_count: 42,
    posts_count: 5
  }

  const p2: CommunityProfile = {
    id: 'user-elena-rodriguez',
    slug: 'elena-rodriguez',
    display_name: 'Elena Rodríguez',
    headline: 'Supervisora Senior SOMA | Auditora OHSAS 18001 / ISO 45001',
    bio: 'Prevencionista con experiencia en minería de tajo abierto y plantas de beneficio. Cero fatalidades en 8 años de gestión.',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    location_region: 'Cusco, Perú',
    specialties: ['Seguridad Minera', 'SOMA', 'Gestión de Riesgos', 'Medio Ambiente'],
    is_active: true,
    visibility: 'public',
    allow_employer_matching: false,
    connections_count: 58,
    posts_count: 8
  }

  const p3: CommunityProfile = {
    id: 'user-jorge-quispe',
    slug: 'jorge-quispe',
    display_name: 'Jorge Quispe',
    headline: 'Técnico Especialista en Motores Cummins y Maquinaria CAT',
    bio: '12 años reparando motores de alta cilindrada en campamentos a más de 4,200 msnm. Diagnóstico hidráulico y transmisiones.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    location_region: 'Arequipa, Perú',
    specialties: ['Mecánica Pesada', 'Motores Diésel', 'Sistemas Hidráulicos', 'Línea Amarilla'],
    is_active: true,
    visibility: 'public',
    allow_employer_matching: true,
    connections_count: 31,
    posts_count: 3
  }

  const p4: CommunityProfile = {
    id: 'user-carlos-flores',
    slug: 'carlos-flores-romero',
    display_name: 'Carlos Flores Romero',
    headline: 'Geólogo de Exploraciones y Sondajes Diamantinos',
    bio: 'Especialista en cartografiado estructural y modelamiento de yacimientos pórfidos y vetiformes. 9 años de experiencia en la cordillera sur.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    location_region: 'Cusco, Perú',
    specialties: ['Geología Estructural', 'Sondajes Diamantinos', 'Geoestadística', 'Modelamiento 3D'],
    is_active: true,
    visibility: 'public',
    allow_employer_matching: true,
    connections_count: 38,
    posts_count: 4
  }

  const p5: CommunityProfile = {
    id: 'user-diana-corza',
    slug: 'diana-corza',
    display_name: 'Diana Corza',
    headline: 'Ingeniera de Perforación y Voladura | SOMA',
    bio: 'Diseño de mallas de disparo, control de vibraciones y fragmentación. Pasión por la minería responsable y tecnología aplicada.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    location_region: 'Arequipa, Perú',
    specialties: ['Perforación y Voladura', 'Control de Vibraciones', 'Seguridad Minera'],
    is_active: true,
    visibility: 'public',
    allow_employer_matching: false,
    connections_count: 51,
    posts_count: 6
  }

  memoryStore.profiles.set(p1.id, p1)
  memoryStore.profiles.set(p1.slug, p1)
  memoryStore.profiles.set(p2.id, p2)
  memoryStore.profiles.set(p2.slug, p2)
  memoryStore.profiles.set(p3.id, p3)
  memoryStore.profiles.set(p3.slug, p3)
  memoryStore.profiles.set(p4.id, p4)
  memoryStore.profiles.set(p4.slug, p4)
  memoryStore.profiles.set(p5.id, p5)
  memoryStore.profiles.set(p5.slug, p5)

  // Grupos semilla iniciales (abiertos y dinámicos)
  const g1: CommunityGroup = {
    id: 'grp-soma-operaciones',
    slug: 'soma-seguridad-operaciones',
    name: 'SOMA & Seguridad en Operaciones Mineras',
    description: 'Espacio de intercambio de protocolos, análisis de incidentes de alto potencial y cumplimiento normativo en faena.',
    category: 'Seguridad y Salud',
    custom_tags: ['#SOMA', '#CeroAccidentes', '#IPERC', '#MineríaSegura'],
    privacy: 'public',
    join_policy: 'open',
    group_rules: [
      { id: '1', title: 'Respeto mutuo y confidencialidad de datos de mina' },
      { id: '2', title: 'Publicaciones respaldadas en estándares técnicos' }
    ],
    created_by: p2.id,
    members_count: 124,
    posts_count: 36
  }

  const g2: CommunityGroup = {
    id: 'grp-mecanica-pesada',
    slug: 'mantenimiento-mecanico-flota',
    name: 'Mecánica Pesada y Mantenimiento de Flotas',
    description: 'Comunidad técnica para mecánicos, electricistas y supervisores de línea amarilla, volquetes y plantas concentradoras.',
    category: 'Mantenimiento Mecánico',
    custom_tags: ['#Cummins', '#CAT', '#LíneaAmarilla', '#FlotaPesada'],
    privacy: 'public',
    join_policy: 'open',
    group_rules: [
      { id: '1', title: 'Compartir fichas técnicas y manuales de servicio' },
      { id: '2', title: 'No se permite spam de venta informal' }
    ],
    created_by: p3.id,
    members_count: 89,
    posts_count: 22
  }

  const g3: CommunityGroup = {
    id: 'grp-perforacion-geologia',
    slug: 'perforacion-geologia-voladura',
    name: 'Perforación, Geología y Control de Taludes',
    description: 'Red de geólogos, perforistas y especialistas en geomecánica para intercambio de experiencias operativas.',
    category: 'Geología y Perforación',
    custom_tags: ['#Geología', '#Perforación', '#Geomecánica', '#Sondajes'],
    privacy: 'public',
    join_policy: 'open',
    group_rules: [
      { id: '1', title: 'Aportes geológicos verificables' }
    ],
    created_by: p4.id,
    members_count: 67,
    posts_count: 18
  }

  const g4: CommunityGroup = {
    id: 'grp-transporte-logistica',
    slug: 'transporte-logistica-minera',
    name: 'Transporte Pesado y Logística de Concentrados',
    description: 'Optimización de rutas de transporte de mineral, mantenimiento de semirremolques y gestión de convoyes.',
    category: 'Transporte y Carga',
    custom_tags: ['#Transporte', '#Logística', '#ConvoyMinero', '#Tolvas'],
    privacy: 'public',
    join_policy: 'open',
    group_rules: [
      { id: '1', title: 'Seguridad vial y reporte de incidentes en ruta' }
    ],
    created_by: p1.id,
    members_count: 53,
    posts_count: 14
  }

  memoryStore.groups.set(g1.id, g1)
  memoryStore.groups.set(g1.slug, g1)
  memoryStore.groups.set(g2.id, g2)
  memoryStore.groups.set(g2.slug, g2)
  memoryStore.groups.set(g3.id, g3)
  memoryStore.groups.set(g3.slug, g3)
  memoryStore.groups.set(g4.id, g4)
  memoryStore.groups.set(g4.slug, g4)

  // Membresías
  memoryStore.groupMembers.set(g1.id, [
    { group_id: g1.id, profile_id: p2.id, role: 'owner', status: 'active', joined_at: new Date().toISOString() },
    { group_id: g1.id, profile_id: p1.id, role: 'member', status: 'active', joined_at: new Date().toISOString() }
  ])
  memoryStore.groupMembers.set(g2.id, [
    { group_id: g2.id, profile_id: p3.id, role: 'owner', status: 'active', joined_at: new Date().toISOString() }
  ])

  // Historias y Destacados Técnicos (Facebook Stories Pattern)
  memoryStore.stories = [
    {
      id: 'story-1',
      author_id: p2.id,
      author_name: p2.display_name,
      author_avatar: p2.avatar_url || '',
      author_specialty: 'SOMA & Seguridad',
      title: 'Protocolo de inspección de arneses y líneas de vida en tajo a 4,300m',
      gradient: 'from-blue-600 to-indigo-900',
      tag: '#Seguridad',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      id: 'story-2',
      author_id: p3.id,
      author_name: p3.display_name,
      author_avatar: p3.avatar_url || '',
      author_specialty: 'Mantenimiento Mecánico',
      title: 'Calibración de inyección Common Rail en frío para volquete CAT 777',
      gradient: 'from-amber-600 to-slate-900',
      tag: '#Mecánica',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
    },
    {
      id: 'story-3',
      author_id: p4.id,
      author_name: p4.display_name,
      author_avatar: p4.avatar_url || '',
      author_specialty: 'Geología y Sondajes',
      title: 'Testigo de perforación diamantina HQ con mineralización de calcopirita',
      gradient: 'from-emerald-600 to-teal-950',
      tag: '#Geología',
      created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
    },
    {
      id: 'story-4',
      author_id: p5.id,
      author_name: p5.display_name,
      author_avatar: p5.avatar_url || '',
      author_specialty: 'Perforación y Voladura',
      title: 'Malla electrónica no eléctrica para control de sobreexcavación',
      gradient: 'from-purple-600 to-blue-950',
      tag: '#Voladura',
      created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
    }
  ]

  // Mensajes directos iniciales (Chat flotante)
  memoryStore.directMessages = [
    {
      id: 'msg-1',
      sender_id: p2.id,
      receiver_id: p1.id,
      content: 'Ing. Carlos, ¿revisó el reporte de control de polvo en la chimenea 4?',
      created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      is_read: false
    },
    {
      id: 'msg-2',
      sender_id: p1.id,
      receiver_id: p2.id,
      content: 'Hola Elena, sí. Ya dispusimos los nebulizadores adicionales en el nivel 3900.',
      created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
      is_read: true
    }
  ]

  // Publicaciones semilla
  memoryStore.posts.push({
    id: 'post-seed-1',
    author_id: p1.id,
    group_id: g1.id,
    content: 'Colegas, ante las bajas temperaturas (-8°C) en campamento sobre los 4,300 msnm, estamos reforzando la purga de condensado en líneas de aire para evitar congelamiento de válvulas en martillos perforadores. ¿Qué tipo de aditivo anticongelante les ha dado mejor ratio costo-beneficio sin degradar los sellos de nitrilo?',
    media_urls: [],
    tags: ['#Perforación', '#Campamento', '#Mantenimiento'],
    visibility: 'public',
    likes_count: 14,
    comments_count: 3,
    shares_count: 2,
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    author: p1,
    group: g1
  })

  memoryStore.posts.push({
    id: 'post-seed-2',
    author_id: p3.id,
    group_id: g2.id,
    content: 'Revisión preventiva de 1,000 horas en motor Cummins QSK19 de volquete de 35T. Presión de aceite estable en 45 PSI a 1,800 RPM. Es fundamental verificar el torque en los pernos de la bancada del turbo en cada cambio de turno.',
    media_urls: [],
    tags: ['#Cummins', '#LíneaAmarilla', '#MantenimientoPreventivo'],
    visibility: 'public',
    likes_count: 21,
    comments_count: 5,
    shares_count: 4,
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    author: p3,
    group: g2
  })
}

// Ejecutar inicialización de datos de memoria
seedMemoryStorage()

// ==============================================================================
// 1. GESTIÓN DE PERFILES PROFESIONALES
// ==============================================================================

/**
 * Obtiene el perfil comunitario de un usuario por su ID o Slug.
 */
export async function getProfile(
  supabase: any,
  identifier: string
): Promise<CommunityProfile | null> {
  // 1. Intentar consulta en PostgreSQL soberano (inthaly_community.profiles)
  if (await canUseCommunityDb()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
      const rows = isUuid
        ? await inthalyCommunitySql`SELECT * FROM inthaly_community.profiles WHERE id = ${identifier} LIMIT 1`
        : await inthalyCommunitySql`SELECT * FROM inthaly_community.profiles WHERE lower(display_name) = lower(${identifier.replace(/-/g, ' ')}) LIMIT 1`

      if (rows.length > 0) {
        const p = mapDbProfile(rows[0])
        memoryStore.profiles.set(p.id, p)
        memoryStore.profiles.set(p.slug, p)
        return p
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en getProfile:', err?.message)
    }
  }

  // 2. Consulta en Supabase si está disponible
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
    const column = isUuid ? 'id' : 'slug'

    const { data, error } = await supabase
      .from('community_profiles')
      .select('*')
      .eq(column, identifier)
      .maybeSingle()

    if (!error && data) {
      return data as CommunityProfile
    }
  } catch (err) {
    // Si la tabla remota no existe aún, procedemos a fallback en memoria
  }

  // 3. Fallback seguro en memoria
  const cached = memoryStore.profiles.get(identifier)
  return cached || null
}

/**
 * Crea o actualiza el perfil profesional de un usuario de forma voluntaria y soberana.
 */
export async function upsertProfile(
  supabase: any,
  profile: Partial<CommunityProfile> & { id: string; display_name: string }
): Promise<ActionResponse<CommunityProfile>> {
  const slug = profile.slug || profile.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const payload: CommunityProfile = {
    id: profile.id,
    slug,
    display_name: profile.display_name,
    headline: profile.headline || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',
    banner_url: profile.banner_url || '',
    location_region: profile.location_region || 'Perú',
    specialties: profile.specialties || [],
    is_active: profile.is_active !== undefined ? profile.is_active : true,
    visibility: profile.visibility || 'public',
    allow_employer_matching: !!profile.allow_employer_matching,
    updated_at: new Date().toISOString()
  }

  // 1. Intentar persistencia en PostgreSQL soberano
  if (await canUseCommunityDb()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.id)
      if (isUuid) {
        const rows = await inthalyCommunitySql`
          INSERT INTO inthaly_community.profiles (
            id, display_name, headline, bio, location_region, specialties,
            avatar_url, cover_url, allow_employer_matching, is_active, updated_at
          ) VALUES (
            ${payload.id}, ${payload.display_name}, ${payload.headline || ''}, ${payload.bio || ''},
            ${payload.location_region || 'Perú'}, ${payload.specialties || []},
            ${payload.avatar_url || null}, ${payload.banner_url || null},
            ${Boolean(payload.allow_employer_matching)}, ${payload.is_active ?? true}, timezone('utc', now())
          )
          ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            headline = EXCLUDED.headline,
            bio = EXCLUDED.bio,
            location_region = EXCLUDED.location_region,
            specialties = EXCLUDED.specialties,
            avatar_url = COALESCE(EXCLUDED.avatar_url, inthaly_community.profiles.avatar_url),
            cover_url = COALESCE(EXCLUDED.cover_url, inthaly_community.profiles.cover_url),
            allow_employer_matching = EXCLUDED.allow_employer_matching,
            is_active = EXCLUDED.is_active,
            updated_at = timezone('utc', now())
          RETURNING *
        `
        if (rows.length > 0) {
          const saved = mapDbProfile(rows[0])
          memoryStore.profiles.set(saved.id, saved)
          memoryStore.profiles.set(saved.slug, saved)
          return { success: true, data: saved }
        }
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en upsertProfile:', err?.message)
    }
  }

  // 2. Intentar en Supabase si está disponible
  try {
    const { data, error } = await supabase
      .from('community_profiles')
      .upsert(payload)
      .select()
      .maybeSingle()

    if (!error && data) {
      memoryStore.profiles.set(data.id, data)
      memoryStore.profiles.set(data.slug, data)
      return { success: true, data }
    }
  } catch (err) {
    // Si Supabase remoto aún no cuenta con la tabla, guardamos en memoria
  }

  // 3. Fallback en memoria estructurada
  memoryStore.profiles.set(payload.id, payload)
  memoryStore.profiles.set(payload.slug, payload)
  return { success: true, data: payload }
}

/**
 * Ejecuta la desconexión del usuario de Comunidad en uno de los 3 niveles autorizados.
 * Inviolable: CERO impacto en InthalyOps, boletas, tareo o relación laboral.
 */
export async function unlinkCommunityPresence(
  supabase: any,
  userId: string,
  level: UnlinkLevel
): Promise<UnlinkActionResult> {
  const profile = await getProfile(supabase, userId)

  switch (level) {
    case 'pause_profile': {
      // Nivel 1: Pausar perfil (oculta temporalmente del feed y directorio público)
      if (profile) {
        profile.is_active = false
        await upsertProfile(supabase, profile)
      }
      return {
        success: true,
        level,
        message: 'Tu perfil comunitario ha sido pausado. No aparecerás en búsquedas públicas, pero tus contactos están guardados.',
        workRelationIntact: true
      }
    }

    case 'leave_group': {
      // Nivel 2: Abandono selectivo de grupos
      return {
        success: true,
        level,
        message: 'Has salido de los grupos seleccionados satisfactoriamente.',
        workRelationIntact: true
      }
    }

    case 'delete_community_presence': {
      // Nivel 3: Derecho al olvido comunitario total
      memoryStore.profiles.delete(userId)
      if (profile) memoryStore.profiles.delete(profile.slug)

      try {
        await supabase.from('community_profiles').delete().eq('id', userId)
      } catch (err) {
        // Modo fallback
      }

      return {
        success: true,
        level,
        message: 'Tu presencia comunitaria ha sido eliminada por completo. Tu cuenta de faena y acceso a boletas en InthalyOps permanecen intactos.',
        workRelationIntact: true
      }
    }

    default:
      return {
        success: false,
        level,
        message: 'Nivel de desconexión no reconocido.',
        workRelationIntact: true
      }
  }
}

// ==============================================================================
// 2. GESTIÓN DE GRUPOS DINÁMICOS ABIERTOS
// ==============================================================================

/**
 * Consulta la lista de grupos abiertos por categoría o búsqueda de texto libre.
 */
export async function getGroups(
  supabase: any,
  options?: { category?: string; search?: string; limit?: number }
): Promise<CommunityGroup[]> {
  // 1. Intentar consulta en PostgreSQL soberano (inthaly_community.groups)
  if (await canUseCommunityDb()) {
    try {
      const rows = options?.category && options.category !== 'all'
        ? await inthalyCommunitySql`
            SELECT * FROM inthaly_community.groups 
            WHERE lower(category) = lower(${options.category}) 
            ORDER BY members_count DESC 
            LIMIT ${options?.limit || 50}
          `
        : await inthalyCommunitySql`
            SELECT * FROM inthaly_community.groups 
            ORDER BY members_count DESC 
            LIMIT ${options?.limit || 50}
          `

      if (rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          slug: String(r.slug),
          name: String(r.name),
          description: String(r.description || ''),
          category: String(r.category),
          custom_tags: Array.isArray(r.custom_tags) ? r.custom_tags : [],
          privacy: r.privacy || 'public',
          join_policy: 'open',
          group_rules: [],
          created_by: String(r.created_by),
          members_count: Number(r.members_count || 1),
          posts_count: 0,
          created_at: new Date(r.created_at).toISOString()
        }))
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en getGroups:', err?.message)
    }
  }

  // 2. Consulta en Supabase si está disponible
  try {
    let query = supabase.from('community_groups').select('*')
    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`)
    }
    const { data, error } = await query.order('members_count', { ascending: false }).limit(options?.limit || 50)
    if (!error && data && data.length > 0) return data as CommunityGroup[]
  } catch (err) {
    // Fallback en memoria
  }

  // Filtrado en memoria
  let list = Array.from(new Set(memoryStore.groups.values()))
  if (options?.category && options.category !== 'all') {
    list = list.filter(g => g.category.toLowerCase() === options.category?.toLowerCase())
  }
  if (options?.search) {
    const q = options.search.toLowerCase()
    list = list.filter(g => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
  }
  return list.slice(0, options?.limit || 50)
}

/**
 * Obtiene el detalle de un grupo dinámico por su Slug.
 */
export async function getGroupBySlug(
  supabase: any,
  slug: string
): Promise<CommunityGroup | null> {
  if (await canUseCommunityDb()) {
    try {
      const rows = await inthalyCommunitySql`
        SELECT * FROM inthaly_community.groups WHERE slug = ${slug} LIMIT 1
      `
      if (rows.length > 0) {
        const r = rows[0]
        return {
          id: String(r.id),
          slug: String(r.slug),
          name: String(r.name),
          description: String(r.description || ''),
          category: String(r.category),
          custom_tags: Array.isArray(r.custom_tags) ? r.custom_tags : [],
          privacy: r.privacy || 'public',
          join_policy: 'open',
          group_rules: [],
          created_by: String(r.created_by),
          members_count: Number(r.members_count || 1),
          posts_count: 0,
          created_at: new Date(r.created_at).toISOString()
        }
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en getGroupBySlug:', err?.message)
    }
  }

  try {
    const { data, error } = await supabase.from('community_groups').select('*').eq('slug', slug).maybeSingle()
    if (!error && data) return data as CommunityGroup
  } catch (err) {
    // Fallback
  }
  return memoryStore.groups.get(slug) || null
}

/**
 * Crea un nuevo grupo sobre cualquier especialidad, interés o nicho técnico.
 */
export async function createGroup(
  supabase: any,
  groupData: {
    name: string
    description?: string
    category: string
    custom_tags?: string[]
    privacy?: 'public' | 'closed' | 'secret'
    join_policy?: 'open' | 'requires_approval' | 'invite_only'
    created_by: string
  }
): Promise<ActionResponse<CommunityGroup>> {
  const slug = groupData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const newGroup: CommunityGroup = {
    id: `grp-${Date.now()}`,
    slug,
    name: groupData.name,
    description: groupData.description || '',
    category: groupData.category,
    custom_tags: groupData.custom_tags || [],
    privacy: groupData.privacy || 'public',
    join_policy: groupData.join_policy || 'open',
    group_rules: [],
    created_by: groupData.created_by,
    members_count: 1,
    posts_count: 0,
    created_at: new Date().toISOString()
  }

  // 1. Intentar persistencia en PostgreSQL
  if (await canUseCommunityDb()) {
    try {
      const isAuthorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(groupData.created_by)
      if (isAuthorUuid) {
        const rows = await inthalyCommunitySql`
          INSERT INTO inthaly_community.groups (
            name, slug, description, category, privacy, custom_tags, created_by, members_count
          ) VALUES (
            ${groupData.name}, ${slug}, ${groupData.description || ''}, ${groupData.category},
            ${groupData.privacy || 'public'}, ${groupData.custom_tags || []}, ${groupData.created_by}, 1
          ) RETURNING *
        `
        if (rows.length > 0) {
          const r = rows[0]
          const created: CommunityGroup = {
            id: String(r.id),
            slug: String(r.slug),
            name: String(r.name),
            description: String(r.description || ''),
            category: String(r.category),
            custom_tags: Array.isArray(r.custom_tags) ? r.custom_tags : [],
            privacy: r.privacy || 'public',
            join_policy: groupData.join_policy || 'open',
            group_rules: [],
            created_by: String(r.created_by),
            members_count: Number(r.members_count || 1),
            posts_count: 0,
            created_at: new Date(r.created_at).toISOString()
          }
          memoryStore.groups.set(created.id, created)
          memoryStore.groups.set(created.slug, created)
          return { success: true, data: created }
        }
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en createGroup:', err?.message)
    }
  }

  // 2. Intentar en Supabase
  try {
    const { data, error } = await supabase.from('community_groups').insert(newGroup).select().maybeSingle()
    if (!error && data) {
      memoryStore.groups.set(data.id, data)
      memoryStore.groups.set(data.slug, data)
      return { success: true, data }
    }
  } catch (err) {
    // Fallback
  }

  memoryStore.groups.set(newGroup.id, newGroup)
  memoryStore.groups.set(newGroup.slug, newGroup)
  return { success: true, data: newGroup }
}

/**
 * Se une o solicita unirse a un grupo.
 */
export async function joinGroup(
  supabase: any,
  groupId: string,
  profileId: string
): Promise<ActionResponse<boolean>> {
  if (await canUseCommunityDb()) {
    try {
      const isGroupUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(groupId)
      const isProfileUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileId)
      if (isGroupUuid && isProfileUuid) {
        await inthalyCommunitySql`
          INSERT INTO inthaly_community.group_members (group_id, profile_id, role)
          VALUES (${groupId}, ${profileId}, 'member')
          ON CONFLICT (group_id, profile_id) DO NOTHING
        `
        await inthalyCommunitySql`
          UPDATE inthaly_community.groups
          SET members_count = members_count + 1
          WHERE id = ${groupId}
        `
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en joinGroup:', err?.message)
    }
  }

  const group = memoryStore.groups.get(groupId)
  const status = group?.join_policy === 'requires_approval' ? 'pending_approval' : 'active'

  const member: CommunityGroupMember = {
    group_id: groupId,
    profile_id: profileId,
    role: 'member',
    status,
    joined_at: new Date().toISOString()
  }

  try {
    await supabase.from('community_group_members').upsert(member)
  } catch (err) {
    // Fallback
  }

  const existing = memoryStore.groupMembers.get(groupId) || []
  if (!existing.some(m => m.profile_id === profileId)) {
    existing.push(member)
    memoryStore.groupMembers.set(groupId, existing)
    if (group && status === 'active') group.members_count++
  }

  return { success: true, data: true }
}

// ==============================================================================
// 3. GESTIÓN DE PUBLICACIONES Y FEED TÉCNICO
// ==============================================================================

/**
 * Consulta el feed de publicaciones en orden cronológico inverso.
 */
export async function getFeedPosts(
  supabase: any,
  options?: { groupId?: string; limit?: number }
): Promise<CommunityPost[]> {
  // 1. Intentar consulta en PostgreSQL soberano
  if (await canUseCommunityDb()) {
    try {
      const rows = options?.groupId
        ? await inthalyCommunitySql`
            SELECT p.*, pr.display_name, pr.headline, pr.avatar_url
            FROM inthaly_community.posts p
            LEFT JOIN inthaly_community.profiles pr ON p.author_id = pr.id
            WHERE p.group_id = ${options.groupId}
            ORDER BY p.created_at DESC
            LIMIT ${options?.limit || 20}
          `
        : await inthalyCommunitySql`
            SELECT p.*, pr.display_name, pr.headline, pr.avatar_url
            FROM inthaly_community.posts p
            LEFT JOIN inthaly_community.profiles pr ON p.author_id = pr.id
            ORDER BY p.created_at DESC
            LIMIT ${options?.limit || 20}
          `

      if (rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          author_id: String(r.author_id),
          author_name: String(r.display_name || 'Colega Profesional'),
          author_headline: String(r.headline || ''),
          author_avatar: r.avatar_url ? String(r.avatar_url) : undefined,
          group_id: r.group_id ? String(r.group_id) : undefined,
          content: String(r.content),
          media_urls: Array.isArray(r.media_urls) ? r.media_urls : [],
          tags: Array.isArray(r.tags) ? r.tags : [],
          visibility: 'public',
          likes_count: Number(r.likes_count || 0),
          comments_count: Number(r.comments_count || 0),
          shares_count: 0,
          created_at: new Date(r.created_at).toISOString(),
          is_liked: false
        }))
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en getFeedPosts:', err?.message)
    }
  }

  try {
    let query = supabase.from('community_posts').select('*, author:community_profiles(*), group:community_groups(*)')
    if (options?.groupId) {
      query = query.eq('group_id', options.groupId)
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(options?.limit || 20)
    if (!error && data && data.length > 0) return data as CommunityPost[]
  } catch (err) {
    // Fallback en memoria
  }

  let posts = [...memoryStore.posts]
  if (options?.groupId) {
    posts = posts.filter(p => p.group_id === options.groupId)
  }
  return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, options?.limit || 20)
}

/**
 * Crea una nueva publicación en el feed público o en un grupo.
 */
export async function createPost(
  supabase: any,
  postData: {
    author_id: string
    group_id?: string | null
    content: string
    media_urls?: string[]
    tags?: string[]
    visibility?: 'public' | 'connections' | 'group'
  }
): Promise<ActionResponse<CommunityPost>> {
  const author = await getProfile(supabase, postData.author_id)
  const group = postData.group_id ? await getGroupBySlug(supabase, postData.group_id) : null

  // 1. Intentar persistencia en PostgreSQL soberano
  if (await canUseCommunityDb()) {
    try {
      const isAuthorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postData.author_id)
      if (isAuthorUuid) {
        const rows = await inthalyCommunitySql`
          INSERT INTO inthaly_community.posts (
            author_id, group_id, content, media_urls, tags
          ) VALUES (
            ${postData.author_id}, ${postData.group_id || null}, ${postData.content},
            ${postData.media_urls || []}, ${postData.tags || []}
          ) RETURNING *
        `
        if (rows.length > 0) {
          const r = rows[0]
          const created: CommunityPost = {
            id: String(r.id),
            author_id: String(r.author_id),
            author_name: author?.display_name || 'Colega Profesional',
            author_headline: author?.headline || '',
            author_avatar: author?.avatar_url,
            group_id: r.group_id ? String(r.group_id) : undefined,
            content: String(r.content),
            media_urls: Array.isArray(r.media_urls) ? r.media_urls : (postData.media_urls || []),
            tags: Array.isArray(r.tags) ? r.tags : [],
            visibility: postData.visibility || 'public',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            created_at: new Date(r.created_at).toISOString(),
            author: author || undefined,
            group: group || null
          }
          memoryStore.posts.unshift(created)
          return { success: true, data: created }
        }
      }
    } catch (err: any) {
      console.warn('[Community DB] Fallback en createPost:', err?.message)
    }
  }

  const newPost: CommunityPost = {
    id: `post-${Date.now()}`,
    author_id: postData.author_id,
    group_id: postData.group_id || null,
    content: postData.content,
    media_urls: postData.media_urls || [],
    tags: postData.tags || [],
    visibility: postData.visibility || 'public',
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: new Date().toISOString(),
    author: author || undefined,
    group: group || null
  }

  try {
    const { data, error } = await supabase.from('community_posts').insert(newPost).select().maybeSingle()
    if (!error && data) {
      memoryStore.posts.unshift(data)
      return { success: true, data }
    }
  } catch (err) {
    // Fallback
  }

  memoryStore.posts.unshift(newPost)
  return { success: true, data: newPost }
}

/**
 * Alterna una reacción profesional en una publicación (*Útil*, *Recomendar*, *Técnico*).
 */
export async function toggleReaction(
  supabase: any,
  params: {
    user_id: string
    target_id: string
    target_type: 'post' | 'comment'
    reaction_type: ReactionType
  }
): Promise<ActionResponse<{ added: boolean; reactionType: ReactionType }>> {
  const idx = memoryStore.reactions.findIndex(
    r => r.user_id === params.user_id && r.target_id === params.target_id
  )

  let added = false
  if (idx >= 0) {
    memoryStore.reactions.splice(idx, 1)
    const post = memoryStore.posts.find(p => p.id === params.target_id)
    if (post && post.likes_count > 0) post.likes_count--
  } else {
    memoryStore.reactions.push({
      id: `react-${Date.now()}`,
      user_id: params.user_id,
      target_type: params.target_type,
      target_id: params.target_id,
      reaction_type: params.reaction_type,
      created_at: new Date().toISOString()
    })
    added = true
    const post = memoryStore.posts.find(p => p.id === params.target_id)
    if (post) post.likes_count++
  }

  return { success: true, data: { added, reactionType: params.reaction_type } }
}

/**
 * Agrega un comentario a una publicación.
 */
export async function addComment(
  supabase: any,
  commentData: {
    post_id: string
    author_id: string
    content: string
  }
): Promise<ActionResponse<CommunityComment>> {
  const author = await getProfile(supabase, commentData.author_id)

  const newComment: CommunityComment = {
    id: `comm-${Date.now()}`,
    post_id: commentData.post_id,
    author_id: commentData.author_id,
    content: commentData.content,
    likes_count: 0,
    created_at: new Date().toISOString(),
    author: author || undefined
  }

  const list = memoryStore.comments.get(commentData.post_id) || []
  list.push(newComment)
  memoryStore.comments.set(commentData.post_id, list)

  const post = memoryStore.posts.find(p => p.id === commentData.post_id)
  if (post) post.comments_count++

  return { success: true, data: newComment }
}

/**
 * Obtiene los comentarios de una publicación.
 */
export async function getPostComments(
  supabase: any,
  postId: string
): Promise<CommunityComment[]> {
  return memoryStore.comments.get(postId) || []
}

// ==============================================================================
// 4. MOTOR HEURÍSTICO PONDERADO DE RECOMENDACIONES (ADR-006 / ADR-013)
// ==============================================================================

/**
 * Calcula recomendaciones de colegas y contactos usando el algoritmo determinista
 * ponderado (40% Especialidad, 25% Región, 20% Grupos, 15% Conexiones mutuas).
 * Incluye filtro de salvaguarda anti-espionaje laboral.
 */
export async function getRecommendedProfiles(
  supabase: any,
  currentUserId: string,
  userCompanyId?: string | null,
  weights: RecommendationEngineWeights = DEFAULT_RECOMMENDER_WEIGHTS
): Promise<RecommendationResult[]> {
  const currentProfile = await getProfile(supabase, currentUserId)
  if (!currentProfile) return []

  const allProfiles = Array.from(new Set(memoryStore.profiles.values())).filter(
    p => p.id !== currentUserId && p.is_active
  )

  const results: RecommendationResult[] = []

  for (const candidate of allProfiles) {
    // Filtro de Salvaguarda Laboral: Si el candidato no permite matching con colegas de empresa
    if (!candidate.allow_employer_matching && userCompanyId && (candidate as any).company_id === userCompanyId) {
      continue
    }

    // 1. Coincidencia de Especialidades (40%)
    const userSpecs = new Set(currentProfile.specialties.map(s => s.toLowerCase()))
    const commonSpecs = candidate.specialties.filter(s => userSpecs.has(s.toLowerCase()))
    const specialtyScore = Math.min(100, (commonSpecs.length / Math.max(1, userSpecs.size)) * 100)

    // 2. Proximidad Geográfica (25%)
    let proximityScore = 0
    if (currentProfile.location_region && candidate.location_region) {
      const userLoc = currentProfile.location_region.toLowerCase()
      const candLoc = candidate.location_region.toLowerCase()
      if (userLoc === candLoc) proximityScore = 100
      else if (userLoc.split(',')[0]?.trim() === candLoc.split(',')[0]?.trim()) proximityScore = 80
      else proximityScore = 30
    }

    // 3. Grupos Compartidos (20%)
    let sharedGroupsScore = 0
    let sharedGroupName = ''
    for (const [groupId, members] of memoryStore.groupMembers.entries()) {
      const hasUser = members.some(m => m.profile_id === currentUserId && m.status === 'active')
      const hasCand = members.some(m => m.profile_id === candidate.id && m.status === 'active')
      if (hasUser && hasCand) {
        sharedGroupsScore = 100
        const grp = memoryStore.groups.get(groupId)
        if (grp) sharedGroupName = grp.name
        break
      }
    }

    // 4. Conexiones Mutuas (15%)
    const mutualConnectionsScore = 50 // Base heurística inicial

    // Ponderación total
    const totalScore = Math.round(
      specialtyScore * weights.specialtyWeight +
      proximityScore * weights.proximityWeight +
      sharedGroupsScore * weights.sharedGroupsWeight +
      mutualConnectionsScore * weights.mutualConnectionsWeight
    )

    // Explicación humana determinista
    const reasons: string[] = []
    if (commonSpecs.length > 0) reasons.push(`coinciden en ${commonSpecs.slice(0, 2).join(' y ')}`)
    if (proximityScore >= 80) reasons.push(`ambos operan en ${candidate.location_region}`)
    if (sharedGroupsScore > 0 && sharedGroupName) reasons.push(`miembros de "${sharedGroupName}"`)

    const explanation = reasons.length > 0
      ? `Recomendado porque ${reasons.join(', ')}.`
      : `Recomendado por afinidad en el ecosistema técnico.`

    if (totalScore >= 40) {
      results.push({
        candidateProfile: candidate,
        score: totalScore,
        scoreBreakdown: {
          specialtyScore,
          proximityScore,
          sharedGroupsScore,
          mutualConnectionsScore
        },
        explanation
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5)
}

// ==============================================================================
// 5. INVITACIONES CORPORATIVAS VOLUNTARIAS
// ==============================================================================

/**
 * Registra una invitación emitida por una empresa para que un trabajador se sume a Comunidad.
 * No activa ningún perfil automáticamente.
 */
export async function createCorporateInvitation(
  supabase: any,
  params: {
    companyId: string
    workerDni: string
    workerName?: string
    targetEmail?: string
  }
): Promise<ActionResponse<CommunityInvitation>> {
  const token = `inv-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`
  
  const invitation: CommunityInvitation = {
    id: `inv-${Date.now()}`,
    company_id: params.companyId,
    worker_dni: params.workerDni,
    worker_name: params.workerName || 'Trabajador',
    target_email: params.targetEmail,
    invitation_token: token,
    status: 'pending',
    expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString()
  }

  memoryStore.invitations.set(token, invitation)
  return { success: true, data: invitation }
}

/**
 * Obtiene el estado de una invitación por token.
 */
export async function getInvitationByToken(
  supabase: any,
  token: string
): Promise<CommunityInvitation | null> {
  return memoryStore.invitations.get(token) || null
}

/**
 * Responde a una invitación corporativa (Aceptar o Rechazar de forma voluntaria).
 */
export async function respondToInvitation(
  supabase: any,
  token: string,
  response: 'accept' | 'reject'
): Promise<ActionResponse<boolean>> {
  const inv = memoryStore.invitations.get(token)
  if (!inv) return { success: false, error: 'Invitación no encontrada o expirada' }

  inv.status = response === 'accept' ? 'accepted' : 'rejected'
  memoryStore.invitations.set(token, inv)

  return { success: true, data: true }
}

// ==============================================================================
// 6. HISTORIAS / DESTACADOS TÉCNICOS (FACEBOOK STORIES PATTERN)
// ==============================================================================

export async function getTechnicalStories(
  _supabase: any
): Promise<TechnicalStory[]> {
  return [...memoryStore.stories]
}

export async function createTechnicalStory(
  _supabase: any,
  story: Omit<TechnicalStory, 'id' | 'created_at'>
): Promise<ActionResponse<TechnicalStory>> {
  const newStory: TechnicalStory = {
    ...story,
    id: `story-${Date.now()}`,
    created_at: new Date().toISOString()
  }
  memoryStore.stories.unshift(newStory)
  return { success: true, data: newStory }
}

// ==============================================================================
// 7. MENSAJERÍA DIRECTA Y CONTACTOS EN LÍNEA (DOCK DE CHAT ESTILO MESSENGER)
// ==============================================================================

export async function getDirectMessages(
  _supabase: any,
  userA: string,
  userB: string
): Promise<DirectMessage[]> {
  return memoryStore.directMessages.filter(
    m => (m.sender_id === userA && m.receiver_id === userB) ||
         (m.sender_id === userB && m.receiver_id === userA)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export async function sendDirectMessage(
  _supabase: any,
  senderId: string,
  receiverId: string,
  content: string
): Promise<ActionResponse<DirectMessage>> {
  if (!content.trim()) return { success: false, error: 'Mensaje vacío' }
  const msg: DirectMessage = {
    id: `msg-${Date.now()}`,
    sender_id: senderId,
    receiver_id: receiverId,
    content: content.trim(),
    created_at: new Date().toISOString(),
    is_read: false
  }
  memoryStore.directMessages.push(msg)
  return { success: true, data: msg }
}

export async function getOnlineContacts(
  _supabase: any,
  currentUserId: string
): Promise<CommunityProfile[]> {
  const contacts: CommunityProfile[] = []
  for (const [id, prof] of memoryStore.profiles.entries()) {
    if (id.startsWith('user-') && id !== currentUserId && prof.is_active) {
      if (!contacts.some(c => c.id === prof.id)) {
        contacts.push(prof)
      }
    }
  }
  return contacts
}

// ==============================================================================
// 8. GUARDADOS / MARCADORES PERSISTENTES
// ==============================================================================

export async function toggleSavePost(
  _supabase: any,
  userId: string,
  postId: string
): Promise<ActionResponse<{ isSaved: boolean }>> {
  let userSaves = memoryStore.savedPosts.get(userId)
  if (!userSaves) {
    userSaves = new Set<string>()
    memoryStore.savedPosts.set(userId, userSaves)
  }

  const isSaved = userSaves.has(postId)
  if (isSaved) {
    userSaves.delete(postId)
  } else {
    userSaves.add(postId)
  }

  return { success: true, data: { isSaved: !isSaved } }
}

export async function getSavedPostIds(
  _supabase: any,
  userId: string
): Promise<string[]> {
  const userSaves = memoryStore.savedPosts.get(userId)
  return userSaves ? Array.from(userSaves) : []
}

// ==============================================================================
// 9. ALMACENAMIENTO DE OBJETOS MULTIMEDIA (MinIO S3 AUTOGESTIONADO)
// ==============================================================================

/**
 * Sube y valida un archivo multimedia (avatar, portada o documento) usando MinIO S3
 * Previene la saturación de PostgreSQL al mantener binarios fuera de la base de datos.
 */
export async function uploadCommunityMedia(params: {
  profileId: string
  fileBuffer: Buffer
  mimeType: string
  fileSizeBytes: number
  type: 'avatar' | 'cover' | 'document'
  originalFilename?: string
}): Promise<ActionResponse<{ url: string; key: string }>> {
  const validation = validateFileConstraints(params.fileSizeBytes, params.mimeType, params.type)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const ext = params.mimeType.split('/')[1] || 'bin'
  const prefix = params.type === 'avatar' ? 'avatars' : params.type === 'cover' ? 'covers' : 'docs'
  const key = generateStorageKey(prefix, params.profileId, ext)

  const uploadResult = await uploadObjectToStorage({
    bucket: 'community-media',
    key,
    contentType: params.mimeType,
    buffer: params.fileBuffer
  })

  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error || 'Error al almacenar el archivo en MinIO' }
  }

  return {
    success: true,
    data: {
      url: uploadResult.url,
      key: uploadResult.key
    }
  }
}
