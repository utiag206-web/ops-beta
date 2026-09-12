import type { Metadata } from 'next'
import { LandingClient } from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  metadataBase: new URL('https://inthaly-ops.com'),
  title: 'INTHALY OPS | Plataforma SaaS Integral de Gestión Operativa',
  description:
    'INTHALY OPS es una plataforma SaaS de gestión operativa integral para empresas que centraliza trabajadores, asistencia y tareo, inventario Kardex, transporte, documentos normativos y finanzas en una sola suite.',
  keywords: [
    'INTHALY OPS',
    'gestión de operaciones',
    'SaaS empresarial',
    'gestión de trabajadores',
    'tareo operativo',
    'control de asistencia',
    'control de inventario',
    'kardex continuo',
    'logística y transporte',
    'software de operaciones',
    'portal del trabajador',
    'gestión industrial y minera'
  ],
  authors: [{ name: 'INTHALY OPS Team' }],
  creator: 'INTHALY OPS',
  publisher: 'INTHALY OPS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: 'https://inthaly-ops.com',
    siteName: 'INTHALY OPS',
    title: 'INTHALY OPS | Controla toda tu operación desde un solo lugar',
    description:
      'Plataforma SaaS de gestión operativa integral para empresas que centraliza trabajadores, asistencia y tareo, inventario Kardex, transporte, documentos y finanzas.',
    images: [
      {
        url: '/images/screens/hero-dashboard.png',
        width: 1600,
        height: 950,
        alt: 'INTHALY OPS - Dashboard Operativo para Empresas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INTHALY OPS | Gestión Integral de Operaciones Empresariales',
    description:
      'Centraliza trabajadores, asistencia y tareo, inventario Kardex, transporte, documentos y finanzas en una sola suite conectada.',
    images: ['/images/screens/hero-dashboard.png'],
  },
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'INTHALY OPS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    description:
      'Plataforma SaaS de gestión operativa integral para empresas que centraliza trabajadores, asistencia y tareo, inventario Kardex, transporte, documentos y finanzas en una sola suite.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'INTHALY OPS',
      url: 'https://inthaly-ops.com',
      logo: 'https://inthaly-ops.com/logo-ops.png',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
