import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'INTHALY GLOBAL — Centro de Administración y Control del Ecosistema',
  description: 'Consola única de supervisión, observabilidad, identidades y gestión multiempresa del ecosistema Inthaly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
