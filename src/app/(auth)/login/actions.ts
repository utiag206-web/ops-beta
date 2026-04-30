'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()

  console.log(`[AUTH] Intentando login para: ${email}`)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Audit logs for specific security signals
    console.error(`[AUTH_ERROR] Código: ${error.code}, Mensaje: ${error.message}`)
    
    // Si es un error de seguridad (como contraseña comprometida o débil),
    // devolvemos un mensaje que no bloquee al usuario.
    if (error.message.toLowerCase().includes('password') || error.code === 'weak_password') {
      return { 
        error: 'Seguridad: Tu contraseña es muy débil o ha sido comprometida en otros sitios. Por favor, contacta al administrador.',
        code: error.code 
      }
    }

    return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
  }

  console.log(`[AUTH_SUCCESS] Login exitoso para: ${email}`)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
