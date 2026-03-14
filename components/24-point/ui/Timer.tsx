'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  timeLeft: number
  total?: number
}

export default function Timer({ timeLeft, total = 60 }: TimerProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const percentage = mounted ? (timeLeft / total) * 100 : 100
  const isLow = timeLeft <= 10
  const isCritical = timeLeft <= 5

  const color = isCritical
    ? 'text-rose-500'
    : isLow
      ? 'text-amber-500'
      : 'text-gray-700'

  const barColor = isCritical
    ? 'bg-rose-400'
    : isLow
      ? 'bg-amber-400'
      : 'bg-indigo-400'

  return (
    <div className="flex items-center gap-3 min-w-[120px] md:min-w-[160px]">
      <div className="flex-1 h-2 md:h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-mono font-bold text-lg md:text-xl tabular-nums ${color} ${isCritical ? 'animate-pulse' : ''}`}>
        {timeLeft}s
      </span>
    </div>
  )
}
