import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
 const cookieStore = await cookies()

 const anonKey = process.env.NEXT_PUBLIC_SB_PUB || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 return createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 anonKey!,
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

let adminClientSingleton: SupabaseClient | null =
  (globalThis as any).__inthaly_admin_supabase_client ?? null

export async function createAdminClient() {
 if (adminClientSingleton) {
   return adminClientSingleton
 }

 const serviceRoleKey = process.env.SB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
 
 if (!serviceRoleKey) {
 console.error("[ADMIN_CLIENT_DEBUG] SUPABASE_SERVICE_ROLE_KEY (or SB_SECRET) is missing!")
 }

 adminClientSingleton = createSupabaseClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 serviceRoleKey!,
 {
 auth: { persistSession: false, autoRefreshToken: false }
 }
 )
 ;(globalThis as any).__inthaly_admin_supabase_client = adminClientSingleton
 return adminClientSingleton
}
