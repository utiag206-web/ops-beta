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
 title: "InthalyOps",
 description: "Plataforma de Gestión de Trabajadores - Horizon Industries",
 manifest: "/manifest.json",
 icons: {
 icon: "/logo-ops.png",
 shortcut: "/logo-ops.png",
 apple: "/apple-touch-icon.png",
 }
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
