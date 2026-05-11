import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kadxdfswqyhqqzyzzrte.supabase.co'
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZHhkZnN3cXlocXF6eXp6cnRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU4MDIyOCwiZXhwIjoyMDg5MTU2MjI4fQ.1pI4MYgk04NYmLU79K_U-HohmKSZFFKqbVOYXJSBxu0'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

async function checkRoles() {
  const { data, error } = await supabase
    .from('users')
    .select('email, role_id')
    .or('role_id.ilike.super%')
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log('--- USERS WITH SUPER ROLE ---')
  data.forEach(u => {
    console.log(`Email: ${u.email}, Role ID: "${u.role_id}"`)
  })
}

checkRoles()
