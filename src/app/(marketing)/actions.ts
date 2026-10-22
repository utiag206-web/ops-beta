'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DemoRequestPayload {
  contactName: string
  email: string
  phone: string
  companyName: string
  taxId: string
  industry: string
  contactPosition: string
  estimatedWorkers: string
  message?: string
}

export async function submitDemoRequest(payload: DemoRequestPayload) {
  try {
    const contactName = payload.contactName?.trim()
    const email = payload.email?.trim().toLowerCase()
    const phone = payload.phone?.trim()
    const companyName = payload.companyName?.trim()
    const taxId = payload.taxId?.trim()
    const industry = payload.industry?.trim() || 'Servicios'
    const contactPosition = payload.contactPosition?.trim() || 'Directivo'
    const estimatedWorkers = payload.estimatedWorkers?.trim() || '1-15'
    const message = payload.message?.trim() || ''

    if (!contactName || !email || !phone || !companyName || !taxId) {
      return { success: false, error: 'Por favor completa todos los campos obligatorios.' }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Ingresa un correo electrónico corporativo válido.' }
    }

    const supabase = await createAdminClient()

    // 1. Verificar si ya existe una empresa con ese RUC o nombre
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name, status, working_hours')
      .or(`tax_id.eq.${taxId},name.ilike.${companyName}`)
      .maybeSingle()

    if (existingCompany) {
      let parsed = {}
      try {
        parsed = JSON.parse(existingCompany.working_hours || '{}')
      } catch (_) {}

      const isPendingApproval = (parsed as any)?.approval_status === 'pending' || (parsed as any)?.demo_request

      if (isPendingApproval) {
        return {
          success: true,
          isExisting: true,
          message: 'Ya existe una solicitud pendiente registrada para esta empresa. Nuestro equipo comercial se comunicará contigo a la brevedad.',
        }
      } else if (existingCompany.status === 'active') {
        return {
          success: false,
          error: 'Esta empresa ya se encuentra activa en INTHALY OPS. Puedes ingresar directamente desde la opción "Acceder".',
        }
      }
    }

    // 2. Registrar la empresa con estado DB 'inactive' (compatible con companies_status_check) y approval_status: 'pending'
    const demoDetails = {
      request_type: 'demo',
      approval_status: 'pending',
      demo_request: {
        contact_name: contactName,
        contact_position: contactPosition,
        estimated_workers: estimatedWorkers,
        notes: message,
        phone,
        email,
        tax_id: taxId,
        submitted_at: new Date().toISOString(),
      },
    }

    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert([
        {
          name: companyName,
          tax_id: taxId,
          contact_email: email,
          phone: phone,
          industry: industry,
          status: 'inactive', // COMPATIBLE CON DB CHECK CONSTRAINT 'companies_status_check'
          address: 'Solicitud Demo Web',
          timezone: 'America/Lima',
          working_hours: JSON.stringify(demoDetails),
          is_test: false,
        },
      ])
      .select('id')
      .single()

    if (insertError) {
      console.error('[DEMO_REQUEST_ERROR] Error inserting company:', insertError)
      return { success: false, error: `Error al registrar la solicitud: ${insertError.message}` }
    }

    // 3. Registrar evento en auditoría (con snapshot inmutable del solicitante)
    try {
      await supabase.from('export_audit_logs').insert({
        company_id: newCompany.id,
        user_id: null,
        user_name: contactName, // SNAPSHOT inmutable
        report_id: 'demo_request',
        report_title: `Solicitud de Demostración: ${companyName}`,
        category: 'LEAD_DEMO',
        format: 'WEB_FORM',
        filters_applied: JSON.stringify({
          tax_id: taxId,
          industry,
          contact_position: contactPosition,
          estimated_workers: estimatedWorkers,
          phone,
          email,
          notes: message,
        }),
        status: 'success',
      })
    } catch (auditErr) {
      console.warn('[DEMO_AUDIT_WARNING] Could not save audit record:', auditErr)
    }

    revalidatePath('/super-admin')

    return {
      success: true,
      companyId: newCompany.id,
      companyName,
      contactName,
    }
  } catch (error: any) {
    console.error('[DEMO_REQUEST_FATAL]', error)
    return { success: false, error: 'Ocurrió un error inesperado al procesar tu solicitud.' }
  }
}
