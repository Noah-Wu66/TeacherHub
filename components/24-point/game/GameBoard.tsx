'use client'

import Card from '@/components/24-point/ui/Card'
import Timer from '@/components/24-point/ui/Timer'
import NumberCards from './NumberCards'
import ExpressionInput from './ExpressionInput'
import OperatorPad from './OperatorPad'
import ScoreBoard from './ScoreBoard'

interface GameBoardProps {
  // 游戏状态
  numbers: number[]
  expression: string
  usedNumbers: number[]
  timeLeft: number
  feedback: 'success' | 'error' | null
  isPlaying: boolean
  hint: string | null
  // 分数
  playerName: string
  playerScore: number
  opponentName?: string
  opponentScore?: number
  round: number
  totalRounds: number
  // 操作
  onNumberClick: (num: number) => void
  onOperator: (op: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit: () => void
  onHint: () => void
  onSkip: () => void
  // 布局
  compact?: boolean
  className?: string
  showHint?: boolean
}

export default function GameBoard({
  numbers,
  expression,
  usedNumbers,
  timeLeft,
  feedback,
  isPlaying,
  hint,
  playerName,
  playerScore,
  opponentName,
  opponentScore,
  round,
  totalRounds,
  onNumberClick,
  onOperator,
  onBackspace,
  onClear,
  onSubmit,
  onHint,
  onSkip,
  compact = false,
  className = '',
  showHint = true,
}: GameBoardProps) {
  return (
    <Card glass className={`space-y-2 sm:space-y-3 md:space-y-4 ${compact ? 'p-2.5 sm:p-4' : 'p-3 sm:p-5 md:p-6'} ${className}`}>
      {/* 顶部：分数 + 计时器 */}
      <div className="space-y-1.5 sm:space-y-2">
        <ScoreBoard
          playerName={playerName}
          playerScore={playerScore}
          opponentName={opponentName}
          opponentScore={opponentScore}
          round={round}
          totalRounds={totalRounds}
        />
        <Timer timeLeft={timeLeft} />
      </div>

      {/* 数字卡片 */}
      <NumberCards
        numbers={numbers}
        usedNumbers={usedNumbers}
        onNumberClick={onNumberClick}
        disabled={!isPlaying || feedback !== null}
        compact={compact}
      />

      {/* 表达式输入 */}
      <ExpressionInput
        expression={expression}
        isActive={isPlaying}
        feedback={feedback}
        compact={compact}
      />

      {/* 提示 */}
      {showHint && hint && (
        <div className="text-center text-xs sm:text-sm md:text-base text-amber-600 bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-100">
          参考答案：{hint}
        </div>
      )}

      {/* 操作面板 */}
      <OperatorPad
        onOperator={onOperator}
        onBackspace={onBackspace}
        onClear={onClear}
        onSubmit={onSubmit}
        onHint={onHint}
        onSkip={onSkip}
        disabled={!isPlaying || feedback !== null}
        compact={compact}
        showHint={showHint}
      />
    </Card>
  )
}
