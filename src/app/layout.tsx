import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from 'sonner';
import UppercaseEnforcer from "@/components/UppercaseEnforcer";

const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sistemaops.inthaly.com'),
  title: "INTHALY OPS",
  description: "Sistema de Gestión Empresarial",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-ops.png",
    shortcut: "/logo-ops.png",
    apple: "/apple-touch-icon.png",
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
 {children}
 <Toaster richColors position="top-right" />
 </body>
 </html>
 );
}
