'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Eraser, Check, X } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signature: string) => void
  onCancel: () => void
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.strokeStyle = '#1e3a8a' // blue-900
    context.lineWidth = 3
    context.lineCap = 'round'
    context.lineJoin = 'round'

    // Handle resize
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      context.strokeStyle = '#1e3a8a'
      context.lineWidth = 3
      context.lineCap = 'round'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      const rect = canvas.getBoundingClientRect()
      const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left
      const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top
      context.beginPath()
      context.moveTo(x, y)
      setIsDrawing(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      // Check if canvas is blank (simple check)
      const context = canvas.getContext('2d')
      const pixelData = context?.getImageData(0, 0, canvas.width, canvas.height).data
      if (pixelData) {
        for (let i = 0; i < pixelData.length; i += 4) {
          if (pixelData[i + 3] > 0) {
            setHasSignature(true)
            break
          }
        }
      }
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top

    context.lineTo(x, y)
    context.stroke()
  }

  const clear = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.beginPath()
      setHasSignature(false)
    }
  }

  const save = () => {
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl w-full max-w-md mx-auto animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">Firma de Conformidad</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <p className="text-sm text-slate-500 mb-4">
        Por favor, firma dentro del recuadro para confirmar la recepción del equipo.
      </p>

      <div className="relative border-2 border-slate-100 rounded-xl bg-slate-50 overflow-hidden touch-none h-48">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={clear}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
        >
          <Eraser size={18} />
          Limpiar
        </button>
        <button
          onClick={save}
          disabled={!hasSignature}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors shadow-md"
        >
          <Check size={18} />
          Confirmar
        </button>
      </div>
    </div>
  )
}
