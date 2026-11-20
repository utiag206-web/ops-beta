'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'

interface PhotoCaptureProps {
  onPhotoCapture: (base64Data: string) => void
  label?: string
}

export function PhotoCapture({ onPhotoCapture, label = "Adjuntar Fotografía" }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Optimización razonable: max 800px width/height
        const MAX_SIZE = 800
        let width = img.width
        let height = img.height

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width
          width = MAX_SIZE
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height
          height = MAX_SIZE
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6) // 60% quality
        setPreview(compressedBase64)
        onPhotoCapture(compressedBase64)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const clearPhoto = () => {
    setPreview(null)
    onPhotoCapture('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-slate-600">{label}</label>
      
      {!preview ? (
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-500 transition-colors"
          >
            <Camera size={20} />
            <span className="text-xs font-bold">Tomar / Elegir Foto</span>
          </button>
          <input 
            type="file" 
            accept="image/*"
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleCapture}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 flex items-center justify-center">
          <img src={preview} alt="Evidencia" className="object-contain max-h-full" />
          <button 
            type="button"
            onClick={clearPhoto}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
