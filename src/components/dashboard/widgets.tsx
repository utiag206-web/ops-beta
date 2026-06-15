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

export function StatWidget({ title, value, icon: Icon, color, bg, href, trend }: any) {
  const content = (
    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between gap-5 md:gap-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className={`${bg} p-4 rounded-[1.25rem] group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm border border-slate-100/50`}>
          <Icon className={color} size={28} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
            trend.type === 'up' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'
          }`}>
            {trend.type === 'up' ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>

      <div className="relative z-10 mt-2">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.18em] mb-2 leading-none">{title}</p>
        <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors leading-none">{value}</p>
      </div>
    </div>
  )

  if (href) return <Link href={href} className="block h-full">{content}</Link>
  return content
}

export function AlertWidget({ title, message, icon: Icon, color, bg, href }: any) {
  return (
    <div className={`${bg} border border-slate-100 p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 group-hover:rotate-12 transition-transform">
          <Icon className={color} size={28} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 tracking-tighter">{message}</h4>
        </div>
      </div>
      {href && (
        <Link href={href} className="p-3 bg-white rounded-xl text-slate-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-blue-600 hover:scale-110">
          <ArrowRight size={24} />
        </Link>
      )}
    </div>
  )
}

export function ListWidget({ title, items, icon: Icon, color, hrefLabel, href }: any) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4">
          <div className={`${color.replace('text-', 'bg-')}/10 p-3 rounded-2xl`}>
            <Icon className={color} size={22} strokeWidth={2.5} />
          </div>
          <span className="tracking-tight">{title}</span>
        </h3>
        {href && (
          <Link href={href} className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-2 px-5 py-2.5 bg-blue-50 rounded-xl transition-all uppercase tracking-widest shadow-sm">
            {hrefLabel || 'Ver todos'} <ArrowRight size={14} strokeWidth={3} />
          </Link>
        )}
      </div>
      <div className="space-y-4 flex-1">
        {items?.length > 0 ? (
          items.map((item: any, idx: number) => (
            <div key={idx} className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-[2rem] flex items-center justify-between group/item hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight group-hover/item:text-blue-600 transition-colors">{item.title || item.name}</p>
                <p className="text-[11px] font-bold text-slate-400 truncate mt-1">{item.subtitle}</p>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase ml-4 shadow-sm border ${item.badgeColor || 'bg-white text-slate-600 border-slate-100'}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-10 bg-slate-50/30 rounded-[2rem] border-2 border-dashed border-slate-100">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <Icon className="text-slate-200" size={32} />
            </div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest leading-loose">No hay actividad reciente</p>
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
    switch (viewMode) {
      case 'ADMIN':
        return {
          title: "Centro de Control Administrativo",
          text: "Supervisa el rendimiento global, gestiona el personal y controla los recursos estratégicos de la empresa."
        }
      case 'FINANCE':
        return {
          title: "Gestión de Finanzas y Tesorería",
          text: "Controla los flujos de caja, bonificaciones y reportes administrativos en tiempo real."
        }
      case 'SOMA':
        return {
          title: "Seguridad y Salud Ocupacional (HSEC)",
          text: "Garantiza un entorno seguro reportando incidentes y supervisando el cumplimiento de normas de seguridad."
        }
      case 'OPERACIONES':
        return {
          title: "Gestión Operativa de Campo",
          text: "Monitorea la producción, movimientos de personal y requerimientos logísticos del día."
        }
      case 'COCINA':
        return {
          title: "Control de Servicios de Alimentación",
          text: "Administra el inventario de insumos, raciones diarias y presupuesto de cocina local."
        }
      case 'ALMACEN':
        return {
          title: "Gestión Logística e Inventarios",
          text: "Controla el stock, registra ingresos y salidas, y gestiona transferencias entre almacenes."
        }
      case 'WORKER':
        return {
          title: "Mi Espacio Personal",
          text: "Revisa tu asistencia, descarga tus documentos y mantente al día con las comunicaciones internas."
        }
      default:
        return {
          title: "Panel de Gestión Inthaly",
          text: "Bienvenido al ecosistema operativo para la gestión integral de trabajadores y recursos."
        }
    }
  }

  const content = getHeroContent()

  // Construct worker portal URL on mount to avoid hydration mismatch and mismatch on QR code
  const [portalUrl, setPortalUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      const url = isLocal && localIp && localIp !== '127.0.0.1'
        ? `http://${localIp}:${window.location.port}/w/${companySlug || 'empresa'}`
        : `${window.location.origin}/w/${companySlug || 'empresa'}`
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
              text-transform: uppercase;
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
              text-transform: uppercase;
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
              <h1>PORTAL DE TRABAJADORES</h1>
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
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group border border-blue-600/30">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] group-hover:bg-white/20 transition-all duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[80px] group-hover:bg-indigo-400/20 transition-all duration-1000" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span 
              style={{ color: '#ffffff' }}
              className="bg-white/10 backdrop-blur-md text-[9px] font-extrabold px-4 py-1.5 rounded-lg keep-case tracking-wider border border-white/10"
            >
              {roleName} {area ? `| ${area === 'Almacén y Mantenimiento' ? 'Mecánica' : area}` : ''}
            </span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span 
              style={{ color: '#dbeafe' }}
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Building2 size={13} />
              {companyName}
            </span>
          </div>
          
          <h1 
            style={{ color: '#ffffff' }}
            className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 tracking-tight leading-tight"
          >
            {content.title} 👋
            <span 
              style={{ color: '#dbeafe' }}
              className="text-lg md:text-xl lg:text-2xl block font-medium mt-1"
            >
              Hola, <span style={{ color: '#ffffff' }} className="font-black">{userName}</span>
            </span>
          </h1>
          <p 
            style={{ color: 'rgba(239, 246, 255, 0.85)' }}
            className="text-xs md:text-sm font-bold leading-relaxed max-w-xl mt-3 keep-case"
          >
            {content.text}
          </p>
        </div>
        
        {viewMode !== 'WORKER' && (
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-4 p-5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 hover:scale-105 transition-all text-left group/btn cursor-pointer shadow-lg shadow-blue-900/10"
            >
              <div className="p-3 bg-white/20 rounded-xl group-hover/btn:bg-white text-white group-hover/btn:text-blue-700 transition-colors">
                <QrCode size={24} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest leading-none mb-1.5">Acceso Rápido</p>
                <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none">Acceso Trabajadores</h4>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Floating QR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            {/* Header backdrop gradient */}
            <div className="p-6 text-center bg-gradient-to-r from-blue-700 to-blue-600 text-white relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
              >
                <X size={18} />
              </button>
              
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-lg mb-3">
                <QrCode size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight leading-none">Acceso de Trabajadores</h3>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1.5">{companyName}</p>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col items-center">
              {/* QR Code Frame */}
              <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner mb-6 relative group">
                <div className="bg-white p-3 rounded-2xl shadow-md flex items-center justify-center min-w-[12rem] min-h-[12rem]">
                  {qrImageUrl ? (
                    <img 
                      src={qrImageUrl} 
                      alt="Acceso QR" 
                      className="w-48 h-48 block"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory text */}
              <p className="text-slate-500 font-bold text-center text-xs leading-relaxed max-w-sm mb-6">
                Comparte este acceso con tus trabajadores para que puedan ingresar a su portal operativo mediante DNI o código de trabajador.
              </p>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={handleDownloadPNG}
                  className="flex items-center justify-center gap-2 p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-2xl transition-all border border-slate-100 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Download size={15} className="text-slate-500" />
                  Descargar PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-2xl transition-all border border-slate-100 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Printer size={15} className="text-slate-500" />
                  Descargar PDF
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-2 p-3.5 ${
                    copied ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100'
                  } font-black rounded-2xl transition-all border text-[10px] uppercase tracking-wider cursor-pointer active:scale-95`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} className="text-slate-500" />}
                  {copied ? 'Copiado' : 'Copiar Enlace'}
                </button>
                <button
                  onClick={handleShareLink}
                  className="flex items-center justify-center gap-2 p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black rounded-2xl transition-all border border-blue-100/50 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Share2 size={15} />
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
