import ActivarClient from './activar-client'

export const dynamic = 'force-dynamic'

interface ActivarPageProps {
  searchParams: Promise<{ t?: string; token?: string; token_hash?: string }>
}

export default async function ActivarPage({ searchParams }: ActivarPageProps) {
  const params = await searchParams
  const token = params.t || params.token || params.token_hash || ''

  return <ActivarClient token={token} />
}
