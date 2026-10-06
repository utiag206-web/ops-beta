'use client'

import React from 'react'
import { Sparkles, ArrowRight, X, Clock, Layers } from 'lucide-react'
import { CapabilityKey } from '@/lib/operating-profiles/types'
import { CAPABILITIES_CATALOG } from '@/lib/operating-profiles/capabilities'

interface RoadmapModalProps {
  isOpen: boolean
  onClose: () => void
  capabilityKey: CapabilityKey | null
  capabilityName: string
  industryLabel?: string
}

export function RoadmapModal({
  isOpen,
  onClose,
  capabilityKey,
  capabilityName,
  industryLabel
}: RoadmapModalProps) {
  if (!isOpen) return null

  const definition = capabilityKey ? CAPABILITIES_CATALOG[capabilityKey] : null
  const description = definition?.description || 'Esta capacidad forma parte de la arquitectura operativa vertical de INTHALY OPS.'
  const category = definition?.category || 'OPERACIONES'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header decoration bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-amber-500 via-orange-500 to-emerald-500" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  Capacidad en Hoja de Ruta
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                  {capabilityName}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Context Tag */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Layers size={13} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700">Modelo Operativo:</span>
            <span className="text-slate-900 font-bold">{industryLabel || 'Vertical Sectorial'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{category}</span>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
            <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wide">
              Alcance Funcional Previsto
            </span>
            <p>{description}</p>
          </div>

          {/* Operational Honesty Note */}
          <div className="flex items-start gap-2.5 text-[11px] text-slate-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-slate-800">Evolución Progresiva:</strong> Esta capacidad está incorporada formalmente en el mapa de capacidades de su arquetipo industrial y será activada de forma controlada sin alterar las operaciones en producción.
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-tight transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Entendido</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
