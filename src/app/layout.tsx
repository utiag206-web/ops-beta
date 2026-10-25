import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from 'sonner';
import UppercaseEnforcer from "@/components/UppercaseEnforcer";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { InthalyIsotype } from "@/components/brand/InthalyLogo";
import { AppSplashCoordinator } from "@/components/layout/AppSplashCoordinator";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#06122e',
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
      { url: '/favicon.ico?v=1.3.1', sizes: '32x32' },
      { url: '/icon.svg?v=1.3.1', type: 'image/svg+xml' },
      { url: '/icon-192x192.png?v=1.3.1', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png?v=1.3.1', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=1.3.1',
    apple: [
      { url: '/apple-touch-icon.png?v=1.3.1', sizes: '180x180', type: 'image/png' },
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
      <body className={`${inter.variable} antialiased`}>
        {/* Initial Static HTML Splash: renders instantly on Frame 0, eliminating blank gap */}
        <div
          id="inthaly-initial-splash"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #06122e 0%, #0b1b3d 50%, #1e3a8a 100%)',
            color: '#ffffff',
            userSelect: 'none',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <InthalyIsotype size={96} />
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff', margin: 0 }}>
                Inthaly<span style={{ color: '#38bdf8' }}>Ops</span>
              </h1>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.025em', color: 'rgba(191, 219, 254, 0.75)', margin: 0 }}>
                Operaciones que impulsan tu gente y tu negocio
              </p>
            </div>
            <div style={{ width: '7rem', height: '0.25rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, #38bdf8, #3b82f6)', borderRadius: '9999px' }} />
            </div>
          </div>
        </div>

        {/* Client-side Coordinator: safely dismisses initial splash once React has hydrated */}
        <AppSplashCoordinator />

        {/* Safety Script: In the event of fatal unhandled network/JS failure, dismiss after 5s */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function() {
                var el = document.getElementById('inthaly-initial-splash');
                if (el) {
                  el.style.transition = 'opacity 200ms ease';
                  el.style.opacity = '0';
                  setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 200);
                }
              }, 5000);
            `,
          }}
        />

        <UppercaseEnforcer />
        <OfflineProvider>
          {children}
        </OfflineProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
