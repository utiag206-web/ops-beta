import type { Metadata } from 'next'
import ActivarPage from '../page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "INTHALY OPS",
  description: "Sistema de Gestión Empresarial",
  openGraph: {
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
    siteName: "INTHALY OPS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
  },
}

interface DynamicActivarProps {
  params: Promise<{ token: string }>
}

export default async function DynamicActivarPage({ params }: DynamicActivarProps) {
  const { token } = await params
  return <ActivarPage searchParams={Promise.resolve({ t: token })} />
}
