/**
 * Pool de Conexión Dedicado: Base de Datos INTHALY_COMMUNITY (PostgreSQL 16)
 * 
 * Regla de Oro: Aislamiento total de credenciales.
 * Utiliza el usuario 'inthaly_community_user' con permisos restringidos a la base 'inthaly_community'.
 * No tiene permisos ni acceso al esquema ni tablas de inthaly_id.
 */

import postgres from 'postgres'

const connectionString = process.env.INTHALY_COMMUNITY_DATABASE_URL || 
  'postgresql://inthaly_community_user:inthaly_com_secret_pass@127.0.0.1:5432/inthaly_community'

declare global {
  // Evitar conexiones duplicadas en Next.js hot-reload en desarrollo
  var inthalyCommunitySql: postgres.Sql | undefined
}

export const inthalyCommunitySql: postgres.Sql = global.inthalyCommunitySql || postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 5,
  onnotice: () => {},
  transform: {
    undefined: null
  }
})

if (process.env.NODE_ENV !== 'production') {
  global.inthalyCommunitySql = inthalyCommunitySql
}

/**
 * Healthcheck de conectividad para Comunidad Inthaly
 */
export async function checkCommunityDbHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    const result = await inthalyCommunitySql`SELECT 1 as alive`
    if (result && result.length > 0) {
      return { ok: true, latencyMs: Date.now() - start }
    }
    return { ok: false, error: 'Sin respuesta de base de datos' }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión a inthaly_community' }
  }
}
