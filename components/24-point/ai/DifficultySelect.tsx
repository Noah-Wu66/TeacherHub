'use client'

import Card from '@/components/24-point/ui/Card'
import type { AiDifficulty } from '@/types/24-point'
import { AI_CONFIG } from '@/types/24-point'

interface DifficultySelectProps {
  onSelect: (difficulty: AiDifficulty) => void
}

const difficulties: AiDifficulty[] = ['easy', 'normal', 'hard', 'adaptive']

const icons: Record<AiDifficulty, string> = {
  easy: '🤖',
  normal: '🧠',
  hard: '👾',
  adaptive: '🎛️',
}

const gradients: Record<AiDifficulty, string> = {
  easy: 'from-green-400 to-emerald-500',
  normal: 'from-amber-400 to-orange-500',
  hard: 'from-rose-400 to-red-500',
  adaptive: 'from-sky-400 to-indigo-500',
}

export default function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="space-y-4">
      {difficulties.map((diff) => {
        const config = AI_CONFIG[diff]
        return (
          <Card
            key={diff}
            glass
            padding="none"
            className="group cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <button
              onClick={() => onSelect(diff)}
              className="w-full flex items-center gap-4 p-4 sm:p-5 md:p-6 text-left cursor-pointer"
            >
              <div className={`
                w-12 h-12 md:w-14 md:h-14 rounded-xl
                bg-gradient-to-br ${gradients[diff]}
                flex items-center justify-center text-2xl
                shadow-lg group-hover:scale-105 transition-transform duration-300
              `}>
                {icons[diff]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {config.label}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">{config.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>
        )
      })}
    </div>
  )
}
