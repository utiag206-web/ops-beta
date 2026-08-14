'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function AttendanceDateFilter({ defaultDate }: { defaultDate: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDate = searchParams.get('date') || defaultDate

  return (
    <input 
      type="date" 
      value={currentDate}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`?date=${e.target.value}`)
        } else {
          router.push(`?`)
        }
      }}
      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-800"
    />
  )
}
