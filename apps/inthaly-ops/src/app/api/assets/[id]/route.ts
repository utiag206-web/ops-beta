import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id !== 'logo' && id !== 'favicon') {
    return new NextResponse('Not Found', { status: 404 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      },
    }
  )

  const { data, error } = await supabase
    .from('ecosystem_assets')
    .select('mime_type, base64_data')
    .eq('id', id)
    .single()

  if (error || !data) {
    return new NextResponse('Asset Not Found', { status: 404 })
  }

  const base64Data = data.base64_data.split(',').pop() || data.base64_data
  const buffer = Buffer.from(base64Data, 'base64')

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': data.mime_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

