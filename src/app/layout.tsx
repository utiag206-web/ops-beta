import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from 'sonner';
import UppercaseEnforcer from "@/components/UppercaseEnforcer";
import { OfflineProvider } from "@/components/providers/offline-provider";

const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
});


export const viewport: Viewport = {
  themeColor: '#0f172a',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sistemaops.inthaly.com'),
  title: "INTHALY OPS",
  description: "Sistema de Gestión Empresarial",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
    siteName: "INTHALY OPS",
    url: "https://sistemaops.inthaly.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "INTHALY OPS",
    description: "Sistema de Gestión Empresarial",
  },
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="es">
 <body
 className={`${inter.variable} antialiased`}
 >
 <UppercaseEnforcer />
 <OfflineProvider>
  {children}
 </OfflineProvider>
 <Toaster richColors position="top-right" />
 </body>
 </html>
 );
}
