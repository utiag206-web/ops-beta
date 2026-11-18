'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { communityService } from '@/services'
import { getCurrentIdentityAction } from '@/app/(id)/actions'
import type { CommunityProfile, UnlinkLevel, ReactionType } from '@/types/community.types'

/**
 * Resuelve la identidad de forma soberana a partir de la sesión validada.
 * REGLA A4: El servidor obtiene el identificador exclusivamente desde una sesión autenticada.
 * Si no hay sesión válida, rechaza la operación inmediatamente.
 */
async function getAuthenticatedUserId(): Promise<string> {
  // 1. Validar sesión soberana de Inthaly ID
  const inthalyIdentity = await getCurrentIdentityAction()
  if (inthalyIdentity?.id) {
    return inthalyIdentity.id
  }

  // 2. Fallback a sesión de Supabase si existe
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch {
    // ignore
  }

  throw new Error('UNAUTHORIZED: Se requiere una sesión activa y validada en Inthaly ID para esta acción.')
}

export async function getFeedPostsAction(groupId?: string) {
  const supabase = await createAdminClient()
  return communityService.getFeedPosts(supabase, { groupId })
}

export async function createPostAction(content: string, groupId?: string, tags?: string[]) {
  const author_id = await getAuthenticatedUserId()
  const supabase = await createAdminClient()
  
  const result = await communityService.createPost(supabase, {
    author_id,
    group_id: groupId || null,
    content,
    tags: tags || []
  })

  revalidatePath('/comunidad')
  return result
}

export async function toggleReactionAction(targetId: string, reactionType: ReactionType = 'like') {
  const user_id = await getAuthenticatedUserId()
  const supabase = await createAdminClient()

  const result = await communityService.toggleReaction(supabase, {
    user_id,
    target_id: targetId,
    target_type: 'post',
    reaction_type: reactionType
  })

  revalidatePath('/comunidad')
  return result
}

export async function addCommentAction(postId: string, content: string) {
  const author_id = await getAuthenticatedUserId()
  const supabase = await createAdminClient()

  const result = await communityService.addComment(supabase, {
    post_id: postId,
    author_id,
    content
  })

  revalidatePath('/comunidad')
  return result
}

export async function getPostCommentsAction(postId: string) {
  const supabase = await createAdminClient()
  return communityService.getPostComments(supabase, postId)
}

export async function getGroupsAction(category?: string, search?: string) {
  const supabase = await createAdminClient()
  return communityService.getGroups(supabase, { category, search })
}

export async function getGroupBySlugAction(slug: string) {
  const supabase = await createAdminClient()
  return communityService.getGroupBySlug(supabase, slug)
}

export async function createGroupAction(data: {
  name: string
  description?: string
  category: string
  custom_tags?: string[]
  privacy?: 'public' | 'closed' | 'secret'
}) {
  const created_by = await getAuthenticatedUserId()
  const supabase = await createAdminClient()

  const result = await communityService.createGroup(supabase, {
    ...data,
    created_by
  })

  revalidatePath('/comunidad/grupos')
  return result
}

export async function joinGroupAction(groupId: string) {
  const profileId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()

  const result = await communityService.joinGroup(supabase, groupId, profileId)
  revalidatePath('/comunidad/grupos')
  return result
}

export async function getRecommendedProfilesAction() {
  try {
    const currentUserId = await getAuthenticatedUserId()
    const supabase = await createAdminClient()
    return communityService.getRecommendedProfiles(supabase, currentUserId)
  } catch {
    return []
  }
}

export async function getCommunityProfileAction(identifier?: string) {
  const supabase = await createAdminClient()
  let idToLookup: string
  if (identifier) {
    idToLookup = identifier
  } else {
    try {
      idToLookup = await getAuthenticatedUserId()
    } catch {
      return null
    }
  }
  return communityService.getProfile(supabase, idToLookup)
}

/**
 * Actualiza o crea el perfil comunitario.
 * REGLA A4: El servidor asigna obligatoriamente el ID de la identidad autenticada,
 * ignorando cualquier ID manipulable enviado en el cuerpo de la petición.
 */
export async function updateCommunityProfileAction(profile: Omit<Partial<CommunityProfile>, 'id'> & { display_name: string }) {
  const verifiedId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()

  const result = await communityService.upsertProfile(supabase, {
    ...profile,
    id: verifiedId
  })

  revalidatePath('/comunidad/perfil')
  return result
}

export async function unlinkCommunityAction(level: UnlinkLevel) {
  const userId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()
  const result = await communityService.unlinkCommunityPresence(supabase, userId, level)

  revalidatePath('/comunidad')
  return result
}

export async function respondInvitationAction(token: string, response: 'accept' | 'reject') {
  const supabase = await createAdminClient()
  return communityService.respondToInvitation(supabase, token, response)
}

export async function getTechnicalStoriesAction() {
  const supabase = await createAdminClient()
  return communityService.getTechnicalStories(supabase)
}

export async function getOnlineContactsAction() {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createAdminClient()
    return communityService.getOnlineContacts(supabase, userId)
  } catch {
    return []
  }
}

export async function getDirectMessagesAction(targetUserId: string) {
  const currentUserId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()
  return communityService.getDirectMessages(supabase, currentUserId, targetUserId)
}

export async function sendDirectMessageAction(targetUserId: string, content: string) {
  const currentUserId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()
  return communityService.sendDirectMessage(supabase, currentUserId, targetUserId, content)
}

export async function toggleSavePostAction(postId: string) {
  const currentUserId = await getAuthenticatedUserId()
  const supabase = await createAdminClient()
  return communityService.toggleSavePost(supabase, currentUserId, postId)
}

export async function getSavedPostIdsAction() {
  try {
    const currentUserId = await getAuthenticatedUserId()
    const supabase = await createAdminClient()
    return communityService.getSavedPostIds(supabase, currentUserId)
  } catch {
    return []
  }
}

export async function uploadCommunityMediaAction(formData: FormData) {
  const profileId = await getAuthenticatedUserId()
  const file = formData.get('file') as File | null
  const type = (formData.get('type') as 'avatar' | 'cover' | 'document') || 'avatar'

  if (!file) {
    return { success: false, error: 'No se ha proporcionado ningún archivo.' }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return communityService.uploadCommunityMedia({
    profileId,
    fileBuffer: buffer,
    mimeType: file.type,
    fileSizeBytes: file.size,
    type,
    originalFilename: file.name
  })
}
