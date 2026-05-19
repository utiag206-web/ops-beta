'use client'

import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'slate'
}

export function StatsCard({ title, value, subtitle, trend, icon, color }: StatsCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            <span className="text-[8px] opacity-70 font-bold ml-1">{trend.label}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}

export function SimpleBarChart({ data, maxValue, label }: { data: number[], maxValue: number, label: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-1 h-32">
        {data.map((val, i) => {
          const height = maxValue > 0 ? (val / maxValue) * 100 : 0
          return (
            <div key={i} className="flex-1 group relative">
              <div 
                className="bg-blue-500/20 group-hover:bg-blue-500 rounded-t-sm transition-all cursor-pointer"
                style={{ height: `${Math.max(height, 5)}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Día {i+1}: {val}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
        <span>Inicio Mes</span>
        <span>{label}</span>
        <span>Fin Mes</span>
      </div>
    </div>
  )
}

export function DonutChart({ percentage, label, color, size = 120 }: { percentage: number, label: string, color: string, size?: number }) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-slate-800">{percentage}%</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  )
}
