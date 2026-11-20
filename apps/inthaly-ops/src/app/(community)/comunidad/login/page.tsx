import React from 'react'
import CommunityLoginClient from '@/components/community/community-login-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Iniciar Sesión — Comunidad Inthaly',
  description: 'Conecta con las personas que hacen crecer tu industria mediante tu Inthaly ID.'
}

export default function CommunityLoginPage() {
  return <CommunityLoginClient />
}
