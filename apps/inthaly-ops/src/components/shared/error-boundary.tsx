'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
 children: ReactNode
 fallback?: ReactNode
}

interface State {
 hasError: boolean
 error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
 public state: State = {
 hasError: false
 }

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error }
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
 }

 public render() {
 if (this.state.hasError) {
 return this.props.fallback || (
 <div className="p-12 bg-white rounded-[2rem] border-2 border-dashed border-red-200 flex flex-col items-center text-center space-y-4">
 <div className="bg-red-100 p-4 rounded-full text-red-600">
 <AlertTriangle size={32} />
 </div>
 <div>
 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Error en el componente</h2>
 <p className="text-slate-500 text-sm mt-2 max-w-md">
 Hubo un fallo inesperado al renderizar esta sección. Esto puede deberse a datos inconsistentes en el servidor.
 </p>
 {this.state.error && (
 <pre className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] text-slate-400 font-mono overflow-auto max-w-full text-left">
 {this.state.error.message}
 </pre>
 )}
 </div>
 <button 
 onClick={() => window.location.reload()}
 className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all"
 >
 <RefreshCcw size={16} />
 Recargar Aplicación
 </button>
 </div>
 )
 }

 return this.props.children
 }
}
