'use client'

import React from 'react'

export interface InthalyIsotypeProps {
  size?: number | string
  className?: string
  variant?: 'standalone' | 'appIcon'
}

/**
 * InthalyOps Official Pure Vector Isotype
 * Faithful mathematical replication of the official brand identity:
 * - Isometric badge / play form (▶)
 * - Pure continuous ribbon loop with rounded corner at right apex
 * - Lower diagonal capsule arm with semicircular rounded cap overlapping left pillar
 * - Beveled 3D chamfer facet connecting left pillar to top arm
 * - Pristine triangular inner cavity (negative space revealing background)
 * - Central regular floating hexagon with point-up/down orientation
 * - Transparent background (standalone) or official squircle with ambient glow (appIcon)
 */
export function InthalyIsotype({
  size = 36,
  className = '',
  variant = 'standalone',
}: InthalyIsotypeProps) {
  const isAppIcon = variant === 'appIcon'
  const viewBox = isAppIcon ? '0 0 512 512' : '105 85 305 335'
  const computedHeight =
    typeof size === 'number'
      ? isAppIcon
        ? size
        : Math.round(size * (335 / 305))
      : size

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={computedHeight}
      className={'shrink-0 ' + className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="InthalyOps Isotipo"
    >
      <defs>
        {/* Squircle Background Gradient */}
        <linearGradient id="inthaly_bgGrad" x1="18%" y1="0%" x2="82%" y2="100%">
          <stop offset="0%" stopColor="#4aa3ff" />
          <stop offset="25%" stopColor="#1f71fc" />
          <stop offset="65%" stopColor="#024fd8" />
          <stop offset="100%" stopColor="#012b94" />
        </linearGradient>

        {/* Ambient Center Glow for App Icon */}
        <radialGradient id="inthaly_centerGlow" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#2563eb" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#012b94" stopOpacity="0" />
        </radialGradient>

        {/* Left Pillar Gradient: Pure white outer highlight into luminous cyan and blue */}
        <linearGradient id="inthaly_leftPillarGrad" x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor="#e0f2fe" />
          <stop offset="65%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Top-Left 3D Chamfer Facet */}
        <linearGradient id="inthaly_facetGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>

        {/* Top Chamfer Roof Edge: Crisp pure white highlight */}
        <linearGradient id="inthaly_topRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#f0f9ff" />
          <stop offset="75%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>

        {/* Continuous Outer Ribbon Gradient: From white apex -> cyan -> sky blue -> ice-white cap */}
        <linearGradient id="inthaly_ribbonGrad" x1="25%" y1="5%" x2="45%" y2="95%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#e0f2fe" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="70%" stopColor="#0284c7" />
          <stop offset="85%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Hexagon Gradient: ice-blue to vibrant azure */}
        <linearGradient id="inthaly_hexGrad" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="45%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Drop shadow under the capsule end overlapping the left pillar */}
        <filter id="inthaly_pillShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="-4" dy="-3" stdDeviation="5" floodColor="#012b7a" floodOpacity="0.32" />
        </filter>
      </defs>

      {isAppIcon && (
        <g>
          <rect width="512" height="512" rx="115" fill="url(#inthaly_bgGrad)" />
          <rect width="512" height="512" rx="115" fill="url(#inthaly_centerGlow)" />
        </g>
      )}

      {/* 1. Left Vertical Pillar & Hexagonal Base Facets */}
      <path
        d="M 195 175
           L 195 335
           L 195 375
           L 190 412
           C 165 412 142 390 132 360
           L 132 185
           C 132 160 148 142 172 142
           L 195 175 Z"
        fill="url(#inthaly_leftPillarGrad)"
      />

      {/* 2. Top-Left 3D Chamfer Facet */}
      <path
        d="M 172 142
           L 220 106
           L 242 138
           L 195 175 Z"
        fill="url(#inthaly_facetGrad)"
      />

      {/* 3. The Continuous Outer Ribbon: Top Arm + Right Apex + Bottom Capsule Arm */}
      <path
        d="M 220 106
           C 234 96 252 100 268 110
           L 375 192
           C 392 205 398 228 394 256
           C 390 278 378 296 360 308
           L 245 392
           A 38 38 0 0 1 195 335
           L 338 256
           L 195 175
           L 242 138
           Z"
        fill="url(#inthaly_ribbonGrad)"
        filter="url(#inthaly_pillShadow)"
      />

      {/* 4. Top Arm Roof Chamfer (pure white top highlight strip) */}
      <path
        d="M 220 106
           C 234 96 252 100 268 110
           L 375 192
           C 392 205 398 228 394 256
           L 365 235
           L 255 142
           L 220 106 Z"
        fill="url(#inthaly_topRoofGrad)"
      />

      {/* 5. Floating Regular Hexagon in Cavity */}
      <polygon
        points="
          250, 224
          278, 240
          278, 272
          250, 288
          222, 272
          222, 240
        "
        fill="url(#inthaly_hexGrad)"
      />
    </svg>
  )
}

/**
 * Full InthalyOps Brand Logo (Isotype + Wordmark)
 */
export function InthalyLogo({
  size = 36,
  className = '',
  textColor = 'text-white',
  variant = 'standalone',
}: {
  size?: number
  className?: string
  textColor?: string
  variant?: 'standalone' | 'appIcon'
}) {
  return (
    <div className={'flex items-center gap-3 ' + className}>
      <InthalyIsotype size={size} variant={variant} />
      <div className="flex flex-col">
        <span className={'text-lg font-black tracking-tight leading-none ' + textColor}>
          Inthaly<span className="text-sky-400">Ops</span>
        </span>
        <span className="text-[10px] font-medium tracking-normal text-slate-400 mt-1">
          Operaciones que impulsan tu gente y tu negocio
        </span>
      </div>
    </div>
  )
}
