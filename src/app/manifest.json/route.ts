import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const context = searchParams.get('context')
  const companySlug = searchParams.get('companySlug')

  let startUrl = '/dashboard'
  let name = 'InthalyOps'
  let shortName = 'Ops'

  if (context === 'worker' && companySlug) {
    startUrl = `/w/${companySlug}`
    name = `Portal - ${companySlug.toUpperCase().replace(/-/g, ' ')}`
    shortName = 'Portal Ops'
  }

  return NextResponse.json({
    name,
    short_name: shortName,
    description: 'Plataforma de gestión de trabajadores',
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
