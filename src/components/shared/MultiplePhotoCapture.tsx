'use client'

import React, { useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'

interface MultiplePhotoCaptureProps {
  photos: string[]
  onChange: (photos: string[]) => void
  label?: string
}

export function MultiplePhotoCapture({ photos, onChange, label = "Adjuntar Fotografías" }: MultiplePhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: string[] = []
    let processedCount = 0

    const checkComplete = () => {
      processedCount++
      if (processedCount === files.length) {
        onChange([...photos, ...newPhotos])
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const objectUrl = URL.createObjectURL(file)
      
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width))
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height))
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        newPhotos.push(dataUrl)
        URL.revokeObjectURL(objectUrl)
        checkComplete()
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        checkComplete()
      }
      img.src = objectUrl
    }
  }

  const removePhoto = (index: number) => {
    const next = [...photos]
    next.splice(index, 1)
    onChange(next)
  }

  return (
    <div className="w-full">
      <div className="text-[11px] font-bold text-slate-600 mb-2">{label}</div>
      
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map((p, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
              <img src={p} alt="evidence" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Camera size={20} className="mb-1" />
          <span className="text-[10px] font-bold">Tomar / Seleccionar</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCapture}
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
      />
    </div>
  )
}
