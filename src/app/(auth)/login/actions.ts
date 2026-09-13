'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
 const email = formData.get('email') as string
 const password = formData.get('password') as string
 
 const supabase = await createClient()

 console.log(`[AUTH] Intentando login para: ${email}`)

 const { data, error } = await supabase.auth.signInWithPassword({
 email,
 password,
 })

 if (error) {
 console.error(`[AUTH_ERROR] Código: ${error.code}, Mensaje: ${error.message}`)
 if (error.message.toLowerCase().includes('password') || error.code === 'weak_password') {
 return { 
 error: 'Seguridad: Tu contraseña es muy débil o ha sido comprometida en otros sitios. Por favor, contacta al administrador.',
 code: error.code 
 }
 }
 return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
 }

 const authUser = data.user
 if (!authUser) return { error: 'No se pudo recuperar la información del usuario.' }

 console.log(`[AUTH_SUCCESS] Login exitoso para: ${email}`)
  // Direct DB Query to avoid getUserSession cookie race condition
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = await createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('role_id, company_id, status, name, companies(id, name, status)')
    .eq('id', authUser.id)
    .maybeSingle()

  const role = userData?.role_id?.toLowerCase()
  console.log(`[AUTH] Rol detectado para redirect: ${role}`)

  if (role === 'trabajador') {
    await supabase.auth.signOut()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('active_company_id')
    cookieStore.delete('worker_session')
    
    return { 
      error: 'Acceso Denegado: Los colaboradores deben ingresar a través del Portal de Trabajadores de su empresa (código QR o enlace de acceso corporativo).' 
    }
  }

  // Si no es Super Admin, verificar el estado de la empresa y del usuario
  const isSuperAdmin = role === 'super_admin' || role === 'superadmin'
  if (!isSuperAdmin) {
    const userCompany = Array.isArray(userData?.companies) ? userData?.companies[0] : userData?.companies
    const companyStatus = (userCompany?.status || '').toLowerCase()
    const userStatus = (userData?.status || '').toLowerCase()

    if (companyStatus === 'pending' || userStatus === 'pending') {
      await supabase.auth.signOut()
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.delete('active_company_id')
      cookieStore.delete('worker_session')

      return {
        error: 'Acceso en espera: La cuenta de su empresa se encuentra en proceso de revisión o aprobación por el Super Administrador. Nos comunicaremos con usted a la brevedad.'
      }
    }

    if (companyStatus === 'rejected' || userStatus === 'rejected') {
      await supabase.auth.signOut()
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.delete('active_company_id')
      cookieStore.delete('worker_session')

      return {
        error: 'Acceso Denegado: Su solicitud de acceso ha sido denegada. Por favor contacte al soporte de INTHALY OPS.'
      }
    }

    if (companyStatus === 'inactive' || userStatus === 'inactive') {
      await supabase.auth.signOut()
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.delete('active_company_id')
      cookieStore.delete('worker_session')

      return {
        error: 'Acceso Denegado: La empresa asociada a esta cuenta se encuentra suspendida o inactiva. Contacte al administrador.'
      }
    }
  }

  revalidatePath('/', 'layout')

  if (role === 'super_admin' || role === 'superadmin') {
    redirect('/super-admin')
  }

  redirect('/dashboard')
}

export async function logout() {
 const { cookies } = await import('next/headers')
 const cookieStore = await cookies()
 
 let redirectUrl = '/login'
 const workerSessionVal = cookieStore.get('worker_session')?.value
 if (workerSessionVal) {
 try {
 const parsed = JSON.parse(workerSessionVal)
 if (parsed?.companySlug) {
 redirectUrl = `/w/${parsed.companySlug}`
 }
 } catch (_) {}
 }
 
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (user && redirectUrl === '/login') {
 const { data: dbUser } = await supabase
 .from('users')
 .select('*, companies(name)')
 .eq('id', user.id)
 .maybeSingle()
 
 if (dbUser?.companies?.name) {
 const slugify = (text: string) => {
 return text
 .toString()
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9\s-]/g, '')
 .trim()
 .replace(/\s+/g, '-')
 .replace(/-+/g, '-');
 }
 const companySlug = slugify(dbUser.companies.name)
 redirectUrl = `/w/${companySlug}`
 }
 }

 await supabase.auth.signOut()
 cookieStore.delete('active_company_id')
 cookieStore.delete('worker_session')
 
 revalidatePath('/', 'layout')
 redirect(redirectUrl)
}
