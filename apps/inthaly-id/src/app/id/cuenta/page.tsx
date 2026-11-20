import React from 'react'
import { redirect } from 'next/navigation'
import { 
  getCurrentIdentityAction, 
  getActiveSessionsAction, 
  getConnectedAppsAction, 
  getSecurityEventsAction 
} from '@/app/(id)/actions'
import InthalyIdAccountClient from '@/components/id/inthaly-id-account-client'

export const dynamic = 'force-dynamic'

export default async function InthalyIdAccountPage() {
  const currentIdentity = await getCurrentIdentityAction()
  
  if (!currentIdentity) {
    redirect('/id/login')
  }

  const [sessions, apps, securityEvents] = await Promise.all([
    getActiveSessionsAction(),
    getConnectedAppsAction(),
    getSecurityEventsAction()
  ])

  return (
    <InthalyIdAccountClient 
      identity={currentIdentity}
      initialSessions={sessions}
      initialApps={apps}
      initialSecurityEvents={securityEvents}
    />
  )
}
