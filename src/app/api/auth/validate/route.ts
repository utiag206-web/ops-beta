import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ valid: false, reason: 'unauthenticated' }, { status: 401 })
    }

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, status, company_id, role_id')
      .eq('id', user.id)
      .maybeSingle()

    if (dbError || !dbUser) {
      return NextResponse.json({ valid: false, reason: 'user_not_found' }, { status: 404 })
    }

    const userStatus = (dbUser.status || '').toLowerCase()
    if (userStatus === 'inactive' || userStatus === 'rejected') {
      return NextResponse.json({ valid: false, reason: 'revoked' }, { status: 403 })
    }

    return NextResponse.json({ 
      valid: true, 
      userId: user.id,
      companyId: dbUser.company_id,
      roleId: dbUser.role_id,
      status: userStatus
    })
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 })
  }
}
