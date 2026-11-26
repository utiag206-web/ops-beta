import { NextResponse } from 'next/server'

export async function GET(request: Request) {
 const { searchParams } = new URL(request.url)
 const context = searchParams.get('context')
 const companySlug = searchParams.get('companySlug')

 let startUrl = '/dashboard'
 let name = 'INTHALY OPS'
 let shortName = 'INTHALY OPS'

 if (context === 'worker' && companySlug) {
 startUrl = `/w/${companySlug}`
 name = `Portal - ${companySlug.toUpperCase().replace(/-/g, ' ')}`
 shortName = 'Portal Ops'
 }

 return NextResponse.json({
 name,
 short_name: shortName,
 description: 'Sistema de Gestión Empresarial',
 start_url: startUrl,
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
 icons: [
 {
 src: '/icon-192x192.png?v=1.4.0',
 sizes: '192x192',
 type: 'image/png',
        purpose: 'any'
 },
 {
        src: '/icon-512x512.png?v=1.4.0',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
 ]
 }, {
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-cache, no-store, must-revalidate'
 }
 })
}

