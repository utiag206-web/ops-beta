'use server'

import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCompanyAuthSettings } from '@/lib/company-auth-settings'
import { revalidatePath } from 'next/cache'

// Dynamic JS slugify as fallback
const slugify = (text: string) => {
  return text
  .toString()
  .toLowerCase()
   .replace(/[\u0300-\u036f]/g, '')
   .toLowerCase()
   .replace(/[^a-z0-9\s-]/g, '')
  .trim()
   .replace(/\s+/g, '-')
  .replace(/-+/g, '-');
}

export async function loginWorker(companySlug: string, identifier: string, pin: string) {
  try {
  if (!companySlug || !identifier || !pin) {
  return { success: false, error: 'Todos los campos son obligatorios.' }
  }

  const supabase = await createAdminClient()

  // 1. Fetch companies to match the slug (supports DB column slug and dynamic fallback)
  const { data: companies, error: compErr } = await supabase
  .from('companies')
  .select('*')

  if (compErr || !companies) {
  console.error('[WORKER_AUTH] Error fetching companies:', compErr)
  return { success: false, error: 'Error al buscar la empresa en el sistema.' }
  }

  const company = companies.find(c => c.slug === companySlug || slugify(c.name) === companySlug)
  if (!company) {
  return { success: false, error: 'La empresa especificada no existe.' }
  }

  const authSettings = getCompanyAuthSettings(company)

  // Detect type of identifier to avoid Postgres type cast errors (e.g. comparing string emails with numeric DNI)
  const isEmail = identifier.includes('@')
  const isNumeric = /^\d+$/.test(identifier)

  let worker = null
  let isAuthVerified = false
  let userRole = 'trabajador'
  let userArea = null

  // 2. DUAL AUTHENTICATION: Supabase Auth (for operational workers with formal accounts)
  if (isEmail || authSettings.login_mode === 'EMAIL') {
  try {
  const client = await createClient()
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
  email: identifier,
  password: pin
  })

  if (!authError && authData?.user) {
  // Find corresponding user in the current company
  const { data: dbUser } = await supabase
  .from('users')
  .select('*')
  .eq('id', authData.user.id)
  .eq('company_id', company.id)
  .maybeSingle()

  if (dbUser) {
  userRole = dbUser.role_id || 'trabajador'
  userArea = dbUser.area || null

  if (dbUser.worker_id) {
  // Fetch corresponding worker record
  const { data: linkedWorker } = await supabase
  .from('workers')
  .select('*')
  .eq('id', dbUser.worker_id)
  .maybeSingle()
  
  if (linkedWorker) {
  worker = linkedWorker
  isAuthVerified = true
  }
  } else {
  // No linked worker profile exists yet. Let's auto-create one dynamically!
  const nameParts = (dbUser.name || 'Trabajador').trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'Trabajador'
  
  // Generate a temporary unique 8-digit DNI
  const tempDni = String(Math.floor(10000000 + Math.random() * 90000000))
  
  const { data: newWorker, error: wError } = await supabase
  .from('workers')
  .insert({
  company_id: company.id,
  name: firstName,
  last_name: lastName,
  dni: tempDni,
  cod: `W-${tempDni.substring(4)}`,
  position: dbUser.role_id === 'jefe_area' ? 'Jefe de Área' : 'Trabajador',
  status: 'active'
  })
  .select()
  .single()

  if (!wError && newWorker) {
  // Link it back to the user
  await supabase
  .from('users')
  .update({ worker_id: newWorker.id })
  .eq('id', dbUser.id)

  worker = newWorker
  isAuthVerified = true
  } else {
  console.error('[WORKER_AUTH_FALLBACK] Error auto-creating worker:', wError)
  }
  }
  }
  }
  } catch (err) {
  console.error('[WORKER_AUTH] Supabase Auth sign in failed:', err)
  }
  }

  // 3. PARAMETRIC AUTHENTICATION: Dynamic worker table lookup based on company.auth_settings
  if (!worker) {
  let query = supabase
  .from('workers')
  .select('*')
  .eq('company_id', company.id)

  if (authSettings.login_mode === 'DNI_ONLY') {
  if (!isNumeric) {
  return { success: false, error: 'La empresa está configurada para ingresar únicamente con DNI (números).' }
  }
  query = query.eq('dni', identifier)
  } else if (authSettings.login_mode === 'COD_ONLY') {
  query = query.eq('cod', identifier)
  } else {
  // DNI_OR_COD (Default)
  if (isNumeric) {
  query = query.or(`dni.eq.${identifier},cod.eq.${identifier}`)
  } else {
  query = query.eq('cod', identifier)
  }
  }

  let { data: dbWorker, error: workerErr } = await query.maybeSingle()

  if (workerErr) {
  console.error('[WORKER_AUTH] Error querying worker:', workerErr)
  return { success: false, error: 'Error al verificar los datos del trabajador.' }
  }

  worker = dbWorker
  }

  if (!worker) {
  return { success: false, error: 'El trabajador no está registrado en esta empresa.' }
  }

  // 4. Verify worker is active
  const isWorkerActive = 
  String(worker.status).toLowerCase() === 'active' || 
  String(worker.status).toLowerCase() === 'activo'

  if (!isWorkerActive) {
  return { success: false, error: 'El trabajador no se encuentra en estado ACTIVO.' }
  }

  // 5. Compare PIN / Password according to secret_mode
  if (!isAuthVerified) {
  let expectedPins: string[] = []

  if (authSettings.secret_mode === 'BIRTHDATE') {
  let birthDateStr = worker.birth_date || worker.fecha_nacimiento
  if (birthDateStr) {
  const parts = String(birthDateStr).split('T')[0].split('-')
  if (parts.length === 3) {
  const ddmmaaaa = `${parts[2]}${parts[1]}${parts[0]}`
  expectedPins.push(ddmmaaaa)
  }
  }
  if (worker.pin) expectedPins.push(String(worker.pin))
  if (worker.dni) expectedPins.push(String(worker.dni))
  } else if (authSettings.secret_mode === 'CUSTOM_PIN') {
  if (worker.pin) expectedPins.push(String(worker.pin))
  if (worker.dni) expectedPins.push(String(worker.dni))
  } else {
  // DNI_DEFAULT or PASSWORD
  if (worker.pin) expectedPins.push(String(worker.pin))
  if (worker.dni) expectedPins.push(String(worker.dni))
  }

  const cleanInputPin = String(pin).trim()
  const isValidPin = expectedPins.some(p => String(p).trim() === cleanInputPin)

  if (!isValidPin) {
  return { success: false, error: 'Contraseña o PIN incorrecto.' }
  }
  }

  // 5. Check if first login password change is required by company settings
  const isFirstLoginPending = authSettings.require_pin_change_on_first_login && (
    worker.pin_changed === false ||
    worker.first_login_pending === true ||
    !worker.last_login_at ||
    worker.pin === worker.dni ||
    !worker.pin
  )

  // 6. Store session in secure HTTP-only cookie
  const sessionData = {
  workerId: worker.id,
  name: worker.name,
  last_name: worker.last_name || '',
  dni: worker.dni,
  cod: worker.cod,
  position: worker.position,
  companyId: company.id,
  companyName: company.name,
  companyLogo: company.logo_url,
  companySlug: slugify(company.name),
  roleId: userRole,
  area: userArea,
  photoUrl: worker.photo_url || null,
  requirePinChange: Boolean(isFirstLoginPending)
  }

  const cookieStore = await cookies()
  cookieStore.set('worker_session', JSON.stringify(sessionData), {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30, // 30 days session
  sameSite: 'lax'
  })

  if (userRole !== 'trabajador') {
    cookieStore.set('active_company_id', company.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days session
      sameSite: 'lax'
    })
    return { success: true, redirectToDashboard: true, requirePinChange: Boolean(isFirstLoginPending) }
  }

  // Update last_login_at
  try {
    const supabaseAdmin = await createAdminClient()
    await supabaseAdmin.from('workers').update({ last_login_at: new Date().toISOString() }).eq('id', worker.id)
    revalidatePath('/workers')
    revalidatePath('/dashboard')
  } catch (err) {
    console.error('[WORKER_AUTH] Error updating last_login_at:', err)
  }

  return { success: true, requirePinChange: Boolean(isFirstLoginPending) }
  } catch (error: any) {
    console.error('[WORKER_AUTH] Unexpected error:', error)
    return { success: false, error: 'Ocurrió un error inesperado al iniciar sesión.' }
  }
}

export async function updateWorkerPin(workerId: string, newPin: string) {
  try {
    if (!workerId || !newPin) {
      return { success: false, error: 'La nueva contraseña no puede estar vacía.' }
    }

    if (newPin.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' }
    }

    const supabase = await createAdminClient()

    const updatePayload: any = {
      pin: newPin.trim(),
      pin_changed: true,
      first_login_pending: false,
      last_login_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('workers')
      .update(updatePayload)
      .eq('id', workerId)

    if (error) {
      if (error.code === '42703' || (error.message && (error.message.includes('pin_changed') || error.message.includes('first_login_pending')))) {
        delete updatePayload.pin_changed
        delete updatePayload.first_login_pending
        const { error: retryErr } = await supabase
          .from('workers')
          .update(updatePayload)
          .eq('id', workerId)

        if (retryErr) {
          return { success: false, error: retryErr.message }
        }
      } else {
        console.error('[UPDATE_WORKER_PIN_ERR]', error)
        return { success: false, error: 'No se pudo actualizar la contraseña. Verifica tu conexión.' }
      }
    }

    revalidatePath('/workers')
    revalidatePath('/dashboard')
    
    const cookieStore = await cookies()
    const sessionValue = cookieStore.get('worker_session')?.value
    if (sessionValue) {
      try {
        const sessionObj = JSON.parse(sessionValue)
        sessionObj.requirePinChange = false
        cookieStore.set('worker_session', JSON.stringify(sessionObj), {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30,
          sameSite: 'lax'
        })
      } catch (e) {
        // Ignore cookie update error
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[UPDATE_WORKER_PIN_UNEXPECTED]', err)
    return { success: false, error: err.message || 'Error al guardar la nueva contraseña.' }
  }
}

export async function getWorkerSession() {
 try {
 const cookieStore = await cookies()
 const sessionValue = cookieStore.get('worker_session')?.value
 if (sessionValue) {
 return JSON.parse(sessionValue)
 }

 // Fallback: Si no hay session de trabajador pero hay una sesión activa de Supabase Auth
 const { getUserSession } = await import('@/lib/auth')
 const authSession = await getUserSession()
 if (authSession?.extendedUser) {
 const user = authSession.extendedUser
 if (user.worker_id) {
 const supabase = await createAdminClient()
 const { data: worker } = await supabase
 .from('workers')
 .select('*')
 .eq('id', user.worker_id)
 .maybeSingle()

 if (worker) {
 const sessionData = {
 workerId: worker.id,
 name: worker.name,
 last_name: worker.last_name || '',
 dni: worker.dni,
 cod: worker.cod,
 position: worker.position,
 companyId: worker.company_id,
 companyName: user.company_name,
 companyLogo: user.company_logo,
 companySlug: user.company_slug || slugify(user.company_name || 'empresa'),
 roleId: user.role_id,
 area: user.area,
 photoUrl: worker.photo_url || null
 }
 
 cookieStore.set('worker_session', JSON.stringify(sessionData), {
 path: '/',
 httpOnly: true,
 secure: process.env.NODE_ENV === 'production',
 maxAge: 60 * 60 * 24 * 30, // 30 days session
 sameSite: 'lax'
 })

 return sessionData
 }
 }
 }
 return null
 } catch (error) {
 console.error('[WORKER_AUTH] Error parsing session:', error)
 return null
 }
}

export async function logoutWorker() {
  try {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete('worker_session')
  cookieStore.delete('active_company_id')
  return { success: true }
  } catch (error) {
  console.error('[WORKER_AUTH] Error deleting session:', error)
  return { success: false }
  }
}

export async function getWorkerPortalAuthSettings(companySlug: string) {
  try {
  const supabase = await createAdminClient()
  const { data: companies } = await supabase.from('companies').select('*')
  if (!companies) return { success: false, settings: null }

  const company = companies.find(c => c.slug === companySlug || slugify(c.name) === companySlug)
  if (!company) return { success: false, settings: null }

  const settings = getCompanyAuthSettings(company)
  return { success: true, settings, companyName: company.name }
  } catch (err) {
  return { success: false, settings: null }
  }
}
