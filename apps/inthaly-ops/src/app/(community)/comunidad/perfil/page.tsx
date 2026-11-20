import React from 'react'
import { getCommunityProfileAction } from '@/app/(community)/comunidad/actions'
import CommunityProfileClient from '@/components/community/community-profile-client'

export const dynamic = 'force-dynamic'

export default async function CommunityProfilePage() {
  const profile = await getCommunityProfileAction()

  return (
    <CommunityProfileClient initialProfile={profile} />
  )
}
