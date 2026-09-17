'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
 Users, UserCheck, ShieldAlert, BadgeDollarSign, 
 Package, Boxes, ClipboardCheck, Activity, 
 Clock, CheckCircle2, ArrowRight, FileText,
 Mountain, Bed, Construction, Building2,
 QrCode, Download, Share2, Copy, Check, X, Printer,
 Loader2
} from 'lucide-react'

export function StatWidget({ title, value, icon: Icon, color, bg, href, trend, badge }: any) {
  const content = (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group h-full relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className={`${bg} p-2 rounded-lg group-hover:scale-105 transition-transform duration-200 shrink-0 shadow-xs border border-slate-100/50`}>
          <Icon className={color} size={18} strokeWidth={2.2} />
        </div>
        {badge && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${badge.color || 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
            {badge.text}
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${
            trend.type === 'up' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'
          }`}>
            {trend.type === 'up' ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>

      <div className="relative z-10 mt-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 leading-none">{title}</p>
        <p className={`font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none ${
          String(value || '').length > 12 
            ? 'text-base sm:text-lg tracking-tight' 
            : String(value || '').length > 8 
            ? 'text-lg sm:text-xl tracking-tight' 
            : 'text-xl sm:text-2xl tracking-tight'
        }`}>{value}</p>
      </div>
    </div>
  )

  if (href) return <Link href={href} className="block h-full">{content}</Link>
  return content
}

export function AlertWidget({ title, message, icon: Icon, color, bg, href }: any) {
  return (
    <div className={`${bg} border border-slate-100 p-4 sm:p-5 rounded-xl shadow-xs flex items-center justify-between group hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center gap-4">
        <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-50 group-hover:rotate-6 transition-transform">
          <Icon className={color} size={20} strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{message}</h4>
        </div>
      </div>
      {href && (
        <Link href={href} className="p-2 bg-white rounded-lg text-slate-400 shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:text-blue-600 hover:scale-105">
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  )
}

export function ListWidget({ title, items, icon: Icon, color, hrefLabel, href }: any) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-100 flex flex-col h-full hover:shadow-md transition-all duration-200 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-3">
          <div className={`${color.replace('text-', 'bg-')}/10 p-2 rounded-lg`}>
            <Icon className={color} size={18} strokeWidth={2.2} />
          </div>
          <span className="tracking-tight">{title}</span>
        </h3>
        {href && (
          <Link href={href} className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 rounded-lg transition-all tracking-tight shadow-xs">
            {hrefLabel || 'Ver todos'} <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        )}
      </div>
      <div className="space-y-2.5 flex-1">
        {items?.length > 0 ? (
          items.map((item: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl flex items-center justify-between group/item hover:bg-white hover:shadow-xs hover:border-blue-100 transition-all duration-200">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate tracking-tight group-hover/item:text-blue-600 transition-colors">{item.title || item.name}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ml-3 shadow-xs border ${item.badgeColor || 'bg-white text-slate-600 border-slate-100'}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/30 rounded-xl border-2 border-dashed border-slate-100">
            <div className="bg-white p-3 rounded-full shadow-xs mb-2">
              <Icon className="text-slate-200" size={24} />
            </div>
            <p className="text-xs font-medium text-slate-400 tracking-tight">No hay actividad reciente</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function WelcomeHero({ userName, roleName, area, companyName, viewMode, companySlug, localIp }: any) {
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [copied, setCopied] = useState(false)

 const getHeroContent = () => {
    // Convertir nombre a Title Case (Ej: ROMEL CHUNG -> Romel Chung)
    const formattedName = userName 
      ? userName.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Usuario';

    return {
      title: `Bienvenido, ${formattedName}`,
      text: "Supervisa la operación, el personal y los recursos de la empresa."
    }
  }

 const content = getHeroContent()

 // Construct worker portal URL on mount to avoid hydration mismatch and mismatch on QR code
 const [portalUrl, setPortalUrl] = useState('')

 useEffect(() => {
 if (typeof window !== 'undefined') {
 const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
 const origin = window.location.origin
 const url = isLocal && localIp && localIp !== '127.0.0.1'
 ? `http://${localIp}:${window.location.port}/w/${companySlug || 'empresa'}`
 : `${origin}/w/${companySlug || 'empresa'}`
 setPortalUrl(url)
 }
 }, [companySlug, localIp])

 const qrImageUrl = portalUrl 
 ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
 : ''

 // Copy Link
 const handleCopyLink = async () => {
 try {
 await navigator.clipboard.writeText(portalUrl)
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 } catch (err) {
 console.error('Failed to copy', err)
 }
 }

 // Share Link
 const handleShareLink = () => {
 if (navigator.share) {
 navigator.share({
 title: `Portal de Trabajadores - ${companyName}`,
 text: `Ingresa al portal operativo de ${companyName} mediante tu DNI o código de trabajador.`,
 url: portalUrl,
 }).catch(console.error)
 } else {
 const text = encodeURIComponent(`Hola! Aquí tienes el enlace de acceso al Portal de Trabajadores de ${companyName}: ${portalUrl}`)
 window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
 }
 }

 // Download PNG
 const handleDownloadPNG = async () => {
 try {
 const response = await fetch(qrImageUrl)
 const blob = await response.blob()
 const downloadUrl = window.URL.createObjectURL(blob)
 const link = document.createElement('a')
 link.href = downloadUrl
 link.download = `QR_Acceso_${companySlug || 'empresa'}.png`
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
 } catch (err) {
 window.open(qrImageUrl, '_blank')
 }
 }

 // Download PDF / Print View
 const handleDownloadPDF = () => {
 const printWindow = window.open('', '_blank', 'width=800,height=800')
 if (!printWindow) return

 printWindow.document.write(`
 <html>
 <head>
 <title>QR Acceso Trabajadores - ${companyName}</title>
 <style>
 body {
 font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
 margin: 0;
 padding: 40px;
 color: #1e293b;
 text-align: center;
 background-color: #ffffff;
 }
 .container {
 max-width: 600px;
 margin: 0 auto;
 border: 2px solid #e2e8f0;
 border-radius: 24px;
 padding: 40px;
 box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
 }
 .header {
 margin-bottom: 30px;
 }
 .logo-placeholder {
 width: 64px;
 height: 64px;
 background-color: #1D4ED8;
 color: white;
 border-radius: 16px;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 28px;
 font-weight: bold;
 margin: 0 auto 16px;
 }
 h1 {
 font-size: 24px;
 font-weight: 800;
 margin: 0 0 8px;
 color: #0f172a;
 letter-spacing: -0.025em;
 }
 .company {
 font-size: 16px;
 font-weight: 600;
 color: #1D4ED8;
 text-transform: ;
 letter-spacing: 0.05em;
 }
 .qr-code {
 width: 250px;
 height: 250px;
 margin: 30px auto;
 padding: 10px;
 border: 1px solid #e2e8f0;
 border-radius: 16px;
 }
 .instructions {
 margin-top: 30px;
 text-align: left;
 background-color: #f8fafc;
 padding: 24px;
 border-radius: 16px;
 }
 .instructions h3 {
 margin: 0 0 12px;
 font-size: 14px;
 font-weight: bold;
 text-transform: ;
 color: #475569;
 letter-spacing: 0.05em;
 }
 .instructions ol {
 margin: 0;
 padding-left: 20px;
 font-size: 14px;
 color: #475569;
 line-height: 1.6;
 }
 .instructions li {
 margin-bottom: 8px;
 }
 .footer {
 margin-top: 40px;
 font-size: 11px;
 color: #94a3b8;
 }
 @media print {
 body {
 padding: 0;
 }
 .container {
 border: none;
 box-shadow: none;
 padding: 20px;
 }
 }
 </style>
 </head>
 <body>
 <div class="container">
 <div class="header">
 <div class="logo-placeholder">IO</div>
 <h1>Portal de Trabajadores</h1>
 <div class="company">${companyName}</div>
 </div>
 <img class="qr-code" src="${qrImageUrl}" alt="Código QR de Acceso" />
 <div class="instructions">
 <h3>Instrucciones para el trabajador:</h3>
 <ol>
 <li>Escanea el código QR con la cámara de tu celular.</li>
 <li>Ingresa mediante tu número de DNI o código de trabajador.</li>
 <li>Digita tu PIN de seguridad (DNI por defecto).</li>
 <li>¡Listo! Podrás ver tu asistencia, bonos y documentos.</li>
 </ol>
 </div>
 <div class="footer">
 Generado automáticamente por InthalyOps - ${new Date().toLocaleDateString()}
 </div>
 </div>
 <script>
 window.onload = function() {
 window.print();
 setTimeout(function() { window.close(); }, 500);
 }
 </script>
 </body>
 </html>
 `)
 printWindow.document.close()
 }

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-white shadow-xl relative overflow-hidden group border border-blue-600/30">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-white/15 transition-all duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-[70px] group-hover:bg-indigo-400/20 transition-all duration-1000" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2.5">
            <span 
              style={{ color: '#ffffff' }}
              className="bg-white/10 backdrop-blur-md text-[9px] font-semibold px-2.5 py-1 rounded-md keep-case tracking-normal border border-white/10"
            >
              {roleName} {area ? `| ${area === 'Almacén y Mantenimiento' ? 'Mecánica' : area}` : ''}
            </span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span 
              style={{ color: '#dbeafe' }}
              className="text-xs font-bold tracking-normal flex items-center gap-1.5"
            >
              <Building2 size={13} />
              {companyName}
            </span>
          </div>
          
          <h1 
            style={{ color: '#ffffff' }}
            className="text-xl sm:text-2xl font-bold mb-1 tracking-tight leading-snug"
          >
            {content.title} 👋
          </h1>
          <p 
            style={{ color: 'rgba(239, 246, 255, 0.85)' }}
            className="text-xs font-normal leading-relaxed max-w-xl mt-1 keep-case"
          >
            {content.text}
          </p>
        </div>
        
        {viewMode !== 'WORKER' && (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 hover:scale-102 transition-all text-left group/btn cursor-pointer shadow-md shadow-blue-900/10"
            >
              <div className="p-2 bg-white/20 rounded-lg group-hover/btn:bg-white text-white group-hover/btn:text-blue-700 transition-colors">
                <QrCode size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Acceso Rápido</p>
                <h4 className="text-xs font-bold text-white tracking-normal leading-none">Acceso Trabajadores</h4>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Floating QR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header backdrop gradient */}
            <div className="p-4 sm:p-5 text-center bg-gradient-to-r from-blue-700 to-blue-600 text-white relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-3 top-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
              >
                <X size={16} />
              </button>
              
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl mx-auto flex items-center justify-center border border-white/20 shadow-md mb-2">
                <QrCode size={20} className="text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight leading-none">Acceso de Trabajadores</h3>
              <p className="text-blue-100 text-[10px] font-semibold tracking-tight mt-1">{companyName}</p>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col items-center">
              {/* QR Code Frame */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner mb-4 relative group">
                <div className="bg-white p-2 rounded-lg shadow-xs flex items-center justify-center min-w-[9rem] min-h-[9rem]">
                  {qrImageUrl ? (
                    <img 
                      src={qrImageUrl} 
                      alt="Acceso QR" 
                      className="w-36 h-36 block"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-600" size={28} />
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory text */}
              <p className="text-slate-500 font-medium text-center text-xs leading-relaxed max-w-xs mb-4">
                Comparte este acceso con tus trabajadores para ingresar a su portal operativo mediante DNI o código de trabajador.
              </p>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={handleDownloadPNG}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all border border-slate-100 text-[10px] tracking-normal cursor-pointer active:scale-95"
                >
                  <Download size={14} className="text-slate-500" />
                  Descargar PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all border border-slate-100 text-[10px] tracking-normal cursor-pointer active:scale-95"
                >
                  <Printer size={14} className="text-slate-500" />
                  Descargar PDF
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-1.5 p-2.5 ${
                    copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100'
                  } font-bold rounded-xl transition-all border text-[10px] tracking-normal cursor-pointer active:scale-95`}
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-500" />}
                  {copied ? '¡Copiado!' : 'Copiar Link'}
                </button>
                <button
                  onClick={handleShareLink}
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs text-[10px] tracking-normal cursor-pointer active:scale-95"
                >
                  <Share2 size={14} />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
