/**
 * Mock de Supabase Client para Tests Unitarios — INTHALY
 * Simula respuestas fluidas de consultas Supabase para pruebas de arquitectura.
 */

function createMockSupabase(dataToReturn = [], errorToReturn = null) {
  const queryBuilder = {
    select: () => queryBuilder,
    insert: () => queryBuilder,
    update: () => queryBuilder,
    delete: () => queryBuilder,
    upsert: () => queryBuilder,
    eq: () => queryBuilder,
    neq: () => queryBuilder,
    gte: () => queryBuilder,
    lte: () => queryBuilder,
    in: () => queryBuilder,
    or: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    match: () => queryBuilder,
    single: async () => ({ data: dataToReturn[0] || null, error: errorToReturn }),
    maybeSingle: async () => ({ data: dataToReturn[0] || null, error: errorToReturn }),
    then: (resolve) => resolve({ data: dataToReturn, error: errorToReturn })
  }

  return {
    from: () => queryBuilder,
    auth: {
      getUser: async () => ({ data: { user: { id: 'test-user-id' } }, error: null })
    }
  }
}

module.exports = { createMockSupabase }
