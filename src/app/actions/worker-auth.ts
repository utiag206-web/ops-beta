'use server'

import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Dynamic JS slugify as fallback
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

    // Detect type of identifier to avoid Postgres type cast errors (e.g. comparing string emails with numeric DNI)
    const isEmail = identifier.includes('@')
    const isNumeric = /^\d+$/.test(identifier)

    let worker = null
    let isAuthVerified = false
    let userRole = 'trabajador'
    let userArea = null

    // 2. DUAL AUTHENTICATION: Supabase Auth (for operational workers with formal accounts)
    if (isEmail) {
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
                  status: 'ACTIVO'
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

    // 3. FALLBACK AUTHENTICATION: Traditional worker table lookup
    if (!worker) {
      let query = supabase
        .from('workers')
        .select('*')
        .eq('company_id', company.id)

      if (isNumeric) {
        query = query.or(`dni.eq.${identifier},cod.eq.${identifier}`)
      } else {
        query = query.eq('cod', identifier)
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
      String(worker.status).toUpperCase() === 'ACTIVO' || 
      String(worker.current_status).toUpperCase() === 'ACTIVO'

    if (!isWorkerActive) {
      return { success: false, error: 'El trabajador no se encuentra en estado ACTIVO.' }
    }

    // 5. Compare PIN / Password if not already verified by Supabase Auth
    if (!isAuthVerified) {
      const expectedPin = worker.pin || worker.dni
      if (String(pin).trim() !== String(expectedPin).trim()) {
        return { success: false, error: 'Contraseña o PIN incorrecto.' }
      }
    }

    // 5. Store session in secure HTTP-only cookie
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
      area: userArea
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
      return { success: true, redirectToDashboard: true }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[WORKER_AUTH] Unexpected error:', error)
    return { success: false, error: 'Ocurrió un error inesperado al iniciar sesión.' }
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
            area: user.area
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
