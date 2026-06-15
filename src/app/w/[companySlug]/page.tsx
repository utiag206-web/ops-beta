import React, { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getWorkerSession } from '@/app/actions/worker-auth'
import { resolveCompany } from '@/app/actions/worker-portal'
import WorkerPortalClient from './WorkerPortalClient'
import { AlertTriangle, Home, ShieldAlert, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    companySlug: string
  }>
}

export default async function WorkerPortalPage({ params }: PageProps) {
  const { companySlug } = await params
  
  // 1. Resolve company by slug
  const compRes = await resolveCompany(companySlug)
  
  if (!compRes.success || !compRes.company) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center relative overflow-hidden font-sans">
        {/* Glow ambient background */}
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[60%] rounded-full bg-blue-900/20 blur-[130px]" />
        
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative z-10">
          <div className="w-16 h-16 bg-rose-950/40 text-rose-500 rounded-3xl border border-rose-900/50 flex items-center justify-center mx-auto animate-bounce">
            <ShieldAlert size={36} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Acceso Denegado</h1>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Empresa No Registrada</p>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            La ruta <code className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-blue-400 font-mono text-xs font-semibold">/w/{companySlug}</code> no coincide con ninguna empresa registrada en la plataforma SaaS.
          </p>

          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs text-slate-500 font-medium">
              Por favor, verifique el código QR de acceso provisto por el área de Administración o Recursos Humanos de su empresa.
            </p>
          </div>
          
          <Link 
            href="/"
            className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Home size={14} />
            <span>IR A INICIO</span>
          </Link>
        </div>
      </div>
    )
  }

  const company = compRes.company

  // 2. Fetch worker session
  let session = await getWorkerSession()

  // 3. Multi-tenant check: if worker is logged into a different company, flag session as mismatched
  if (session && session.companyId !== company.id) {
    console.log(`[TENANT_ISOLATION] Flagging mismatched session. Logged in: ${session.companyName} (${session.companyId}), Requesting: ${company.name} (${company.id})`)
    session = { ...session, isMismatched: true }
  }

  // 4. Render the client side portal
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    }>
      <WorkerPortalClient 
        company={company}
        session={session}
      />
    </Suspense>
  )
}
