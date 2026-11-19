import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateIdentity } from '@/services/inthaly-id.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña requeridos' }, { status: 400 })
    }
    const result = await authenticateIdentity({ email, password })
    if (result.success && result.data) {
      const isSuperAdmin =
        result.data.identity.id === 'id-super-admin-global' ||
        result.data.identity.email === 'admin@inthaly.com'
      return NextResponse.json({
        success: true,
        user: {
          id: result.data.identity.id,
          email: result.data.identity.email,
          name: result.data.identity.display_name,
          is_super_admin: isSuperAdmin,
          roles: isSuperAdmin ? ['super_admin'] : ['user']
        }
      })
    }
    return NextResponse.json({ success: false, error: result.error || 'Credenciales inválidas' }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

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
