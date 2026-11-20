import React from 'react'
import { getGroupsAction } from '@/app/(community)/comunidad/actions'
import CommunityGroupsClient from '@/components/community/community-groups-client'

export const dynamic = 'force-dynamic'

export default async function CommunityGroupsPage() {
  const groups = await getGroupsAction()

  return (
    <CommunityGroupsClient initialGroups={groups} />
  )
}
