
// [HARDENING_AUDIT_LOGS] Sanitizador recursivo para impedir que credenciales se graben en los logs
function sanitizeAuditDetails(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeAuditDetails)
  
  const SENSITIVE_KEYS = ['password', 'pin', 'token', 'secret', 'authorization', 'cookie', 'service_role']
  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) {
      clean[k] = '[REDACTED_SECURITY]'
    } else if (typeof v === 'object') {
      clean[k] = sanitizeAuditDetails(v)
    } else {
      clean[k] = v
    }
  }
  return clean
}

import { createAdminClient } from '@/lib/supabase/server'

export interface AuditEventPayload {
  companyId?: string | null
  userId?: string | null
  userName: string // Immutable actor snapshot string (e.g. user's current name or 'Sistema')
  action: string // e.g. 'DEMO_REQUEST_RECEIVED', 'COMPANY_APPROVED', 'COMPANY_REJECTED', 'COMPANY_STATUS_CHANGED'
  title: string
  category?: string
  details?: Record<string, any>
  status?: string
}

/**
 * Registra un evento de auditoría inmutable en `export_audit_logs`.
 * Almacena explícitamente `user_name` como una instantánea de texto inmutable
 * para que futuras modificaciones de perfil no alteren la trazabilidad histórica.
 */
export async function logAuditEvent(payload: AuditEventPayload) {
  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('export_audit_logs').insert([{
      company_id: payload.companyId || null,
      user_id: payload.userId || null,
      user_name: payload.userName || 'Sistema',
      report_id: payload.action,
      report_title: payload.title,
      category: payload.category || 'AUDIT_SECURITY',
      format: 'AUDIT_EVENT',
      filters_applied: sanitizeAuditDetails(payload.details || {}),
      records_count: 1,
      status: payload.status || 'COMPLETED'
    }])

    if (error) {
      console.warn('[AUDIT_LOG_WARN] Error inserting immutable audit log:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[AUDIT_LOG_ERROR] Unexpected error in logAuditEvent:', err.message)
    return { success: false, error: err.message }
  }
}
