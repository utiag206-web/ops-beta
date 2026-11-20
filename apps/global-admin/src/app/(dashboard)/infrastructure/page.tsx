import React from 'react'
import Link from 'next/link'
import {
  Server,
  ArrowLeft,
  Shield,
  HardDrive,
  Cpu,
  Network,
  CheckCircle2,
  Lock,
  ExternalLink,
  Layers,
  Activity
} from 'lucide-react'
import {
  getSystemMetrics,
  getContainerServices,
  getSecurityPerimeterStatus
} from '@/lib/telemetry/system-telemetry.service'

export const dynamic = 'force-dynamic'

export default function InfrastructurePage() {
  const metrics = getSystemMetrics()
  const containers = getContainerServices()
  const security = getSecurityPerimeterStatus()

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
              <Server size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Infraestructura & Contenedores Docker</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Red inthaly_internal Activa
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Docker Compose v2.26+ · Red Interna Aislada</p>
            </div>
          </div>

          <Link
            href="/control-center"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Activity size={13} className="text-blue-400" />
            <span>Ver Métricas en Tiempo Real</span>
          </Link>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Topología física y lógica de la infraestructura autogestionada INTHALY CORE. Diseñada sobre un servidor Linux autogestionado con orquestación modular de microservicios, aislamiento de redes y proxy perimetral seguro.
        </p>
      </div>

      {/* 2. Topología de Redes & Aislamiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Red Pública / DMZ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network size={18} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Red Pública / DMZ (Host)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Caddy Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Único punto de entrada perimetral. Los puertos 80 (HTTP) y 443 (HTTPS) están gestionados por Caddy con TLS automatizado y filtrado de cabeceras.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Puertos Expuestos:</span>
              <span className="font-mono font-bold text-slate-900">80/tcp, 443/tcp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cifrado Perimetral:</span>
              <span className="font-bold text-emerald-600">TLS 1.3 / HSTS 31536000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Firewall de Host:</span>
              <span className="font-bold text-slate-900">UFW + Fail2ban Activo</span>
            </div>
          </div>
        </div>

        {/* Red Privada inthaly_internal */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Red Privada: inthaly_internal
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Aislada
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Red bridge interna de Docker. Ni PostgreSQL ni Redis ni PgBouncer exponen puertos hacia internet. Toda comunicación inter-contenedor es cifrada o local.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Puertos de Base de Datos:</span>
              <span className="font-mono font-bold text-slate-900">Solo 127.0.0.1:5432 / 6432</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Driver de Red:</span>
              <span className="font-mono font-bold text-slate-900">bridge (internal: false)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Docker Socket:</span>
              <span className="font-bold text-emerald-600">Sin montaje /var/run/docker.sock</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Desglose Detallado de Contenedores */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Contenedores Orquestados en docker-compose.yml
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {containers.map((c) => (
            <div key={c.containerName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {c.status}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 block">{c.containerName}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {c.details}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Imagen:</span>
                  <span className="font-mono text-slate-700 text-[10px] truncate max-w-[150px]">{c.image}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Puerto Interno:</span>
                  <span className="font-mono font-bold text-slate-700">:{c.internalPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reinicio:</span>
                  <span className="font-mono text-slate-700 text-[10px]">{c.restartPolicy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
