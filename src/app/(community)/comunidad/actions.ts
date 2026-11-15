'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { communityService } from '@/services'
import type { CommunityProfile, UnlinkLevel, ReactionType } from '@/types/community.types'

async function getCurrentUserId(supabase: any): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch (e) {
    // ignore
  }
  return 'user-carlos-mendoza'
}

export async function getFeedPostsAction(groupId?: string) {
  const supabase = await createAdminClient()
  return communityService.getFeedPosts(supabase, { groupId })
}

export async function createPostAction(content: string, groupId?: string, tags?: string[]) {
  const supabase = await createAdminClient()
  const author_id = await getCurrentUserId(supabase)
  
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
  const supabase = await createAdminClient()
  const user_id = await getCurrentUserId(supabase)

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
  const supabase = await createAdminClient()
  const author_id = await getCurrentUserId(supabase)

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
  const supabase = await createAdminClient()
  const created_by = await getCurrentUserId(supabase)

  const result = await communityService.createGroup(supabase, {
    ...data,
    created_by
  })

  revalidatePath('/comunidad/grupos')
  return result
}

export async function joinGroupAction(groupId: string) {
  const supabase = await createAdminClient()
  const profileId = await getCurrentUserId(supabase)

  const result = await communityService.joinGroup(supabase, groupId, profileId)
  revalidatePath('/comunidad/grupos')
  return result
}

export async function getRecommendedProfilesAction() {
  const supabase = await createAdminClient()
  const currentUserId = await getCurrentUserId(supabase)
  return communityService.getRecommendedProfiles(supabase, currentUserId)
}

export async function getCommunityProfileAction(identifier?: string) {
  const supabase = await createAdminClient()
  const idToLookup = identifier || await getCurrentUserId(supabase)
  return communityService.getProfile(supabase, idToLookup)
}

export async function updateCommunityProfileAction(profile: Partial<CommunityProfile> & { display_name: string }) {
  const supabase = await createAdminClient()
  const id = profile.id || await getCurrentUserId(supabase)

  const result = await communityService.upsertProfile(supabase, {
    ...profile,
    id
  })

  revalidatePath('/comunidad/perfil')
  return result
}

export async function unlinkCommunityAction(level: UnlinkLevel) {
  const supabase = await createAdminClient()
  const userId = await getCurrentUserId(supabase)
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
  const supabase = await createAdminClient()
  const userId = await getCurrentUserId(supabase)
  return communityService.getOnlineContacts(supabase, userId)
}

export async function getDirectMessagesAction(targetUserId: string) {
  const supabase = await createAdminClient()
  const currentUserId = await getCurrentUserId(supabase)
  return communityService.getDirectMessages(supabase, currentUserId, targetUserId)
}

export async function sendDirectMessageAction(targetUserId: string, content: string) {
  const supabase = await createAdminClient()
  const currentUserId = await getCurrentUserId(supabase)
  return communityService.sendDirectMessage(supabase, currentUserId, targetUserId, content)
}

export async function toggleSavePostAction(postId: string) {
  const supabase = await createAdminClient()
  const currentUserId = await getCurrentUserId(supabase)
  return communityService.toggleSavePost(supabase, currentUserId, postId)
}

export async function getSavedPostIdsAction() {
  const supabase = await createAdminClient()
  const currentUserId = await getCurrentUserId(supabase)
  return communityService.getSavedPostIds(supabase, currentUserId)
}
