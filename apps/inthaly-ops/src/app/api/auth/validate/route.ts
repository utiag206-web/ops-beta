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
        result.data.identity.id === '4f3ac2b9-c79a-4823-83a4-538bdabb7a1e' ||
        result.data.identity.email === 'admin@inthaly.com' ||
        result.data.identity.email === 'inthalyops@gmail.com'
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

    // Fallback soberano: Verificar credenciales contra Supabase Auth (donde residen los Super Admins actuales)
    try {
      const supabase = await createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (!authError && authData.user) {
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminSupabase = await createAdminClient()
        const { data: userData } = await adminSupabase
          .from('users')
          .select('id, name, email, role_id, role, status')
          .eq('id', authData.user.id)
          .maybeSingle()

        const role = (userData?.role_id || userData?.role || '').toLowerCase()
        const isSuperAdmin =
          role === 'super_admin' ||
          role === 'superadmin' ||
          email.toLowerCase() === 'inthalyops@gmail.com'

        return NextResponse.json({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: userData?.name || 'CORPORATIVO INTHALY',
            is_super_admin: isSuperAdmin,
            roles: isSuperAdmin ? ['super_admin'] : ['user']
          }
        })
      }
    } catch (sbErr) {
      console.warn('[AUTH_VALIDATE] Verificación Supabase Auth falló:', sbErr)
    }
    return NextResponse.json({ success: false, error: result.error || 'Credenciales inválidas' }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { getUserSession } = await import('@/lib/auth')
    const { user, extendedUser } = await getUserSession()

    if (!user) {
      return NextResponse.json({ valid: false, reason: 'unauthenticated' }, { status: 401 })
    }

    if (!extendedUser) {
      return NextResponse.json({ valid: false, reason: 'user_not_found' }, { status: 404 })
    }

    return NextResponse.json({ 
      valid: true, 
      userId: user.id,
      companyId: extendedUser.company_id,
      roleId: extendedUser.role_id,
      status: 'active'
    })
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) {
      return NextResponse.json({ valid: false, reason: 'unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 })
  }
}
