export const PRODUCTION_SITE_URL = 'https://sistemaops.inthaly.com'

/**
 * Obtiene la URL base segura del sitio para generar enlaces externos (WhatsApp, correos, etc.).
 * Si estamos en desarrollo local, prioriza la URL pública de producción para que los enlaces
 * compartidos con clientes funcionen desde cualquier teléfono móvil o dispositivo externo.
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') || headersList.get('host')
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = headersList.get('x-forwarded-proto') || 'https'
      return `${proto}://${host}`
    }
  } catch (_) {}

  return PRODUCTION_SITE_URL
}

/**
 * Obtiene el origen público para componentes de cliente (WhatsApp, enlaces compartidos)
 */
export function getPublicAppOrigin(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      return window.location.origin
    }
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || PRODUCTION_SITE_URL
}
