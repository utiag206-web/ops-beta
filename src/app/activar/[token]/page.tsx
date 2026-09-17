import ActivarPage from '../page'

export const dynamic = 'force-dynamic'

interface DynamicActivarProps {
  params: Promise<{ token: string }>
}

export default async function DynamicActivarPage({ params }: DynamicActivarProps) {
  const { token } = await params
  return <ActivarPage searchParams={Promise.resolve({ t: token })} />
}
