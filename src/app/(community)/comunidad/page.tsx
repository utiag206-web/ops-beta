import React from 'react'
import { 
  getFeedPostsAction, 
  getRecommendedProfilesAction, 
  getGroupsAction,
  getTechnicalStoriesAction,
  getOnlineContactsAction,
  getSavedPostIdsAction,
  getCommunityProfileAction
} from './actions'
import CommunityFeedClient from '@/components/community/community-feed-client'

export const dynamic = 'force-dynamic'

export default async function CommunityFeedPage() {
  const [
    initialPosts, 
    recommendedProfiles, 
    groups,
    stories,
    contacts,
    savedPostIds,
    currentUser
  ] = await Promise.all([
    getFeedPostsAction(),
    getRecommendedProfilesAction(),
    getGroupsAction(undefined, undefined),
    getTechnicalStoriesAction(),
    getOnlineContactsAction(),
    getSavedPostIdsAction(),
    getCommunityProfileAction()
  ])

  return (
    <CommunityFeedClient 
      initialPosts={initialPosts}
      recommendedProfiles={recommendedProfiles}
      groups={groups}
      initialStories={stories}
      onlineContacts={contacts}
      initialSavedIds={savedPostIds}
      currentUser={currentUser}
    />
  )
}
