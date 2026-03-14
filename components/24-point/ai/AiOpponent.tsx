'use client'

import Card from '@/components/24-point/ui/Card'
import NumberCards from '@/components/24-point/game/NumberCards'
import ExpressionInput from '@/components/24-point/game/ExpressionInput'

interface AiOpponentProps {
  numbers: number[]
  aiExpression: string
  aiThinking: boolean
  aiSolved: boolean
  aiName: string
  difficulty: string
}

export default function AiOpponent({
  numbers,
  aiExpression,
  aiThinking,
  aiSolved,
  aiName,
  difficulty,
}: AiOpponentProps) {
  return (
    <Card glass className="p-3 sm:p-4 md:p-5 space-y-3 md:space-y-4 opacity-90">
      {/* AI 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md shadow-rose-200/60">
            AI
          </div>
          <div>
            <div className="text-sm md:text-base font-semibold text-gray-700">{aiName}</div>
            <div className="text-xs text-gray-400">{difficulty}</div>
          </div>
        </div>
        {/* 状态指示 */}
        <div className="flex items-center gap-1.5">
          {aiThinking && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              思考中
            </div>
          )}
          {aiSolved && (
            <span className="text-xs text-emerald-500 font-medium">已解出!</span>
          )}
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

      {/* 表达式展示 */}
      <ExpressionInput
        expression={aiExpression}
        isActive={true}
        feedback={aiSolved ? 'success' : null}
        compact
      />
    </Card>
  )
}
