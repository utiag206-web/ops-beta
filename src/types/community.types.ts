/**
 * Tipos de Dominio: Comunidad Inthaly — Ecosistema INTHALY
 * Contratos de datos para perfiles profesionales, grupos dinámicos,
 * feed técnico, conexiones, invitaciones voluntarias y motor de recomendaciones.
 */

import type { BaseAuditEntity } from './common.types'

export type ProfileVisibility = 'public' | 'connections' | 'private'

export interface CommunityProfile {
  id: string
  slug: string
  display_name: string
  headline?: string | null
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  location_region?: string | null
  specialties: string[]
  is_active: boolean
  visibility: ProfileVisibility
  allow_employer_matching?: boolean
  created_at?: string
  updated_at?: string
  connections_count?: number
  posts_count?: number
  [key: string]: unknown
}

export type GroupPrivacy = 'public' | 'closed' | 'secret'
export type GroupJoinPolicy = 'open' | 'requires_approval' | 'invite_only'
export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member'
export type GroupMemberStatus = 'active' | 'pending_approval' | 'banned'

export interface GroupRule {
  id: string
  title: string
  description?: string
}

export interface CommunityGroup {
  id: string
  slug: string
  name: string
  description?: string | null
  icon_url?: string | null
  banner_url?: string | null
  category: string
  custom_tags: string[]
  privacy: GroupPrivacy
  join_policy: GroupJoinPolicy
  group_rules?: GroupRule[]
  created_by?: string | null
  members_count: number
  posts_count: number
  created_at?: string
  updated_at?: string
  current_user_membership?: {
    role: GroupRole
    status: GroupMemberStatus
  } | null
  [key: string]: unknown
}

export interface CommunityGroupMember {
  group_id: string
  profile_id: string
  role: GroupRole
  status: GroupMemberStatus
  joined_at: string
  profile?: CommunityProfile
}

export type PostVisibility = 'public' | 'connections' | 'group'

export interface CommunityPost {
  id: string
  author_id: string
  group_id?: string | null
  content: string
  media_urls: string[]
  tags: string[]
  visibility: PostVisibility
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at?: string
  author?: CommunityProfile
  group?: CommunityGroup | null
  user_reaction?: ReactionType | null
  is_saved?: boolean
  [key: string]: unknown
}

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string
  parent_comment_id?: string | null
  content: string
  likes_count: number
  created_at: string
  author?: CommunityProfile
  replies?: CommunityComment[]
  [key: string]: unknown
}

export type ReactionType = 'like' | 'insightful' | 'applaud' | 'helpful'

export interface CommunityReaction {
  id: string
  user_id: string
  target_type: 'post' | 'comment'
  target_id: string
  reaction_type: ReactionType
  created_at: string
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked'

export interface CommunityConnection {
  requester_id: string
  addressee_id: string
  status: ConnectionStatus
  created_at: string
  updated_at?: string
  profile?: CommunityProfile
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface CommunityInvitation {
  id: string
  company_id: string
  worker_dni: string
  worker_name?: string
  target_email?: string
  invitation_token: string
  status: InvitationStatus
  expires_at: string
  created_at: string
}

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'reaction'
  | 'comment'
  | 'reply'
  | 'group_invite'

export interface CommunityNotification {
  id: string
  user_id: string
  actor_id?: string | null
  type: NotificationType
  entity_id?: string | null
  entity_type?: string | null
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
  actor?: CommunityProfile
}

export type UnlinkLevel = 'pause_profile' | 'resume_profile' | 'leave_group' | 'delete_community_presence'

export interface UnlinkActionResult {
  success: boolean
  level: UnlinkLevel
  message: string
  workRelationIntact: true
  inMemoryUpdated?: boolean
}

export interface TechnicalStory {
  id: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_specialty?: string
  title: string
  media_url?: string
  gradient?: string
  tag?: string
  created_at: string
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

export interface RecommendationEngineWeights {
  specialtyWeight: number // default: 0.40
  proximityWeight: number // default: 0.25
  sharedGroupsWeight: number // default: 0.20
  mutualConnectionsWeight: number // default: 0.15
}

export interface RecommendationResult {
  candidateProfile: CommunityProfile
  score: number // 0 a 100
  scoreBreakdown: {
    specialtyScore: number
    proximityScore: number
    sharedGroupsScore: number
    mutualConnectionsScore: number
  }
  explanation: string
}
