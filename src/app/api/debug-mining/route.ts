import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) {
      return NextResponse.json({ error: 'Not authenticated' })
    }

    const supabase = await createClient()

    // 1. Exact query used in Tareo
    const { data: tareoData, error: tareoError } = await supabase
      .from('work_cycles')
      .select(`*, worker:workers!fk_work_cycles_worker(name, last_name)`)
      .eq('company_id', extendedUser.company_id)

    // 2. Exact query used in Movements
    const { data: movData, error: movError } = await supabase
      .from('worker_movements')
      .select(`*, worker:workers!fk_worker_movements_worker(name, last_name)`)
      .eq('company_id', extendedUser.company_id)
      
    // 3. Exact query used in Documents
    const { data: docData, error: docError } = await supabase
      .from('worker_documents')
      .select(`*, worker:workers!fk_worker_documents_worker(name, last_name)`)
      .eq('company_id', extendedUser.company_id)

    // 4. Exact query used in Camp
    const { data: campData, error: campError } = await supabase
      .from('camp_rooms')
      .select(`*, worker:workers!fk_camp_rooms_worker(name, last_name)`)
      .eq('company_id', extendedUser.company_id)

    return NextResponse.json({
      diagnosis: {
        company_id: extendedUser.company_id,
        tareo: { data_length: tareoData?.length, error: tareoError },
        movements: { data_length: movData?.length, error: movError },
        documents: { data_length: docData?.length, error: docError },
        camp: { data_length: campData?.length, error: campError },
      }
    })
  } catch (e: any) {
    return NextResponse.json({ fatal_error: e.message })
  }
}
