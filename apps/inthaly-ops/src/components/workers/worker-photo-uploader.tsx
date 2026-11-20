'use client'

import React, { useState, useRef, useTransition } from 'react'
import { User, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadWorkerPhoto } from '@/app/(main)/workers/actions'

interface WorkerPhotoUploaderProps {
 workerId: string
 initialPhotoUrl: string | null
 workerName: string
 canManage: boolean
}

export function WorkerPhotoUploader({
 workerId,
 initialPhotoUrl,
 workerName,
 canManage
}: WorkerPhotoUploaderProps) {
 const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl)
 const [isPending, startTransition] = useTransition()
 const fileInputRef = useRef<HTMLInputElement>(null)

 const handleContainerClick = () => {
 if (!canManage || isPending) return
 fileInputRef.current?.click()
 }

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 // Preview immediately
 const previewUrl = URL.createObjectURL(file)
 setPhotoUrl(previewUrl)

 startTransition(async () => {
 const formData = new FormData()
 formData.append('photo', file)

 const res = await uploadWorkerPhoto(workerId, formData)
 if (res.success && res.photo_url) {
 setPhotoUrl(res.photo_url)
 toast.success('Fotografía actualizada correctamente.')
 } else {
 // Rollback to initial url on failure
 setPhotoUrl(initialPhotoUrl)
 toast.error(res.error || 'No se pudo subir la fotografía.')
 }
 })
 }

 return (
 <div className="flex flex-col items-center gap-2">
 <div 
 onClick={handleContainerClick}
 className={`relative w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden group ${
 canManage && !isPending ? 'cursor-pointer hover:opacity-90' : ''
 }`}
 >
 {photoUrl ? (
 <img src={photoUrl} alt={workerName} className="w-full h-full object-cover" />
 ) : (
 <User size={40} />
 )}

 {/* Hover Camera Overlay */}
 {canManage && !isPending && (
 <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
 <Camera size={20} className="mb-0.5" />
 <span className="text-[9px] font-black tracking-normal">Actualizar</span>
 </div>
 )}

 {/* Loading Spinner Overlay */}
 {isPending && (
 <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white">
 <Loader2 className="animate-spin" size={24} />
 </div>
 )}
 </div>

 {canManage && (
 <>
 <input 
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept="image/*"
 className="hidden"
 />
 <button 
 type="button"
 onClick={handleContainerClick}
 disabled={isPending}
 className="text-[10px] font-black tracking-tight text-slate-400 hover:text-blue-600 transition-colors"
 >
 {isPending ? 'Subiendo...' : 'Cambiar Foto'}
 </button>
 </>
 )}
 </div>
 )
}
