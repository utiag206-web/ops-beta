// INTHALY OPS - Intelligent Route Pre-warmer for Universal Offline Navigation
// Fetches HTML and RSC payloads of key application routes in the background while online.

const APP_ROUTES = [
  '/dashboard',
  '/operaciones/planta',
  '/mecanica',
  '/mecanica/checklists',
  '/mecanica/compresora-combustible',
  '/mecanica/compresora-mantenimiento',
  '/mecanica/equipos-mina',
  '/mecanica/generador-combustible',
  '/mecanica/generador-mantenimiento',
  '/mecanica/herramientas',
  '/mecanica/mantenimiento-vehiculos',
  '/tareo',
  '/attendance',
  '/requerimientos',
  '/soma/hsec',
  '/soma/capacitaciones',
  '/soma/charlas',
  '/inventory/stock',
  '/inventory/products',
  '/inventory/kardex',
  '/inventory/history',
  '/inventory/reports',
  '/movements',
  '/workers',
  '/caja-chica',
  '/users',
  '/company',
  '/reports/export-center',
  '/configuracion/warehouses',
  '/profile'
]

let isPrewarmingStarted = false

export function warmApplicationRoutes() {
  if (typeof window === 'undefined' || isPrewarmingStarted) return
  if (!navigator.onLine) return

  isPrewarmingStarted = true
  let index = 0

  const warmNext = () => {
    if (index >= APP_ROUTES.length) return
    if (!navigator.onLine) return

    const route = APP_ROUTES[index++]

    // Fetch RSC payload for client-side router
    fetch(route, { headers: { 'RSC': '1' } }).catch(() => {})
    // Fetch HTML document for hard navigation / F5
    fetch(route, { cache: 'no-cache' }).catch(() => {})

    setTimeout(warmNext, 300)
  }

  // Delay start by 2s to leave initial thread completely free
  setTimeout(warmNext, 2000)
}
