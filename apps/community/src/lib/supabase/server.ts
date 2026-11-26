import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kadxdfswqyhqqzyzzrte.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SB_PUB || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MB4e6e9nyYc7YZAcyVBeNQ_xs0eAwbY'

  return createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Error handled
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const serviceRoleKey = process.env.SB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret__d8j8zevRq5zHpM2QIybjA_MkyvoL-r'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kadxdfswqyhqqzyzzrte.supabase.co'
  
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: { persistSession: false }
    }
  )
}
