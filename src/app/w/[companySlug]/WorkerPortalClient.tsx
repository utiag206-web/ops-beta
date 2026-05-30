'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Clock, LogIn, LogOut, CheckCircle2, FileText, 
  BadgeDollarSign, ShieldAlert, GraduationCap, 
  MessageSquare, User, Key, Lock, Briefcase, 
  ChevronRight, Download, RefreshCw, PenTool, 
  X, AlertTriangle, Info, Calendar, DollarSign,
  TrendingUp, Award, AwardIcon, ShieldCheck,
  LayoutDashboard, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { loginWorker, logoutWorker } from '@/app/actions/worker-auth'
import { 
  getWorkerPortalStats, 
  checkInWorker, 
  checkOutWorker, 
  getWorkerPortalDocuments, 
  getWorkerPortalPPEDeliveries, 
  signWorkerPortalPPEDelivery, 
  getWorkerPortalFinances 
} from '@/app/actions/worker-portal'
import { hasPermission } from '@/lib/permissions'

interface WorkerPortalClientProps {
  company: {
    id: string
    name: string
    logo_url: string | null
    slug: string
  }
  session: {
    workerId: string
    name: string
    last_name: string
    dni: string
    cod: string | null
    position: string | null
    companyId: string
    companyName: string
    companyLogo: string | null
    companySlug: string
    roleId?: string
    area?: string | null
    isMismatched?: boolean
  } | null
}

type TabType = 'inicio' | 'documentos' | 'epps' | 'finanzas' | 'soma'

export default function WorkerPortalClient({ company, session }: WorkerPortalClientProps) {
  const router = useRouter()

  // 0. Detect multi-tenant company mismatch and reset session cookie safely on client side mount
  const [isResettingSession, setIsResettingSession] = useState(false)

  useEffect(() => {
    if (session && session.isMismatched) {
      setIsResettingSession(true)
      const triggerLogout = async () => {
        try {
          await logoutWorker()
          toast.success('SINCRONIZANDO PORTAL MULTIEMPRESA...')
          window.location.reload()
        } catch (e) {
          console.error(e)
          window.location.reload()
        }
      }
      triggerLogout()
    }
  }, [session])

  const [activeTab, setActiveTab] = useState<TabType>('inicio')
  
  // Login State
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Portal Data States
  const [stats, setStats] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [ppeDeliveries, setPpeDeliveries] = useState<any[]>([])
  const [finances, setFinances] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(false)

  // Signature Modal State
  const [activePPETosign, setActivePPETosign] = useState<any>(null)
  const [isSigning, setIsSigning] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch data if session exists
  const loadPortalData = async () => {
    if (!session) return
    setLoadingData(true)
    try {
      const [statsData, docsData, ppeData, finData] = await Promise.all([
        getWorkerPortalStats(),
        getWorkerPortalDocuments(),
        getWorkerPortalPPEDeliveries(),
        getWorkerPortalFinances()
      ])
      
      setStats(statsData)
      setDocuments(docsData)
      setPpeDeliveries(ppeData)
      setFinances(finData)
    } catch (error) {
      console.error('Error al cargar datos del portal:', error)
      toast.error('Error al sincronizar datos.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadPortalData()
    } else {
      setIdentifier('')
      setPin('')
      setLoginError(null)
      setShowPassword(false)
    }
  }, [session])

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !pin.trim()) {
      setLoginError('Complete todos los campos por favor.')
      return
    }

    setLoginLoading(true)
    setLoginError(null)

    try {
      const res = await loginWorker(company.slug, identifier.trim(), pin.trim())
      if (res.success) {
        toast.success('¡Acceso exitoso!')
        if (res.redirectToDashboard) {
          window.location.href = '/dashboard'
        } else {
          router.refresh()
        }
      } else {
        setLoginError(res.error || 'Identificador o PIN incorrecto.')
      }
    } catch (error) {
      setLoginError('Ocurrió un error inesperado al iniciar sesión.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutWorker()
      toast.success('Sesión cerrada correctamente.')
      setIdentifier('')
      setPin('')
      setLoginError(null)
      setShowPassword(false)
      setActiveTab('inicio')
      router.refresh()
    } catch (error) {
      toast.error('Error al cerrar sesión.')
    }
  }

  // Handle Check In
  const handleCheckIn = async () => {
    setMarkingAttendance(true)
    try {
      const res = await checkInWorker()
      if (res.success) {
        toast.success('Ingreso registrado correctamente.')
        await loadPortalData()
      } else {
        toast.error(res.error || 'Error al registrar ingreso.')
      }
    } catch (error) {
      toast.error('Error de red al registrar ingreso.')
    } finally {
      setMarkingAttendance(false)
    }
  }

  // Handle Check Out
  const handleCheckOut = async () => {
    setMarkingAttendance(true)
    try {
      const res = await checkOutWorker()
      if (res.success) {
        toast.success('Salida registrada correctamente. ¡Buen descanso!')
        await loadPortalData()
      } else {
        toast.error(res.error || 'Error al registrar salida.')
      }
    } catch (error) {
      toast.error('Error de red al registrar salida.')
    } finally {
      setMarkingAttendance(false)
    }
  }

  // Canvas drawing functions for signature
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 }
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Set up canvas styling when modal opens
  useEffect(() => {
    if (activePPETosign) {
      setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        // Match canvas layout size
        canvas.width = canvas.parentElement?.clientWidth || 400
        canvas.height = 200
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.strokeStyle = '#1E3A8A' // Blue-900 color for signature ink
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }, 100)
    }
  }, [activePPETosign])

  // Submit Signature
  const handleSaveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas || !activePPETosign) return

    // Simple validation: check if the canvas is blank
    const blank = document.createElement('canvas')
    blank.width = canvas.width
    blank.height = canvas.height
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.warning('Por favor, realice su firma antes de confirmar.')
      return
    }

    setIsSigning(true)
    try {
      const signatureBase64 = canvas.toDataURL('image/png')
      const res = await signWorkerPortalPPEDelivery(activePPETosign.id, signatureBase64)
      
      if (res.success) {
        toast.success('¡EPP firmado digitalmente con éxito!')
        setActivePPETosign(null)
        await loadPortalData()
      } else {
        toast.error(res.error || 'Error al guardar la firma.')
      }
    } catch (error) {
      toast.error('Error al procesar la firma.')
    } finally {
      setIsSigning(false)
    }
  }

  if (isResettingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center relative overflow-hidden font-sans">
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[60%] rounded-full bg-blue-900/20 blur-[130px]" />
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative z-10">
          <div className="w-16 h-16 bg-blue-950/40 text-blue-500 rounded-3xl border border-blue-900/50 flex items-center justify-center mx-auto">
            <RefreshCw size={32} className="animate-spin text-blue-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Sincronizando Sesión</h1>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Multiempresa Corporativa</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hemos detectado un cambio de empresa activa a través de su código QR o enlace. Sincronizando credenciales de forma segura...
          </p>
          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs text-slate-500 font-medium">
              Por favor, espere un momento mientras reconfiguramos su portal de acceso.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDERING: UNAUTHENTICATED LOGIN VIEW
  // -------------------------------------------------------------
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans antialiased text-slate-800">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-gradient-to-r from-blue-800 to-blue-600">
            <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="max-h-[75%] max-w-[75%] object-contain" />
              ) : (
                <span className="text-3xl font-bold text-blue-700">{company.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">{company.name}</h1>
            <p className="text-blue-100 mt-2 text-sm font-medium uppercase tracking-wider">Portal de Trabajadores</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5 text-left">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="flex-shrink-0" size={18} />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Identifier (DNI / CODE) */}
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-slate-600 mb-1">
                  DNI o Código de Trabajador
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej: 72345678"
                    data-keep-case="true"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl py-3.5 pr-4 pl-12 text-slate-900 font-bold transition-all outline-none shadow-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PIN / Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="pin" className="block text-sm font-semibold text-slate-600">
                    Contraseña / PIN
                  </label>
                  <span className="text-xs text-slate-400 font-medium">DNI por defecto</span>
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    id="pin"
                    type={showPassword ? "text" : "password"}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••••"
                    data-keep-case="true"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl py-3.5 pr-12 pl-12 text-slate-900 font-bold transition-all outline-none shadow-sm placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Lock size={18} />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer mt-2"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2" size={20} />
                    Ingresar al portal
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-xs text-slate-400">
                InthalyOps &copy; 2026. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDERING: AUTHENTICATED WORKER DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-8 font-sans antialiased text-slate-800 relative">
      
      {/* 1. PREMIUM HEADER */}
      <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white pt-8 pb-14 px-6 relative overflow-hidden rounded-b-[2.5rem] shadow-lg">
        {/* Glow circles */}
        <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[150%] rounded-full bg-blue-600/20 blur-[100px]" />
        
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {session.companyLogo ? (
              <div className="h-12 flex items-center justify-center">
                <img src={session.companyLogo} alt={session.companyName} className="max-h-full max-w-[140px] object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-xl">
                {session.companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest">{session.companyName}</p>
              <h2 className="text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                <span>{session.name} {session.last_name.split(' ')[0]}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              {session.position && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] text-blue-100 font-bold uppercase tracking-wide mt-1">
                  <Briefcase size={10} />
                  <span>{session.position}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {session.roleId && session.roleId.toLowerCase() !== 'trabajador' && (
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer border border-emerald-400/30"
              >
                <LayoutDashboard size={14} />
                <span>Panel de Gestión</span>
              </Link>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-white/10 hover:bg-red-500/20 border border-white/20 rounded-2xl flex items-center justify-center text-white hover:text-red-300 active:scale-95 transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        
        {/* Loading overlay */}
        {loadingData && (
          <div className="fixed top-4 right-4 z-[150] bg-slate-900/95 backdrop-blur text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <Loader2 className="animate-spin text-blue-400" size={14} />
            <span>Sincronizando...</span>
          </div>
        )}

        {/* TAB 1: INICIO */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            
            {/* Live Clock Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Fecha y Hora</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hora Local del Servidor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-800 tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Attendance marker card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Control de Asistencia</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registra tus marcaciones diarias</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stats?.todayAttendance === 'PRESENTE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{stats?.todayAttendance || 'SIN REGISTRO'}</span>
                </div>
              </div>

              {/* Shift Hours visualization */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl relative overflow-hidden">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
                  <p className="text-xl font-black text-slate-700 tabular-nums">
                    {stats?.todayAttendanceDetail?.check_in || '--:--'}
                  </p>
                  {stats?.todayAttendanceDetail?.check_in && (
                    <div className="absolute right-3 bottom-3 text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl relative overflow-hidden">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salida</p>
                  <p className="text-xl font-black text-slate-700 tabular-nums">
                    {stats?.todayAttendanceDetail?.check_out || '--:--'}
                  </p>
                  {stats?.todayAttendanceDetail?.check_out && (
                    <div className="absolute right-3 bottom-3 text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Control Action Buttons */}
              <div className="pt-2">
                {markingAttendance ? (
                  <button disabled className="w-full h-14 bg-slate-200 text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-3">
                    <RefreshCw className="animate-spin" size={20} />
                    <span>PROCESANDO REGISTRO...</span>
                  </button>
                ) : !stats?.todayAttendanceDetail?.check_in ? (
                  <button 
                    onClick={handleCheckIn}
                    className="w-full h-14 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <LogIn size={20} />
                    <span>MARCAR ENTRADA</span>
                  </button>
                ) : !stats?.todayAttendanceDetail?.check_out ? (
                  <button 
                    onClick={handleCheckOut}
                    className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <LogOut size={20} />
                    <span>MARCAR SALIDA</span>
                  </button>
                ) : (
                  <div className="w-full h-14 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-black flex items-center justify-center gap-3">
                    <CheckCircle2 className="text-emerald-600" size={20} />
                    <span>JORNADA REGISTRADA Y COMPLETADA</span>
                  </div>
                )}
              </div>
            </div>
                    {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hasPermission(session?.roleId || 'trabajador', 'documents', session?.area) && (
                <button 
                  onClick={() => setActiveTab('documentos')}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start text-left hover:border-blue-300 transition-all cursor-pointer active:scale-95 group"
                >
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentos</h4>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats?.totalDocs || 0}</p>
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider flex items-center mt-2 group-hover:translate-x-1 transition-transform">
                    Ver Boletas <ChevronRight size={10} className="ml-1" />
                  </span>
                </button>
              )}

              {hasPermission(session?.roleId || 'trabajador', 'ppe', session?.area) && (
                <button 
                  onClick={() => setActiveTab('epps')}
                  className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-start text-left hover:border-rose-300 transition-all cursor-pointer active:scale-95 group ${stats?.pendingPPE > 0 ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${stats?.pendingPPE > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-600'}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendientes EPP</h4>
                  <p className={`text-2xl font-black mt-1 ${stats?.pendingPPE > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{stats?.pendingPPE || 0}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center mt-2 group-hover:translate-x-1 transition-transform ${stats?.pendingPPE > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    Firmar entregables <ChevronRight size={10} className="ml-1" />
                  </span>
                </button>
              )}

              {hasPermission(session?.roleId || 'trabajador', 'bonuses', session?.area) && (
                <button 
                  onClick={() => setActiveTab('finanzas')}
                  className={`p-5 rounded-3xl border shadow-sm flex flex-col items-start text-left hover:border-emerald-300 transition-all col-span-2 md:col-span-1 cursor-pointer active:scale-95 group ${stats?.pendingBenefitsAmount > 0 ? 'border-amber-100 bg-amber-50/20' : 'bg-white border-slate-100'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${stats?.pendingBenefitsAmount > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                    <BadgeDollarSign size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Beneficios S/</h4>
                  <p className="text-2xl font-black text-slate-800 mt-1">S/ {((stats?.totalBonusesAmount || 0) + (stats?.totalTransportAmount || 0)).toLocaleString()}</p>
                  {stats?.pendingBenefitsAmount > 0 ? (
                    <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider flex items-center mt-2 group-hover:translate-x-1 transition-transform">
                      S/ {stats.pendingBenefitsAmount.toLocaleString()} PENDIENTE <ChevronRight size={10} className="ml-1" />
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center mt-2 group-hover:translate-x-1 transition-transform">
                      Consultar pagos <ChevronRight size={10} className="ml-1" />
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* SOMA Next training / talk box */}
            {(hasPermission(session?.roleId || 'trabajador', 'soma', session?.area) || hasPermission(session?.roleId || 'trabajador', 'soma-capacitaciones', session?.area)) && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-black text-slate-800 text-md flex items-center gap-2 border-b border-slate-100 pb-3">
                  <GraduationCap className="text-amber-500" size={20} />
                  <span>Próximas Actividades SOMA</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-[9px] font-bold text-amber-700 uppercase tracking-wider">Capacitación</span>
                      <h4 className="font-bold text-slate-700 text-sm mt-2">{stats?.nextTraining}</h4>
                    </div>
                    {stats?.nextTrainingDate && (
                      <p className="text-[10px] text-slate-400 mt-3 font-semibold flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(stats?.nextTrainingDate).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-[9px] font-bold text-blue-700 uppercase tracking-wider">Charla de 5 Min</span>
                      <h4 className="font-bold text-slate-700 text-sm mt-2">{stats?.nextTalk}</h4>
                    </div>
                    {stats?.nextTalkDate && (
                      <p className="text-[10px] text-slate-400 mt-3 font-semibold flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(stats?.nextTalkDate).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* TAB 2: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <h3 className="font-black text-slate-800 text-xl">Mis Documentos</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Accede a tus boletas de pago, contratos y certificados</p>
            </div>

            {documents.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
                <FileText className="mx-auto text-slate-300" size={48} />
                <p className="font-bold text-slate-500">No se encontraron documentos</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Cuando el departamento de administración cargue tus boletas o contratos, aparecerán en esta sección.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm leading-snug">{doc.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-indigo-600 font-bold uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{doc.file_type || 'PDF'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {doc.file_url ? (
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-10 h-10 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0"
                        title="Ver / Descargar"
                      >
                        <Download size={18} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">Sin archivo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EPPs */}
        {activeTab === 'epps' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 text-xl">Entrega de EPP / Equipos</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Equipos de Protección Personal asignados</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-blue-700">
                <Info size={14} className="text-blue-500" />
                <span>Firma tus recepciones pendientes</span>
              </div>
            </div>

            {ppeDeliveries.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
                <ShieldCheck className="mx-auto text-slate-300" size={48} />
                <p className="font-bold text-slate-500">No se registran entregas de EPP</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">No hay entregas pendientes ni registradas a su código en este periodo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ppeDeliveries.map((delivery) => (
                  <div 
                    key={delivery.id} 
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${delivery.status === 'signed' ? 'bg-slate-50/50 border-slate-200/60' : 'bg-rose-50/10 border-rose-200 shadow-sm shadow-rose-100 animate-in fade-in duration-500'}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-black text-slate-800 text-md leading-tight">{delivery.equipment_name}</h4>
                        {delivery.status === 'signed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">FIRMADO</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[9px] font-bold text-rose-700 uppercase tracking-wide animate-pulse">PENDIENTE FIRMA</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          <span>Entrega: {new Date(delivery.delivery_date).toLocaleDateString()}</span>
                        </span>
                        {delivery.ppe_type && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-bold uppercase">{delivery.ppe_type}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {delivery.status === 'signed' ? (
                        <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Entregado y Firmado</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setActivePPETosign(delivery)}
                          className="w-full md:w-auto h-11 px-5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-rose-200 cursor-pointer"
                        >
                          <PenTool size={14} />
                          <span>FIRMAR DIGITALMENTE</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FINANZAS */}
        {activeTab === 'finanzas' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 text-xl">Mis Pagos y Beneficios</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Historial de bonos y reembolsos de movilidad</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Acumulado</p>
                <p className="text-2xl font-black text-emerald-600">S/ {((stats?.totalBonusesAmount || 0) + (stats?.totalTransportAmount || 0)).toLocaleString()}</p>
              </div>
            </div>

            {/* Financial indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex flex-col justify-between text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cobrado (Pagado)</p>
                <p className="text-xl font-black text-emerald-700 mt-2">S/ {(stats?.paidBenefitsAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-5 bg-amber-50/20 border border-amber-100 rounded-2xl flex flex-col justify-between text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendiente de Pago</p>
                <p className="text-xl font-black text-amber-700 mt-2">S/ {(stats?.pendingBenefitsAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-5 bg-blue-50/20 border border-blue-100 rounded-2xl flex flex-col justify-between text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</p>
                <p className="text-xl font-black text-blue-700 mt-2">S/ {((stats?.totalBonusesAmount || 0) + (stats?.totalTransportAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {finances.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
                <BadgeDollarSign className="mx-auto text-slate-300" size={48} />
                <p className="font-bold text-slate-500">No se registran bonificaciones</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">No se registran bonos ni depósitos de movilidad asignados en su cuenta.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {finances.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'bono' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm leading-snug">{item.concept}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'paid' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-amber-50 border border-amber-100 text-amber-600'}`}>
                            {item.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                          </span>
                          <span className="text-slate-400 font-semibold">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-800 text-md">S/ {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SOMA */}
        {activeTab === 'soma' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <h3 className="font-black text-slate-800 text-xl">SOMA & Seguridad</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capacitaciones de salud ocupacional y medio ambiente</p>
            </div>

            {/* SOMA transversal banner card */}
            <div className="p-5 bg-gradient-to-r from-blue-700/5 to-indigo-700/5 border border-indigo-100 rounded-3xl relative overflow-hidden flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm">Cultura de Seguridad Integral</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  La seguridad la construimos todos. Registra tus firmas de charlas y cumple con el uso de tus EPP obligatorios en obra.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Box 1: Trainings */}
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Programación de Capacitaciones SOMA</span>
                </h4>
                
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center gap-4">
                  <div>
                    <h5 className="font-bold text-slate-700 text-sm">{stats?.nextTraining || 'Ninguna programada'}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Capacitación General Mensual</p>
                  </div>
                  {stats?.nextTrainingDate && (
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tabular-nums">
                      {new Date(stats?.nextTrainingDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Box 2: Talks */}
              <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  <span>Charlas Diarias de 5 Minutos</span>
                </h4>

                <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center gap-4">
                  <div>
                    <h5 className="font-bold text-slate-700 text-sm">{stats?.nextTalk || 'Ninguna programada'}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Charla Técnica Operativa</p>
                  </div>
                  {stats?.nextTalkDate && (
                    <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-700 uppercase tabular-nums">
                      {new Date(stats?.nextTalkDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50 md:py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {hasPermission(session?.roleId || 'trabajador', 'dashboard', session?.area) && (
            <button 
              onClick={() => setActiveTab('inicio')}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-colors ${activeTab === 'inicio' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Clock size={20} className={activeTab === 'inicio' ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-wider">Inicio</span>
            </button>
          )}
          
          {hasPermission(session?.roleId || 'trabajador', 'documents', session?.area) && (
            <button 
              onClick={() => setActiveTab('documentos')}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-colors ${activeTab === 'documentos' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FileText size={20} className={activeTab === 'documentos' ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-wider">Boletas</span>
            </button>
          )}

          {hasPermission(session?.roleId || 'trabajador', 'ppe', session?.area) && (
            <button 
              onClick={() => setActiveTab('epps')}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-colors relative ${activeTab === 'epps' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ShieldAlert size={20} className={activeTab === 'epps' ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-wider">EPPs</span>
              {stats?.pendingPPE > 0 && (
                <span className="absolute top-[-2px] right-4 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] font-black animate-bounce">
                  {stats.pendingPPE}
                </span>
              )}
            </button>
          )}

          {hasPermission(session?.roleId || 'trabajador', 'bonuses', session?.area) && (
            <button 
              onClick={() => setActiveTab('finanzas')}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-colors ${activeTab === 'finanzas' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BadgeDollarSign size={20} className={activeTab === 'finanzas' ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-wider">Pagos</span>
            </button>
          )}

          {(hasPermission(session?.roleId || 'trabajador', 'soma', session?.area) || hasPermission(session?.roleId || 'trabajador', 'soma-capacitaciones', session?.area)) && (
            <button 
              onClick={() => setActiveTab('soma')}
              className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-colors ${activeTab === 'soma' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <GraduationCap size={20} className={activeTab === 'soma' ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-wider">SOMA</span>
            </button>
          )}
        </div>
      </nav>

      {/* 4. MODAL: DIGITAL SIGNATURE FOR EPP */}
      {activePPETosign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
          <div 
            className="w-full max-w-lg bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <PenTool className="text-rose-500" size={20} />
                  <span>Firma Digital de Entrega</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Confirmación de recepción EPP
                </p>
              </div>
              <button 
                onClick={() => setActivePPETosign(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* EPP Description info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Artículo Entregado</p>
              <h4 className="font-black text-slate-700 text-md">{activePPETosign.equipment_name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                <Calendar size={12} />
                <span>Fecha de asignación: {new Date(activePPETosign.delivery_date).toLocaleDateString()}</span>
              </p>
            </div>

            {/* Signature Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Firme con su dedo en el recuadro blanco</label>
              
              <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative group">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full bg-white block relative z-10 cursor-crosshair touch-none h-[200px]"
                />
                
                {/* Background watermarked text */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-200 font-bold pointer-events-none select-none select-all z-0 text-sm tracking-widest uppercase">
                  Área de Firma Digital
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={clearCanvas}
                className="flex-1 h-12 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                LIMPIAR LIENZO
              </button>
              
              <button 
                type="button"
                disabled={isSigning}
                onClick={handleSaveSignature}
                className="flex-1 h-12 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-200 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSigning ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>CONFIRMAR FIRMA</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
