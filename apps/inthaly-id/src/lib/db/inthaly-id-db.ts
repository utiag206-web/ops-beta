/**
 * Pool de Conexión Dedicado: Base de Datos INTHALY_ID (PostgreSQL 16)
 * 
 * Regla de Oro: Aislamiento total de credenciales.
 * Utiliza el usuario 'inthaly_id_user' con permisos restringidos a la base 'inthaly_id'.
 */

import postgres from 'postgres'

const connectionString = process.env.INTHALY_ID_DATABASE_URL || 
  'postgresql://inthaly_id_user:inthaly_id_secret_pass@127.0.0.1:5432/inthaly_id'

declare global {
  // Evitar conexiones duplicadas en Next.js hot-reload en desarrollo
  var inthalyIdSql: postgres.Sql | undefined
}

export const inthalyIdSql: postgres.Sql = global.inthalyIdSql || postgres(connectionString, {
  max: 15,
  idle_timeout: 20,
  connect_timeout: 5,
  onnotice: () => {}, // silenciar avisos no críticos
  transform: {
    undefined: null
  }
})

if (process.env.NODE_ENV !== 'production') {
  global.inthalyIdSql = inthalyIdSql
}

/**
 * Healthcheck de conectividad para Inthaly ID
 */
export async function checkInthalyIdDbHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    const result = await inthalyIdSql`SELECT 1 as alive`
    if (result && result.length > 0) {
      return { ok: true, latencyMs: Date.now() - start }
    }
    return { ok: false, error: 'Sin respuesta de base de datos' }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de conexión a inthaly_id' }
  }
}
