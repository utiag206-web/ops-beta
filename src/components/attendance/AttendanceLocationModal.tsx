'use client'

import React from 'react'
import { MapPin, Clock, ShieldCheck, X, Navigation, ExternalLink, Info } from 'lucide-react'

export interface LocationPunch {
  type: string
  timestamp: string
  latitude?: number
  longitude?: number
  accuracy?: number
  address?: string
}

interface AttendanceLocationModalProps {
  isOpen: boolean
  onClose: () => void
  workerName: string
  date: string
  punches: LocationPunch[]
}

const EVENT_LABELS: Record<string, { label: string; color: string; badgeBg: string }> = {
  in: { label: 'Entrada a Planta / Sede', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  break_start: { label: 'Inicio de Refrigerio', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  break_end: { label: 'Fin de Refrigerio', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  out: { label: 'Salida de Jornada', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  shift_change: { label: 'Cambio de Turno', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  commission: { label: 'Comisión de Servicio', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  permission: { label: 'Permiso Temporal', color: 'text-amber-300', badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300' }
}

export const AttendanceLocationModal: React.FC<AttendanceLocationModalProps> = ({
  isOpen,
  onClose,
  workerName,
  date,
  punches
}) => {
  if (!isOpen) return null

  const validPunchesWithGps = punches.filter(p => p.latitude !== undefined && p.longitude !== undefined)
  const selectedPunch = validPunchesWithGps[0] || punches[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg flex items-center gap-2">
                Evidencia de Marcación & Ubicación GPS
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{workerName}</span> • <span className="text-slate-300 font-medium">{date}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {punches.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay registros de marcación GPS para este día.</p>
            </div>
          ) : (
            <>
              {/* Map Preview */}
              {selectedPunch && selectedPunch.latitude !== undefined && selectedPunch.longitude !== undefined ? (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative h-64 shadow-inner">
                  <iframe
                    title="Ubicación GPS"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${selectedPunch.latitude},${selectedPunch.longitude}&z=16&output=embed`}
                    className="w-full h-full filter brightness-90 contrast-105"
                  />
                  <div className="absolute bottom-3 right-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedPunch.latitude},${selectedPunch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all"
                    >
                      <span>Abrir en Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Marcación sin Geolocalización GPS</span>
                    Las coordenadas geográficas no fueron otorgadas por el navegador o dispositivo durante el fichaje.
                  </div>
                </div>
              )}

              {/* Punch Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Línea de Tiempo de Eventos en la Jornada ({punches.length})
                </h4>

                <div className="space-y-3">
                  {punches.map((p, idx) => {
                    const cfg = EVENT_LABELS[p.type] || { label: p.type, color: 'text-slate-300', badgeBg: 'bg-slate-800 text-slate-300' }
                    const timeFormatted = p.timestamp.includes('T')
                      ? new Date(p.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : p.timestamp

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.badgeBg}`}>
                            {cfg.label}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                              <span>Hora: {timeFormatted}</span>
                            </div>
                            {p.address ? (
                              <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <span>{p.address}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 italic mt-1">Dirección no geocodificada</p>
                            )}
                          </div>
                        </div>

                        {p.latitude !== undefined && p.longitude !== undefined && (
                          <div className="flex items-center gap-3 text-xs bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
                            <Navigation className="w-3.5 h-3.5 text-slate-400" />
                            <div className="text-slate-300 font-mono">
                              {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
                            </div>
                            {p.accuracy && (
                              <span className="text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                ±{Math.round(p.accuracy)}m
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditoría de Marcaciones e Integridad Geográfica</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
