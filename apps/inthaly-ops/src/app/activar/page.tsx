import type { Metadata } from 'next'
import ActivarClient from './activar-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "INTHALY OPS",
  description: "Sistema de Gestión Empresarial",
  openGraph: {
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
    siteName: "INTHALY OPS",
    url: "https://sistemaops.inthaly.com/activar",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
  },
}

interface ActivarPageProps {
  searchParams: Promise<{ t?: string; token?: string; token_hash?: string }>
}

export default async function ActivarPage({ searchParams }: ActivarPageProps) {
  const params = await searchParams
  const token = params.t || params.token || params.token_hash || ''

  return <ActivarClient token={token} />
}
