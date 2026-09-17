'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Sparkles,
} from 'lucide-react'

interface ScreenSlide {
  id: string
  title: string
  category: string
  description: string
  route: string
  image: string
}

const SCREENS: ScreenSlide[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Operativo',
    category: 'Centro de Control',
    description:
      'Supervisión ejecutiva en tiempo real de asistencia, caja chica, activos y control de incidencias.',
    route: 'inthaly-ops.com / dashboard',
    image: '/images/screens/showcase-dashboard.png',
  },
  {
    id: 'worker-portal',
    title: 'Portal del Trabajador',
    category: 'Autoservicio Móvil',
    description:
      'Acceso móvil seguro para consulta de asistencia diaria, boletas de pago y firma de documentos.',
    route: 'inthaly-ops.com / w / portal',
    image: '/images/screens/showcase-worker-portal.png',
  },
  {
    id: 'inventory',
    title: 'Control de Inventario y Kardex',
    category: 'Cadena de Suministro',
    description:
      'Registro automatizado de entradas, salidas, transferencias de almacén y trazabilidad Kardex continua.',
    route: 'inthaly-ops.com / inventory / stock',
    image: '/images/screens/showcase-inventory.png',
  },
  {
    id: 'planta',
    title: 'Control de Planta y Mineral',
    category: 'Operaciones de Planta',
    description:
      'Pesaje digital en balanza electrónica, control de canchas de acopio, molienda y despacho de producción.',
    route: 'inthaly-ops.com / operaciones / planta',
    image: '/images/screens/showcase-planta.png',
  },
  {
    id: 'mecanica',
    title: 'Mecánica y Mantenimiento',
    category: 'Mantenimiento de Activos',
    description:
      'Plan preventivo vehicular, horómetros de maquinaria, generadores, compresoras y checklists de campo.',
    route: 'inthaly-ops.com / mecanica / mantenimiento',
    image: '/images/screens/showcase-mecanica.png',
  },
  {
    id: 'transport',
    title: 'Logística y Transporte de Personal',
    category: 'Flota y Movilidad',
    description:
      'Coordinación de traslados entre sedes, asignación de unidades, control de choferes y lista de pasajeros.',
    route: 'inthaly-ops.com / transport',
    image: '/images/screens/showcase-transport.png',
  },
  {
    id: 'export-center',
    title: 'Centro de Exportaciones',
    category: 'Reportabilidad',
    description:
      'Generación centralizada de informes gerenciales y operativos en formatos oficiales Excel y PDF.',
    route: 'inthaly-ops.com / reports / export-center',
    image: '/images/screens/showcase-export-center.png',
  },
]

const AUTOPLAY_INTERVAL = 5500

export function SoftwareShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const activeScreen = SCREENS[currentIndex]

  // Pause on explicit manual interaction and auto-resume after 6 seconds
  const handleUserInteraction = () => {
    setIsPaused(true)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 6000)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENS.length)
    handleUserInteraction()
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + SCREENS.length) % SCREENS.length)
    handleUserInteraction()
  }

  const selectSlide = (index: number) => {
    setCurrentIndex(index)
    handleUserInteraction()
  }

  // Automatic slide rotation (silent, natural, and continuous)
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENS.length)
    }, AUTOPLAY_INTERVAL)

    return () => clearInterval(interval)
  }, [isPaused])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [])

  return (
    <section id="software" className="relative py-10 sm:py-12 lg:py-14 bg-white border-t border-slate-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Vistas Reales de la Plataforma</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-slate-900">
            El Software en Funcionamiento
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Una mirada transparente a la interfaz corporativa. Sin maquetas ficticias ni ilustraciones conceptuales: pantallas reales de INTHALY OPS.
          </p>
        </div>

        {/* HORIZONTAL TAB STRIP (INTERACTIVE SELECTOR) */}
        <div className="mx-auto max-w-4xl xl:max-w-5xl mb-3 flex items-center justify-start sm:justify-center overflow-x-auto pb-1.5 gap-1.5 scrollbar-none">
          {SCREENS.map((s, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={s.id}
                onClick={() => selectSlide(idx)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {s.title}
              </button>
            )
          })}
        </div>

        {/* ACTIVE SLIDE INFO BAR WITH AUTOPLAY STATUS */}
        <div className="mx-auto max-w-4xl xl:max-w-5xl mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {activeScreen.category}
              </span>
              <span className="text-slate-300">•</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {activeScreen.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-normal max-w-xl">
              {activeScreen.description}
            </p>
          </div>

          {/* SLIDE CONTROLS (COUNTER & CHEVRONS) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs font-bold text-slate-400">
              {currentIndex + 1} de {SCREENS.length}
            </span>

            <button
              onClick={prevSlide}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-100 active:scale-95 cursor-pointer"
              aria-label="Pantalla anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={nextSlide}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-100 active:scale-95 cursor-pointer"
              aria-label="Siguiente pantalla"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* BROWSER SHOWCASE DISPLAY FRAME (CALIBRATED TO FIT ENTIRE SCREEN IN VIEWPORT) */}
        <div className="mx-auto max-w-4xl xl:max-w-5xl relative rounded-2xl border border-slate-200/90 bg-slate-900/5 p-1.5 sm:p-2 shadow-xl shadow-blue-950/10 transition-shadow duration-300">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/90 px-3 py-2 rounded-t-xl mb-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white px-3 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <span>{activeScreen.route}</span>
            </div>
            <div className="flex items-center text-[11px] text-slate-400 font-bold">
              <Monitor className="h-3 w-3 mr-1" />
              1600 × 950
            </div>
          </div>

          {/* Screenshot Container (Fits 100% in viewport) */}
          <div className="relative aspect-[16/9.5] max-h-[440px] xl:max-h-[500px] w-full overflow-hidden rounded-lg sm:rounded-xl border border-slate-200/80 bg-slate-950">
            {SCREENS.map((screen, idx) => {
              const isActive = idx === currentIndex
              return (
                <div
                  key={screen.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-[0.995] z-0 pointer-events-none'
                  }`}
                  aria-hidden={!isActive}
                >
                  <Image
                    src={screen.image}
                    alt={screen.title}
                    fill
                    className="object-contain sm:object-cover sm:object-top"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority
                  />
                </div>
              )
            })}
          </div>

          {/* Pagination Indicators (Dots) */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5 pb-0.5">
            {SCREENS.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => selectSlide(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  dotIdx === currentIndex
                    ? 'w-6 bg-blue-600'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Ir a pantalla ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
