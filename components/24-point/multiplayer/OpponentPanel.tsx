'use client'

import Card from '@/components/24-point/ui/Card'
import NumberCards from '@/components/24-point/game/NumberCards'
import ExpressionInput from '@/components/24-point/game/ExpressionInput'

interface OpponentPanelProps {
  nickname: string
  score: number
  numbers: number[]
  expression: string
  feedback: 'success' | 'error' | null
}

export default function OpponentPanel({
  nickname,
  score,
  numbers,
  expression,
  feedback,
}: OpponentPanelProps) {
  return (
    <Card glass className="p-3 sm:p-4 md:p-5 space-y-3 md:space-y-4 opacity-90">
      {/* 对手信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md shadow-rose-200/60">
            {nickname[0]}
          </div>
          <span className="text-sm md:text-base font-semibold text-gray-700">{nickname}</span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-sm">
          {score}分
        </div>
      </div>

      {/* 数字展示（只读） */}
      <NumberCards
        numbers={numbers}
        usedNumbers={[]}
        onNumberClick={() => {}}
        disabled
        compact
      />

      {/* 对手表达式展示 */}
      <ExpressionInput
        expression={expression}
        isActive={true}
        feedback={feedback}
        compact
      />

      <div className="text-center text-xs text-gray-300">
        对手面板（只读）
      </div>
    </Card>
  )
}
