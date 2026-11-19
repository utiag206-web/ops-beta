'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, KeyRound, Lock, Mail, ArrowRight } from 'lucide-react'

export default function GlobalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Cabecera */}
        <div className="p-8 text-center bg-slate-900 border-b border-slate-800 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-md shadow-blue-900/30">
            IN
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">INTHALY GLOBAL</h1>
            <span className="text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Centro Único de Control y Administración del Ecosistema
          </p>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Autenticación Soberana</span>
              <span className="text-[11px] text-blue-700">Acceso protegido mediante Inthaly ID con cifrado de grado industrial.</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = '/overview'
            }}
            className="space-y-3.5"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Correo Institucional</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@inthaly.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Contraseña Maestra</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder a la Consola Global</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400">
              ¿Problemas de acceso? Contacta a la unidad de seguridad central.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
