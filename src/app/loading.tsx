import { InthalyIsotype } from '@/components/brand/InthalyLogo'

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#06122e] via-[#0b1b3d] to-[#1e3a8a] text-white select-none px-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-5">
        {/* Centered Clean Vector Isotype with NO background plate */}
        <InthalyIsotype size={96} className="transform transition-transform animate-pulse" />

        {/* Wordmark matching brand guide */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Inthaly<span className="text-sky-400">Ops</span>
          </h1>
          <p className="text-xs font-medium tracking-wide text-blue-200/75">
            Operaciones que impulsan tu gente y tu negocio
          </p>
        </div>

        {/* Sleek indeterminate loader bar */}
        <div className="w-28 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
          <div className="w-full h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
