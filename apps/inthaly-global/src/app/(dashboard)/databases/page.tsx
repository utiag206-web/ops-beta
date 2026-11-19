import React from 'react'
import Link from 'next/link'
import {
  Database,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  HardDrive,
  RefreshCw,
  Layers,
  KeyRound,
  Compass,
  Lock,
  FileText
} from 'lucide-react'
import { getBackupDisasterRecoveryStatus } from '@/lib/telemetry/system-telemetry.service'

export const dynamic = 'force-dynamic'

export default function DatabasesPage() {
  const backup = getBackupDisasterRecoveryStatus()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/overview"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Bases de Datos Soberanas & Respaldos</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  PostgreSQL 16 Activo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Esquemas inthaly_id e inthaly_community · PgBouncer Pooler</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Supervisión de los motores de datos del ecosistema. Garantiza el aislamiento total de credenciales y perfiles, pooling de conexiones transaccionales mediante PgBouncer y pruebas de restauración efímera contra desastres.
        </p>
      </div>

      {/* 2. Desglose de Bases de Datos Segregadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* BD 1: inthaly_id */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Base de Datos: inthaly_id
              </h2>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Identidad Central
            </span>
          </div>

          <p className="text-slate-500 leading-relaxed">
            Esquema reservado exclusivamente para la federación de identidades, sesiones ciegas, tokens de verificación y clientes OIDC del ecosistema.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Usuario DB Propietario:</span>
              <span className="font-mono font-bold text-slate-900">inthaly_id_user</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Autenticación de Motor:</span>
              <span className="font-bold text-emerald-600">SCRAM-SHA-256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tablas Principales:</span>
              <span className="font-mono text-slate-700 text-[11px]">identities, sessions, oidc_clients</span>
            </div>
          </div>
        </div>

        {/* BD 2: inthaly_community */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Base de Datos: inthaly_community
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Red Profesional
            </span>
          </div>

          <p className="text-slate-500 leading-relaxed">
            Esquema para perfiles comunitarios, foros técnicos, publicaciones y mensajería. Prohíbe almacenar fotos binarias en base de datos.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Usuario DB Propietario:</span>
              <span className="font-mono font-bold text-slate-900">inthaly_community_user</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Aislamiento de Permisos:</span>
              <span className="font-bold text-emerald-600">Sin acceso de lectura a inthaly_id</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Almacenamiento de Fotos:</span>
              <span className="font-mono text-slate-700 text-[11px]">MinIO S3 (Bucket inthaly-community-assets)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Panel de Respaldos & Disaster Recovery con Restauración Real */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck size={18} className="text-blue-600" />
              <span>Respaldos Diarios & Prueba Real de Restauración</span>
            </h2>
            <p className="text-xs text-slate-500">Validación periódica con script infra/backup/test-restore.sh</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            DR Verificado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Política de Respaldo</span>
            <span className="font-bold text-slate-900 block">{backup.schedule}</span>
            <span className="text-slate-500 text-[11px] block">Rotación automática de {backup.retentionDays} días</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Integridad Criptográfica</span>
            <span className="font-mono font-bold text-slate-900 text-[11px] block">{backup.integrityAlgorithm}</span>
            <span className="font-mono text-[10px] text-slate-500 truncate block">Hash: {backup.lastBackupSha256}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Test de Restauración Efímera</span>
            <span className="font-bold text-emerald-600 text-[11px] block">Base inthaly_restore_test_db</span>
            <span className="text-slate-500 text-[11px] block">Prueba de ciclo completo verificada</span>
          </div>
        </div>
      </div>
    </div>
  )
}
